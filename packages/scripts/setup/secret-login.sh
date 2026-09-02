#!/usr/bin/env bash
set -eo pipefail

# Logs the Infisical CLI into the self-hosted secrets manager
# (secrets.example.invalid). The interactive `infisical login` opens your
# browser, which carries your Cloudflare Access session, so the sign-in
# completes through the Access gate.
#
# Usage:  pnpm secret:login

DOMAIN="https://secrets.example.invalid"
API="${DOMAIN}/api"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

# ─── Ensure the Infisical CLI is installed (detect OS → offer to install) ────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./ensure-infisical.sh
source "${SCRIPT_DIR}/ensure-infisical.sh"
ensure_infisical || exit 1

# ─── Log in ─────────────────────────────────────────────────────────────────
echo -e "${GREEN}==> Logging into Infisical at ${API} ...${NC}"
export INFISICAL_API_URL="${API}"
infisical login --domain="${API}"

echo -e "${GREEN}==> Logged in. This shell targets the self-hosted instance via INFISICAL_API_URL=${API}.${NC}"
echo -e "    Tip: export ${CYAN}INFISICAL_API_URL=${API}${NC} in your profile to make it the default."
