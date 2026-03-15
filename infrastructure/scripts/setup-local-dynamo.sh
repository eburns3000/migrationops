#!/usr/bin/env bash
# MigrationOps — DynamoDB Local Setup Script
#
# Creates the required DynamoDB tables in DynamoDB Local for
# STORAGE_BACKEND=dynamodb local development or SAM local testing.
#
# Prerequisites:
#   docker run -d -p 8000:8000 amazon/dynamodb-local
#
# Usage:
#   ./infrastructure/scripts/setup-local-dynamo.sh

set -euo pipefail

ENDPOINT="http://localhost:8000"
REGION="us-east-1"
STACK="migrationops"

# Use dummy credentials for DynamoDB Local
export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export AWS_DEFAULT_REGION=$REGION

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MigrationOps — DynamoDB Local Table Setup"
echo "  Endpoint: $ENDPOINT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Create Workloads Table ───────────────────────────────────────────────────

echo ""
echo "▶ Creating ${STACK}-workloads..."
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STACK}-workloads" \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null && echo "✓ Created" || echo "  Already exists"

# ─── Create Assessments Table (with WorkloadIdIndex GSI) ─────────────────────

echo ""
echo "▶ Creating ${STACK}-assessments..."
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STACK}-assessments" \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=workloadId,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"WorkloadIdIndex","KeySchema":[{"AttributeName":"workloadId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null && echo "✓ Created" || echo "  Already exists"

# ─── Create Reports Table (with TypeDateIndex GSI) ───────────────────────────

echo ""
echo "▶ Creating ${STACK}-reports..."
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STACK}-reports" \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=type,AttributeType=S \
    AttributeName=generatedAt,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"TypeDateIndex","KeySchema":[{"AttributeName":"type","KeyType":"HASH"},{"AttributeName":"generatedAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  2>/dev/null && echo "✓ Created" || echo "  Already exists"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Tables ready. Now run:"
echo "  cd backend"
echo "  STORAGE_BACKEND=dynamodb DYNAMODB_ENDPOINT=http://localhost:8000 npm run seed:dynamo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
