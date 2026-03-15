/**
 * MigrationOps — DynamoDB Client Singleton
 *
 * Uses AWS SDK v3 DynamoDBDocumentClient which handles marshalling
 * JavaScript objects to/from DynamoDB's native AttributeValue format.
 *
 * Configuration:
 *   - AWS_REGION          → target AWS region (default: us-east-1)
 *   - DYNAMODB_ENDPOINT   → override endpoint for DynamoDB Local development
 *                           e.g. http://localhost:8000
 *
 * For production Lambda, credentials come from the Lambda execution role IAM policy.
 * For local development with DynamoDB Local:
 *   docker run -p 8000:8000 amazon/dynamodb-local
 *   DYNAMODB_ENDPOINT=http://localhost:8000 npm run dev
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT
    ? { endpoint: process.env.DYNAMODB_ENDPOINT }
    : {}),
});

export const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    // Omit undefined fields — avoids DynamoDB validation errors on optional attributes
    removeUndefinedValues: true,
    // Convert empty strings to null — avoids DynamoDB empty string restriction
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

/**
 * Builds a DynamoDB UpdateExpression from a partial update object.
 * Skips undefined values so optional fields aren't accidentally cleared.
 *
 * Example: { status: 'approved', reviewerNote: 'LGTM' }
 * → UpdateExpression: "SET #status = :status, #reviewerNote = :reviewerNote"
 */
export function buildUpdateExpression(updates: Record<string, unknown>): {
  UpdateExpression: string;
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, unknown>;
} {
  const ExpressionAttributeNames: Record<string, string> = {};
  const ExpressionAttributeValues: Record<string, unknown> = {};
  const setClauses: string[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    ExpressionAttributeNames[`#${key}`] = key;
    ExpressionAttributeValues[`:${key}`] = value;
    setClauses.push(`#${key} = :${key}`);
  }

  if (setClauses.length === 0) {
    throw new Error('buildUpdateExpression: no valid attributes to update');
  }

  return {
    UpdateExpression: `SET ${setClauses.join(', ')}`,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };
}
