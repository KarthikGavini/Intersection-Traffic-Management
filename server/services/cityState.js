// server/services/cityState.js

// --- Configuration Constants ---
export const LANE_SEQUENCE = ['North', 'East', 'South', 'West'];
export const MIN_GREEN_TIME = 5000;      // 5 seconds
export const MAX_GREEN_TIME = 15000;     // 15 seconds
export const YELLOW_TIME = 3000;         // 3 seconds
export const MIN_DENSITY_THRESHOLD = 10; // 10%

// --- City State Management ---

// This is the ID of the *only* intersection that our Python script is watching
export const REAL_INTERSECTION_ID = "68bf113329a3d66abae0fd7c"; 

// This helper function creates a default state for an intersection
const createNodeState = (name, isSimulated = false, startDensities = {}) => ({
  name: name,
  lights: { 'North': 'red', 'South': 'red', 'East': 'red', 'West': 'red' },
  densities: isSimulated 
    ? { 'North': 10, 'South': 20, 'East': 5, 'West': 30 }
    : { 'North': 0, 'South': 0, 'East': 0, 'West': 0 },
  pollutionScores: { 'North': 0, 'South': 0, 'East': 0, 'West': 0 },
  frames: { 'North': null, 'South': null, 'East': null, 'West': null },
  currentLaneIndex: 0,
  currentLightState: 'RED', // RED, GREEN, or YELLOW
  stateChangeTime: Date.now(),
  isSimulated: isSimulated,
  incomingPlatoons: [] // Stores traffic "platoons" heading towards this node
});

// This holds the state for ALL intersections in the city
export const cityState = {
  [REAL_INTERSECTION_ID]: createNodeState("Main & First (Real)", false),
  "sim-node-1": createNodeState("Second & Oak (Sim)", true),
  "sim-node-2": createNodeState("Third & Maple (Sim)", true),
};

// This defines how traffic flows *between* intersections
export const cityLayout = {
  // FROM sim-node-1's 'North' lane TO the 'South' lane of our REAL node
  "sim-node-1": { 
    'North': { destNode: REAL_INTERSECTION_ID, destLane: 'South' } 
  },
  // FROM sim-node-2's 'East' lane TO the 'West' lane of our REAL node
  "sim-node-2": { 
    'East': { destNode: REAL_INTERSECTION_ID, destLane: 'West' } 
  },
  // FROM our REAL node's 'South' lane TO the 'North' lane of sim-node-1
  [REAL_INTERSECTION_ID]: {
    'South': { destNode: "sim-node-1", destLane: 'North' },
    'West': { destNode: "sim-node-2", destLane: 'East' }
  }
};