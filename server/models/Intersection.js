// server/models/Intersection.js

import mongoose from 'mongoose';
import './Camera.js';

const intersectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // This is an array that will hold the ObjectIDs of the associated Camera documents
  cameras: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera' // This tells Mongoose to look in the 'Camera' model
  }],
});

const Intersection = mongoose.model('Intersection', intersectionSchema);

export default Intersection;