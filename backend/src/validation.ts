import { z } from 'zod';
import type { Response } from 'express';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid resource ID');
export const reward = z.number().int().min(0).max(10_000);

export function invalidRequest(res: Response, error: z.ZodError) {
  return res.status(400).json({ error: 'Invalid request', details: error.flatten() });
}
