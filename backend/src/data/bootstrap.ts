/**
 * MigrationOps — DynamoDB Bootstrap / Seeding
 *
 * Checks if the workloads table is empty on startup. If empty, writes all
 * 12 RetailCo seed workloads and their pre-generated assessments to DynamoDB.
 *
 * This runs:
 *   - Once per Lambda cold start (via the initPromise pattern in handlers)
 *   - Once on Express server startup (in src/index.ts)
 *   - As a standalone CLI script (src/scripts/seedDynamo.ts)
 *
 * Idempotent: PutItem with the same UUIDs as the seed data is safe to
 * run multiple times — it will overwrite with identical data.
 *
 * Only runs when STORAGE_BACKEND=dynamodb. In memory mode the in-memory
 * store initializes with seed data automatically via inMemoryStore.ts.
 */

import { getRepositories } from '../repositories';
import { seedWorkloads, seedAssessments } from './seed';

let _bootstrapped = false;
let _bootstrapPromise: Promise<void> | null = null;

export async function ensureBootstrapped(): Promise<void> {
  // Already done — skip
  if (_bootstrapped) return;

  // Only one bootstrap at a time (important for Lambda: multiple concurrent
  // cold starts are rate-limited by Lambda, but this guard is still correct)
  if (_bootstrapPromise) return _bootstrapPromise;

  _bootstrapPromise = runBootstrap().then(() => {
    _bootstrapped = true;
    _bootstrapPromise = null;
  });

  return _bootstrapPromise;
}

async function runBootstrap(): Promise<void> {
  // Bootstrap only applies to DynamoDB — in-memory mode seeds itself
  if ((process.env.STORAGE_BACKEND || 'memory') !== 'dynamodb') {
    return;
  }

  const repos = getRepositories();

  const workloadCount = await repos.workloads.count();
  if (workloadCount > 0) {
    console.log(`[bootstrap] DynamoDB already seeded (${workloadCount} workloads). Skipping.`);
    return;
  }

  console.log('[bootstrap] DynamoDB is empty — seeding RetailCo dataset...');

  // Write workloads
  await Promise.all(seedWorkloads.map((w) => repos.workloads.put(w)));
  console.log(`[bootstrap] Seeded ${seedWorkloads.length} workloads`);

  // Write assessments
  await Promise.all(seedAssessments.map((a) => repos.assessments.put(a)));
  console.log(`[bootstrap] Seeded ${seedAssessments.length} assessments`);

  console.log('[bootstrap] RetailCo dataset ready in DynamoDB');
}

/** Force re-seed (useful for testing or manual reset) */
export async function forceSeed(): Promise<void> {
  _bootstrapped = false;
  _bootstrapPromise = null;

  const repos = getRepositories();
  await Promise.all(seedWorkloads.map((w) => repos.workloads.put(w)));
  await Promise.all(seedAssessments.map((a) => repos.assessments.put(a)));

  console.log(`[bootstrap] Force-seeded ${seedWorkloads.length} workloads + ${seedAssessments.length} assessments`);
  _bootstrapped = true;
}
