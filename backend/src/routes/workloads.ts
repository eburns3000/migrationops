/**
 * MigrationOps — Workload Express Routes
 *
 * Thin Express wrappers around workloadController functions.
 * For local development with STORAGE_BACKEND=memory (or dynamodb).
 * Lambda handlers call the same controllers directly.
 */

import { Router, Request, Response } from 'express';
import * as controller from '../controllers/workloadController';
import { CreateWorkloadPayload, Workload } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const data = await controller.listWorkloads();
  res.json({ data, count: data.length });
});

router.get('/:id', async (req: Request, res: Response) => {
  const data = await controller.getWorkload(req.params.id);
  if (!data) return res.status(404).json({ error: 'Workload not found' });
  return res.json({ data });
});

router.post('/', async (req: Request, res: Response) => {
  const payload = req.body as CreateWorkloadPayload;
  if (!payload.name || !payload.businessFunction) {
    return res.status(400).json({ error: 'name and businessFunction are required' });
  }
  const data = await controller.createWorkload(payload);
  return res.status(201).json({ data });
});

router.put('/:id', async (req: Request, res: Response) => {
  const data = await controller.updateWorkload(req.params.id, req.body as Partial<Workload>);
  if (!data) return res.status(404).json({ error: 'Workload not found' });
  return res.json({ data });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const deleted = await controller.deleteWorkload(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Workload not found' });
  return res.json({ data: { deleted: true, id: req.params.id } });
});

export default router;
