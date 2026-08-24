#!/usr/bin/env bash
# Provision a CloudFront distribution in front of the images S3 bucket, with
# Origin Access Control (OAC). Prints CDN_BASE_URL on success — store it in
# Infisical (dev + prod) for both `awanaija` and `api`.
#
# Prereqs: awscli v2, credentials with CloudFront + S3 (Get/PutBucketPolicy)
# perms (likely an admin profile, NOT the upload-scoped S3 key). Run e.g.:
#   AWS_PROFILE=admin S3_BUCKET=... AWS_REGION=... deploy/provision-image-cdn.sh
#
# Optional custom domain (see "Changing the domain" at the bottom):
#   CUSTOM_DOMAIN=cdn.ournigeria.ng \
#   ACM_CERT_ARN=arn:aws:acm:us-east-1:<acct>:certificate/<id> \
#   deploy/provision-image-cdn.sh
#
# DO NOT run blindly — this creates billable AWS infrastructure and edits the
# bucket policy (additively). Read it first.
set -euo pipefail

BUCKET="${S3_BUCKET:?set S3_BUCKET}"
REGION="${AWS_REGION:?set AWS_REGION}"
ORIGIN_DOMAIN="${BUCKET}.s3.${REGION}.amazonaws.com"
OAC_NAME="${BUCKET}-oac"
CALLER_REF="ournigeria-img-$(date +%s)"   # unique per run
CUSTOM_DOMAIN="${CUSTOM_DOMAIN:-}"         # optional, e.g. cdn.ournigeria.ng
ACM_CERT_ARN="${ACM_CERT_ARN:-}"           # required if CUSTOM_DOMAIN set; cert MUST be in us-east-1

if [ -n "$CUSTOM_DOMAIN" ] && [ -z "$ACM_CERT_ARN" ]; then
  echo "CUSTOM_DOMAIN set but ACM_CERT_ARN is empty (need a us-east-1 ACM cert for $CUSTOM_DOMAIN)" >&2
  exit 1
fi

echo "Bucket:        $BUCKET"
echo "Origin domain: $ORIGIN_DOMAIN"
[ -n "$CUSTOM_DOMAIN" ] && echo "Custom domain: $CUSTOM_DOMAIN"

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

# Attach the custom domain + TLS cert if provided (otherwise serves on *.cloudfront.net).
if [ -n "$CUSTOM_DOMAIN" ]; then
  DIST_CONFIG="$(echo "$DIST_CONFIG" | jq \
    --arg d "$CUSTOM_DOMAIN" --arg c "$ACM_CERT_ARN" '
    .Aliases = { "Quantity": 1, "Items": [$d] } |
    .ViewerCertificate = { "ACMCertificateArn": $c, "SSLSupportMethod": "sni-only", "MinimumProtocolVersion": "TLSv1.2_2021" }')"
fi

RESULT="$(aws cloudfront create-distribution --distribution-config "$DIST_CONFIG")"
DIST_ID="$(echo "$RESULT" | jq -r '.Distribution.Id')"
DOMAIN="$(echo "$RESULT" | jq -r '.Distribution.DomainName')"
DIST_ARN="$(echo "$RESULT" | jq -r '.Distribution.ARN')"
echo "Created distribution: $DIST_ID  ($DOMAIN)"

# 3) Bucket policy: ADD a statement allowing this distribution (via OAC) to read.
# IMPORTANT: merge into the existing policy — direct-S3 image URLs currently rely
# on whatever public-read statement is already there. Replacing it would 403 them
# until the backfill rewrites every image_url to the CDN. So we never clobber.
CF_STATEMENT="$(cat <<JSON
{
  "Sid": "AllowCloudFrontOACRead",
  "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::${BUCKET}/*",
  "Condition": { "StringEquals": { "AWS:SourceArn": "${DIST_ARN}" } }
}
JSON
)"
EXISTING="$(aws s3api get-bucket-policy --bucket "$BUCKET" --query Policy --output text 2>/dev/null || echo '')"
if [ -n "$EXISTING" ] && [ "$EXISTING" != "None" ]; then
  MERGED="$(echo "$EXISTING" | jq --argjson s "$CF_STATEMENT" '
    .Statement |= (map(select(.Sid != "AllowCloudFrontOACRead")) + [$s])')"
else
  MERGED="$(jq -n --argjson s "$CF_STATEMENT" '{ "Version": "2012-10-17", "Statement": [$s] }')"
fi
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$MERGED"
echo "Merged CloudFront OAC read into the bucket policy (existing statements preserved)."

CDN_HOST="${CUSTOM_DOMAIN:-$DOMAIN}"
echo ""
echo "============================================================"
echo "CDN_BASE_URL=https://${CDN_HOST}"
echo "Store it in Infisical (dev + prod) for awanaija + api, e.g.:"
echo "  infisical secrets set CDN_BASE_URL \"https://${CDN_HOST}\" --env prod --path /"
if [ -n "$CUSTOM_DOMAIN" ]; then
  echo ""
  echo "DNS: add a CNAME  ${CUSTOM_DOMAIN}  ->  ${DOMAIN}"
fi
echo "CloudFront domain (always works): https://${DOMAIN}"
echo "Distribution is deploying (~10-15 min) before it serves."
echo "============================================================"
