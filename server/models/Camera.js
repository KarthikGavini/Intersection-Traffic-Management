// server/models/Camera.js

import mongoose from 'mongoose';

const cameraSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  videoSource: { 
    type: String, 
    required: true 
  },
  roiPolygons: { 
    type: Object, 
    required: true 
  },
  // This creates the link back to the parent Intersection document
  intersection: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Intersection' 
  }
});

const Camera = mongoose.model('Camera', cameraSchema);

export default Camera;