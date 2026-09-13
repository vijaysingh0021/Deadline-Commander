import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/server.js';
import { connectDB } from '../src/config/db.js';
import { jwtSecret } from '../src/config/auth.js';

let databaseConnection: Promise<void> | undefined;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  jwtSecret();
  databaseConnection ??= connectDB();

  try {
    await databaseConnection;
  } catch (error) {
    databaseConnection = undefined;
    console.error('MongoDB connection failed:', error);
    res.status(503).json({ error: 'Database unavailable' });
    return;
  }

  return app(req, res);
}