// server/services/GTM.js

import { cityState, cityLayout } from './cityState.js';
import { updateLocalIntersectionLogic } from './localLogic.js';
import { simulateCityFlow } from './simulation.js';

const GTM_INTERVAL_MS = 2000; // Run the city-wide logic every 2 seconds

/**
 * This is the main GTM loop function.
 * It will be started by server.js
 */
export function runGlobalTrafficManager(io) {
  // 1. Run the simulation logic to move traffic around
  simulateCityFlow();

  // 2. Run the local light logic for *every* intersection
  for (const intersectionId in cityState) {
    const nodeState = cityState[intersectionId];
    // updateLocalIntersectionLogic(nodeState); // This function updates the state in-place
    updateLocalIntersectionLogic(intersectionId, nodeState, cityState, cityLayout);
    
    // 3. Broadcast the *specific* state to the *specific* room
    io.to(intersectionId).emit('state-update', nodeState);

    // Also send Arduino command for the real node
    if (intersectionId === cityState.REAL_INTERSECTION_ID) {
        const { lights } = nodeState;
        const commandString = LANE_SEQUENCE.map(lane => lights[lane].charAt(0).toUpperCase()).join(',');
        io.to(intersectionId).emit('arduino-command', commandString);
    }
  }
}

/**
 * This function initializes the GTM and starts the interval.
 * We pass 'io' from server.js
 */
export function initializeGTM(io) {
  console.log('🚀 Global Traffic Manager (GTM) initializing...');
  setInterval(() => {
    runGlobalTrafficManager(io);
  }, GTM_INTERVAL_MS);
  console.log(`✅ GTM started. Running logic every ${GTM_INTERVAL_MS}ms.`);
}