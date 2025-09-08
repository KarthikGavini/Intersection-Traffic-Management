// src/components/TrafficLight.jsx
import React from 'react';

const TrafficLight = ({ status }) => {
  const baseClasses = "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-600 transition-all duration-300";
  const lightClasses = {
    red: "bg-red-500 shadow-[0_0_15px_2px_rgba(239,68,68,0.7)]",
    yellow: "bg-yellow-400 shadow-[0_0_15px_2px_rgba(250,204,21,0.7)]",
    green: "bg-green-500 shadow-[0_0_15px_2px_rgba(34,197,94,0.7)]",
    off: "bg-gray-900",
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-center">Signal Status</h3>
      <div className="bg-gray-900 p-3 rounded-lg flex space-x-3 justify-center">
        <div className={`${baseClasses} ${status === 'red' ? lightClasses.red : lightClasses.off}`}></div>
        <div className={`${baseClasses} ${status === 'yellow' ? lightClasses.yellow : lightClasses.off}`}></div>
        <div className={`${baseClasses} ${status === 'green' ? lightClasses.green : lightClasses.off}`}></div>
      </div>
    </div>
  );
};

export default TrafficLight;