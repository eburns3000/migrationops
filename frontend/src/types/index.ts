// MigrationOps — Frontend Type Definitions
// Mirror of backend types/index.ts — keep in sync

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

export interface Assessment {
  id: string;
  workloadId: string;
  migrationStrategy: MigrationStrategy;
  wave: MigrationWave;
  riskLevel: RiskLevel;
  complexityScore: number;
  confidenceScore: number;
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

export interface WorkloadWithAssessment extends Workload {
  assessment?: Assessment;
}

export interface PortfolioMetrics {
  totalWorkloads: number;
  assessedCount: number;
  readinessScore: number;
  strategyDistribution: Record<MigrationStrategy, number>;
  waveDistribution: Record<MigrationWave, number>;
  riskDistribution: Record<RiskLevel, number>;
}

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

export interface WaveData {
  'Wave 1': WorkloadWithAssessment[];
  'Wave 2': WorkloadWithAssessment[];
  'Wave 3': WorkloadWithAssessment[];
  unassigned: WorkloadWithAssessment[];
}

export interface ApprovalPayload {
  status: 'approved' | 'overridden';
  reviewerNote?: string;
  approvedBy?: string;
  overriddenStrategy?: MigrationStrategy;
}

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
