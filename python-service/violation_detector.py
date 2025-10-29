# python-service/violation_detector.py

import cv2
import numpy as np
import base64
import requests

print("--- 🚗 Violation Detector Module Loaded ---")

# --- Configuration (Copied from main.py for now) ---
REAL_INTERSECTION_ID = "68bf113329a3d66abae0fd7c"
REAL_INTERSECTION_NAME = "Main & First (Real)"
# We'll need the API endpoint to send violations
VIOLATION_API_ENDPOINT = "http://localhost:5001/api/violations"

# --- Placeholder for Object Tracker ---
# In a real implementation, you would initialize a tracker like SORT or DeepSORT here
# tracker = initialize_tracker()

# --- Placeholder Violation Zones ---
# In a real system, these would likely come from the camera config
VIOLATION_LINES = {
    "North": [(100, 300), (500, 310)], # Example line coordinates
    "South": [(100, 400), (500, 410)],
    "East": [(300, 100), (310, 500)],
    "West": [(400, 100), (410, 500)],
}

# --- State Variables (should be managed per camera instance in a class) ---
tracked_objects_history = {} # Stores previous positions, e.g., { track_id: [ (x,y), (x,y)... ] }

def process_frame_for_violations(frame, camera_name, detection_model, current_light_state):
    """
    Analyzes a single frame for red light violations.
    This function contains the high-load logic.
    """
    height, width, _ = frame.shape
    # print(f"[{camera_name}] Processing frame for violations...") # DEBUG

    # 1. TODO: Run Object Detection (using detection_model passed from main.py)
    # results = run_detection(frame, detection_model)
    detections = [] # Placeholder: Replace with actual detections

    # 2. TODO: Update Object Tracker
    # tracked_objects = tracker.update(detections) # List of tracked objects with IDs and bboxes

    # 3. TODO: Check for Violations
    if current_light_state == "red":
        # Get the violation line/zone for this camera
        violation_line = VIOLATION_LINES.get(camera_name)
        if violation_line:
            # For each tracked object
            # for obj in tracked_objects:
                # track_id = obj.id
                # bbox = obj.bbox
                # current_center = ( (bbox[0]+bbox[2])/2, (bbox[1]+bbox[3])/2 )

                # Add current position to history
                # if track_id not in tracked_objects_history:
                #     tracked_objects_history[track_id] = []
                # tracked_objects_history[track_id].append(current_center)
                # Keep history short (e.g., last 5 positions)
                # tracked_objects_history[track_id] = tracked_objects_history[track_id][-5:]

                # Check if the object's path crossed the violation line
                # if len(tracked_objects_history[track_id]) > 1:
                #     prev_pos = tracked_objects_history[track_id][-2]
                #     curr_pos = tracked_objects_history[track_id][-1]
                #     if did_cross_line(prev_pos, curr_pos, violation_line):
                        # print(f"🚨🚨🚨 POTENTIAL VIOLATION DETECTED by object ID {
                        #     # track_id
                        #     } on {camera_name} (Red Light) 🚨🚨🚨")

                        # a. TODO: Crop image around the object
                        # cropped_image = frame[bbox[1]:bbox[3], bbox[0]:bbox[2]]

                        # b. TODO: Run Number Plate Recognition (OCR)
                        # license_plate = run_ocr(cropped_image)
                        license_plate = "AB 12 CD 3456" # Placeholder

                        # c. TODO: Save image/evidence (maybe upload?)
                        # For now, just encode the frame
                        _, buffer = cv2.imencode('.jpg', frame)
                        img_str = base64.b64encode(buffer).decode('utf-8')
                        # In reality, you'd upload the cropped image and get a URL
                        image_url_placeholder = f"data:image/jpeg;base64,{img_str[:100]}..." # Fake URL

                        # d. Send violation to server
                        payload = {
                            "intersectionId": REAL_INTERSECTION_ID,
                            "intersectionName": REAL_INTERSECTION_NAME,
                            "cameraName": camera_name,
                            "licensePlate": license_plate,
                            "imageUrl": image_url_placeholder # Use the actual image URL here
                        }
                        send_violation_to_server(payload)

                        # e. Prevent reporting same object multiple times quickly
                        # Remove from history or add debounce logic
                        # del tracked_objects_history[track_id]


    # 4. Return annotated frame (optional)
    annotated_frame = frame.copy()
    # TODO: Draw tracked bounding boxes and violation lines on annotated_frame
    if violation_line:
       cv2.line(annotated_frame, violation_line[0], violation_line[1], (0, 0, 255), 2)


    return annotated_frame # Return annotated frame if needed, otherwise maybe just None


# --- Helper Functions (Placeholders) ---

def run_detection(frame, model):
    # This would use the SAHI predictor or similar
    return []

def initialize_tracker():
    # Load SORT, DeepSORT, ByteTrack etc.
    return None

def did_cross_line(point1, point2, line):
    # Basic line segment intersection logic
    return False # Placeholder

def run_ocr(image):
    # Use Tesseract or another OCR model
    return "XX 00 XX 0000" # Placeholder

def send_violation_to_server(payload):
    """Sends a detected violation to the Node.js server."""
    try:
        response = requests.post(VIOLATION_API_ENDPOINT, json=payload)
        if response.status_code == 201:
            print(f"✅ Violation sent successfully for {payload['licensePlate']}")
        else:
            print(f"❌ Failed to send violation. Status: {response.status_code}, {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error sending violation: {e}")