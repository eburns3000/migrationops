/**
 * MigrationOps — In-Memory Data Store
 *
 * Implements a DynamoDB-compatible interface pattern so the storage layer
 * can be swapped to a real DynamoDB adapter with minimal code changes on AWS deployment.
 *
 * Interface mirrors DynamoDB operation semantics:
 *   get    → GetItem
 *   put    → PutItem
 *   update → UpdateItem
 *   delete → DeleteItem
 *   scan   → Scan
 *   query  → Query (by partition key)
 */

import { Workload, Assessment, ExecutiveReport } from '../types';
import { seedWorkloads, seedAssessments } from '../data/seed';

class Table<T extends { id: string }> {
  private items: Map<string, T>;

  constructor(seed: T[] = []) {
    this.items = new Map(seed.map((item) => [item.id, item]));
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  put(item: T): T {
    this.items.set(item.id, item);
    return item;
  }

  update(id: string, updates: Partial<T>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.items.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  scan(): T[] {
    return Array.from(this.items.values());
  }

  // Query by a field value — mirrors DynamoDB GSI query pattern
  query<K extends keyof T>(field: K, value: T[K]): T[] {
    return this.scan().filter((item) => item[field] === value);
  }

  count(): number {
    return this.items.size;
  }
}

// ─── Store Singleton ──────────────────────────────────────────────────────────

class InMemoryStore {
  readonly workloads: Table<Workload>;
  readonly assessments: Table<Assessment>;
  readonly reports: Table<ExecutiveReport>;

  constructor() {
    this.workloads = new Table<Workload>(seedWorkloads);
    this.assessments = new Table<Assessment>(seedAssessments);
    this.reports = new Table<ExecutiveReport>([]);
  }

  // Convenience: get assessment for a specific workload
  getAssessmentForWorkload(workloadId: string): Assessment | undefined {
    return this.assessments.query('workloadId', workloadId)[0];
  }

  // Convenience: get all workloads with their assessments joined
  getWorkloadsWithAssessments() {
    return this.workloads.scan().map((workload) => ({
      ...workload,
      assessment: this.getAssessmentForWorkload(workload.id),
    }));
  }
}

export const store = new InMemoryStore();
