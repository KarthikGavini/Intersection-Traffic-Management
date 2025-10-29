// // src/components/CityMapView.jsx (HEAVILY UPDATED)

// import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
// import { useNavigate } from 'react-router-dom';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
// import { useVipMode } from './MainLayout'; // 2. Import the new hook
// import VipRoutePlanner from './VipRoutePlanner'; // 3. Import the planner

// // --- Create our custom CSS-based icons ---
// const realIcon = L.divIcon({
//     className: 'real-marker', // From index.css
//     iconSize: [20, 20],
//     iconAnchor: [10, 10],
//     popupAnchor: [0, -10]
// });

// const simIcon = L.divIcon({
//     className: 'simulated-marker', // From index.css
//     iconSize: [16, 16],
//     iconAnchor: [8, 8],
//     popupAnchor: [0, -8]
// });


// const CityMapView = () => {
//     const [intersections, setIntersections] = useState([]);
//     const [mapRef, setMapRef] = useState(null); // <-- 1. Ref to control the map
//     const navigate = useNavigate();
//     const { isVipMode } = useVipMode();

//     const [currentRoute, setCurrentRoute] = useState([]); // [{id, name, position}, ...]
//     const routePositions = currentRoute.map(node => node.position); // Just the [lat, lng] array

//     useEffect(() => {
//         fetch('http://localhost:5001/api/intersections')
//             .then(res => res.json())
//             .then(data => {
//                 setIntersections(data);
//             })
//             .catch(err => console.error("Error fetching intersections:", err));
//     }, []);

//     // 6. Handle marker clicks (new logic)
//     const handleMarkerClick = (node) => {
//         if (isVipMode) {
//             // --- VIP Mode: Add to route ---
//             // Check if already in route
//             if (currentRoute.find(n => n.id === node.id)) {
//                 // If last node, remove it (undo)
//                 if (currentRoute.length > 0 && currentRoute[currentRoute.length - 1].id === node.id) {
//                     setCurrentRoute(prev => prev.slice(0, -1));
//                 } else {
//                     alert('Node already in route. You can only remove the last node.');
//                 }
//             } else {
//                 setCurrentRoute(prev => [...prev, node]);
//             }
//         } else {
//             // --- Normal Mode: Navigate ---
//             navigate(`/intersection/${node.id}`);
//         }
//     };

//     // // --- 2. Function to handle clicks from the sidebar ---
//     // const handleSidebarClick = (intersection) => {
//     //     if (mapRef) {
//     //         // "Fly" the map to the new position
//     //         mapRef.flyTo(intersection.position, 17, { // Zoom in to level 17
//     //             duration: 1.5 // 1.5 second animation
//     //         });
//     //     }

//     //     // After the animation, navigate to the intersection page
//     //     setTimeout(() => {
//     //         navigate(`/intersection/${intersection.id}`);
//     //     }, 1500); // Must match the duration
//     // };

//     const handleSidebarClick = (node) => {
//         if (mapRef) {
//             mapRef.flyTo(node.position, 17, { duration: 1.5 });
//         }
//         // Don't navigate, just fly to the location
//     };

//     const handleClearRoute = () => {
//         setCurrentRoute([]);
//     };

//     const mapCenter = intersections.length > 0
//         ? intersections[0].position
//         : [16.305, 80.435]; // Default center

//     return (
//     <div className="flex" style={{ height: "calc(100vh - 68px)" }}>
//       {/* === Sidebar === */}
//       <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto shadow-lg relative"> {/* 7. Add relative */}
//         {isVipMode && (
//           <VipRoutePlanner
//             route={currentRoute}
//             onClearRoute={handleClearRoute}
//           />
//         )}
        
//         {/* We can hide the normal list when in VIP mode */}
//         {!isVipMode && (
//           <>
//             <h2 className="text-2xl font-bold mb-4 text-cyan-400">Intersections</h2>
//             <ul className="space-y-2">
//               {intersections.map(node => (
//                 <li key={node.id}>
//                   <button
//                     onClick={() => handleSidebarClick(node)}
//                     className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
//                   >
//                     <p className="font-semibold text-lg">{node.name}</p>
//                     <p className={node.isSimulated ? "text-amber-400" : "text-cyan-400"}>
//                       {node.isSimulated ? "Simulated" : "Real (Live)"}
//                     </p>
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </>
//         )}
//       </div>

//       {/* === Map Container === */}
//       <div className="w-3/4">
//         <MapContainer
//           center={mapCenter}
//           zoom={16}
//           style={{ height: "100%", width: "100%" }}
//           whenCreated={setMapRef}
//         >
//           <TileLayer
//             url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
//             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
//           />
          
