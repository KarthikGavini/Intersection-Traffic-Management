// server/routes/intersections.js

import express from 'express';
// --- This is the key: we import the REAL cityState ---
import { cityState } from '../services/cityState.js'; 

import Intersection from '../models/Intersection.js';
import Camera from '../models/Camera.js';


const router = express.Router();

// --- The config endpoint for Python (This part was correct) ---
// GET /api/intersections/:id
router.get('/:id', async (req, res) => {
  try {
    const intersection = await Intersection.findById(req.params.id).populate('cameras');
    if (!intersection) {
      return res.status(404).json({ msg: 'Intersection not found in database' });
    }
    res.json(intersection); 
  } catch (err) {
    console.error("Error fetching intersection config:", err.message);
    res.status(500).send('Server Error');
  }
});


// --- THIS IS THE FIX ---
// GET /api/intersections/
// This provides the list of intersections for the map view
router.get('/', (req, res) => {
  // This logic now CORRECTLY reads from the imported 20-node cityState
  const mapData = Object.entries(cityState).map(([id, state]) => ({
    id: id,
    name: state.name,
    isSimulated: state.isSimulated,
    position: state.position // <-- It now gets the REAL position from the state
  }));
  res.json(mapData);
});
// -----------------------


// --- The data-in endpoint for Python (This part was correct) ---
// POST /api/intersections/:id/data
router.post('/:id/data', (req, res) => {
  const { id } = req.params;
  const { cameraName, densities, annotatedFrame, pollutionScore, pedestrianWaiting } = req.body;

  // Find the 'real' ID from the cityState object
  const realId = Object.keys(cityState).find(id => !cityState[id].isSimulated);
  const nodeState = cityState[id];

  if (nodeState && id === realId) {
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