/**
 * MigrationOps — API Service Layer
 *
 * All AI calls route through the backend — never directly from the frontend.
 * Uses Vite proxy in development; update BASE_URL for production deployment.
 */

/**
 * API base URL resolution:
 *   Local dev     → '' (empty) — Vite proxy routes /api to Express on :3001
 *   SAM local     → http://localhost:3002 (set VITE_API_BASE_URL)
 *   AWS prod      → https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
 *
 * Set VITE_API_BASE_URL in .env for non-proxy environments.
 * All AI calls are routed through the backend — never called directly from the frontend.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';

import axios from 'axios';
import {
  WorkloadWithAssessment,
  Assessment,
  PortfolioMetrics,
  ExecutiveReport,
  WaveData,
  ApprovalPayload,
  CreateWorkloadPayload,
} from '../types';

const client = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s for AI calls
});

// ─── Workloads ────────────────────────────────────────────────────────────────

export const workloadsApi = {
  list: async (): Promise<WorkloadWithAssessment[]> => {
    const res = await client.get('/workloads');
    return res.data.data;
  },

  get: async (id: string): Promise<WorkloadWithAssessment> => {
    const res = await client.get(`/workloads/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateWorkloadPayload): Promise<WorkloadWithAssessment> => {
    const res = await client.post('/workloads', payload);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/workloads/${id}`);
  },
};

// ─── Assessments ──────────────────────────────────────────────────────────────

export const assessmentsApi = {
  getForWorkload: async (workloadId: string): Promise<Assessment> => {
    const res = await client.get(`/assessments/workload/${workloadId}`);
    return res.data.data;
  },

  runAssessment: async (workloadId: string): Promise<Assessment> => {
    const res = await client.post(`/assessments/workload/${workloadId}/run`);
    return res.data.data;
  },

  approve: async (assessmentId: string, payload: ApprovalPayload): Promise<Assessment> => {
    const res = await client.patch(`/assessments/${assessmentId}/approve`, payload);
    return res.data.data;
  },

  deleteAssessment: async (assessmentId: string): Promise<void> => {
    await client.delete(`/assessments/${assessmentId}`);
  },
};

// ─── Waves ────────────────────────────────────────────────────────────────────

export const wavesApi = {
  getWaves: async (): Promise<{ data: WaveData; summary: Record<string, number> }> => {
    const res = await client.get('/waves');
    return res.data;
  },
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export const reportsApi = {
  getMetrics: async (): Promise<PortfolioMetrics> => {
    const res = await client.get('/reports/metrics');
    return res.data.data;
  },

  getLatest: async (): Promise<ExecutiveReport | null> => {
    try {
      const res = await client.get('/reports/latest');
      return res.data.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return null;
      throw err;
    }
  },

  list: async (): Promise<ExecutiveReport[]> => {
    const res = await client.get('/reports');
    return res.data.data;
  },

  generate: async (): Promise<ExecutiveReport> => {
    const res = await client.post('/reports/generate');
    return res.data.data;
  },
};