//           {/* 8. Draw the Polyline for the VIP route */}
//           {routePositions.length > 0 && (
//             <Polyline pathOptions={{ color: '#06b6d4', weight: 5 }} positions={routePositions} />
//           )}

//           {intersections.map(node => (
//             <Marker
//               key={node.id}
//               position={node.position}
//               icon={node.isSimulated ? simIcon : realIcon}
//               zIndexOffset={100}
//               eventHandlers={{
//                 click: () => handleMarkerClick(node), // 9. Use new click handler
//               }}
//             >
//               {/* 10. Show a different popup in VIP mode */}
//               <Popup>
//                 <strong>{node.name}</strong><br />
//                 {isVipMode ? (
//                   <em>Click to add to VIP route.</em>
//                 ) : (
//                   <button
//                     onClick={() => navigate(`/intersection/${node.id}`)}
//                     className="mt-2 px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500"
//                   >
//                     View Dashboard
//                   </button>
//                 )}
//               </Popup>
//             </Marker>
//           ))}
//         </MapContainer>
//       </div>
//     </div>
//   );
// };

// export default CityMapView;


// // src/components/CityMapView.jsx

// import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
// import { useNavigate } from 'react-router-dom';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
// import { useVipMode } from './MainLayout'; 
// import VipRoutePlanner from './VipRoutePlanner';

// // --- Icon definitions (unchanged) ---
// const realIcon = L.divIcon({
//     className: 'real-marker',
//     iconSize: [20, 20],
//     iconAnchor: [10, 10],
//     popupAnchor: [0, -10]
// });
// const simIcon = L.divIcon({
//     className: 'simulated-marker',
//     iconSize: [16, 16],
//     iconAnchor: [8, 8],
//     popupAnchor: [0, -8]
// });


// const CityMapView = () => {
//     const [intersections, setIntersections] = useState([]);
//     const [mapRef, setMapRef] = useState(null); 
//     const navigate = useNavigate();
//     const { isVipMode } = useVipMode();
//     const [currentRoute, setCurrentRoute] = useState([]); 
//     const routePositions = currentRoute.map(node => node.position);

//     useEffect(() => {
//         // This fetches the list of 20 nodes
//         fetch('http://localhost:5001/api/intersections')
//             .then(res => res.json())
//             .then(data => {
//                 setIntersections(data); // This populates the sidebar
//             })
//             .catch(err => console.error("Error fetching intersections:", err));
//     }, []);

//     const handleMarkerClick = (node) => {
//         if (isVipMode) {
//             // ... (VIP route logic is unchanged)
//             if (currentRoute.find(n => n.id === node.id)) {
//                 if (currentRoute.length > 0 && currentRoute[currentRoute.length - 1].id === node.id) {
//                     setCurrentRoute(prev => prev.slice(0, -1));
//                 } else {
//                     alert('Node already in route. You can only remove the last node.');
//                 }
//             } else {
//                 setCurrentRoute(prev => [...prev, node]);
//             }
//         } else {
//             navigate(`/intersection/${node.id}`);
//         }
//     };

//     // --- THIS IS THE FIX for the sidebar click ---
//     const handleSidebarClick = (node) => {
//         if (mapRef) {
//             mapRef.flyTo(node.position, 17, { duration: 1.5 });
//         }
//         // Also navigate to the page
//         navigate(`/intersection/${node.id}`);
//     };
//     // ------------------------------------------

//     const handleClearRoute = () => {
//         setCurrentRoute([]);
//     };

//     const mapCenter = intersections.length > 0
//         ? intersections[0].position
//         : [16.305, 80.435]; 

//     return (
//     <div className="flex" style={{ height: "calc(100vh - 68px)" }}>
//       {/* === Sidebar === */}
//       <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto shadow-lg relative">
//         {isVipMode && (
//           <VipRoutePlanner
//             route={currentRoute}
//             onClearRoute={handleClearRoute}
//           />
//         )}
        
//         {!isVipMode && (
//           <>
//             <h2 className="text-2xl font-bold mb-4 text-cyan-400">Intersections</h2>
//             <ul className="space-y-2">
//               {intersections.map(node => ( // This list gets populated
//                 <li key={node.id}>
//                   <button
//                     onClick={() => handleSidebarClick(node)} // <-- This now works
//                     className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
//                   >
//                     <p className="font-semibold text-lg">{node.name}</p>
//                     <p className={node.isSimulated ? "text-amber-400" : "text-cyan-400"}>
//                       {node.isSimulated ? "Simulated" : "Real (Live)"}
//                     </p>
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </>
//         )}
//       </div>

