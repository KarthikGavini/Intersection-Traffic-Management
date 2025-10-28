// // server/server.js

// import express from 'express';
// import cors from 'cors';
// import { createServer } from 'http'; // <-- 1. Import http
// import { Server } from 'socket.io'; // <-- 2. Import Server from socket.io

// import connectDB from './db.js';
// import intersectionRoutes from './routes/intersections.js';
// import videoStreamRouter from './routes/videoStream.js';

// connectDB();

// const app = express();
// const PORT = 5001;

// // --- 3. Create HTTP server and integrate Socket.IO ---
// const httpServer = createServer(app);
// const io = new Server(httpServer, {
//   cors: {
//     origin: "http://localhost:5173", // The origin for our future React app
//     methods: ["GET", "POST"]
//   }
// });

// // --- 4. Middleware to attach 'io' to each request ---
// // This makes the 'io' object available in our route files
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));

// // --- 5. Socket.IO connection listener ---
// io.on('connection', (socket) => {
//   console.log(`🔌 New client connected: ${socket.id}`);
  
//   socket.on('disconnect', () => {
//     console.log(`👋 Client disconnected: ${socket.id}`);
//   });
// });

// app.get('/', (req, res) => {
//   res.send('Server is running!');
// });

// app.use('/api/intersections', intersectionRoutes); 
// app.use('/api/videos', videoStreamRouter);

// // --- 6. Start the server using the httpServer instance ---
// httpServer.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });


// server/server.js

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB from './db.js';
import intersectionRoutes from './routes/intersections.js';
import videoStreamRouter from './routes/videoStream.js';
import { initializeGTM } from './services/GTM.js'; // <-- IMPORT THE GTM

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

// --- 5. Start the server ---
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// --- 6. NEW: Start the Global Traffic Manager (GTM) ---
// We pass 'io' to the GTM so it can broadcast updates
initializeGTM(io);