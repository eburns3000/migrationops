/**
 * MigrationOps — Repository Interfaces
 *
 * Async repository contracts that decouple application logic from storage.
 * The DynamoDB implementation and in-memory implementation both satisfy
 * these interfaces, enabling seamless local dev and AWS production deployment.
 *
 * Pattern: Repository + Factory
 *   - WorkloadRepository, AssessmentRepository, ReportRepository define contracts
 *   - getRepositories() returns the correct implementation based on STORAGE_BACKEND env var
 *   - Controllers depend only on these interfaces — never on DynamoDB or in-memory directly
 */

import { Workload, Assessment, ExecutiveReport, WorkloadWithAssessment } from '../types';

// ─── Individual Entity Repositories ──────────────────────────────────────────

export interface WorkloadRepository {
  get(id: string): Promise<Workload | undefined>;
  list(): Promise<Workload[]>;
  put(item: Workload): Promise<Workload>;
  update(id: string, updates: Partial<Workload>): Promise<Workload | undefined>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}

export interface AssessmentRepository {
  get(id: string): Promise<Assessment | undefined>;
  list(): Promise<Assessment[]>;
  put(item: Assessment): Promise<Assessment>;
  update(id: string, updates: Partial<Assessment>): Promise<Assessment | undefined>;
  delete(id: string): Promise<boolean>;
  getByWorkloadId(workloadId: string): Promise<Assessment | undefined>;
}

export interface ReportRepository {
  get(id: string): Promise<ExecutiveReport | undefined>;
  list(): Promise<ExecutiveReport[]>;
  put(item: ExecutiveReport): Promise<ExecutiveReport>;
  getLatest(): Promise<ExecutiveReport | undefined>;
}

// ─── Aggregate Repository ─────────────────────────────────────────────────────

export interface Repositories {
  workloads: WorkloadRepository;
  assessments: AssessmentRepository;
  reports: ReportRepository;

  /** Convenience: list workloads with their assessments joined in one call */
  getWorkloadsWithAssessments(): Promise<WorkloadWithAssessment[]>;
}
