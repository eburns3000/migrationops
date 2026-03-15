/**
 * MigrationOps — DynamoDB Repository Implementation
 *
 * Uses @aws-sdk/lib-dynamodb (DocumentClient) which handles JS↔DynamoDB
 * type marshalling automatically.
 *
 * Table names come from environment variables set by:
 *   - SAM template (production/staging via API Gateway + Lambda)
 *   - .env file (local development with DynamoDB Local)
 *
 * DynamoDB access patterns:
 *
 * Workloads table (PK: id)
 *   - GetItem    → get by id
 *   - Scan       → list all (portfolio is small, Scan is appropriate)
 *   - PutItem    → create / replace
 *   - UpdateItem → partial update
 *   - DeleteItem → remove
 *
 * Assessments table (PK: id, GSI: WorkloadIdIndex on workloadId)
 *   - GetItem    → get by assessment id
 *   - Query GSI  → get assessment for a workload (one-to-one)
 *   - PutItem    → create / replace
 *   - UpdateItem → approval workflow updates
 *   - DeleteItem → remove
 *   - Scan       → list all assessments (metrics calculation)
 *
 * Reports table (PK: id, GSI: TypeDateIndex on type+generatedAt)
 *   - PutItem    → store generated report
 *   - Query GSI  → list reports sorted by date, get latest
 */

import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, buildUpdateExpression } from '../lib/dynamo';
import { Workload, Assessment, ExecutiveReport, WorkloadWithAssessment } from '../types';
import {
  WorkloadRepository,
  AssessmentRepository,
  ReportRepository,
  Repositories,
} from './interfaces';

// Table names from environment (set by SAM template or .env)
const WORKLOADS_TABLE = () => process.env.DYNAMODB_WORKLOADS_TABLE || 'migrationops-workloads';
const ASSESSMENTS_TABLE = () => process.env.DYNAMODB_ASSESSMENTS_TABLE || 'migrationops-assessments';
const REPORTS_TABLE = () => process.env.DYNAMODB_REPORTS_TABLE || 'migrationops-reports';

// ─── Workload Repository ──────────────────────────────────────────────────────

class DynamoWorkloadRepository implements WorkloadRepository {
  async get(id: string): Promise<Workload | undefined> {
    const result = await docClient.send(
      new GetCommand({ TableName: WORKLOADS_TABLE(), Key: { id } })
    );
    return result.Item as Workload | undefined;
  }

  async list(): Promise<Workload[]> {
    const result = await docClient.send(new ScanCommand({ TableName: WORKLOADS_TABLE() }));
    return (result.Items ?? []) as Workload[];
  }

  async put(item: Workload): Promise<Workload> {
    await docClient.send(new PutCommand({ TableName: WORKLOADS_TABLE(), Item: item }));
    return item;
  }

  async update(id: string, updates: Partial<Workload>): Promise<Workload | undefined> {
    const existing = await this.get(id);
    if (!existing) return undefined;

    const expr = buildUpdateExpression(updates as Record<string, unknown>);
    const result = await docClient.send(
      new UpdateCommand({
        TableName: WORKLOADS_TABLE(),
        Key: { id },
        ...expr,
        ReturnValues: 'ALL_NEW',
      })
    );
    return result.Attributes as Workload;
  }

  async delete(id: string): Promise<boolean> {
    await docClient.send(new DeleteCommand({ TableName: WORKLOADS_TABLE(), Key: { id } }));
    return true;
  }

  async count(): Promise<number> {
    const result = await docClient.send(
      new ScanCommand({ TableName: WORKLOADS_TABLE(), Select: 'COUNT' })
    );
    return result.Count ?? 0;
  }
}

// ─── Assessment Repository ────────────────────────────────────────────────────

class DynamoAssessmentRepository implements AssessmentRepository {
  async get(id: string): Promise<Assessment | undefined> {
    const result = await docClient.send(
      new GetCommand({ TableName: ASSESSMENTS_TABLE(), Key: { id } })
    );
    return result.Item as Assessment | undefined;
  }

  async list(): Promise<Assessment[]> {
    const result = await docClient.send(new ScanCommand({ TableName: ASSESSMENTS_TABLE() }));
    return (result.Items ?? []) as Assessment[];
  }

