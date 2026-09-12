import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';

/**
 * Snapshot sync layer.
 *
 * The command brain (risk engine, planner, XP economy, analytics) lives in the
 * frontend and computes the full CommanderSnapshot as its source of truth.
 * This API gives every commander a durable copy on the backend + identity on
 * top (JWT auth), so history survives across browsers and devices.
 *
 *   GET  /api/snapshot  → download your saved snapshot
 *   PUT  /api/snapshot  → upload (replace) your snapshot
 *   GET  /api/snapshot/hydrate → first-run from identity (no snapshot yet)
 */
const router = Router();
router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: 'Commander not found' });
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        gold: user.gold,
        streak: user.streak,
      },
      snapshot: user.snapshot ?? null,
      hasSnapshot: Boolean(user.snapshot),
      updatedAt: user.snapshotUpdatedAt ?? null,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/', async (req: AuthRequest, res) => {
  try {
    const snapshot = req.body.snapshot;
    if (!snapshot || typeof snapshot !== 'object') {
      return res.status(400).json({ error: 'A snapshot object is required' });
    }

    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: 'Commander not found' });

    user.snapshot = snapshot;
    user.snapshotUpdatedAt = new Date();

    // Mirror economy stats onto the denormalised user record for leaderboards
    const profile = snapshot.profile as { level?: number; xp?: number; gold?: number; streak?: number };
    if (profile) {
      if (typeof profile.level === 'number') user.level = profile.level;
      if (typeof profile.xp === 'number') user.xp = profile.xp;
      if (typeof profile.gold === 'number') user.gold = profile.gold;
      if (typeof profile.streak === 'number') user.streak = profile.streak;
    }

    await user.save();
    res.json({ ok: true, savedAt: user.snapshotUpdatedAt, user });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ error: 'Commander not found' });
    user.snapshot = undefined;
    user.snapshotUpdatedAt = undefined;
    await user.save();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;