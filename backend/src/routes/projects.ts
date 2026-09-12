import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { z } from 'zod';
import { invalidRequest } from '../validation.js';

const router = Router();
router.use(authenticateToken);
const projectSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5_000).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'legendary']).optional(),
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const projects = await Project.find({ ownerId: req.user?.userId }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) return invalidRequest(res, parsed.error);
    const { title, description, difficulty } = parsed.data;
    const project = new Project({
      ownerId: req.user?.userId,
      title,
      description,
      difficulty: difficulty || 'medium'
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOneAndDelete({ _id: id, ownerId: req.user?.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await Task.deleteMany({ projectId: id, ownerId: req.user?.userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
