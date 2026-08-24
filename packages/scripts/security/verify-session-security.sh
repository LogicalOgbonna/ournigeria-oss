#!/usr/bin/env bash
#
# Reproduce + verify OWASP A07 findings 4 & 5 (opaque session tokens).
# Run against a deployed API (dev by default). No DB creds needed — it drives
# the HTTP surface end to end.
#
#   packages/scripts/security/verify-session-security.sh
#   API_BASE=https://spending-api.arinze.online/api \
#     packages/scripts/security/verify-session-security.sh
#
# Exits non-zero on the first failed assertion.

set -euo pipefail

API_BASE="${API_BASE:-https://spending-api.arinze.online/api}"
JAR="$(mktemp)"
JAR2="$(mktemp)"
trap 'rm -f "$JAR" "$JAR2"' EXIT

pass() { printf '  \033[32mPASS\033[0m %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; exit 1; }

echo "▶ dev-login (mints an opaque user session + one-time handoff code)"
LOGIN_JSON="$(curl -sS -X POST "$API_BASE/auth/dev-login" -c "$JAR")"
AUTH_TOKEN="$(printf '%s' "$LOGIN_JSON" | sed -n 's/.*"authToken":"\([^"]*\)".*/\1/p')"
COOKIE_VAL="$(awk '/nb_uid/ {print $7}' "$JAR" | tail -1)"

# 1) The session cookie is an OPAQUE token, NOT the user's UUID primary key.
case "$COOKIE_VAL" in
  nbs_*) pass "nb_uid cookie is an opaque session token (nbs_…), not the user PK" ;;
  *)     fail "nb_uid cookie is not an opaque session token: $COOKIE_VAL" ;;
esac
if printf '%s' "$COOKIE_VAL" | grep -Eq '^[0-9a-f]{8}-[0-9a-f]{4}-'; then
  fail "nb_uid cookie is still a raw UUID"
fi

# 2) The handoff code is opaque and carries NO userId segment.
case "$AUTH_TOKEN" in
  nbh_*) pass "handoff authToken is opaque (nbh_…) — no plaintext userId" ;;
  *)     fail "handoff authToken is not an opaque code: $AUTH_TOKEN" ;;
esac

# 3) The session authenticates.
CODE="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/auth/profile" -b "$JAR")"
[ "$CODE" = "200" ] && pass "profile authenticates with the session cookie" \
  || fail "profile expected 200, got $CODE"

# 4) Handoff code is single-use: first exchange succeeds, second is rejected.
EX1="$(curl -sS -X POST "$API_BASE/auth/exchange" -H 'Content-Type: application/json' \
  -d "{\"code\":\"$AUTH_TOKEN\"}")"
SESSION_TOKEN="$(printf '%s' "$EX1" | sed -n 's/.*"sessionToken":"\([^"]*\)".*/\1/p')"
case "$SESSION_TOKEN" in
  nbs_*) pass "exchange returns a fresh opaque session token" ;;
  *)     fail "exchange did not return a session token: $EX1" ;;
esac
EX2_CODE="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API_BASE/auth/exchange" \
  -H 'Content-Type: application/json' -d "{\"code\":\"$AUTH_TOKEN\"}")"
[ "$EX2_CODE" = "401" ] && pass "handoff code is single-use (second exchange → 401)" \
  || fail "expected 401 on reused handoff code, got $EX2_CODE"

# 5) Revocation works: after logout the SAME (still-unexpired) token is dead.
curl -sS -X POST "$API_BASE/auth/logout" -b "$JAR" -c "$JAR" >/dev/null
REVOKED_CODE="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/auth/profile" \
  -H "Cookie: nb_uid=$COOKIE_VAL")"
[ "$REVOKED_CODE" = "401" ] && pass "logout revokes the session server-side (replay → 401)" \
  || fail "revoked token still authenticates ($REVOKED_CODE)"

# 6) A forged opaque token is rejected.
FORGED="nbs_$(head -c 32 /dev/urandom | base64 | tr '+/' '-_' | tr -d '=')"
FORGED_CODE="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/auth/profile" \
  -H "Cookie: nb_uid=$FORGED")"
[ "$FORGED_CODE" = "401" ] && pass "forged session token rejected" \
  || fail "forged token accepted ($FORGED_CODE)"

echo
echo "✅ All session-security assertions passed against $API_BASE"
