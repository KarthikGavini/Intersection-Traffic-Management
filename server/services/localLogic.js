// server/services/localLogic.js

import {
  LANE_SEQUENCE,
  MIN_GREEN_TIME,
  MAX_GREEN_TIME,
  YELLOW_TIME,
  MIN_DENSITY_THRESHOLD
} from './cityState.js';

/**
 * This function updates the state of a *single* intersection
 * It modifies the nodeState object directly (in-place)
 */
export function updateLocalIntersectionLogic(nodeState) {
  const { lights, densities } = nodeState;
  const now = Date.now();
  const elapsedTime = now - nodeState.stateChangeTime;
  
  // --- State 1: A light is GREEN (Active Phase) ---
  if (nodeState.currentLightState === 'GREEN') {
    const activeLane = LANE_SEQUENCE[nodeState.currentLaneIndex];
    const activeDensity = densities[activeLane];

    const isMaxTimeReached = elapsedTime >= MAX_GREEN_TIME;
    const isMinTimeFinished = elapsedTime >= MIN_GREEN_TIME;
    const isDensityLow = activeDensity < MIN_DENSITY_THRESHOLD;

    if (isMaxTimeReached || (isDensityLow && isMinTimeFinished)) {
      nodeState.currentLightState = 'YELLOW';
      lights[activeLane] = 'yellow';
      nodeState.stateChangeTime = now;
    }
  }

  // --- State 2: A light is YELLOW (Transition Phase) ---
  else if (nodeState.currentLightState === 'YELLOW') {
    if (elapsedTime >= YELLOW_TIME) {
      const previousLane = LANE_SEQUENCE[nodeState.currentLaneIndex];
      
      nodeState.currentLightState = 'RED';
      lights[previousLane] = 'red';
      nodeState.currentLaneIndex = (nodeState.currentLaneIndex + 1) % LANE_SEQUENCE.length;
      nodeState.stateChangeTime = now;
    }
  }

  // --- State 3: All lights are RED (Decision Phase) ---
  else if (nodeState.currentLightState === 'RED') {
    const candidateLane = LANE_SEQUENCE[nodeState.currentLaneIndex];
    const candidateDensity = densities[candidateLane];
    
    if (candidateDensity > 0) {
      nodeState.currentLightState = 'GREEN';
      lights[candidateLane] = 'green';
      nodeState.stateChangeTime = now;
    } else {
      // If the candidate has 0 density, immediately skip to the next lane
      nodeState.currentLaneIndex = (nodeState.currentLaneIndex + 1) % LANE_SEQUENCE.length;
    }
  }
}