// server/server.js

import express from 'express';
import cors from 'cors';
import { createServer } from 'http'; // <-- 1. Import http
import { Server } from 'socket.io'; // <-- 2. Import Server from socket.io

import connectDB from './db.js';
import intersectionRoutes from './routes/intersections.js';

connectDB();

const app = express();
const PORT = 5001;

// --- 3. Create HTTP server and integrate Socket.IO ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // The origin for our future React app
    methods: ["GET", "POST"]
  }
});

// --- 4. Middleware to attach 'io' to each request ---
// This makes the 'io' object available in our route files
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 5. Socket.IO connection listener ---
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`👋 Client disconnected: ${socket.id}`);
  });
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.use('/api/intersections', intersectionRoutes); 

// --- 6. Start the server using the httpServer instance ---
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});