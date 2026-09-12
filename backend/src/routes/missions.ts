import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Mission } from '../models/Mission.js';
import { User } from '../models/User.js';
import { z } from 'zod';
import { invalidRequest, reward } from '../validation.js';

const router = Router();
router.use(authenticateToken);
const missionSchema = z.object({
  title: z.string().trim().min(1).max(240),
  objective: z.string().trim().min(1).max(5_000),
  deadline: z.coerce.date(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'legendary']).optional(),
  riskLevel: z.enum(['low', 'moderate', 'elevated', 'critical']).optional(),
  xpReward: reward.optional(),
  goldReward: reward.optional(),
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const missions = await Mission.find({ ownerId: req.user?.userId }).sort({ deadline: 1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const parsed = missionSchema.safeParse(req.body);
    if (!parsed.success) return invalidRequest(res, parsed.error);
    const { title, objective, deadline, difficulty, riskLevel, xpReward, goldReward } = parsed.data;
    const mission = new Mission({
      ownerId: req.user?.userId,
      title,
      objective,
      deadline,
      difficulty: difficulty || 'medium',
      riskLevel: riskLevel || 'low',
      xpReward: xpReward ?? 200,
      goldReward: goldReward ?? 50
    });
    await mission.save();
    res.status(201).json(mission);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.patch('/:id/complete', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const mission = await Mission.findOneAndUpdate(
      { _id: id, ownerId: req.user?.userId, status: { $ne: 'completed' } },
      { status: 'completed' },
      { new: true }
    );

    if (!mission) {
      const existing = await Mission.findOne({ _id: id, ownerId: req.user?.userId });
      if (!existing) return res.status(404).json({ error: 'Mission not found' });
      return res.json(existing);
    }

    if (mission) {
      const user = await User.findById(req.user?.userId);
      if (user) {
        user.xp += mission.xpReward;
        user.gold += mission.goldReward;
        if (user.xp >= user.level * 500) {
          user.level += 1;
        }
        await user.save();
      }
    }

    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await Mission.findOneAndDelete({ _id: id, ownerId: req.user?.userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
