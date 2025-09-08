// server/routes/videoStream.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Helper to get the correct directory path in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/:videoName', (req, res) => {
  const videoName = req.params.videoName;
  // Construct the path to the video file, going up one level from 'server'
  // and then into 'python-service/videos'
  const videoPath = path.join(__dirname, '../../python-service/videos', videoName);

  if (fs.existsSync(videoPath)) {
    res.writeHead(200, { 'Content-Type': 'video/mp4' });
    fs.createReadStream(videoPath).pipe(res);
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

export default router;