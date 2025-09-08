// server/routes/intersections.js
import express from 'express';
import Intersection from '../models/Intersection.js';

const router = express.Router();

// --- Configuration Constants For New Rules ---
const LANE_SEQUENCE = ['North', 'East', 'South', 'West']; // Clockwise order
const MIN_GREEN_TIME = 5000;      // 5 seconds
const MAX_GREEN_TIME = 15000;     // 15 seconds
const YELLOW_TIME = 3000;         // 3 seconds
const MIN_DENSITY_THRESHOLD = 10; // 10%

// --- Central State Management ---
// We add new state variables for the sequential logic
const intersectionState = {
  densities: { 'North': 0, 'South': 0, 'East': 0, 'West': 0 },
  lights: { 'North': 'red', 'South': 'red', 'East': 'red', 'West': 'red' },
  frames: { 'North': null, 'South': null, 'East': null, 'West': null },
  
  // State for the new logic
  currentLaneIndex: 0, // Start by checking North
  currentLightState: 'RED', // Can be 'RED', 'GREEN', or 'YELLOW'
  stateChangeTime: 0,   // Timestamp of the last light color change
};


// --- The NEW "Brain": Time-Based Sequential Logic ---
function updateTrafficLogic(io) {
  const { densities, lights } = intersectionState;
  const now = Date.now();
  const elapsedTime = now - intersectionState.stateChangeTime;
  
  // --- State 1: A light is GREEN (Active Phase) ---
  if (intersectionState.currentLightState === 'GREEN') {
    const activeLane = LANE_SEQUENCE[intersectionState.currentLaneIndex];
    const activeDensity = densities[activeLane];

    // Check conditions to switch from Green to Yellow
    const isMaxTimeReached = elapsedTime >= MAX_GREEN_TIME;
    const isMinTimeFinished = elapsedTime >= MIN_GREEN_TIME;
    const isDensityLow = activeDensity < MIN_DENSITY_THRESHOLD;

    if (isMaxTimeReached || (isDensityLow && isMinTimeFinished)) {
      intersectionState.currentLightState = 'YELLOW';
      lights[activeLane] = 'yellow';
      intersectionState.stateChangeTime = now;
      console.log(`[Logic] State change to YELLOW for ${activeLane}`);
    }
  }

  // --- State 2: A light is YELLOW (Transition Phase) ---
  else if (intersectionState.currentLightState === 'YELLOW') {
    if (elapsedTime >= YELLOW_TIME) {
      const previousLane = LANE_SEQUENCE[intersectionState.currentLaneIndex];
      
      intersectionState.currentLightState = 'RED';
      lights[previousLane] = 'red';
      // IMPORTANT: Move to the next lane in the sequence for the next check
      intersectionState.currentLaneIndex = (intersectionState.currentLaneIndex + 1) % LANE_SEQUENCE.length;
      intersectionState.stateChangeTime = now;
      console.log(`[Logic] State change to RED. Next up for consideration: ${LANE_SEQUENCE[intersectionState.currentLaneIndex]}`);
    }
  }

  // --- State 3: All lights are RED (Decision Phase) ---
  // This check runs regardless of the other states to decide if a red light can turn green
  if (intersectionState.currentLightState === 'RED') {
    const candidateLane = LANE_SEQUENCE[intersectionState.currentLaneIndex];
    const candidateDensity = densities[candidateLane];
    
    // Rule: Skip entirely if density is 0
    if (candidateDensity > 0) {
      intersectionState.currentLightState = 'GREEN';
      lights[candidateLane] = 'green';
      intersectionState.stateChangeTime = now;
      console.log(`[Logic] State change to GREEN for ${candidateLane}`);
    } else {
      // If the candidate has 0 density, immediately skip to the next lane
      console.log(`[Logic] Skipping ${candidateLane} due to zero density.`);
      intersectionState.currentLaneIndex = (intersectionState.currentLaneIndex + 1) % LANE_SEQUENCE.length;
    }
  }
  
  // Broadcast the entire, updated state (no changes here)
  io.emit('state-update', {
    lights: intersectionState.lights,
    densities: intersectionState.densities,
    frames: intersectionState.frames,
  });

  const commandString = LANE_SEQUENCE.map(lane => lights[lane].charAt(0).toUpperCase()).join(',');
  io.emit('arduino-command', commandString);
  // console.log(`[Arduino] Sent command: ${commandString}`);
}


// --- API Endpoints (No changes from your working version) ---
router.get('/:id', async (req, res) => {
  try {
    const intersection = await Intersection.findById(req.params.id).populate('cameras');
    if (!intersection) {
      return res.status(404).json({ msg: 'Intersection not found' });
    }
    res.json(intersection);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/:id/data', (req, res) => {
  const { cameraName, densities, annotatedFrame } = req.body;

  if (cameraName && intersectionState.densities.hasOwnProperty(cameraName)) {
    const densityValues = densities ? Object.values(densities) : [];
    intersectionState.densities[cameraName] = densityValues.length > 0 ? densityValues[0] : 0;
    intersectionState.frames[cameraName] = annotatedFrame;
  }
  
  // The logic is still triggered by incoming data
  updateTrafficLogic(req.io);
  
  res.status(200).json({ message: 'Data received, logic updated' });
});

export default router;