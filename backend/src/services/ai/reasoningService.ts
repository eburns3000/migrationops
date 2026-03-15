/**
 * MigrationOps — AI Reasoning Service
 *
 * Business logic layer that sits between routes and the AI provider.
 * Handles provider selection, error handling, and output normalization.
 *
 * The reasoning layer is model-agnostic and can support Bedrock or third-party
 * LLM APIs depending on governance and cost requirements.
 */

import { AIProvider, ExecutiveReportInput } from './provider';
import { AnthropicProvider } from './anthropicProvider';
import { Workload, Assessment, WorkloadWithAssessment } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// ─── Provider Registry ────────────────────────────────────────────────────────

function createProvider(): AIProvider {
  const providerKey = process.env.AI_PROVIDER || 'anthropic';

  switch (providerKey) {
    case 'anthropic':
      return new AnthropicProvider();

    // Bedrock provider — swap in for AWS deployment
    // case 'bedrock':
    //   return new BedrockProvider();

    default:
      throw new Error(
        `Unknown AI provider: "${providerKey}". Set AI_PROVIDER to a supported value (anthropic).`
      );
  }
}

// Lazy singleton — provider is instantiated on first use
let _provider: AIProvider | null = null;

function getProvider(): AIProvider {
  if (!_provider) {
    _provider = createProvider();
  }
  return _provider;
}

// ─── Reasoning Service ────────────────────────────────────────────────────────

export async function runWorkloadAssessment(workload: Workload): Promise<Assessment> {
  const provider = getProvider();

  const output = await provider.assessWorkload({ workload });

  const assessment: Assessment = {
    id: uuidv4(),
    workloadId: workload.id,
    migrationStrategy: output.migrationStrategy,
    wave: output.wave,
    riskLevel: output.riskLevel,
    complexityScore: Math.min(10, Math.max(1, Math.round(output.complexityScore))),
    confidenceScore: Math.min(100, Math.max(0, Math.round(output.confidenceScore))),
    riskFactors: output.riskFactors,
    reasoningSummary: output.reasoningSummary,
    awsTargetArchitecture: output.awsTargetArchitecture,
    architectureRationale: output.architectureRationale,
    status: 'assessed',
    generatedAt: new Date().toISOString(),
  };

  return assessment;
}

export async function runExecutiveReport(
  workloads: WorkloadWithAssessment[],
  readinessScore: number
): Promise<{
  migrationOverview: string;
  strategySummary: string;
  keyRisks: string;
  sequencingRecommendations: string;
  executiveSummary: string;
}> {
  const provider = getProvider();

  const assessed = workloads.filter((w) => w.assessment);

  const strategyBreakdown: Record<string, number> = {};
  const waveBreakdown: Record<string, number> = {};
  const riskBreakdown: Record<string, number> = {};
  const highRiskWorkloads: string[] = [];
  const wave1: string[] = [];
  const wave2: string[] = [];
  const wave3: string[] = [];

  for (const w of assessed) {
    const a = w.assessment!;
    strategyBreakdown[a.migrationStrategy] = (strategyBreakdown[a.migrationStrategy] || 0) + 1;
    waveBreakdown[a.wave] = (waveBreakdown[a.wave] || 0) + 1;
    riskBreakdown[a.riskLevel] = (riskBreakdown[a.riskLevel] || 0) + 1;

    if (a.riskLevel === 'high') highRiskWorkloads.push(w.name);
    if (a.wave === 'Wave 1') wave1.push(w.name);
    if (a.wave === 'Wave 2') wave2.push(w.name);
    if (a.wave === 'Wave 3') wave3.push(w.name);
  }

  const input: ExecutiveReportInput = {
    companyName: 'RetailCo',
    totalWorkloads: workloads.length,
    readinessScore,
    strategyBreakdown,
    waveBreakdown,
    riskBreakdown,
    highRiskWorkloads,
    wave1Workloads: wave1,
    wave2Workloads: wave2,
    wave3Workloads: wave3,
  };

  return provider.generateExecutiveReport(input);
}

export function getActiveProvider(): { providerName: string; modelId: string } {
  try {
    const p = getProvider();
    return { providerName: p.providerName, modelId: p.modelId };
  } catch {
    return { providerName: 'none', modelId: 'none' };
  }
}
