# python-service/main.py

import cv2
import numpy as np
import requests
import torch
import json
import time
import base64
import sys
from multiprocessing import Process
from sahi import AutoDetectionModel
from sahi.predict import get_sliced_prediction

# --- Configuration ---
SERVER_URL = "http://localhost:5001/api/intersections"
# This should be the ID of the main "Intersection" document in your database
INTERSECTION_ID = "68bf113329a3d66abae0fd7c" 
ALLOWED_CLASSES = ['car', 'motorcycle', 'bus', 'truck', 'bicycle']
# ALLOWED_CLASSES = ['lmv', 'motorbike', 'bus', 'truck', 'autorickshaw', 'lcv', 'tractor']
PROCESSING_INTERVAL = 5
SLICE_HEIGHT = 640
SLICE_WIDTH = 640

# --- Functions ---
def fetch_intersection_data():
    """Fetches the main intersection object which contains the list of cameras."""
    try:
        print("[Manager] Fetching intersection and camera configurations...")
        # This endpoint must populate the camera data
        url = f"{SERVER_URL}/{INTERSECTION_ID}"
        response = requests.get(url)
        
        if response.status_code == 200:
            print("[Manager] Successfully fetched configuration.")
            return response.json()
        else:
            print(f"[Manager] Error fetching config. Status: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"[Manager] Error connecting to server: {e}")
        return None

def send_data_to_server(payload):
    """Sends the analysis payload to the Node.js server."""
    try:
        headers = {'Content-Type': 'application/json'}
        url = f"{SERVER_URL}/{INTERSECTION_ID}/data"
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        if response.status_code != 200:
            print(f"Failed to send data. Server responded with {response.status_code}")
    except requests.exceptions.RequestException:
        pass

# --- WORKER: This function contains all your original analysis logic ---
def process_camera_feed(camera_config):
    """This is the main worker function for a single camera."""
    
    camera_name = camera_config.get('name', 'Unknown')
    video_source = camera_config.get('videoSource', '')
    lane_polygons = camera_config.get('roiPolygons', {})

    if not video_source or not lane_polygons:
        print(f"[{camera_name}] Error: Missing videoSource or roiPolygons in config.")
        return

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"[{camera_name}] Worker started. Device: {device}, Source: {video_source}")

    detection_model = AutoDetectionModel.from_pretrained(
        model_type='yolov8', model_path='yolov8n.pt',
        confidence_threshold=0.3, device=device
    )

    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        print(f"[{camera_name}] Error: Could not open video source.")
        return

    last_analysis_time = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print(f"[{camera_name}] End of video stream. Restarting...")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0) # Loop the video
            continue
        
        current_time = time.time()
        
        if (current_time - last_analysis_time) >= PROCESSING_INTERVAL:
            last_analysis_time = current_time
            print(f"[{camera_name}] Running analysis at {time.strftime('%H:%M:%S')}")
            
            height, width, _ = frame.shape
            frame_densities = {}

            result = get_sliced_prediction(
                frame, detection_model,
                slice_height=SLICE_HEIGHT, slice_width=SLICE_WIDTH,
                overlap_height_ratio=0.2, overlap_width_ratio=0.2
            )
            filtered_predictions = [p for p in result.object_prediction_list if p.category.name in ALLOWED_CLASSES]

            for lane_name, points in lane_polygons.items():
                current_roi_polygon = np.array(points, np.int32)
                roi_area = cv2.contourArea(current_roi_polygon)
                
                bboxes_in_roi = [
                    [int(p.bbox.minx), int(p.bbox.miny), int(p.bbox.maxx), int(p.bbox.maxy)]
                    for p in filtered_predictions
                    if cv2.pointPolygonTest(current_roi_polygon, (int((p.bbox.minx + p.bbox.maxx) / 2), int((p.bbox.miny + p.bbox.maxy) / 2)), False) >= 0
                ]

                bbox_mask = np.zeros((height, width), dtype=np.uint8)
                for bbox in bboxes_in_roi:
                    cv2.rectangle(bbox_mask, (bbox[0], bbox[1]), (bbox[2], bbox[3]), 255, -1)
                
                roi_mask = np.zeros((height, width), dtype=np.uint8)
                cv2.fillPoly(roi_mask, [current_roi_polygon], 255)

                occupied_area_mask = cv2.bitwise_and(bbox_mask, roi_mask)
                density = (cv2.countNonZero(occupied_area_mask) / roi_area) * 100 if roi_area > 0 else 0
                frame_densities[lane_name] = density
            
            priority_lane = max(frame_densities, key=frame_densities.get) if frame_densities else ""
            
            # Note: Creating and sending annotated frames for 4 streams can be heavy.
            # A more optimized version might only send the density data.
            # For now, we'll keep it for visual confirmation.

            # --- ADD THIS LOGIC BACK IN ---
            # Create a visual frame to send to the frontend
            annotated_frame_for_payload = frame.copy()
            for lane_name, points in lane_polygons.items():
                current_roi_polygon = np.array(points, np.int32)
                cv2.polylines(annotated_frame_for_payload, [current_roi_polygon], True, (255, 0, 0), 3)
                density = frame_densities.get(lane_name, 0)
                density_text = f"{lane_name}: {density:.2f}%"
                text_pos = (points[0][0], points[0][1] - 10)
                cv2.putText(annotated_frame_for_payload, density_text, text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4)
                cv2.putText(annotated_frame_for_payload, density_text, text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            # Encode the annotated frame as a Base64 string
            _, buffer = cv2.imencode('.jpg', annotated_frame_for_payload)
            frame_as_base64 = base64.b64encode(buffer).decode('utf-8')
            # --- END OF ADDED LOGIC ---
            
            payload = {
                "cameraName": camera_name,
                "densities": frame_densities,
                "priorityLane": priority_lane,
                "annotatedFrame": frame_as_base64, # Temporarily disabled to reduce load
            }
            send_data_to_server(payload)


# --- MANAGER: This is the main entry point ---
if __name__ == '__main__':
    print("[Manager] Starting up...")
    intersection_data = fetch_intersection_data()

    if intersection_data and 'cameras' in intersection_data and intersection_data['cameras']:
        processes = []
        
        for camera_config in intersection_data['cameras']:
            print(f"[Manager] Creating process for camera: {camera_config.get('name', 'Unknown')}")
            
            # Create a new process for each camera, targeting our worker function
            p = Process(target=process_camera_feed, args=(camera_config,))
            processes.append(p)
            p.start()

        print(f"[Manager] Launched {len(processes)} worker processes.")
        
        for p in processes:
            p.join() # Wait for all processes to finish
    else:
        print("[Manager] Could not fetch valid camera data to start workers. Please check your database and INTERSECTION_ID.")