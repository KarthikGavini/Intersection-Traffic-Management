// src/components/LiveFeed.jsx
import React from 'react';

const LiveFeed = ({ frameData }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Live Feed</h2>
      <div className="bg-black aspect-video w-full flex items-center justify-center rounded">
        {frameData ? (
          // If we have frame data, render it as an image
          // We construct a Base64 data URL here
          <img src={`data:image/jpeg;base64,${frameData}`} alt="Live Intersection Feed" />
        ) : (
          // Otherwise, show the placeholder text
          <p className="text-gray-500">Connecting to video stream...</p>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;