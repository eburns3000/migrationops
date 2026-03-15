/**
 * MigrationOps — Repository Factory
 *
 * Returns the correct repository implementation based on the STORAGE_BACKEND
 * environment variable. Controllers and handlers depend only on the
 * Repositories interface — never on a specific implementation.
 *
 * STORAGE_BACKEND=memory    → InMemoryRepositories (default, fast local dev)
 * STORAGE_BACKEND=dynamodb  → DynamoRepositories (local DynamoDB or AWS)
 *
 * The singleton is initialized once and reused across the process lifetime,
 * which is important for Lambda: the same instance is reused across warm invocations.
 */

import { Repositories } from './interfaces';
import { InMemoryRepositories } from './inMemoryRepositories';
import { DynamoRepositories } from './dynamoRepositories';

let _repos: Repositories | null = null;

export function getRepositories(): Repositories {
  if (_repos) return _repos;

  const backend = process.env.STORAGE_BACKEND || 'memory';

  switch (backend) {
    case 'dynamodb':
      console.log('[repos] Using DynamoDB repository (endpoint:', process.env.DYNAMODB_ENDPOINT || 'AWS', ')');
      _repos = new DynamoRepositories();
      break;

    case 'memory':
    default:
      console.log('[repos] Using in-memory repository (fast local dev mode)');
      _repos = new InMemoryRepositories();
      break;
  }

  return _repos;
}

// Reset for testing purposes
export function resetRepositories(): void {
  _repos = null;
}

export type { Repositories } from './interfaces';
