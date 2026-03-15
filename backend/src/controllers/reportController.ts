/**
 * MigrationOps — Report Controller
 *
 * Handles portfolio metrics calculation, AI executive report generation,
 * and report retrieval. Pure business logic — no HTTP concerns.
 */

import { v4 as uuidv4 } from 'uuid';
import { getRepositories } from '../repositories';
import { runExecutiveReport } from '../services/ai/reasoningService';
import { PortfolioMetrics, ExecutiveReport, MigrationStrategy, MigrationWave, RiskLevel } from '../types';

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function getMetrics(): Promise<PortfolioMetrics> {
  const workloads = await getRepositories().getWorkloadsWithAssessments();
  const assessed = workloads.filter((w) => w.assessment);

  const strategyDist: Record<MigrationStrategy, number> = {
    Rehost: 0, Replatform: 0, Refactor: 0, Retain: 0, Retire: 0,
  };
  const waveDist: Record<MigrationWave, number> = {
    'Wave 1': 0, 'Wave 2': 0, 'Wave 3': 0,
  };
  const riskDist: Record<RiskLevel, number> = {
    low: 0, medium: 0, high: 0,
  };

  let totalConfidence = 0;

  for (const w of assessed) {
    const a = w.assessment!;
    strategyDist[a.migrationStrategy]++;
    waveDist[a.wave]++;
    riskDist[a.riskLevel]++;
    totalConfidence += a.confidenceScore;
  }

  const readinessScore = calculateReadinessScore({
    assessed: assessed.length,
    totalConfidence,
    highRiskCount: riskDist.high,
    simpleStrategyCount: strategyDist.Rehost + strategyDist.Retain + strategyDist.Replatform,
  });

  return {
    totalWorkloads: workloads.length,
    assessedCount: assessed.length,
    readinessScore,
    strategyDistribution: strategyDist,
    waveDistribution: waveDist,
    riskDistribution: riskDist,
  };
}

function calculateReadinessScore({
  assessed,
  totalConfidence,
  highRiskCount,
  simpleStrategyCount,
}: {
  assessed: number;
  totalConfidence: number;
  highRiskCount: number;
  simpleStrategyCount: number;
}): number {
  if (assessed === 0) return 0;
  const avgConfidence = totalConfidence / assessed;
  const highRiskPct = (highRiskCount / assessed) * 100;
  const simplePct = (simpleStrategyCount / assessed) * 100;
  const score = avgConfidence * 0.5 + simplePct * 0.3 + (100 - highRiskPct) * 0.2;
  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function generateReport(): Promise<ExecutiveReport> {
  const repos = getRepositories();
  const workloads = await repos.getWorkloadsWithAssessments();
  const assessed = workloads.filter((w) => w.assessment);

  if (assessed.length === 0) {
    throw new Error('No assessed workloads to generate a report from.');
  }

  const metrics = await getMetrics();
  const aiOutput = await runExecutiveReport(workloads, metrics.readinessScore);

  const report: ExecutiveReport = {
    id: uuidv4(),
    generatedAt: new Date().toISOString(),
    migrationOverview: aiOutput.migrationOverview,
    strategySummary: aiOutput.strategySummary,
    keyRisks: aiOutput.keyRisks,
    sequencingRecommendations: aiOutput.sequencingRecommendations,
    executiveSummary: aiOutput.executiveSummary,
    workloadCount: workloads.length,
    readinessScore: metrics.readinessScore,
  };

  return repos.reports.put(report);
}

export async function getLatestReport(): Promise<ExecutiveReport | undefined> {
  return getRepositories().reports.getLatest();
}

export async function listReports(): Promise<ExecutiveReport[]> {
  return getRepositories().reports.list();
}
