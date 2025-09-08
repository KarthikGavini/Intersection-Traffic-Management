// src/components/IntersectionView.jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import TrafficLight from './TrafficLight'; // <-- Import the new component we just created

const IntersectionView = () => {
  // The new state holds the complete data for all lanes
  const [intersectionState, setIntersectionState] = useState({
    lights: {},
    densities: {},
    frames: {},
  });

  // An array of the camera names we expect to display
  const cameraNames = ['North', 'South', 'East', 'West'];

  useEffect(() => {
    const socket = io('http://localhost:5001');
    socket.on('connect', () => console.log('✅ Connected to WebSocket server!'));
    
    // Listen for the new 'state-update' event that contains all data
    socket.on('state-update', (newState) => {
      setIntersectionState(newState);
    });

    socket.on('disconnect', () => console.log('❌ Disconnected from WebSocket server!'));

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Live Intersection Dashboard</h1>
      
      {/* A responsive grid for the four camera views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {cameraNames.map((name) => {
          // Get the specific data for this camera from the overall state
          const density = intersectionState.densities[name] ?? 0;
          const lightStatus = intersectionState.lights[name] ?? 'red';
          const frameData = intersectionState.frames[name];

          return (
            // This is the container for a single camera's complete view
            <div key={name} className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col space-y-4">
              <h2 className="text-2xl font-semibold text-cyan-400 text-center">{name} Approach</h2>
              
              {/* Live Feed Display */}
              <div className="bg-black aspect-video w-full flex items-center justify-center rounded overflow-hidden">
                {frameData ? (
                  <img src={`data:image/jpeg;base64,${frameData}`} alt={`Live feed from ${name}`} />
                ) : (
                  <p className="text-gray-500">Waiting for {name} feed...</p>
                )}
              </div>

              {/* Analytics Display */}
              <div className="flex justify-between items-center text-lg px-2">
                <span className="font-bold">Traffic Density:</span>
                <span className="font-mono text-2xl text-yellow-300">{density.toFixed(2)}%</span>
              </div>
              
              {/* Traffic Light Display */}
              <TrafficLight status={lightStatus} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IntersectionView;