// src/components/IntersectionView.jsx

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useParams, Link } from 'react-router-dom'; // Import useParams and Link
import TrafficLight from './TrafficLight';
import ROIEditor from './ROIEditor';

const IntersectionView = () => {
  const { id } = useParams(); // <-- 1. Get the intersection ID from the URL
  const [intersectionState, setIntersectionState] = useState({
    lights: {}, densities: {}, frames: {}, name: "Loading..." // Add 'name'
  });

  const [editorConfig, setEditorConfig] = useState({
    isOpen: false,
    cameraId: null,
    videoUrl: null
  });

  // These can remain hardcoded since it's a prototype
  const cameraNames = ['North', 'South', 'East', 'West'];
  const videoSources = ['north_cam.mp4', 'south_cam.mp4', 'east_cam.mp4', 'west_cam.mp4'];

  useEffect(() => {
    const socket = io('http://localhost:5001');

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server!');
      // --- 2. KEY CHANGE: Subscribe to the specific intersection room ---
      socket.emit('subscribe-to-intersection', id);
      console.log(`Subscribed to room: ${id}`);
    });

    // --- 3. Server now sends state just for this room ---
    socket.on('state-update', (newState) => {
      setIntersectionState(newState);
    });
    
    socket.on('disconnect', () => console.log('❌ Disconnected from WebSocket server!'));
    
    return () => socket.disconnect();

  }, [id]); // <-- 4. Re-run this effect if the ID in the URL changes

  const openRoiEditor = (cameraName) => {
    const cameraId = intersectionState.cameraDbIds[cameraName];
    const videoUrl = `http://localhost:5001/api/videos/${videoSources[cameraNames.indexOf(cameraName)]}`;
    
    if (!cameraId) {
      alert("Error: Camera ID not loaded from server yet. Please wait a moment and try again.");
      return;
    }
    
    setEditorConfig({
      isOpen: true,
      cameraId: cameraId,
      videoUrl: videoUrl
    });
  };

  return (
    <> {/* 1. Wrap in a React Fragment */}
      
      {/* 2. Conditionally render the editor modal */}
      {editorConfig.isOpen && (
        <ROIEditor
          cameraId={editorConfig.cameraId}
          videoUrl={editorConfig.videoUrl}
          onClose={() => setEditorConfig({ isOpen: false, cameraId: null, videoUrl: null })}
        />
      )}

      {/* This is your existing page content */}
      <div className="p-4 md:p-8">
        {/* 5. Back link to the map */}
        <div className="mb-4">
          <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition">
            &larr; Back to City Map
          </Link>
        </div>

        {/* 6. Use the dynamic name from the state */}
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
          {intersectionState.name}
          {intersectionState.isSimulated && " (Simulated)"}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {cameraNames.map((name, index) => {
            const density = intersectionState.densities[name] ?? 0;
            const lightStatus = intersectionState.lights[name] ?? 'red';
            const pollution = intersectionState.pollutionScores?.[name] ?? 0;
            const frameData = intersectionState.frames[name];
            const videoUrl = `http://localhost:5001/api/videos/${videoSources[index]}`;

            return (
              <div key={name} className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col space-y-4">
                
                {/* 3. Updated header to include the "Edit ROIs" button */}
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-cyan-400">{name} Approach</h2>
                  {!intersectionState.isSimulated && (
                    <button
                      onClick={() => openRoiEditor(name)}
                      className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500 transition text-sm"
                    >
                      Edit ROIs
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Left side: Live Video Stream */}
                  <div>
                    <h3 className="text-center font-semibold mb-2">Live Stream</h3>
                    <div className="bg-black aspect-video w-full flex items-center justify-center rounded overflow-hidden">
                      {/* Only show videos for the "Real" node */}
                      {!intersectionState.isSimulated ? (
                        <video
                          src={videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        ></video>
                      ) : (
                        <p className="text-gray-500 text-sm">Video only on real node</p>
                      )}
                    </div>
                  </div>

                  {/* Right side: Inferenced Frame */}
                  <div>
                    <h3 className="text-center font-semibold mb-2">AI Analysis</h3>
                    <div className="bg-black aspect-video w-full flex items-center justify-center rounded overflow-hidden">
                      {frameData ? (
                        <img src={`data:image/jpeg;base64,${frameData}`} alt={`Analysis from ${name}`} />
                      ) : (
                        <p className="text-gray-500 text-sm">
                          {intersectionState.isSimulated ? "Simulated data" : "Waiting for analysis..."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg px-2">
                  <span className="font-bold">Traffic Density:</span>
                  <span className="font-mono text-2xl text-yellow-300">{density.toFixed(2)}%</span>
                </div>
                
                <div className="flex justify-between items-center text-lg px-2">
                  <span className="font-bold">Pollution Score:</span>
                  <span className="font-mono text-2xl text-red-400">{pollution}</span>
                </div>

                <TrafficLight status={lightStatus} />
              </div>
            );
          })}
        </div>
      </div>
    </> // 4. Close the React Fragment
  );
};

export default IntersectionView;