/**
 * MigrationOps — In-Memory Repository Implementation
 *
 * Async wrapper over the existing synchronous in-memory store.
 * Used when STORAGE_BACKEND=memory (default for local Express development).
 *
 * Benefits:
 *   - Zero infrastructure dependencies for fast local frontend development
 *   - Seeded RetailCo data available immediately on startup
 *   - Satisfies the same async Repository interfaces as DynamoDB
 */

import { Workload, Assessment, ExecutiveReport, WorkloadWithAssessment } from '../types';
import {
  WorkloadRepository,
  AssessmentRepository,
  ReportRepository,
  Repositories,
} from './interfaces';
import { store } from '../store/inMemoryStore';

// ─── In-Memory Workload Repository ───────────────────────────────────────────

class InMemoryWorkloadRepository implements WorkloadRepository {
  async get(id: string) { return store.workloads.get(id); }
  async list() { return store.workloads.scan(); }
  async put(item: Workload) { return store.workloads.put(item); }
  async update(id: string, updates: Partial<Workload>) { return store.workloads.update(id, updates); }
  async delete(id: string) { return store.workloads.delete(id); }
  async count() { return store.workloads.count(); }
}

// ─── In-Memory Assessment Repository ─────────────────────────────────────────

class InMemoryAssessmentRepository implements AssessmentRepository {
  async get(id: string) { return store.assessments.get(id); }
  async list() { return store.assessments.scan(); }
  async put(item: Assessment) { return store.assessments.put(item); }
  async update(id: string, updates: Partial<Assessment>) { return store.assessments.update(id, updates); }
  async delete(id: string) { return store.assessments.delete(id); }
  async getByWorkloadId(workloadId: string) { return store.getAssessmentForWorkload(workloadId); }
}

// ─── In-Memory Report Repository ─────────────────────────────────────────────

class InMemoryReportRepository implements ReportRepository {
  async get(id: string) { return store.reports.get(id); }
  async list() {
    return store.reports
      .scan()
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }
  async put(item: ExecutiveReport) { return store.reports.put(item); }
  async getLatest() {
    const all = await this.list();
    return all[0];
  }
}

// ─── Aggregate ────────────────────────────────────────────────────────────────

export class InMemoryRepositories implements Repositories {
  readonly workloads = new InMemoryWorkloadRepository();
  readonly assessments = new InMemoryAssessmentRepository();
  readonly reports = new InMemoryReportRepository();

  async getWorkloadsWithAssessments(): Promise<WorkloadWithAssessment[]> {
    const workloads = await this.workloads.list();
    return Promise.all(
      workloads.map(async (w) => ({
        ...w,
        assessment: await this.assessments.getByWorkloadId(w.id),
      }))
    );
  }
}
