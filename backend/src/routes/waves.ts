import { Router, Request, Response } from 'express';
import * as controller from '../controllers/waveController';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const result = await controller.getWaves();
  res.json(result);
});

export default router;
