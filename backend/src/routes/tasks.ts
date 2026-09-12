import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { z } from 'zod';
import { invalidRequest, objectId, reward } from '../validation.js';

const router = Router();
router.use(authenticateToken);
const taskSchema = z.object({
  projectId: objectId,
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(5_000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dueDate: z.coerce.date().optional(),
  xpReward: reward.optional(),
  goldReward: reward.optional(),
});
const statusSchema = z.object({ status: z.enum(['todo', 'in_progress', 'completed']) });

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.query;
    const query: any = { ownerId: req.user?.userId };
    if (projectId) query.projectId = projectId;
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const parsed = taskSchema.safeParse(req.body);
    if (!parsed.success) return invalidRequest(res, parsed.error);
    const { projectId, title, description, priority, dueDate, xpReward, goldReward } = parsed.data;
    const project = await Project.exists({ _id: projectId, ownerId: req.user?.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const task = new Task({
      projectId,
      ownerId: req.user?.userId,
      title,
      description,
      priority: priority || 'medium',
      dueDate,
      xpReward: xpReward ?? 50,
      goldReward: goldReward ?? 10
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return invalidRequest(res, parsed.error);
    const { status } = parsed.data;
    const completing = status === 'completed';
    const task = await Task.findOneAndUpdate(
      { _id: id, ownerId: req.user?.userId, ...(completing ? { status: { $ne: 'completed' } } : {}) },
      { status },
      { new: true }
    );

    if (!task) {
      const existing = await Task.findOne({ _id: id, ownerId: req.user?.userId });
      if (!existing) return res.status(404).json({ error: 'Task not found' });
      return res.json(existing);
    }

    if (completing) {
      // Award XP & Gold to User
      const user = await User.findById(req.user?.userId);
      if (user) {
        user.xp += task.xpReward;
        user.gold += task.goldReward;
        if (user.xp >= user.level * 500) {
          user.level += 1;
        }
        await user.save();
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await Task.findOneAndDelete({ _id: id, ownerId: req.user?.userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
