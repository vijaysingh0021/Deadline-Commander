import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Mission } from '../models/Mission.js';

const router = Router();

router.use(authenticateToken);

// Dashboard Metrics & Analytics Summary
router.get('/metrics', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const projectCount = await Project.countDocuments({ ownerId: userId });
    const taskCount = await Task.countDocuments({ ownerId: userId });
    const completedTasks = await Task.countDocuments({ ownerId: userId, status: 'completed' });
    const missionCount = await Mission.countDocuments({ ownerId: userId });
    const activeMissions = await Mission.countDocuments({ ownerId: userId, status: 'active' });

    res.json({
      projectCount,
      taskCount,
      completedTasks,
      missionCount,
      activeMissions,
      completionRate: taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
