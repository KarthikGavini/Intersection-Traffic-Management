// // server/models/Camera.js

// import mongoose from 'mongoose';

// const cameraSchema = new mongoose.Schema({
//   name: { 
//     type: String, 
//     required: true 
//   },
//   videoSource: { 
//     type: String, 
//     required: true 
//   },
//   roiPolygons: { 
//     type: Object, 
//     required: true 
//   },
//   // This creates the link back to the parent Intersection document
//   intersection: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'Intersection' 
//   }
// });

// const Camera = mongoose.model('Camera', cameraSchema);

// export default Camera;

// server/models/Camera.js

import mongoose from 'mongoose';

// --- 1. NEW: Define a sub-schema for a single ROI ---
// This lets us have an array of these objects
const roiSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  type: {
    type: String,
    required: true,
    enum: ['Traffic', 'Pedestrian'] // Only allow these two string values
  },
  points: { 
    type: Array, // Will be an array of [x, y] coordinates
    required: true 
  }
}, { _id: false }); // Don't give each sub-document its own _id

// --- 2. Update the main Camera schema ---
const cameraSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  videoSource: { 
    type: String, 
    required: true 
  },
  
  // --- This is the key change ---
  // We're replacing 'roiPolygons' with 'rois'
  rois: [roiSchema], // An array of the roiSchema objects
  
  // We are keeping this for our Python script
  roiPolygons: { 
    type: Object, 
    required: false // No longer required, as we phase it out
  },
  // ---------------------------------
  
  intersection: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Intersection' 
  }
});

const Camera = mongoose.model('Camera', cameraSchema);

export default Camera;