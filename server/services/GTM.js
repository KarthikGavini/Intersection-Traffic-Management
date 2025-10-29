// server/services/GTM.js

import { cityState, cityLayout } from './cityState.js';
import { updateLocalIntersectionLogic } from './localLogic.js';
import { simulateCityFlow } from './simulation.js';
import ScheduledRoute from '../models/ScheduledRoute.js'; // <-- 1. Import the model

const GTM_INTERVAL_MS = 2000;

/**
 * This is the main GTM loop function.
 */
export async function runGlobalTrafficManager(io) { // <-- 2. Make this function async
    const now = Date.now();

    // --- 3. NEW: VIP "GREEN WAVE" LOGIC ---
    const vipPriorities = {}; // Will look like: { "intersectionId": "laneToMakeGreen" }

    try {
        // Find all routes that are scheduled to be active
        const activeRoutes = await ScheduledRoute.find({
            status: { $in: ['pending', 'active'] },
            startTime: { $lte: new Date(now) }
        });

        for (const route of activeRoutes) {
            if (route.status === 'pending') {
                route.status = 'active'; // Mark as active
                await route.save();
                console.log(`[GTM] VIP Route "${route.name}" is now ACTIVE.`);
            }

            // TODO: Add logic to mark as 'completed' after startTime + duration

            // Now, build the priority map for all intersections on this route
            for (let i = 0; i < route.route.length - 1; i++) {
                const currentNodeId = route.route[i];
                const nextNodeId = route.route[i + 1];

                // Find the lane in the current node that leads to the next node
                const laneToClear = Object.keys(cityLayout[currentNodeId] || {}).find(
                    lane => cityLayout[currentNodeId][lane].destNode === nextNodeId
                );

                if (laneToClear) {
                    // Tell this intersection to force this lane green
                    vipPriorities[currentNodeId] = laneToClear;
                }
            }
        }
    } catch (err) {
        console.error('[GTM] Error processing VIP routes:', err.message);
    }
    // --- END OF VIP LOGIC ---


    // 1. Run the simulation logic (no change)
    simulateCityFlow();

    // 2. Run the local light logic for *every* intersection (updated)
    for (const intersectionId in cityState) {
        const nodeState = cityState[intersectionId];

        // 4. Pass the VIP command (if any) to the local logic
        const vipPriorityLane = vipPriorities[intersectionId] || null;

        updateLocalIntersectionLogic(
            intersectionId,
            nodeState,
            cityState,
            cityLayout,
            vipPriorityLane // <-- 5. Pass the VIP command
        );

        // ... (rest of the broadcast/arduino logic is the same)
        io.to(intersectionId).emit('state-update', nodeState);
        if (intersectionId === cityState.REAL_INTERSECTION_ID) {
            const { lights } = nodeState;
            const commandString = LANE_SEQUENCE.map(lane => lights[lane].charAt(0).toUpperCase()).join(',');
            io.to(intersectionId).emit('arduino-command', commandString);
        }
    }
}

/**
 * This function initializes the GTM and starts the interval.
 */
export function initializeGTM(io) {
    console.log('🚀 Global Traffic Manager (GTM) initializing...');
    setInterval(() => {
        // We don't await here, let it run in the background
        runGlobalTrafficManager(io);
    }, GTM_INTERVAL_MS);
    console.log(`✅ GTM started. Running logic every ${GTM_INTERVAL_MS}ms.`);
}