// server/models/Violation.js

import mongoose from 'mongoose';

const violationSchema = new mongoose.Schema({
  // e.g., "68bf113329a3d66abae0fd7c"
  intersectionId: {
    type: String,
    required: true,
  },
  // e.g., "Main & First (Real)"
  intersectionName: {
    type: String,
    required: true,
  },
  // e.g., "North"
  cameraName: {
    type: String,
    required: true,
  },
  // e.g., "AP 39 GH 1234"
  licensePlate: {
    type: String,
    required: true,
  },
  // A URL to the "evidence" photo
  imageUrl: {
    type: String,
    required: true,
  },
  // When the violation occurred
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true }); // Adds createdAt

const Violation = mongoose.model('Violation', violationSchema);

export default Violation;