  async put(item: Assessment): Promise<Assessment> {
    await docClient.send(new PutCommand({ TableName: ASSESSMENTS_TABLE(), Item: item }));
    return item;
  }

  async update(id: string, updates: Partial<Assessment>): Promise<Assessment | undefined> {
    const existing = await this.get(id);
    if (!existing) return undefined;

    const expr = buildUpdateExpression(updates as Record<string, unknown>);
    const result = await docClient.send(
      new UpdateCommand({
        TableName: ASSESSMENTS_TABLE(),
        Key: { id },
        ...expr,
        ReturnValues: 'ALL_NEW',
      })
    );
    return result.Attributes as Assessment;
  }

  async delete(id: string): Promise<boolean> {
    await docClient.send(new DeleteCommand({ TableName: ASSESSMENTS_TABLE(), Key: { id } }));
    return true;
  }

  async getByWorkloadId(workloadId: string): Promise<Assessment | undefined> {
    // Uses the WorkloadIdIndex GSI — efficient point lookup
    const result = await docClient.send(
      new QueryCommand({
        TableName: ASSESSMENTS_TABLE(),
        IndexName: 'WorkloadIdIndex',
        KeyConditionExpression: 'workloadId = :wid',
        ExpressionAttributeValues: { ':wid': workloadId },
        Limit: 1,
      })
    );
    const items = result.Items ?? [];
    return items[0] as Assessment | undefined;
  }
}

// ─── Report Repository ────────────────────────────────────────────────────────

// Reports use a fixed partition key 'type' = 'REPORT' on the GSI
// so all reports can be queried together, sorted by generatedAt
const REPORT_TYPE_KEY = 'REPORT';

class DynamoReportRepository implements ReportRepository {
  async get(id: string): Promise<ExecutiveReport | undefined> {
    const result = await docClient.send(
      new GetCommand({ TableName: REPORTS_TABLE(), Key: { id } })
    );
    return result.Item as ExecutiveReport | undefined;
  }

  async list(): Promise<ExecutiveReport[]> {
    // Query the TypeDateIndex GSI, newest first
    const result = await docClient.send(
      new QueryCommand({
        TableName: REPORTS_TABLE(),
        IndexName: 'TypeDateIndex',
        KeyConditionExpression: '#type = :type',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { ':type': REPORT_TYPE_KEY },
        ScanIndexForward: false, // descending by generatedAt
      })
    );
    return (result.Items ?? []) as ExecutiveReport[];
  }

  async put(item: ExecutiveReport): Promise<ExecutiveReport> {
    // Inject the fixed 'type' field used as the GSI partition key
    const itemWithType = { ...item, type: REPORT_TYPE_KEY };
    await docClient.send(new PutCommand({ TableName: REPORTS_TABLE(), Item: itemWithType }));
    return item;
  }

  async getLatest(): Promise<ExecutiveReport | undefined> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: REPORTS_TABLE(),
        IndexName: 'TypeDateIndex',
        KeyConditionExpression: '#type = :type',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { ':type': REPORT_TYPE_KEY },
        ScanIndexForward: false,
        Limit: 1,
      })
    );
    const items = result.Items ?? [];
    return items[0] as ExecutiveReport | undefined;
  }
}

// ─── Aggregate ────────────────────────────────────────────────────────────────

export class DynamoRepositories implements Repositories {
  readonly workloads = new DynamoWorkloadRepository();
  readonly assessments = new DynamoAssessmentRepository();
  readonly reports = new DynamoReportRepository();

  async getWorkloadsWithAssessments(): Promise<WorkloadWithAssessment[]> {
    // Parallel fetch: Scan workloads + Scan assessments, then join in memory.
    // More efficient than N individual assessment queries (N+1 avoided).
    const [workloads, assessments] = await Promise.all([
      this.workloads.list(),
      this.assessments.list(),
    ]);

    const assessmentByWorkloadId = new Map(assessments.map((a) => [a.workloadId, a]));

    return workloads.map((w) => ({
      ...w,
      assessment: assessmentByWorkloadId.get(w.id),
    }));
  }
}
