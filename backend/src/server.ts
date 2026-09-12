import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import missionRoutes from './routes/missions.js';
import analyticsRoutes from './routes/analytics.js';
import snapshotRoutes from './routes/snapshot.js';
import { jwtSecret } from './config/auth.js';

dotenv.config();

const app = express();

// Security & Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/snapshot', snapshotRoutes);

// Catch-all 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Database & Server startup
const startServer = async () => {
  jwtSecret();
  let dbOnline = false;
  try {
    await connectDB();
    dbOnline = true;
  } catch {
    console.warn('⚠️  MongoDB unavailable — running in demo mode (auth + snapshot persistence disabled).');
  }
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🎖️  Deadline Commander API running on port ${PORT} [${process.env.NODE_ENV || 'development'}] · DB: ${dbOnline ? 'online' : 'demo'}`);
  });
};

startServer().catch(console.error);
