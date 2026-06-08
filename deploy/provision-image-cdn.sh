#!/usr/bin/env bash
# Provision a CloudFront distribution in front of the images S3 bucket, with
# Origin Access Control (OAC) so the bucket stays private and only CloudFront can
# read it. Prints CDN_BASE_URL on success — store it in Infisical (dev + prod)
# for both `awanaija` and `api`.
#
# Idempotent-ish: re-running creates a NEW OAC/distribution unless you pass an
# existing distribution id. Review output before re-running.
#
# Prereqs: awscli v2, credentials with CloudFront + S3 (PutBucketPolicy) perms.
# Run with the image bucket's creds injected, e.g.:
#   infisical run --env prod -- deploy/provision-image-cdn.sh
#
# DO NOT run blindly — this creates billable AWS infrastructure. Read it first.
set -euo pipefail

BUCKET="${S3_BUCKET:?set S3_BUCKET}"
REGION="${AWS_REGION:?set AWS_REGION}"
ORIGIN_DOMAIN="${BUCKET}.s3.${REGION}.amazonaws.com"
OAC_NAME="${BUCKET}-oac"
CALLER_REF="ournigeria-img-$(date +%s)"   # unique per run

echo "Bucket:        $BUCKET"
echo "Origin domain: $ORIGIN_DOMAIN"

# 1) Origin Access Control (signs CloudFront -> S3 requests)
OAC_ID="$(aws cloudfront create-origin-access-control \
  --origin-access-control-config "Name=${OAC_NAME},SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
  --query 'OriginAccessControl.Id' --output text)"
echo "Created OAC: $OAC_ID"

# 2) Distribution. CachingOptimized managed policy = 658327ea-f89d-4fab-a63d-7e88639e58f6
DIST_CONFIG="$(cat <<JSON
{
  "CallerReference": "${CALLER_REF}",
  "Comment": "OurNigeria images (${BUCKET})",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "s3-${BUCKET}",
      "DomainName": "${ORIGIN_DOMAIN}",
      "OriginAccessControlId": "${OAC_ID}",
      "S3OriginConfig": { "OriginAccessIdentity": "" }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-${BUCKET}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] } },
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "PriceClass": "PriceClass_All"
}
JSON
)"

RESULT="$(aws cloudfront create-distribution --distribution-config "$DIST_CONFIG")"
DIST_ID="$(echo "$RESULT" | jq -r '.Distribution.Id')"
DOMAIN="$(echo "$RESULT" | jq -r '.Distribution.DomainName')"
DIST_ARN="$(echo "$RESULT" | jq -r '.Distribution.ARN')"
echo "Created distribution: $DIST_ID  ($DOMAIN)"

# 3) Bucket policy: allow this distribution (via OAC) to read objects.
BUCKET_POLICY="$(cat <<JSON
{
  "Version": "2008-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipalRead",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${BUCKET}/*",
    "Condition": { "StringEquals": { "AWS:SourceArn": "${DIST_ARN}" } }
  }]
}
JSON
)"
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$BUCKET_POLICY"
echo "Updated bucket policy for OAC read."

echo ""
echo "============================================================"
echo "CDN_BASE_URL=https://${DOMAIN}"
echo "Store it in Infisical (dev + prod) for awanaija + api, e.g.:"
echo "  infisical secrets set CDN_BASE_URL \"https://${DOMAIN}\" --env prod"
echo "Distribution is deploying (~10-15 min) before it serves."
echo "============================================================"
