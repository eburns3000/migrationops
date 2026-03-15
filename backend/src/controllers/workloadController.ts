/**
 * MigrationOps — Workload Controller
 *
 * Pure business logic for workload CRUD operations.
 * No Express or Lambda dependencies — callable from both Express routes
 * and Lambda handlers without modification.
 */

import { v4 as uuidv4 } from 'uuid';
import { getRepositories } from '../repositories';
import { Workload, WorkloadWithAssessment, CreateWorkloadPayload } from '../types';

export async function listWorkloads(): Promise<WorkloadWithAssessment[]> {
  return getRepositories().getWorkloadsWithAssessments();
}

export async function getWorkload(id: string): Promise<WorkloadWithAssessment | undefined> {
  const repos = getRepositories();
  const workload = await repos.workloads.get(id);
  if (!workload) return undefined;
  const assessment = await repos.assessments.getByWorkloadId(id);
  return { ...workload, assessment };
}

export async function createWorkload(payload: CreateWorkloadPayload): Promise<Workload> {
  const repos = getRepositories();
  const now = new Date().toISOString();

  const workload: Workload = {
    id: uuidv4(),
    name: payload.name,
    businessFunction: payload.businessFunction,
    currentHosting: payload.currentHosting || '',
    architectureType: payload.architectureType || '',
    databaseType: payload.databaseType || '',
    businessCriticality: payload.businessCriticality || 'medium',
    dependencyLevel: payload.dependencyLevel || 'medium',
    complianceSensitivity: payload.complianceSensitivity || 'low',
    downtimeTolerance: payload.downtimeTolerance || 'medium',
    latencySensitivity: payload.latencySensitivity || 'medium',
    trafficPattern: payload.trafficPattern || 'steady',
    modernizationNeed: payload.modernizationNeed || 'medium',
    integrationComplexity: payload.integrationComplexity || 'medium',
    ownerTeam: payload.ownerTeam || '',
    notes: payload.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  return repos.workloads.put(workload);
}

export async function updateWorkload(
  id: string,
  updates: Partial<Workload>
): Promise<Workload | undefined> {
  return getRepositories().workloads.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteWorkload(id: string): Promise<boolean> {
  const repos = getRepositories();
  const workload = await repos.workloads.get(id);
  if (!workload) return false;

  // Remove associated assessment
  const assessment = await repos.assessments.getByWorkloadId(id);
  if (assessment) {
    await repos.assessments.delete(assessment.id);
  }

  return repos.workloads.delete(id);
}
