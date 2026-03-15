/**
 * MigrationOps — Assessments Lambda Handler
 *
 * Routes handled:
 *   GET    /api/assessments                          → listAssessments
 *   GET    /api/assessments/workload/{workloadId}    → getAssessmentForWorkload
 *   POST   /api/assessments/workload/{workloadId}/run → runAIAssessment (AI call)
 *   PATCH  /api/assessments/{id}/approve             → approveAssessment
 *   DELETE /api/assessments/{id}                     → deleteAssessment
 */

import 'dotenv/config';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import * as controller from '../controllers/assessmentController';
import { ApprovalPayload } from '../types';
import {
  ok, created, notFound, badRequest, serverError,
  serviceUnavailable, parseBody, isAiConfigured,
} from './utils';
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
  const params = event.pathParameters ?? {};

  try {
    // GET /api/assessments
    if (method === 'GET' && path === '/api/assessments') {
      const data = await controller.listAssessments();
      return ok({ data, count: data.length });
    }

    // GET /api/assessments/workload/{workloadId}
    if (method === 'GET' && params.workloadId && !path.endsWith('/run')) {
      const data = await controller.getAssessmentForWorkload(params.workloadId);
      if (!data) return notFound('No assessment found for this workload');
      return ok({ data });
    }

    // POST /api/assessments/workload/{workloadId}/run
    if (method === 'POST' && params.workloadId && path.endsWith('/run')) {
      if (!isAiConfigured()) {
        return serviceUnavailable(
          'AI provider not configured. Set ANTHROPIC_API_KEY in your .env file.',
          'AI_NOT_CONFIGURED'
        );
      }
      const data = await controller.runAIAssessment(params.workloadId);
      return created({ data });
    }

    // PATCH /api/assessments/{id}/approve
    if (method === 'PATCH' && params.id) {
      const payload = parseBody<ApprovalPayload>(event.body);
      if (!['approved', 'overridden'].includes(payload.status)) {
        return badRequest('status must be "approved" or "overridden"');
      }
      const data = await controller.approveAssessment(params.id, payload);
      if (!data) return notFound('Assessment not found');
      return ok({ data });
    }

    // DELETE /api/assessments/{id}
    if (method === 'DELETE' && params.id) {
      const deleted = await controller.deleteAssessment(params.id);
      if (!deleted) return notFound('Assessment not found');
      return ok({ data: { deleted: true, id: params.id } });
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error(JSON.stringify({ handler: 'assessments', error: message }));
    return serverError(message);
  }
};
