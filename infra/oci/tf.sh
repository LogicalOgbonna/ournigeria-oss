#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] || { echo "infra/oci/.env missing (copy .env.example)"; exit 1; }
set -a; . ./.env; set +a   # INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET, INFISICAL_PROJECT_ID

TOKEN="$(infisical login --method=universal-auth \
  --client-id="$INFISICAL_CLIENT_ID" --client-secret="$INFISICAL_CLIENT_SECRET" \
  --silent --plain)"
[ -n "$TOKEN" ] || { echo "infisical universal-auth login failed"; exit 1; }

exec infisical run --token="$TOKEN" --projectId="$INFISICAL_PROJECT_ID" --env=prod --path=/infra -- bash -c '
  export TF_VAR_oci_tenancy_ocid="$OCI_TENANCY_OCID"
  export TF_VAR_oci_user_ocid="$OCI_USER_OCID"
  export TF_VAR_oci_fingerprint="$OCI_FINGERPRINT"
  export TF_VAR_oci_private_key="$OCI_PRIVATE_KEY"
  export TF_VAR_oci_region="$OCI_REGION"
  export TF_VAR_oci_compartment_ocid="$OCI_COMPARTMENT_OCID"
  export TF_VAR_cloudflare_api_token="$CLOUDFLARE_API_TOKEN"
  export TF_VAR_cloudflare_zone_id="$CLOUDFLARE_ZONE_ID"
  export TF_VAR_ssh_public_key="$SSH_PUBLIC_KEY"
  export TF_VAR_infisical_client_id="$INFISICAL_CLIENT_ID"
  export TF_VAR_infisical_client_secret="$INFISICAL_CLIENT_SECRET"
  export TF_VAR_infisical_project_id="$INFISICAL_PROJECT_ID"
  exec terraform "$@"
' _ "$@"
