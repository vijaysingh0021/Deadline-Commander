import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { z } from 'zod';
import { jwtSecret } from '../config/auth.js';
import { invalidRequest } from '../validation.js';

const router = Router();
const registerSchema = z.object({
  username: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});
const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return invalidRequest(res, parsed.error);
    const { username, email, password } = parsed.data;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      jwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        gold: user.gold,
        streak: user.streak
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return invalidRequest(res, parsed.error);
    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      jwtSecret(),
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        gold: user.gold,
        streak: user.streak
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
