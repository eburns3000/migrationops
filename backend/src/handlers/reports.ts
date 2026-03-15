/**
 * MigrationOps — Reports Lambda Handler
 *
 * Routes handled:
 *   GET  /api/reports             → listReports
 *   GET  /api/reports/latest      → getLatestReport
 *   GET  /api/reports/metrics     → getMetrics
 *   POST /api/reports/generate    → generateReport (AI call)
 */

import 'dotenv/config';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import * as controller from '../controllers/reportController';
import { ok, created, notFound, serverError, serviceUnavailable, isAiConfigured } from './utils';
import { ensureBootstrapped } from '../data/bootstrap';

const initPromise = ensureBootstrapped();

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  await initPromise;

  const method = event.requestContext.http.method.toUpperCase();
  const stage = event.requestContext.stage;
  const rawPath = event.requestContext.http.path;
  const path = stage !== '$default' ? rawPath.slice(`/${stage}`.length) : rawPath;

  try {
    // GET /api/reports/metrics
    if (method === 'GET' && path === '/api/reports/metrics') {
      const data = await controller.getMetrics();
      return ok({ data });
    }

    // GET /api/reports/latest
    if (method === 'GET' && path === '/api/reports/latest') {
      const data = await controller.getLatestReport();
      if (!data) return notFound('No reports generated yet');
      return ok({ data });
    }

    // GET /api/reports
    if (method === 'GET' && path === '/api/reports') {
      const data = await controller.listReports();
      return ok({ data });
    }

    // POST /api/reports/generate
    if (method === 'POST' && path === '/api/reports/generate') {
      if (!isAiConfigured()) {
        return serviceUnavailable(
          'AI provider not configured. Set ANTHROPIC_API_KEY in your environment.',
          'AI_NOT_CONFIGURED'
        );
      }
      const data = await controller.generateReport();
      return created({ data });
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error(JSON.stringify({ handler: 'reports', error: message }));
    return serverError(message);
  }
};
