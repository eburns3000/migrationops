/**
 * MigrationOps — Anthropic Claude Provider
 *
 * Implements AIProvider using the Anthropic API directly.
 * For AWS deployment, swap this with the BedrockProvider which uses
 * the same Claude models via Amazon Bedrock without changing business logic.
 *
 * Model: claude-sonnet-4-20250514
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  AIProvider,
  WorkloadAssessmentInput,
  WorkloadAssessmentOutput,
  ExecutiveReportInput,
  ExecutiveReportOutput,
} from './provider';

const WORKLOAD_ASSESSMENT_SYSTEM_PROMPT = `You are a senior AWS cloud migration consultant and solution architect with 15+ years of enterprise migration experience. Your role is to analyze enterprise workloads and generate precise, actionable migration assessments.

You respond ONLY with valid JSON. No explanation, no markdown, no preamble — pure JSON only.

Migration Strategy Definitions:
- Rehost (Lift & Shift): Move the workload as-is to equivalent AWS infrastructure (EC2, etc.). Minimal changes. Best for low-complexity workloads where speed is priority.
- Replatform: Make targeted optimizations during migration without changing core architecture (e.g., move to managed DB, containerize app). Best balance of effort and benefit.
- Refactor: Significantly re-architect the workload to be cloud-native (serverless, microservices, managed services). High effort, highest long-term value.
- Retain: Keep in current environment. Best for SaaS tools, recently upgraded systems, or workloads with prohibitive migration costs.
- Retire: Decommission the workload. Redundant, obsolete, or replaced by another system.

Wave Assignment Guidelines:
- Wave 1 (0–3 months): Low risk, low complexity, low dependencies. Quick wins. Rehost and Retain candidates. Establishes AWS operational confidence.
- Wave 2 (3–6 months): Medium complexity, some dependencies, Replatform candidates. Builds on Wave 1 foundation.
- Wave 3 (6–12 months): High complexity, critical systems, high dependencies, Refactor candidates. Requires stable AWS foundation from earlier waves.

Risk Assessment Factors:
- Compliance: PCI-DSS, SOX, HIPAA, PII data
- Downtime tolerance: None = high risk, High = low risk
- Dependency complexity: High interdependencies increase risk
- Database complexity: Oracle, legacy schemas = higher risk
- Architecture complexity: Monolith harder than microservices

Target AWS Architecture — use specific service names:
Web/API tier: ALB, CloudFront, API Gateway, WAF
Compute: ECS Fargate, EC2, Lambda, EKS
Databases: RDS (MySQL/PostgreSQL/Oracle), Aurora, DynamoDB, DocumentDB, ElastiCache Redis, Redshift
Analytics: S3, Glue, Athena, EMR, QuickSight, Kinesis, Lake Formation
ML/AI: SageMaker, Bedrock
Integration: SQS, SNS, EventBridge, Step Functions
Security: KMS, Secrets Manager, CloudHSM, IAM, Cognito
Networking: VPC, Direct Connect, PrivateLink, Route 53
Operations: CloudWatch, X-Ray, Systems Manager, CloudTrail, Config, AWS Backup

Your JSON response must exactly match this structure:
{
  "migrationStrategy": "Rehost" | "Replatform" | "Refactor" | "Retain" | "Retire",
  "wave": "Wave 1" | "Wave 2" | "Wave 3",
  "riskLevel": "low" | "medium" | "high",
  "complexityScore": <integer 1-10>,
  "confidenceScore": <integer 0-100>,
  "riskFactors": ["<specific risk factor>", ...],
  "reasoningSummary": "<detailed paragraph explaining the recommendation with business context>",
  "awsTargetArchitecture": ["<AWS Service Name>", ...],
  "architectureRationale": "<paragraph explaining why these services and how they work together>"
}`;

const EXECUTIVE_REPORT_SYSTEM_PROMPT = `You are a senior cloud strategy consultant preparing executive briefing documents for C-suite and board audiences. Your writing is professional, data-driven, concise, and business-outcome focused. You avoid technical jargon and focus on business impact, risk, and strategic sequencing.

You respond ONLY with valid JSON. No explanation, no markdown, no preamble — pure JSON only.

Your JSON response must exactly match this structure:
{
  "migrationOverview": "<2-3 sentence executive overview of the migration program scope and business objectives>",
  "strategySummary": "<paragraph summarizing the distribution of migration strategies and what it means for the program>",
  "keyRisks": "<paragraph identifying the top 3-4 risks across the portfolio and recommended mitigations>",
  "sequencingRecommendations": "<paragraph explaining the wave-based sequencing rationale and what each wave achieves>",
  "executiveSummary": "<comprehensive 3-4 sentence executive summary suitable for board presentation, covering scope, approach, risk, and expected business outcomes>"
}`;

export class AnthropicProvider implements AIProvider {
  readonly providerName = 'anthropic';
  readonly modelId: string;

  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for the Anthropic provider.');
    }
    this.client = new Anthropic({ apiKey });
    this.modelId = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  }

  async assessWorkload(input: WorkloadAssessmentInput): Promise<WorkloadAssessmentOutput> {
    const { workload } = input;

    const userMessage = `Analyze this enterprise workload and generate a migration assessment:

Workload Name: ${workload.name}
Business Function: ${workload.businessFunction}
Current Hosting: ${workload.currentHosting}
Architecture Type: ${workload.architectureType}
Database Type: ${workload.databaseType}
Business Criticality: ${workload.businessCriticality}
Dependency Level: ${workload.dependencyLevel}
Compliance Sensitivity: ${workload.complianceSensitivity}
Downtime Tolerance: ${workload.downtimeTolerance}
Latency Sensitivity: ${workload.latencySensitivity}
Traffic Pattern: ${workload.trafficPattern}
Modernization Need: ${workload.modernizationNeed}
Integration Complexity: ${workload.integrationComplexity}
Owner Team: ${workload.ownerTeam}
Additional Notes: ${workload.notes || 'None provided'}

Generate a complete migration assessment for this workload.`;

    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: 2000,
      system: WORKLOAD_ASSESSMENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    const parsed = JSON.parse(content.text) as WorkloadAssessmentOutput;
    return parsed;
  }

  async generateExecutiveReport(input: ExecutiveReportInput): Promise<ExecutiveReportOutput> {
    const userMessage = `Generate an executive migration briefing document for the following enterprise migration program:

Company: ${input.companyName}
Total Workloads in Portfolio: ${input.totalWorkloads}
Migration Readiness Score: ${input.readinessScore}/100

Strategy Distribution:
${Object.entries(input.strategyBreakdown)
  .map(([strategy, count]) => `  - ${strategy}: ${count} workloads`)
  .join('\n')}

Wave Distribution:
${Object.entries(input.waveBreakdown)
  .map(([wave, count]) => `  - ${wave}: ${count} workloads`)
  .join('\n')}

Risk Distribution:
${Object.entries(input.riskBreakdown)
  .map(([risk, count]) => `  - ${risk} risk: ${count} workloads`)
  .join('\n')}

High-Risk Workloads: ${input.highRiskWorkloads.join(', ') || 'None'}
Wave 1 Workloads: ${input.wave1Workloads.join(', ') || 'None'}
Wave 2 Workloads: ${input.wave2Workloads.join(', ') || 'None'}
Wave 3 Workloads: ${input.wave3Workloads.join(', ') || 'None'}

Generate a professional executive migration briefing document.`;

    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: 2000,
      system: EXECUTIVE_REPORT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    const parsed = JSON.parse(content.text) as ExecutiveReportOutput;
    return parsed;
  }
}
