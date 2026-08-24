#!/usr/bin/env bash
# DeepSeek low-balance monitor for the enrichment sweeper.
# Alerts (once) via the deploy Telegram bot when balance <= THRESHOLD; re-arms
# when it recovers above. Fails safe (never alerts on a fetch error).
#
# Deploy on the prod box (hand-copied, like the other deploy scripts):
#   scp deploy/enrichment/check-deepseek-balance.sh ournigeria-prod:/opt/ournigeria/
#   ssh ournigeria-prod 'chmod +x /opt/ournigeria/check-deepseek-balance.sh'
#   ssh ournigeria-prod '(crontab -l 2>/dev/null | grep -v check-deepseek-balance; \
#     echo "0 * * * * /opt/ournigeria/check-deepseek-balance.sh >> /var/log/deepseek-balance.log 2>&1") | crontab -'
# Requires (already on the box): infisical + token in .env, curl, jq, and the
# TELEGRAM_BOT_TOKEN / TELEGRAM_DEPLOY_CHAT_ID deploy-alert creds in .env.
# Override the $2 default with DEEPSEEK_ALERT_THRESHOLD.
set -euo pipefail
cd /opt/ournigeria
set -a; . ./.env; set +a   # TELEGRAM_BOT_TOKEN, TELEGRAM_DEPLOY_CHAT_ID, INFISICAL_TOKEN

THRESHOLD="${DEEPSEEK_ALERT_THRESHOLD:-2}"
FLAG=/tmp/deepseek-lowbalance.alerted

KEY=$(infisical run --token "$INFISICAL_TOKEN" --env prod --path /enrichment --command "printenv DEEPSEEK_API_KEY" 2>/dev/null || true)
[ -n "${KEY:-}" ] || { echo "no key"; exit 0; }

JSON=$(curl -s --max-time 20 https://api.deepseek.com/user/balance -H "Authorization: Bearer $KEY" || true)
BAL=$(printf '%s' "$JSON" | jq -r '.balance_infos[0].total_balance // empty' 2>/dev/null || true)
[ -n "${BAL:-}" ] || { echo "fetch failed; not alerting"; exit 0; }   # never alert on a fetch error

notify() {
  curl -sf -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="$TELEGRAM_DEPLOY_CHAT_ID" \
    --data-urlencode "text=$1" >/dev/null
}

if awk -v b="$BAL" -v t="$THRESHOLD" 'BEGIN{exit !(b+0<=t+0)}'; then
  if [ ! -f "$FLAG" ]; then
    notify "⚠️ DeepSeek balance is \$$BAL (≤ \$$THRESHOLD). The enrichment sweeper will stall at \$0 — top up at platform.deepseek.com/billing." \
      && touch "$FLAG" && echo "alerted at \$$BAL"
  else
    echo "still low (\$$BAL); already alerted"
  fi
else
  rm -f "$FLAG"   # re-arm once balance recovers above the threshold
  echo "ok (\$$BAL)"
fi
