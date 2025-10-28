

// src/components/CityMapView.jsx (HEAVILY UPDATED)

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Create our custom CSS-based icons ---
const realIcon = L.divIcon({
  className: 'real-marker', // From index.css
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

const simIcon = L.divIcon({
  className: 'simulated-marker', // From index.css
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8]
});


const CityMapView = () => {
  const [intersections, setIntersections] = useState([]);
  const [mapRef, setMapRef] = useState(null); // <-- 1. Ref to control the map
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5001/api/intersections')
      .then(res => res.json())
      .then(data => {
        setIntersections(data);
      })
      .catch(err => console.error("Error fetching intersections:", err));
  }, []);

  // --- 2. Function to handle clicks from the sidebar ---
  const handleSidebarClick = (intersection) => {
    if (mapRef) {
      // "Fly" the map to the new position
      mapRef.flyTo(intersection.position, 17, { // Zoom in to level 17
        duration: 1.5 // 1.5 second animation
      });
    }

    // After the animation, navigate to the intersection page
    setTimeout(() => {
      navigate(`/intersection/${intersection.id}`);
    }, 1500); // Must match the duration
  };

  const mapCenter = intersections.length > 0
    ? intersections[0].position
    : [16.305, 80.435]; // Default center

  return (
    // --- 3. New Flex Layout (Sidebar + Map) ---
    // This container fits perfectly under the 68px header
    <div className="flex" style={{ height: "calc(100vh - 68px)" }}>
      
      {/* === Sidebar === */}
      <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Intersections</h2>
        <ul className="space-y-2">
          {intersections.map(node => (
            <li key={node.id}>
              <button
                onClick={() => handleSidebarClick(node)}
                className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              >
                <p className="font-semibold text-lg">{node.name}</p>
                <p className={node.isSimulated ? "text-amber-400" : "text-cyan-400"}>
                  {node.isSimulated ? "Simulated" : "Real (Live)"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* === Map Container === */}
      <div className="w-3/4">
        <MapContainer
          center={mapCenter}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
          whenCreated={setMapRef} // <-- 4. Store the map instance
        >
          {/* --- 5. NEW CLEAN MAP TILE --- */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {intersections.map(intersection => (
            <Marker
              key={intersection.id}
              position={intersection.position}
              icon={intersection.isSimulated ? simIcon : realIcon}
              zIndexOffset={100} // <-- 6. Extra z-index boost
            >
              <Popup>
                <strong>{intersection.name}</strong><br />
                <em>{intersection.isSimulated ? "(Simulated)" : "(Real)"}</em>
                <br /><br />
                <button
                  onClick={() => navigate(`/intersection/${intersection.id}`)}
                  className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500"
                >
                  View Dashboard
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default CityMapView;