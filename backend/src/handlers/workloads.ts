/**
 * MigrationOps — Workloads Lambda Handler
 *
 * Entry point for the WorkloadsFunction Lambda.
 * Routes API Gateway v2 HTTP events to workload controller functions.
 *
 * Routes handled:
 *   GET    /api/workloads          → listWorkloads
 *   GET    /api/workloads/{id}     → getWorkload
 *   POST   /api/workloads          → createWorkload
 *   PUT    /api/workloads/{id}     → updateWorkload
 *   DELETE /api/workloads/{id}     → deleteWorkload
 *
 * The cold-start bootstrap (ensureBootstrapped) seeds DynamoDB with
 * RetailCo data on first invocation if the table is empty.
 */

import 'dotenv/config';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import * as controller from '../controllers/workloadController';
import { CreateWorkloadPayload, Workload } from '../types';
import { ok, created, notFound, badRequest, serverError, parseBody } from './utils';
import { ensureBootstrapped } from '../data/bootstrap';

// Run bootstrap once per Lambda cold start (warm invocations reuse the promise)
const initPromise = ensureBootstrapped();

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  await initPromise;

  const method = event.requestContext.http.method.toUpperCase();
  const id = event.pathParameters?.id;

  try {
    // GET /api/workloads
    if (method === 'GET' && !id) {
      const data = await controller.listWorkloads();
      return ok({ data, count: data.length });
    }

    // GET /api/workloads/{id}
    if (method === 'GET' && id) {
      const data = await controller.getWorkload(id);
      if (!data) return notFound('Workload not found');
      return ok({ data });
    }

    // POST /api/workloads
    if (method === 'POST') {
      const payload = parseBody<CreateWorkloadPayload>(event.body);
      if (!payload.name || !payload.businessFunction) {
        return badRequest('name and businessFunction are required');
      }
      const data = await controller.createWorkload(payload);
      return created({ data });
    }

    // PUT /api/workloads/{id}
    if (method === 'PUT' && id) {
      const payload = parseBody<Partial<Workload>>(event.body);
      const data = await controller.updateWorkload(id, payload);
      if (!data) return notFound('Workload not found');
      return ok({ data });
    }

    // DELETE /api/workloads/{id}
    if (method === 'DELETE' && id) {
      const deleted = await controller.deleteWorkload(id);
      if (!deleted) return notFound('Workload not found');
      return ok({ data: { deleted: true, id } });
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error(JSON.stringify({ handler: 'workloads', error: message, event }));
    return serverError(message);
  }
};
