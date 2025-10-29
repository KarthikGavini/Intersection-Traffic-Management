// server/models/ScheduledRoute.js

import mongoose from 'mongoose';

const scheduledRouteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // The exact time the VIP "wave" should begin
  startTime: {
    type: Date,
    required: true,
  },
  // An ordered list of intersection IDs, e.g.,
  // ["68bf...", "sim-node-1", "sim-node-2"]
  route: {
    type: [String],
    required: true,
  },
  // We'll use this to track the event
  status: {
    type: String,
    required: true,
    enum: ['pending', 'active', 'completed'],
    default: 'pending',
  },
}, { timestamps: true }); // Adds createdAt and updatedAt

const ScheduledRoute = mongoose.model('ScheduledRoute', scheduledRouteSchema);

export default ScheduledRoute;