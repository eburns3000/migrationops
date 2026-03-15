/**
 * MigrationOps — Core Domain Types
 *
 * Designed to map cleanly to DynamoDB item schemas for AWS deployment.
 * All IDs use UUID v4. Timestamps use ISO-8601 strings.
 */

// ─── Enumerated Domain Values ─────────────────────────────────────────────────

export type MigrationStrategy = 'Rehost' | 'Replatform' | 'Refactor' | 'Retain' | 'Retire';
export type MigrationWave = 'Wave 1' | 'Wave 2' | 'Wave 3';
export type RiskLevel = 'low' | 'medium' | 'high';
export type AssessmentStatus = 'pending' | 'assessed' | 'approved' | 'overridden';

export type BusinessCriticality = 'low' | 'medium' | 'high' | 'critical';
export type DependencyLevel = 'low' | 'medium' | 'high';
export type ComplianceSensitivity = 'none' | 'low' | 'medium' | 'high';
export type DowntimeTolerance = 'none' | 'low' | 'medium' | 'high';
export type LatencySensitivity = 'low' | 'medium' | 'high';
export type TrafficPattern = 'steady' | 'variable' | 'bursty';
export type ModernizationNeed = 'low' | 'medium' | 'high';
export type IntegrationComplexity = 'low' | 'medium' | 'high';

// ─── Workload ────────────────────────────────────────────────────────────────

export interface Workload {
  id: string;
  name: string;
  businessFunction: string;
  currentHosting: string;
  architectureType: string;
  databaseType: string;
  businessCriticality: BusinessCriticality;
  dependencyLevel: DependencyLevel;
  complianceSensitivity: ComplianceSensitivity;
  downtimeTolerance: DowntimeTolerance;
  latencySensitivity: LatencySensitivity;
  trafficPattern: TrafficPattern;
  modernizationNeed: ModernizationNeed;
  integrationComplexity: IntegrationComplexity;
  ownerTeam: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export interface Assessment {
  id: string;
  workloadId: string;
  migrationStrategy: MigrationStrategy;
  wave: MigrationWave;
  riskLevel: RiskLevel;
  complexityScore: number;   // 1–10
  confidenceScore: number;   // 0–100
  riskFactors: string[];
  reasoningSummary: string;
  awsTargetArchitecture: string[];
  architectureRationale: string;
  status: AssessmentStatus;
  reviewerNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  overriddenStrategy?: MigrationStrategy;
  generatedAt: string;
}

// ─── Composite Views ──────────────────────────────────────────────────────────

export interface WorkloadWithAssessment extends Workload {
  assessment?: Assessment;
}

// ─── Portfolio Metrics ────────────────────────────────────────────────────────

export interface PortfolioMetrics {
  totalWorkloads: number;
  assessedCount: number;
  readinessScore: number;
  strategyDistribution: Record<MigrationStrategy, number>;
  waveDistribution: Record<MigrationWave, number>;
  riskDistribution: Record<RiskLevel, number>;
}

// ─── Executive Report ─────────────────────────────────────────────────────────

export interface ExecutiveReport {
  id: string;
  generatedAt: string;
  migrationOverview: string;
  strategySummary: string;
  keyRisks: string;
  sequencingRecommendations: string;
  executiveSummary: string;
  workloadCount: number;
  readinessScore: number;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface CreateWorkloadPayload {
  name: string;
  businessFunction: string;
  currentHosting: string;
  architectureType: string;
  databaseType: string;
  businessCriticality: BusinessCriticality;
  dependencyLevel: DependencyLevel;
  complianceSensitivity: ComplianceSensitivity;
  downtimeTolerance: DowntimeTolerance;
  latencySensitivity: LatencySensitivity;
  trafficPattern: TrafficPattern;
  modernizationNeed: ModernizationNeed;
  integrationComplexity: IntegrationComplexity;
  ownerTeam: string;
  notes: string;
}

export interface ApprovalPayload {
  status: 'approved' | 'overridden';
  reviewerNote?: string;
  approvedBy?: string;
  overriddenStrategy?: MigrationStrategy;
}
