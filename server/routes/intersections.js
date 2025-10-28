// server/routes/intersections.js (Updated)

import express from 'express';
import { cityState, REAL_INTERSECTION_ID } from '../services/cityState.js';

// --- 1. IMPORT THE DATABASE MODELS ---
// We need these for the Python script's config endpoint
import Intersection from '../models/Intersection.js';
import Camera from '../models/Camera.js';


const router = express.Router();

// --- 2. ADDED BACK: The config endpoint for Python ---
// GET /api/intersections/:id
// This fetches the detailed intersection data (with cameras) from the database
router.get('/:id', async (req, res) => {
  try {
    // We must .populate('cameras') so the python script gets the camera details
    const intersection = await Intersection.findById(req.params.id).populate('cameras');
    
    if (!intersection) {
      return res.status(404).json({ msg: 'Intersection not found in database' });
    }
    // This sends the full config (ROIs, video sources, etc.) to main.py
    res.json(intersection); 

  } catch (err)
  {
    console.error("Error fetching intersection config:", err.message);
    res.status(500).send('Server Error');
  }
});


// --- 3. KEPT: The "city map" endpoint for React ---
// GET /api/intersections/
// This provides the list of intersections for the map view
router.get('/', (req, res) => {
  const mapData = Object.entries(cityState).map(([id, state]) => ({
    id: id,
    name: state.name,
    isSimulated: state.isSimulated,
    position: (id === REAL_INTERSECTION_ID) 
      ? [16.30, 80.43] // Real node position
      : (id === 'sim-node-1' ? [16.31, 80.44] : [16.30, 80.42]) // Sim node positions
  }));
  res.json(mapData);
});


// --- 4. KEPT: The data-in endpoint for Python ---
// POST /api/intersections/:id/data
// This endpoint receives data for the real node
router.post('/:id/data', (req, res) => {
  const { id } = req.params;
  const { cameraName, densities, annotatedFrame, pollutionScore, pedestrianWaiting } = req.body;

  const nodeState = cityState[id];

  if (nodeState && id === REAL_INTERSECTION_ID) {
    if (cameraName && nodeState.densities.hasOwnProperty(cameraName)) {
      const densityValues = densities ? Object.values(densities) : [];
      nodeState.densities[cameraName] = densityValues.length > 0 ? densityValues[0] : 0;
      nodeState.frames[cameraName] = annotatedFrame;

      if (pollutionScore !== undefined) {
        nodeState.pollutionScores[cameraName] = pollutionScore;
      }
      nodeState.pedestrianWaiting[cameraName] = pedestrianWaiting || false;
    }
  } else {
    return res.status(404).json({ message: "Intersection not found or is simulated" });
  }
  
  res.status(200).json({ message: 'Data received' });
});

export default router;