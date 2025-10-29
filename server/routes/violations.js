// server/routes/violations.js

import express from 'express';
import Violation from '../models/Violation.js';

const router = express.Router();

// --- GET /api/violations ---
// This is for our React app to fetch and display all violations
router.get('/', async (req, res) => {
  try {
    // Find all violations and sort them with the newest one first
    const violations = await Violation.find().sort({ timestamp: -1 });
    res.json(violations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- POST /api/violations ---
// This is for our dummy Python script to create new fake violations
router.post('/', async (req, res) => {
  try {
    const { 
      intersectionId, 
      intersectionName, 
      cameraName, 
      licensePlate, 
      imageUrl 
    } = req.body;

    // Simple validation
    if (!intersectionId || !intersectionName || !cameraName || !licensePlate || !imageUrl) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    const newViolation = new Violation({
      intersectionId,
      intersectionName,
      cameraName,
      licensePlate,
      imageUrl
    });

    await newViolation.save();
    res.status(201).json(newViolation); // 201 = Created
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;