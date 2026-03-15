/**
 * MigrationOps — Assessment Controller
 *
 * Orchestrates AI-powered workload assessment and the human-in-the-loop
 * approval/override workflow. Pure business logic — no HTTP concerns.
 */

import { getRepositories } from '../repositories';
import { runWorkloadAssessment } from '../services/ai/reasoningService';
import { Assessment, ApprovalPayload } from '../types';

export async function getAssessmentForWorkload(workloadId: string): Promise<Assessment | undefined> {
  return getRepositories().assessments.getByWorkloadId(workloadId);
}

export async function runAIAssessment(workloadId: string): Promise<Assessment> {
  const repos = getRepositories();
  const workload = await repos.workloads.get(workloadId);
  if (!workload) throw new Error(`Workload not found: ${workloadId}`);

  // Remove any existing assessment before creating a new one
  const existing = await repos.assessments.getByWorkloadId(workloadId);
  if (existing) {
    await repos.assessments.delete(existing.id);
  }

  const assessment = await runWorkloadAssessment(workload);
  return repos.assessments.put(assessment);
}

export async function approveAssessment(
  assessmentId: string,
  payload: ApprovalPayload
): Promise<Assessment | undefined> {
  const repos = getRepositories();
  const existing = await repos.assessments.get(assessmentId);
  if (!existing) return undefined;

  const updates: Partial<Assessment> = {
    status: payload.status,
    reviewerNote: payload.reviewerNote,
    approvedBy: payload.approvedBy || 'Reviewer',
    approvedAt: new Date().toISOString(),
    ...(payload.status === 'overridden' && payload.overriddenStrategy
      ? { overriddenStrategy: payload.overriddenStrategy }
      : {}),
  };

  return repos.assessments.update(assessmentId, updates);
}

export async function deleteAssessment(assessmentId: string): Promise<boolean> {
  const assessment = await getRepositories().assessments.get(assessmentId);
  if (!assessment) return false;
  return getRepositories().assessments.delete(assessmentId);
}

export async function listAssessments(): Promise<Assessment[]> {
  return getRepositories().assessments.list();
}
