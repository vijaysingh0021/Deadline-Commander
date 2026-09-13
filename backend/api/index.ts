import type { Request, Response } from 'express';
import { app } from '../src/server.js';
import { connectDB } from '../src/config/db.js';
import { jwtSecret } from '../src/config/auth.js';

let databaseConnection: Promise<void> | undefined;

export default async function handler(req: Request, res: Response) {
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