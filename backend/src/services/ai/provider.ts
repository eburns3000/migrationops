/**
 * MigrationOps — AI Provider Abstraction Layer
 *
 * The reasoning layer is model-agnostic and can support Bedrock or third-party
 * LLM APIs depending on governance and cost requirements.
 *
 * To add a new provider:
 *   1. Implement the AIProvider interface below
 *   2. Register the provider in reasoningService.ts
 *   3. Set AI_PROVIDER env var to the new provider key
 *
 * Supported providers:
 *   - 'anthropic'  → AnthropicProvider (claude-sonnet-4-20250514 via Anthropic API)
 *   - 'bedrock'    → BedrockProvider   (Anthropic models via Amazon Bedrock — future)
 */

import { Workload, MigrationStrategy, MigrationWave, RiskLevel } from '../../types';

// ─── Provider I/O Types ───────────────────────────────────────────────────────

export interface WorkloadAssessmentInput {
  workload: Workload;
}

export interface WorkloadAssessmentOutput {
  migrationStrategy: MigrationStrategy;
  wave: MigrationWave;
  riskLevel: RiskLevel;
  complexityScore: number;
  confidenceScore: number;
  riskFactors: string[];
  reasoningSummary: string;
  awsTargetArchitecture: string[];
  architectureRationale: string;
}

export interface ExecutiveReportInput {
  companyName: string;
  totalWorkloads: number;
  readinessScore: number;
  strategyBreakdown: Record<string, number>;
  waveBreakdown: Record<string, number>;
  riskBreakdown: Record<string, number>;
  highRiskWorkloads: string[];
  wave1Workloads: string[];
  wave2Workloads: string[];
  wave3Workloads: string[];
}

export interface ExecutiveReportOutput {
  migrationOverview: string;
  strategySummary: string;
  keyRisks: string;
  sequencingRecommendations: string;
  executiveSummary: string;
}

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface AIProvider {
  readonly providerName: string;
  readonly modelId: string;

  assessWorkload(input: WorkloadAssessmentInput): Promise<WorkloadAssessmentOutput>;
  generateExecutiveReport(input: ExecutiveReportInput): Promise<ExecutiveReportOutput>;
}
