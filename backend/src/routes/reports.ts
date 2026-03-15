/**
 * MigrationOps — Reports Express Routes
 * Thin wrappers around reportController functions.
 */

import { Router, Request, Response } from 'express';
import * as controller from '../controllers/reportController';
import { getActiveProvider } from '../services/ai/reasoningService';

const router = Router();

router.get('/metrics', async (_req: Request, res: Response) => {
  const data = await controller.getMetrics();
  res.json({ data });
});

router.get('/latest', async (_req: Request, res: Response) => {
  const data = await controller.getLatestReport();
  if (!data) return res.status(404).json({ error: 'No reports generated yet' });
  return res.json({ data });
});

router.get('/', async (_req: Request, res: Response) => {
  const data = await controller.listReports();
  res.json({ data });
});

router.post('/generate', async (_req: Request, res: Response) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return res.status(503).json({
      error: 'AI provider not configured. Set ANTHROPIC_API_KEY in your .env file.',
      code: 'AI_NOT_CONFIGURED',
    });
  }
  try {
    const data = await controller.generateReport();
    return res.status(201).json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Report generation failed';
    return res.status(500).json({ error: message, code: 'AI_ERROR' });
  }
});

router.get('/provider', (_req: Request, res: Response) => {
  res.json({ data: getActiveProvider() });
});

export default router;
