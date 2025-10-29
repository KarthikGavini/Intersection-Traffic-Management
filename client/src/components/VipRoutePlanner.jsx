// src/components/VipRoutePlanner.jsx

import React, { useState, useEffect } from 'react';
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import { FaTrash } from 'react-icons/fa';
import axios from 'axios';

const VipRoutePlanner = ({ route, onClearRoute }) => {
    const [routeName, setRouteName] = useState('');
    const [startTime, setStartTime] = useState(new Date());

    // --- 1. State for existing routes ---
    const [scheduledRoutes, setScheduledRoutes] = useState([]);

    // --- 2. Function to fetch routes ---
    const fetchScheduledRoutes = () => {
        axios.get('http://localhost:5001/api/routes')
            .then(res => {
                setScheduledRoutes(res.data);
            })
            .catch(err => console.error("Error fetching scheduled routes:", err));
    };

    // --- 3. Fetch routes when component loads ---
    useEffect(() => {
        fetchScheduledRoutes();
    }, []); // Empty array means this runs once on mount

    const handleSaveRoute = () => {
        if (!routeName) {
            alert('Please enter a name for the route (e.g., "VIP Convoy").');
            return;
        }
        if (route.length < 2) {
            alert('A route must have at least two intersections.');
            return;
        }

        const routeData = {
            name: routeName,
            startTime: startTime,
            route: route.map(node => node.id), // Send only the array of IDs
        };

        axios.post('http://localhost:5001/api/routes', routeData)
            .then(res => {
                alert('VIP Route saved successfully!');
                setRouteName('');
                onClearRoute();
                fetchScheduledRoutes();
            })
            .catch(err => {
                console.error('Error saving route:', err);
                alert('Error saving route. See console for details.');
            });
    };

    // --- 4. Function to delete a route ---
    const handleDeleteRoute = (idToDelete) => {
        if (!window.confirm('Are you sure you want to delete this scheduled route?')) {
            return;
        }

        axios.delete(`http://localhost:5001/api/routes/${idToDelete}`)
            .then(res => {
                alert('Route deleted successfully.');
                // Update the UI by filtering out the deleted route
                setScheduledRoutes(prev => prev.filter(r => r._id !== idToDelete));
            })
            .catch(err => {
                console.error('Error deleting route:', err);
                alert('Error deleting route.');
            });
    };

    return (
        <div className="absolute top-0 left-0 h-full w-full bg-gray-800 bg-opacity-95 p-4 z-20 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">VIP Route Planner</h2>

            {/* --- Section for Creating a New Route --- */}
            <div className="bg-gray-900 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-semibold mb-3 text-white">Create New Route</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Route Name</label>
                    <input
                        type="text"
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        placeholder="e.g., 'Governor Convoy'"
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                    <div className="dark-theme-datetime-picker">
                        <DateTimePicker
                            onChange={setStartTime}
                            value={startTime}
                            className="w-full"
                            minDate={new Date()}
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Selected Route ({route.length} nodes)</h3>
                    <ul className="space-y-2 max-h-40 overflow-y-auto bg-gray-700 p-2 rounded">
                        {route.length === 0 && (
                            <li className="text-gray-400">Click markers on the map to add to the route.</li>
                        )}
                        {route.map((node, index) => (
                            <li key={node.id} className="flex items-center justify-between text-white">
                                <span>{index + 1}. {node.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleSaveRoute}
                        className="w-full bg-cyan-600 text-white p-3 rounded font-bold text-lg hover:bg-cyan-500"
                    >
                        Save New Route
                    </button>
                    <button
                        onClick={onClearRoute}
                        className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-500 flex items-center justify-center space-x-2"
                    >
                        <FaTrash />
                        <span>Clear Current Selection</span>
                    </button>
                </div>
            </div>

            {/* --- 5. NEW Section for Upcoming Routes --- */}
            <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-white">Upcoming Routes</h3>
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {scheduledRoutes.length === 0 && (
                        <li className="text-gray-400">No pending VIP routes found.</li>
                    )}
                    {scheduledRoutes.map(r => (
                        <li key={r._id} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                            <div>
                                <p className="font-bold text-white">{r.name}</p>
                                <p className="text-sm text-gray-300">
                                    {r.route.length} nodes starting at: {new Date(r.startTime).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDeleteRoute(r._id)}
                                className="text-red-400 hover:text-red-300 p-2"
                            >
                                <FaTrash size={18} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default VipRoutePlanner;