/**
 * MigrationOps — Assessment Express Routes
 * Thin wrappers around assessmentController functions.
 */

import { Router, Request, Response } from 'express';
import * as controller from '../controllers/assessmentController';
import { ApprovalPayload } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const data = await controller.listAssessments();
  res.json({ data, count: data.length });
});

router.get('/workload/:workloadId', async (req: Request, res: Response) => {
  const data = await controller.getAssessmentForWorkload(req.params.workloadId);
  if (!data) return res.status(404).json({ error: 'No assessment found for this workload' });
  return res.json({ data });
});

router.post('/workload/:workloadId/run', async (req: Request, res: Response) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return res.status(503).json({
      error: 'AI provider not configured. Set ANTHROPIC_API_KEY in your .env file.',
      code: 'AI_NOT_CONFIGURED',
    });
  }
  try {
    const data = await controller.runAIAssessment(req.params.workloadId);
    return res.status(201).json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Assessment generation failed';
    return res.status(500).json({ error: message, code: 'AI_ERROR' });
  }
});

router.patch('/:id/approve', async (req: Request, res: Response) => {
  const payload = req.body as ApprovalPayload;
  if (!['approved', 'overridden'].includes(payload.status)) {
    return res.status(400).json({ error: 'status must be "approved" or "overridden"' });
  }
  const data = await controller.approveAssessment(req.params.id, payload);
  if (!data) return res.status(404).json({ error: 'Assessment not found' });
  return res.json({ data });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const deleted = await controller.deleteAssessment(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Assessment not found' });
  return res.json({ data: { deleted: true, id: req.params.id } });
});

export default router;
