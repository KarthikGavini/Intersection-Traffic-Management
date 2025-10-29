// server/routes/scheduledRoutes.js

import express from 'express';
import ScheduledRoute from '../models/ScheduledRoute.js';

const router = express.Router();

// --- POST /api/routes ---
// Creates a new scheduled "green wave" route
router.post('/', async (req, res) => {
  const { name, startTime, route } = req.body;

  if (!name || !startTime || !route || !Array.isArray(route)) {
    return res.status(400).json({ msg: 'Please provide a name, startTime, and a route array.' });
  }

  try {
    const newRoute = new ScheduledRoute({
      name,
      startTime,
      route,
      status: 'pending', // All new routes start as pending
    });

    await newRoute.save();
    res.status(201).json(newRoute); // 201 = Created
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- GET /api/routes ---
// Gets all scheduled routes
// The GTM will use this later to find active routes
router.get('/', async (req, res) => {
  try {
    // Find all routes that aren't completed, sorted by start time
    const routes = await ScheduledRoute.find({
      status: { $in: ['pending', 'active'] }
    }).sort({ startTime: 1 });
    
    res.json(routes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/routes/:id
// Deletes a specific scheduled route
router.delete('/:id', async (req, res) => {
  try {
    const route = await ScheduledRoute.findById(req.params.id);

    if (!route) {
      return res.status(404).json({ msg: 'Route not found' });
    }

    // --- THIS IS THE FIX ---
    await route.deleteOne(); // Use this instead of route.remove()
    // -----------------------

    res.json({ msg: 'Route successfully deleted' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;