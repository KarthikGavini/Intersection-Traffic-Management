// src/components/AnalyticsDashboard.jsx
import React from 'react';

const AnalyticsDashboard = ({ analyticsData }) => {
  const densities = analyticsData?.densities;
  const priorityLane = analyticsData?.priorityLane;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
      {densities ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Lane Densities</h3>
            <ul className="space-y-1">
              {/* Loop through the densities object and display each lane */}
              {Object.entries(densities).map(([lane, density]) => (
                <li key={lane} className="flex justify-between text-lg">
                  <span>{lane}:</span>
                  <span className="font-mono">{density.toFixed(2)}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Priority Lane</h3>
            <p className="text-2xl font-bold text-green-400">{priorityLane}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-400">Waiting for data...</p>
      )}
    </div>
  );
};

export default AnalyticsDashboard;