//       {/* === Map Container === */}
//       <div className="w-3/4">
//         <MapContainer
//           center={mapCenter}
//           zoom={16}
//           style={{ height: "100%", width: "100%" }}
//           whenCreated={setMapRef}
//         >
//           <TileLayer
//             url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
//             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
//           />
          
//           {routePositions.length > 0 && (
//             <Polyline pathOptions={{ color: '#06b6d4', weight: 5 }} positions={routePositions} />
//           )}

//           {/* This map will now render all 20 markers */}
//           {intersections.map(node => (
//             <Marker
//               key={node.id}
//               position={node.position} // This will now be valid for all nodes
//               icon={node.isSimulated ? simIcon : realIcon}
//               zIndexOffset={100}
//               eventHandlers={{
//                 click: () => handleMarkerClick(node),
//               }}
//             >
//               <Popup>
//                 <strong>{node.name}</strong><br />
//                 {isVipMode ? (
//                   <em>Click to add to VIP route.</em>
//                 ) : (
//                   <button
//                     onClick={() => navigate(`/intersection/${node.id}`)}
//                     className="mt-2 px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500"
//                   >
//                     View Dashboard
//                   </button>
//                 )}
//               </Popup>
//             </Marker>
//           ))}
//         </MapContainer>
//       </div>
//     </div>
//   );
// };

// export default CityMapView;

// client/src/components/CityMapView.jsx

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useVipMode } from './MainLayout'; 
import VipRoutePlanner from './VipRoutePlanner';

// --- Icon definitions (unchanged) ---
const realIcon = L.divIcon({
    className: 'real-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});
const simIcon = L.divIcon({
    className: 'simulated-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
});


const CityMapView = () => {
    const [intersections, setIntersections] = useState([]);
    const [mapRef, setMapRef] = useState(null); 
    const navigate = useNavigate();
    const { isVipMode } = useVipMode();
    const [currentRoute, setCurrentRoute] = useState([]); 
    const routePositions = currentRoute.map(node => node.position);

    useEffect(() => {
        fetch('http://localhost:5001/api/intersections')
            .then(res => res.json())
            .then(data => {
                setIntersections(data); 
            })
            .catch(err => console.error("Error fetching intersections:", err));
    }, []);

    const handleMarkerClick = (node) => {
        if (isVipMode) {
            if (currentRoute.find(n => n.id === node.id)) {
                if (currentRoute.length > 0 && currentRoute[currentRoute.length - 1].id === node.id) {
                    setCurrentRoute(prev => prev.slice(0, -1));
                } else {
                    alert('Node already in route. You can only remove the last node.');
                }
            } else {
                setCurrentRoute(prev => [...prev, node]);
            }
        } else {
            navigate(`/intersection/${node.id}`);
        }
    };

    // --- This click handler is now CORRECT ---
    const handleSidebarClick = (node) => {
        if (mapRef) {
            mapRef.flyTo(node.position, 17, { duration: 1.5 });
        }
        // Also navigate to the page
        navigate(`/intersection/${node.id}`);
    };

    const handleClearRoute = () => {
        setCurrentRoute([]);
    };

    const mapCenter = intersections.length > 0
        ? intersections[0].position
        : [16.305, 80.435]; 

    return (
    <div className="flex" style={{ height: "calc(100vh - 68px)" }}>
      {/* === Sidebar === */}
      <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto shadow-lg relative">
        {isVipMode && (
          <VipRoutePlanner
            route={currentRoute}
            onClearRoute={handleClearRoute}
          />
        )}
        
        {!isVipMode && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">Intersections</h2>
            <ul className="space-y-2">
              {intersections.map(node => ( 
                <li key={node.id}>
                  <button
                    onClick={() => handleSidebarClick(node)} // <-- This now works
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
          </>
        )}
      </div>

      {/* === Map Container === */}
      <div className="w-3/4">
        <MapContainer
          center={mapCenter}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
          whenCreated={setMapRef}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {routePositions.length > 0 && (
            <Polyline pathOptions={{ color: '#06b6d4', weight: 5 }} positions={routePositions} />
          )}

          {intersections.map(node => (
            <Marker
              key={node.id}
              position={node.position} // This is now correct for all 20 nodes
              icon={node.isSimulated ? simIcon : realIcon}
              zIndexOffset={100}
              eventHandlers={{
                click: () => handleMarkerClick(node),
              }}
            >
              <Popup>
                <strong>{node.name}</strong><br />
                {isVipMode ? (
                  <em>Click to add to VIP route.</em>
                ) : (
                  <button
                    onClick={() => navigate(`/intersection/${node.id}`)}
                    className="mt-2 px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500"
                  >
                    View Dashboard
                  </button>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default CityMapView;