// server/routes/cameras.js

import express from 'express';
import Camera from '../models/Camera.js';

const router = express.Router();


router.get('/:id', async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) {
      return res.status(404).json({ msg: 'Camera not found' });
    }
    // Send back the full camera document
    res.json(camera); 
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- NEW ENDPOINT ---
// PUT /api/cameras/:id/rois
// This will update the list of ROIs for a specific camera.
router.put('/:id/rois', async (req, res) => {
  const { rois } = req.body; // We expect the new 'rois' array
  const { id } = req.params; // The ID of the camera to update

  // Basic validation
  if (!rois || !Array.isArray(rois)) {
    return res.status(400).json({ msg: 'Missing or invalid "rois" data in request body' });
  }

  try {
    const camera = await Camera.findById(id);

    if (!camera) {
      return res.status(404).json({ msg: 'Camera not found' });
    }

    // --- This is the core logic ---
    // 1. Replace the old ROIs with the new ones from the request
    camera.rois = rois;

    // 2. (Optional) We can auto-generate the old 'roiPolygons'
    //    for compatibility with our Python script.
    //    We'll just use the *first* 'Traffic' ROI we find.
    const firstTrafficRoi = rois.find(r => r.type === 'Traffic');
    if (firstTrafficRoi) {
      camera.roiPolygons = { [firstTrafficRoi.name]: firstTrafficRoi.points };
    } else {
      camera.roiPolygons = {}; // Clear it if no traffic ROIs exist
    }
    
    // 3. Save the updated camera document
    await camera.save();

    // Send back the updated ROIs as confirmation
    res.json(camera.rois);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;