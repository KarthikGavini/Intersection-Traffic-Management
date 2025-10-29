// src/components/ViolationsLog.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ViolationsLog = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the violations from our API when the component loads
    axios.get('http://localhost:5001/api/violations')
      .then(res => {
        setViolations(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching violations:", err);
        setLoading(false);
      });
  }, []); // The empty array means this runs once on mount

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">
          Red Light Violations Log
        </h1>
        <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition">
          &larr; Back to City Map
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading violations log...</p>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* List for larger screens */}
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Evidence</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">License Plate</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {violations.map((v) => (
                  <tr key={v._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={v.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img 
                          className="h-16 w-24 rounded object-cover hover:opacity-80 transition" 
                          src={v.imageUrl} 
                          alt={`Violation by ${v.licensePlate}`} 
                        />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-mono">{v.licensePlate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold">{v.intersectionName}</div>
                      <div className="text-sm text-gray-400">{v.cameraName} Camera</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(v.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card list for mobile screens */}
          <div className="md:hidden space-y-4 p-4">
            {violations.map((v) => (
              <div key={v._id} className="bg-gray-700 rounded-lg p-4 shadow">
                <a href={v.imageUrl} target="_blank" rel="noopener noreferrer">
                  <img 
                    className="w-full h-40 rounded object-cover mb-4" 
                    src={v.imageUrl} 
                    alt={`Violation by ${v.licensePlate}`} 
                  />
                </a>
                <div className="font-mono text-2xl mb-2">{v.licensePlate}</div>
                <div className="text-sm font-semibold">{v.intersectionName} ({v.cameraName})</div>
                <div className="text-sm text-gray-400 mt-1">{new Date(v.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>

          {violations.length === 0 && !loading && (
            <p className="p-6 text-gray-400">No violations found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ViolationsLog;