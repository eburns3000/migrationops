#!/usr/bin/env ts-node
/**
 * MigrationOps — Standalone DynamoDB Seed Script
 *
 * Usage:
 *   npm run seed:dynamo
 *
 * Requires:
 *   - STORAGE_BACKEND=dynamodb in .env
 *   - DYNAMODB_ENDPOINT=http://localhost:8000 for DynamoDB Local
 *   - AWS credentials configured for real AWS DynamoDB
 *
 * This script is separate from the automatic bootstrap so you can:
 *   1. Reset data without restarting the server
 *   2. Seed as part of a CI/CD pipeline
 *   3. Run manually after deploying to AWS
 */

import 'dotenv/config';
import { forceSeed } from '../data/bootstrap';

async function main() {
  const backend = process.env.STORAGE_BACKEND || 'memory';
  if (backend !== 'dynamodb') {
    console.error(
      `[seed] STORAGE_BACKEND is "${backend}" — set STORAGE_BACKEND=dynamodb to seed DynamoDB.`
    );
    process.exit(1);
  }

  console.log('[seed] Starting DynamoDB seed...');
  console.log('[seed] Endpoint:', process.env.DYNAMODB_ENDPOINT || 'AWS (real)');
  console.log('[seed] Workloads table:', process.env.DYNAMODB_WORKLOADS_TABLE || 'migrationops-workloads');
  console.log('[seed] Assessments table:', process.env.DYNAMODB_ASSESSMENTS_TABLE || 'migrationops-assessments');

  try {
    await forceSeed();
    console.log('[seed] Done.');
    process.exit(0);
  } catch (err) {
    console.error('[seed] Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
