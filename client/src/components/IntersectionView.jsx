// src/components/IntersectionView.jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import TrafficLight from './TrafficLight';

const IntersectionView = () => {
  const [intersectionState, setIntersectionState] = useState({
    lights: {}, densities: {}, frames: {},
  });

  const cameraNames = ['North', 'South', 'East', 'West'];
  const videoSources = ['north_cam.mp4', 'south_cam.mp4', 'east_cam.mp4', 'west_cam.mp4']; // Match the order of cameraNames

  useEffect(() => {
    // ... (no changes in useEffect)
    const socket = io('http://localhost:5001');
    socket.on('connect', () => console.log('✅ Connected to WebSocket server!'));
    socket.on('state-update', (newState) => setIntersectionState(newState));
    socket.on('disconnect', () => console.log('❌ Disconnected from WebSocket server!'));
    return () => socket.disconnect();
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Live Intersection Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {cameraNames.map((name, index) => {
          const density = intersectionState.densities[name] ?? 0;
          const lightStatus = intersectionState.lights[name] ?? 'red';
          const frameData = intersectionState.frames[name];
          const videoUrl = `http://localhost:5001/api/videos/${videoSources[index]}`;

          return (
            <div key={name} className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col space-y-4">
              <h2 className="text-2xl font-semibold text-cyan-400 text-center">{name} Approach</h2>
              
              {/* --- UPDATED VIDEO DISPLAY --- */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left side: Live Video Stream */}
                <div>
                  <h3 className="text-center font-semibold mb-2">Live Stream</h3>
                  <div className="bg-black aspect-video w-full flex items-center justify-center rounded overflow-hidden">
                    <video
                      src={videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    ></video>
                  </div>
                </div>

                {/* Right side: Inferenced Frame */}
                <div>
                  <h3 className="text-center font-semibold mb-2">AI Analysis</h3>
                  <div className="bg-black aspect-video w-full flex items-center justify-center rounded overflow-hidden">
                    {frameData ? (
                      <img src={`data:image/jpeg;base64,${frameData}`} alt={`Analysis from ${name}`} />
                    ) : (
                      <p className="text-gray-500 text-sm">Waiting for analysis...</p>
                    )}
                  </div>
                </div>
              </div>
              {/* --- END OF UPDATE --- */}

              <div className="flex justify-between items-center text-lg px-2">
                <span className="font-bold">Traffic Density:</span>
                <span className="font-mono text-2xl text-yellow-300">{density.toFixed(2)}%</span>
              </div>
              
              <TrafficLight status={lightStatus} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IntersectionView;