// server/services/cityState.js

import Intersection from '../models/Intersection.js';

// --- Configuration Constants ---
export const LANE_SEQUENCE = ['North', 'East', 'South', 'West'];
export const MIN_GREEN_TIME = 5000;
export const MAX_GREEN_TIME = 15000;
export const YELLOW_TIME = 3000;
export const MIN_DENSITY_THRESHOLD = 10;

// --- City State Management ---
export const REAL_INTERSECTION_ID = "68bf113329a3d66abae0fd7c"; 
const REAL_NODE_LAT = 16.30;
const REAL_NODE_LNG = 80.43;

const createNodeState = (name, isSimulated = false, position = [0,0]) => ({
  name: name,
  position: position, // Position is now part of the state
  lights: { 'North': 'red', 'South': 'red', 'East': 'red', 'West': 'red' },
  densities: isSimulated 
    ? { 'North': 10, 'South': 20, 'East': 5, 'West': 30 }
    : { 'North': 0, 'South': 0, 'East': 0, 'West': 0 },
  pollutionScores: { 'North': 0, 'South': 0, 'East': 0, 'West': 0 },
  frames: { 'North': null, 'South': null, 'East': null, 'West': null },
  pedestrianWaiting: { 'North': false, 'South': false, 'East': false, 'West': false },
  isPedestrianPhase: false,
  cameraDbIds: { 'North': null, 'South': null, 'East': null, 'West': null },
  currentLaneIndex: 0,
  currentLightState: 'RED', 
  stateChangeTime: Date.now(),
  isSimulated: isSimulated,
  incomingPlatoons: [] 
});

// --- Auto-generate 20 nodes ---
export const cityState = {
  // Create the real node WITH its position
  [REAL_INTERSECTION_ID]: createNodeState("Main & First (Real)", false, [REAL_NODE_LAT, REAL_NODE_LNG])
};

export const cityLayout = {
  [REAL_INTERSECTION_ID]: {}
};

const NUM_SIM_NODES = 19;
const GRID_SIZE = 5; 
const SPACING = 0.005; 

let nodeCount = 1;
for (let r = 0; r < GRID_SIZE; r++) {
  for (let c = 0; c < GRID_SIZE; c++) {
    if (nodeCount > NUM_SIM_NODES) break;
    if (r === 0 && c === 0) continue; // Skip the (0,0) spot, which is our real node

    const simNodeId = `sim-node-${nodeCount}`;
    const lat = REAL_NODE_LAT + (r * SPACING);
    const lng = REAL_NODE_LNG + (c * SPACING);
    
    // Create sim node WITH its position
    cityState[simNodeId] = createNodeState(`Sim Node ${nodeCount}`, true, [lat, lng]);
    
    // Auto-generate layout
    cityLayout[simNodeId] = {};
    const westNodeId = (c > 0) ? (r === 0 && (c - 1) === 0 ? REAL_INTERSECTION_ID : `sim-node-${nodeCount - 1}`) : null;
    if (westNodeId) {
      cityLayout[simNodeId]['East'] = { destNode: westNodeId, destLane: 'West' };
      if (!cityLayout[westNodeId]) cityLayout[westNodeId] = {};
      cityLayout[westNodeId]['West'] = { destNode: simNodeId, destLane: 'East' };
    }
    
    nodeCount++;
  }
  if (nodeCount > NUM_SIM_NODES) break;
}

export async function populateRealNodeCameraIds() {
  // ... (This function is unchanged and correctly fetches camera IDs)
  console.log('[Startup] Fetching real camera IDs from database...');
  try {
    const realNode = cityState[REAL_INTERSECTION_ID];
    if (!realNode) {
      console.error('[Startup] Real node not found in cityState!');
      return;
    }
    const intersection = await Intersection.findById(REAL_INTERSECTION_ID).populate('cameras');
    if (!intersection) {
      console.error(`[Startup] Intersection ${REAL_INTERSECTION_ID} not found in DB!`);
      return;
    }
    for (const camera of intersection.cameras) {
      if (realNode.cameraDbIds.hasOwnProperty(camera.name)) {
        realNode.cameraDbIds[camera.name] = camera._id.toString();
        console.log(`[Startup] Mapped ${camera.name} to ${camera._id}`);
      }
    }
  } catch (err) {
    console.error('[Startup] Error populating camera IDs:', err.message);
  }
}