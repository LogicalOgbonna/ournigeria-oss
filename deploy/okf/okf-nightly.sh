#!/usr/bin/env bash
#
# Nightly OKF knowledge-bundle publish (prod box).
#
# Runs the publisher INSIDE the active blue/green API container, so it reuses
# that container's prod env (infisical) — DATABASE_URL, S3/AWS, and every OKF_*
# secret (OKF_PUBLISH_ENABLED, OKF_GIT_REPO, OKF_GIT_SSH_KEY, OKF_SNAPSHOT_BASE_URL).
# No secrets are passed on the command line.
#
# Prerequisite: the deployed API image must already contain dist/okf/okf-publish.cli.js
# (i.e. this branch is merged and the API has been redeployed) AND git+openssh-client
# (added to apps/api/Dockerfile in the same change). Until then this is a no-op-that-errors.
#
# Install (on the box), 02:17 nightly:
#   crontab -e
#   17 2 * * * /path/to/deploy/okf/okf-nightly.sh >> /var/log/okf-nightly.log 2>&1
#
set -euo pipefail

pick_container() {
  for c in ournigeria_api_blue ournigeria_api_green; do
    if [ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)" = "true" ]; then
      echo "$c"; return 0
    fi
  done
  return 1
}

API="$(pick_container)" || { echo "okf-nightly: no running API container found" >&2; exit 1; }
echo "okf-nightly: publishing via $API"
docker exec "$API" infisical run --env prod --path /api -- node dist/okf/okf-publish.cli.js
echo "okf-nightly: done"
