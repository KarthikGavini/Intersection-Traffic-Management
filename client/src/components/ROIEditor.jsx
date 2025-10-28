// src/components/ROIEditor.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Circle, Text } from 'react-konva';
import axios from 'axios';

// This is the main modal component
const ROIEditor = ({ cameraId, videoUrl, onClose }) => {
  const [rois, setRois] = useState([]); // [{ name, type, points: [[x,y], [x,y]] }]
  const [currentPoints, setCurrentPoints] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null); // The index of the selected shape
  const [videoDim, setVideoDim] = useState({ w: 1280, h: 720, scale: 1 });
  const containerRef = useRef(null);

  // --- Data Fetching ---
  useEffect(() => {
    // 1. Fetch existing ROIs for this camera
    axios.get(`http://localhost:5001/api/cameras/${cameraId}`)
      .then(res => {
        // Konva needs points as a flat array: [x1, y1, x2, y2, ...]
        const loadedRois = res.data.rois.map(roi => ({
          ...roi,
          points: roi.points.flat(), // Convert [[x,y]] to [x,y,x,y]
        }));
        setRois(loadedRois);
      })
      .catch(err => console.error("Error fetching camera ROIs:", err));

    // 2. Get video dimensions to scale the canvas
    const video = document.createElement('video');
    video.src = videoUrl;
    video.onloadedmetadata = () => {
      handleResize(video.videoWidth, video.videoHeight);
    };

    // 3. Add window resize listener
    window.addEventListener('resize', () => handleResize(video.videoWidth, video.videoHeight));
    return () => window.removeEventListener('resize', () => handleResize(video.videoWidth, video.videoHeight));
  }, [cameraId, videoUrl]);

  // --- Canvas and Drawing Logic ---
  const handleResize = (videoW, videoH) => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const scale = Math.min(width / videoW, height / videoH);
    setVideoDim({ w: videoW * scale, h: videoH * scale, scale: scale });
  };

  const getScaledMousePos = (stage) => {
    const pos = stage.getPointerPosition();
    return { x: pos.x / videoDim.scale, y: pos.y / videoDim.scale };
  };

  const handleCanvasClick = (e) => {
    const stage = e.target.getStage();
    // Don't draw if we clicked on an existing shape
    if (e.target !== stage) {
      const shapeName = e.target.name();
      if (shapeName.startsWith('shape-')) {
        setSelectedShape(parseInt(shapeName.split('-')[1]));
      }
      return;
    }
    setSelectedShape(null); // Clicked on stage, deselect all
    const { x, y } = getScaledMousePos(stage);
    setCurrentPoints([...currentPoints, x, y]);
  };

  // --- UI and State Handlers ---
  const handleAddNewRoi = (type) => {
    if (currentPoints.length < 6) { // Need at least 3 points
      alert("Please draw a polygon (at least 3 points) first.");
      return;
    }
    const newRoi = {
      name: `${type} ${rois.length + 1}`,
      type: type,
      points: [...currentPoints, currentPoints[0], currentPoints[1]], // Close the polygon
    };
    setRois([...rois, newRoi]);
    setCurrentPoints([]);
  };

  const handleRoiChange = (e) => {
    const { name, value } = e.target;
    const updatedRois = [...rois];
    updatedRois[selectedShape][name] = value;
    setRois(updatedRois);
  };

  const handleDeleteRoi = () => {
    if (selectedShape === null) return;
    setRois(rois.filter((_, index) => index !== selectedShape));
    setSelectedShape(null);
  };

  const handleSave = () => {
    // Convert points back to [[x,y], [x,y]] format for the database
    const roisToSave = rois.map(roi => {
      const points = [];
      for (let i = 0; i < roi.points.length; i += 2) {
        // Don't save the last "closing" point, our ROI tool will handle that
        if (i < roi.points.length - 2) {
          points.push([Math.round(roi.points[i]), Math.round(roi.points[i + 1])]);
        }
      }
      return { name: roi.name, type: roi.type, points: points };
    });

    axios.put(`http://localhost:5001/api/cameras/${cameraId}/rois`, { rois: roisToSave })
      .then(res => {
        alert("ROIs saved successfully!");
        onClose();
      })
      .catch(err => {
        console.error("Error saving ROIs:", err);
        alert("Error saving ROIs. See console for details.");
      });
  };

  // --- Render ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex z-50 p-4">
      {/* Left: Editor Panel */}
      <div className="w-1/4 bg-gray-800 p-4 rounded-l-lg overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">ROI Editor</h2>
        
        <div className="mb-4 space-y-2">
          <p className="text-sm text-gray-400">Click on the video to add points. Click a button below to save the new shape.</p>
          <button onClick={() => handleAddNewRoi('Traffic')} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-400">Save as 'Traffic'</button>
          <button onClick={() => handleAddNewRoi('Pedestrian')} className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-400">Save as 'Pedestrian'</button>
          <button onClick={() => setCurrentPoints([])} className="w-full bg-gray-600 text-white p-2 rounded hover:bg-gray-500">Clear Current Points</button>
        </div>
        
        <hr className="my-4 border-gray-600" />

        {/* Selected Shape Editor */}
        {selectedShape !== null && rois[selectedShape] ? (
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-cyan-400">Edit Shape</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <input
                type="text"
                name="name"
                value={rois[selectedShape].name}
                onChange={handleRoiChange}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Type</label>
              <select
                name="type"
                value={rois[selectedShape].type}
                onChange={handleRoiChange}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600"
              >
                <option value="Traffic">Traffic</option>
                <option value="Pedestrian">Pedestrian</option>
              </select>
            </div>
            <button onClick={handleDeleteRoi} className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-500">Delete Selected Shape</button>
          </div>
        ) : (
          <p className="text-gray-400">Click a shape to edit its properties.</p>
        )}

        {/* Main Actions */}
        <div className="absolute bottom-4 left-4 w-1/4 pr-8">
          <button onClick={handleSave} className="w-full bg-cyan-600 text-white p-3 rounded font-bold text-lg hover:bg-cyan-500">Save All & Close</button>
          <button onClick={onClose} className="w-full bg-transparent text-gray-300 p-2 rounded hover:bg-gray-700 mt-2">Cancel</button>
        </div>
      </div>

      {/* Right: Video & Canvas */}
      <div className="w-3/4 bg-black rounded-r-lg flex items-center justify-center" ref={containerRef}>
        <div style={{ position: 'relative', width: videoDim.w, height: videoDim.h }}>
          <video
            src={videoUrl} autoPlay loop muted
            style={{ width: '100%', height: '100%', position: 'absolute' }}
          />
          <Stage
            width={videoDim.w}
            height={videoDim.h}
            scaleX={videoDim.scale}
            scaleY={videoDim.scale}
            onClick={handleCanvasClick}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <Layer>
              {/* Draw saved ROIs */}
              {rois.map((roi, i) => (
                <React.Fragment key={i}>
                  <Line
                    name={`shape-${i}`}
                    points={roi.points}
                    stroke={roi.type === 'Traffic' ? 'blue' : 'green'}
                    strokeWidth={selectedShape === i ? 4 : 2}
                    closed
                    fill={roi.type === 'Traffic' ? 'rgba(0,0,255,0.2)' : 'rgba(0,255,0,0.2)'}
                  />
                  <Text
                    text={roi.name}
                    x={roi.points[0]}
                    y={roi.points[1] - 15}
                    fill="white"
                    fontSize={14 / videoDim.scale}
                    fontStyle="bold"
                  />
                </React.Fragment>
              ))}
              {/* Draw current unsaved points */}
              <Line points={currentPoints} stroke="red" strokeWidth={2} />
              {currentPoints.map((_, i) =>
                i % 2 === 0 && (
                  <Circle x={currentPoints[i]} y={currentPoints[i+1]} radius={4 / videoDim.scale} fill="red" />
                )
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default ROIEditor;