// server/services/simulation.js

import { cityState, cityLayout, LANE_SEQUENCE } from './cityState.js';

/**
 * This function simulates traffic flow between intersections (Option B)
 * It modifies the cityState object directly
 */
export function simulateCityFlow() {
  const now = Date.now();
  
  // This loop processes traffic *leaving* an intersection
  for (const nodeId in cityState) {
    const nodeState = cityState[nodeId];
    
    const greenLane = Object.keys(nodeState.lights).find(
      lane => nodeState.lights[lane] === 'green'
    );

    if (greenLane) {
      // This intersection has a green light. Drain its density.
      const drainRate = 5; // Drain 5% density per tick
      const densityToDrain = Math.min(nodeState.densities[greenLane], drainRate);
      
      nodeState.densities[greenLane] = Math.max(0, nodeState.densities[greenLane] - densityToDrain);
      
      // Now, check if this lane feeds into another intersection
      const flowRule = cityLayout[nodeId]?.[greenLane];
      if (flowRule && densityToDrain > 0) {
        const destNode = cityState[flowRule.destNode];
        if (destNode) {
          // Add this traffic as an "incoming platoon" to the destination
          destNode.incomingPlatoons.push({
            amount: densityToDrain,
            destLane: flowRule.destLane, // We know the destination lane now
            arrivalTime: now + 10000 // Arrives in 10 seconds
          });
        }
      }
    }
  }

  // This loop processes traffic *arriving* at an intersection
  for (const nodeId in cityState) {
    const nodeState = cityState[nodeId];
    
    // Process arriving platoons
    const remainingPlatoons = [];
    for (const platoon of nodeState.incomingPlatoons) {
      if (now >= platoon.arrivalTime) {
        // It has arrived! Add density to the correct destination lane.
        nodeState.densities[platoon.destLane] += platoon.amount;
        nodeState.densities[platoon.destLane] = Math.min(nodeState.densities[platoon.destLane], 100);
      } else {
        remainingPlatoons.push(platoon);
      }
    }
    nodeState.incomingPlatoons = remainingPlatoons;

    // Add some random "local" traffic for simulated nodes
    if (nodeState.isSimulated && Math.random() < 0.2) { // 20% chance each tick
      const randomLane = LANE_SEQUENCE[Math.floor(Math.random() * 4)];
      nodeState.densities[randomLane] += 5; // Add 5% density
      nodeState.densities[randomLane] = Math.min(nodeState.densities[randomLane], 100);
    }
  }
}