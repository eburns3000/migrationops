/**
 * MigrationOps — Waves Lambda Handler
 *
 * Routes handled:
 *   GET /api/waves → getWaves
 */

import 'dotenv/config';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import * as controller from '../controllers/waveController';
import { ok, serverError } from './utils';
import { ensureBootstrapped } from '../data/bootstrap';

const initPromise = ensureBootstrapped();

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  await initPromise;

  try {
    const result = await controller.getWaves();
    return ok(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error(JSON.stringify({ handler: 'waves', error: message }));
    return serverError(message);
  }
};
