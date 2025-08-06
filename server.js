
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import cors from 'cors';
import { 
  initDatabase, 
  createUser, 
  authenticateUser, 
  verifyToken,
  createStream,
  getUserStreams,
  updateStreamStatus,
  deleteStream,
  startCleanupJob,
  resetAdminPassword,
  testConnection
} from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Initialize database and start cleanup job
await initDatabase();
startCleanupJob();

// No authentication required - public access
function publicAccess(req, res, next) {
  // Set a default public user for all requests
  req.user = {
    userId: 1,
    username: 'public'
  };
  next();
}

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset admin password endpoint (for troubleshooting)
app.post('/api/reset-admin', async (req, res) => {
  try {
    const success = await resetAdminPassword();
    if (success) {
      res.json({ message: 'Admin password reset successfully' });
    } else {
      res.status(404).json({ error: 'Admin user not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset admin password' });
  }
});

// API Routes
// Authentication endpoints removed - this is now an open source streaming server

app.post('/api/streams', publicAccess, async (req, res) => {
  try {
    const { title, description, quality } = req.body;
    const stream = await createStream(req.user.userId, title, description, quality);
    res.status(201).json({ stream });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

app.get('/api/streams', publicAccess, async (req, res) => {
  try {
    const streams = await getUserStreams(req.user.userId);
    res.json({ streams });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

app.put('/api/streams/:id/status', publicAccess, async (req, res) => {
  try {
    const { status } = req.body;
    await updateStreamStatus(req.params.id, status);
    res.json({ message: 'Stream status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stream status' });
  }
});

app.delete('/api/streams/:id', publicAccess, async (req, res) => {
  try {
    const result = await deleteStream(req.params.id, req.user.userId);
    if (!result) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete stream' });
  }
});

// Start RTMP server
const rtmpServer = spawn('node', ['rtmp-server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

rtmpServer.on('error', (err) => {
  console.error('Failed to start RTMP server:', err);
});

// Serve HLS files
app.use('/hls', express.static(path.join(__dirname, 'public', 'hls')));

// CORS for streaming
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Check if we're in production (dist folder exists) or development
const distPath = path.join(__dirname, 'dist');
const isProduction = existsSync(distPath);

if (isProduction) {
  // Production mode - serve built files
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Development mode - proxy to Vite dev server
  app.get('*', (req, res) => {
    res.redirect('http://localhost:5173' + req.url);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web server running on http://0.0.0.0:${PORT}`);
  console.log(`RTMP server running on rtmp://0.0.0.0:1935/live`);
  console.log('\nOBS Configuration:');
  console.log('Server: rtmp://localhost:1935/live');
  console.log('Stream Key: Use the stream key from your dashboard');
  
  if (isProduction) {
    console.log('Running in production mode');
  } else {
    console.log('Running in development mode - redirecting to Vite dev server');
  }
});

// Cleanup on exit
process.on('exit', () => {
  if (rtmpServer) {
    rtmpServer.kill();
  }
});

process.on('SIGTERM', () => {
  if (rtmpServer) {
    rtmpServer.kill();
  }
  process.exit(0);
});
