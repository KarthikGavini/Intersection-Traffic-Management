// server/services/localLogic.js

import {
  LANE_SEQUENCE,
  MIN_GREEN_TIME,
  MAX_GREEN_TIME,
  YELLOW_TIME,
} from './cityState.js';

const PEDESTRIAN_WALK_TIME = 10000; // 10 seconds

// --- Logic Weights & Thresholds ---
const DENSITY_WEIGHT = 0.7;
const POLLUTION_WEIGHT = 0.3;
const MIN_SCORE_THRESHOLD = 10; // Don't turn green for tiny scores
const CONGESTION_THRESHOLD = 75; // % density at which neighbor penalty *starts*

/**
 * This is the new network-aware logic function.
 * It now accepts the entire city state to make smarter decisions.
 */
export function updateLocalIntersectionLogic(
  nodeId,            // The ID of the intersection we're processing
  nodeState,         // The state object for this one intersection
  cityState,         // The state of ALL intersections
  cityLayout,        // The map of how they connect
  vipPriorityLane    // <-- 1. NEW: The VIP override command
) {
  const { lights, densities, pollutionScores, pedestrianWaiting } = nodeState;
  const now = Date.now();
  const elapsedTime = now - nodeState.stateChangeTime;

  // --- 2. NEW: STATE -1: VIP OVERRIDE ---
  // This is the highest priority. If a VIP command exists, do it.
  if (vipPriorityLane) {
    // If the correct light is already green, just reset its timer
    if (lights[vipPriorityLane] === 'green') {
      nodeState.stateChangeTime = now; // Pretend the green light just started
    } else {
      // Force all lights to red, then open the VIP lane
      for (const lane of LANE_SEQUENCE) {
        lights[lane] = 'red';
      }
      lights[vipPriorityLane] = 'green';
      
      // Update the state machine's internal state
      nodeState.currentLightState = 'GREEN';
      nodeState.currentLaneIndex = LANE_SEQUENCE.indexOf(vipPriorityLane);
      nodeState.stateChangeTime = now;
      nodeState.isPedestrianPhase = false; // VIP overrides pedestrians
      console.log(`[Logic ${nodeState.name}] VIP OVERRIDE: Forcing ${vipPriorityLane} green.`);
    }
    return; // --- Skip all other logic ---
  }
  
  // --- STATE 0: Pedestrian Walk Phase (No change) ---
  if (nodeState.isPedestrianPhase) {
    if (elapsedTime >= PEDESTRIAN_WALK_TIME) {
      nodeState.isPedestrianPhase = false;
      nodeState.currentLightState = 'RED'; // Go to decision phase
      nodeState.stateChangeTime = now;
      console.log(`[Logic ${nodeState.name}] Pedestrian phase END. Resuming traffic.`);
    }
    return; // Wait for phase to end
  }

  // We only care about pedestrians if the node is NOT simulated
  const isPedestrianWaiting = !nodeState.isSimulated && Object.values(pedestrianWaiting).some(val => val === true);

  // --- STATE 1: A light is GREEN (No change) ---
  if (nodeState.currentLightState === 'GREEN') {
    const activeLane = LANE_SEQUENCE[nodeState.currentLaneIndex];
    const activeDensity = densities[activeLane] ?? 0;

    const isMaxTimeReached = elapsedTime >= MAX_GREEN_TIME;
    const isMinTimeFinished = elapsedTime >= MIN_GREEN_TIME;
    const isDensityLow = activeDensity < 10; 

    if (isMaxTimeReached || (isDensityLow && isMinTimeFinished)) {
      nodeState.currentLightState = 'YELLOW';
      lights[activeLane] = 'yellow';
      nodeState.stateChangeTime = now;
    }
  }

  // --- STATE 2: A light is YELLOW (No change) ---
  else if (nodeState.currentLightState === 'YELLOW') {
    if (elapsedTime >= YELLOW_TIME) {
      const previousLane = LANE_SEQUENCE[nodeState.currentLaneIndex];
      
      nodeState.currentLightState = 'RED';
      lights[previousLane] = 'red';
      nodeState.stateChangeTime = now;
      
      if (isPedestrianWaiting) {
        nodeState.isPedestrianPhase = true; 
        console.log(`[Logic ${nodeState.name}] Pedestrian waiting. Initiating walk phase.`);
        Object.keys(nodeState.pedestrianWaiting).forEach(k => {
          nodeState.pedestrianWaiting[k] = false;
        });
        return; // Start pedestrian phase
      }
    }
  }

  // --- STATE 3: All lights are RED (Decision Phase with NEW penalty logic) ---
  else if (nodeState.currentLightState === 'RED') {
    
    const scores = {};
    for (let i = 0; i < LANE_SEQUENCE.length; i++) {
      const lane = LANE_SEQUENCE[i];
      
      // 1. Calculate Base Priority Score (same as before)
      const density = densities[lane] ?? 0;
      const normalizedPollution = Math.min((pollutionScores[lane] ?? 0) / 5, 100); 
      const baseScore = (density * DENSITY_WEIGHT) + (normalizedPollution * POLLUTION_WEIGHT);
      
      // --- 4. NEW: Calculate Neighbor Congestion Penalty ---
      let penaltyFactor = 1.0; // Default: no penalty
      const flowRule = cityLayout[nodeId]?.[lane]; // Find where this lane's traffic goes

      if (flowRule) {
        const destNode = cityState[flowRule.destNode];
        // Add a check to make sure destNode exists
        if (destNode) {
          const destLane = flowRule.destLane;
          const destDensity = destNode.densities[destLane] ?? 0;

          // If the destination lane is over the congestion threshold...
          if (destDensity > CONGESTION_THRESHOLD) {
            // Calculate how "full" the remaining capacity is (a value from 0.0 to 1.0)
            const overflow = (destDensity - CONGESTION_THRESHOLD) / (100 - CONGESTION_THRESHOLD);
            // The penalty is the inverse (1.0 down to 0.0)
            penaltyFactor = 1.0 - overflow;
          }
        }
      }
      
      // 5. Calculate Final Score
      const finalScore = baseScore * penaltyFactor;
      scores[lane] = finalScore;
    }
    
    // 6. Find the lane with the highest final score
    let bestLane = null;
    let maxScore = MIN_SCORE_THRESHOLD; 

    for (const lane of LANE_SEQUENCE) {
      if (scores[lane] > maxScore) {
        maxScore = scores[lane];
        bestLane = lane;
      }
    }

    // 7. If a winner is found, turn its light green
    if (bestLane) {
      console.log(`[Logic ${nodeState.name}] Decision: ${bestLane} wins with score ${maxScore.toFixed(1)}`);
      nodeState.currentLightState = 'GREEN';
      lights[bestLane] = 'green';
      nodeState.currentLaneIndex = LANE_SEQUENCE.indexOf(bestLane);
      nodeState.stateChangeTime = now;
    } else {
      // No lane meets the minimum threshold. Do nothing.
      // The system will idle in the RED state until a score is high enough.
    }
  }
}