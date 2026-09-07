#!/usr/bin/env bash
#
# Configure the asset bucket for campaign dashboard uploads (spec §4 "Assets").
#
# Two settings, both idempotent and both MERGED into whatever the bucket already
# has (the AWS APIs replace the whole configuration, so we read-modify-write):
#
#   1. CORS rule "campaign-dashboard-uploads" — lets the dashboard PUT bytes
#      straight at a presigned staging URL. `content-length` is in the allowed
#      headers because the presigner signs content-type AND content-length
#      (apps/api/src/campaigns/asset-store.service.ts); a browser preflight that
#      cannot echo both headers fails the upload.
#   2. Lifecycle rule "expire-staging-uploads" — `staging/` objects are the raw,
#      unvalidated bytes; the API deletes them on commit, this expires the ones
#      nobody committed after 1 day (plus abandoned multipart parts).
#
# Usage (credentials from Infisical /api, once per environment):
#
#   BUCKET=ournigeria-documents \
#   DASHBOARD_ORIGIN=https://dashboard.ournigeria.ng \
#   packages/scripts/setup/s3-campaign-assets.sh
#
#   EXTRA_ORIGINS   comma-separated extra CORS origins (default http://localhost:3004)
#   DRY_RUN=1       print the merged configurations, change nothing
#
# Takedown/purge runbook: docs/ops/campaign-assets-takedown.md
set -euo pipefail

CORS_RULE_ID="campaign-dashboard-uploads"
LIFECYCLE_RULE_ID="expire-staging-uploads"

die() { echo "error: $*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required but not on PATH ($2)"; }

need aws "install the AWS CLI v2"
need jq  "brew install jq / apt-get install jq"

: "${BUCKET:?BUCKET is required, e.g. BUCKET=ournigeria-documents}"
: "${DASHBOARD_ORIGIN:?DASHBOARD_ORIGIN is required, e.g. https://dashboard.ournigeria.ng}"
EXTRA_ORIGINS=${EXTRA_ORIGINS:-http://localhost:3004}
DRY_RUN=${DRY_RUN:-}

# Read one bucket sub-configuration. A bucket with none of that kind answers
# with a NoSuch* error, which is not a failure — it means "start from empty".
read_config() {
  local api=$1 jq_path=$2 empty=$3 err out
  err=$(mktemp)
  if out=$(aws s3api "$api" --bucket "$BUCKET" --output json 2>"$err"); then
    rm -f "$err"
    jq -c "$jq_path // $empty" <<<"$out"
  else
    if grep -qiE 'NoSuch(CORSConfiguration|LifecycleConfiguration)' "$err"; then
      rm -f "$err"
      echo "$empty"
    else
      cat "$err" >&2
      rm -f "$err"
      die "could not read $api on $BUCKET (credentials? bucket name?)"
    fi
  fi
}

# ---------- CORS ----------

existing_cors=$(read_config get-bucket-cors '.CORSRules' '[]')
cors=$(jq -n \
  --arg id "$CORS_RULE_ID" \
  --arg dashboard "$DASHBOARD_ORIGIN" \
  --arg extra "$EXTRA_ORIGINS" \
  --argjson existing "$existing_cors" '
  def dedupe: reduce .[] as $x ([]; if index($x) then . else . + [$x] end);
  {
    CORSRules: (
      ($existing | map(select(.ID != $id)))
      + [{
          ID: $id,
          AllowedOrigins: (([$dashboard] + ($extra | split(",") | map(sub("^\\s+";"") | sub("\\s+$";"")) | map(select(length > 0)))) | dedupe),
          AllowedMethods: ["PUT"],
          AllowedHeaders: ["content-type", "content-length"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3000
        }]
    )
  }')

# ---------- lifecycle ----------

existing_lifecycle=$(read_config get-bucket-lifecycle-configuration '.Rules' '[]')
lifecycle=$(jq -n \
  --arg id "$LIFECYCLE_RULE_ID" \
  --argjson existing "$existing_lifecycle" '
  {
    Rules: (
      ($existing | map(select(.ID != $id)))
      + [{
          ID: $id,
          Filter: { Prefix: "staging/" },
          Status: "Enabled",
          Expiration: { Days: 1 },
          AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 }
        }]
    )
  }')

kept_cors=$(jq '.CORSRules | length - 1' <<<"$cors")
kept_lifecycle=$(jq '.Rules | length - 1' <<<"$lifecycle")

if [[ -n "$DRY_RUN" ]]; then
  echo "DRY_RUN: nothing written to $BUCKET"
  echo "--- CORS (keeping $kept_cors existing rule(s)) ---"
  jq . <<<"$cors"
  echo "--- lifecycle (keeping $kept_lifecycle existing rule(s)) ---"
  jq . <<<"$lifecycle"
  exit 0
fi

aws s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration "$cors"
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" --lifecycle-configuration "$lifecycle"

echo "$BUCKET: CORS rule '$CORS_RULE_ID' (PUT from $DASHBOARD_ORIGIN, $EXTRA_ORIGINS) applied, $kept_cors other rule(s) kept"
echo "$BUCKET: lifecycle rule '$LIFECYCLE_RULE_ID' (staging/ expires after 1 day) applied, $kept_lifecycle other rule(s) kept"
