#!/usr/bin/env bash
# MigrationOps — Frontend Deployment to S3 + CloudFront
#
# Usage:
#   ./infrastructure/scripts/deploy-frontend.sh \
#     --bucket your-bucket-name \
#     --distribution your-cloudfront-id \
#     --api-url https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
#
# Prerequisites:
#   - AWS CLI configured with permissions for S3 and CloudFront
#   - S3 bucket created and configured for static website hosting
#   - CloudFront distribution created pointing to the S3 bucket
#   - npm install run in frontend/ directory

set -euo pipefail

# ─── Parse arguments ──────────────────────────────────────────────────────────

S3_BUCKET=""
CF_DISTRIBUTION_ID=""
API_BASE_URL=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --bucket) S3_BUCKET="$2"; shift 2 ;;
    --distribution) CF_DISTRIBUTION_ID="$2"; shift 2 ;;
    --api-url) API_BASE_URL="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ -z "$S3_BUCKET" ]]; then
  echo "Error: --bucket is required"
  echo "Usage: $0 --bucket BUCKET_NAME [--distribution CF_ID] [--api-url API_URL]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../../frontend" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MigrationOps Frontend Deployment"
echo "  S3 Bucket:     $S3_BUCKET"
echo "  CloudFront ID: ${CF_DISTRIBUTION_ID:-"(skipping invalidation)"}"
echo "  API Base URL:  ${API_BASE_URL:-"(using proxy)"}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Build ────────────────────────────────────────────────────────────────────

echo ""
echo "▶ Building frontend..."
cd "$FRONTEND_DIR"

# Write production env file
cat > .env.production <<EOF
VITE_API_BASE_URL=${API_BASE_URL}
EOF

npm run build
echo "✓ Build complete → $FRONTEND_DIR/dist"

# ─── Deploy to S3 ─────────────────────────────────────────────────────────────

echo ""
echo "▶ Syncing to s3://$S3_BUCKET..."

# Sync static assets with long cache (hashed filenames)
aws s3 sync dist/assets s3://"$S3_BUCKET"/assets \
  --cache-control "max-age=31536000,immutable" \
  --delete

# Sync HTML files with no-cache (always revalidate)
aws s3 sync dist s3://"$S3_BUCKET" \
  --exclude "assets/*" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --delete

echo "✓ S3 sync complete"

# ─── CloudFront invalidation ──────────────────────────────────────────────────

if [[ -n "$CF_DISTRIBUTION_ID" ]]; then
  echo ""
  echo "▶ Creating CloudFront invalidation..."
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CF_DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)
  echo "✓ Invalidation created: $INVALIDATION_ID"
  echo "  (Propagation takes 2-5 minutes)"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Deployment complete"
if [[ -n "$CF_DISTRIBUTION_ID" ]]; then
  echo "  URL: Check CloudFront distribution for domain"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
