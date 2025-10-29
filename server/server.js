// server/server.js

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path'; 
import { fileURLToPath } from 'url';

import connectDB from './db.js';
import intersectionRoutes from './routes/intersections.js';
import videoStreamRouter from './routes/videoStream.js';
import { initializeGTM } from './services/GTM.js'; //
import cameraRoutes from './routes/cameras.js';
import { populateRealNodeCameraIds } from './services/cityState.js';
import scheduledRoutes from './routes/scheduledRoutes.js';
import violationRoutes from './routes/violations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();
const PORT = 5001;

// --- 1. Create HTTP server and integrate Socket.IO ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // React app origin
    methods: ["GET", "POST"]
  }
});

// --- 2. Middleware ---
// We don't need to attach 'io' to req anymore, GTM handles it
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/violation-cars', express.static(path.join(__dirname, '../python-service/violation-cars')));

// --- 3. Socket.IO connection listener (UPDATED) ---
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);
  
  // Event for clients to subscribe to a specific intersection
  socket.on('subscribe-to-intersection', (intersectionId) => {
    // Leave any old "intersection" rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
        console.log(`Client ${socket.id} left room: ${room}`);
      }
    });
    
    // Join the new room
    console.log(`Client ${socket.id} joining room: ${intersectionId}`);
    socket.join(intersectionId);
    // The GTM loop will send updates automatically
  });

  socket.on('disconnect', () => {
    console.log(`👋 Client disconnected: ${socket.id}`);
  });
});

// --- 4. API Routes ---
app.get('/', (req, res) => {
  res.send('Server is running!');
});
app.use('/api/intersections', intersectionRoutes); 
app.use('/api/videos', videoStreamRouter);
app.use('/api/cameras', cameraRoutes);
app.use('/api/routes', scheduledRoutes);
app.use('/api/violations', violationRoutes);

async function startServer() {
  console.log('Server starting...');
  
  // --- 2. ADD THIS ---
  // Wait for the DB to give us the camera IDs before we start
  await populateRealNodeCameraIds(); 
  
  httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // --- 3. This stays the same ---
  initializeGTM(io);
}

startServer();