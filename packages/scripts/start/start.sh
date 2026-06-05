#!/usr/bin/env bash
set -eo pipefail

# ─── App config (bash 3.2 compatible) ───────────────────────────────────────
ALL_APPS="api web dashboard ingest awanaija socials"

get_port() {
  case "$1" in
    api)       echo 3001 ;;
    web)       echo 3000 ;;
    dashboard) echo 3004 ;;
    ingest)    echo 3002 ;;
    awanaija)  echo 3003 ;;
    socials)   echo 3005 ;;
  esac
}

get_command() {
  case "$1" in
    api)       echo "pnpm api:dev" ;;
    web)       echo "pnpm web:dev" ;;
    dashboard) echo "pnpm dashboard:dev" ;;
    ingest)    echo "pnpm ingest:dev" ;;
    awanaija)  echo "pnpm awanaija:dev" ;;
    socials)   echo "pnpm socials:dev" ;;
  esac
}

is_valid_app() {
  case "$1" in
    api|web|dashboard|ingest|awanaija|socials) return 0 ;;
    *) return 1 ;;
  esac
}

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ─── Usage ───────────────────────────────────────────────────────────────────
usage() {
  echo -e "${CYAN}Usage:${NC} $0 [options] [app ...]"
  echo ""
  echo "Apps: api, web, dashboard, ingest, awanaija, socials"
  echo "If no apps specified, all apps are started."
  echo ""
  echo "Options:"
  echo "  -k, --kill-only   Kill ports without starting apps"
  echo "  -h, --help        Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0                     # Kill all ports, start all apps"
  echo "  $0 api web             # Kill all ports, start api + web"
  echo "  $0 -k                  # Kill all ports only"
  echo "  $0 -k api dashboard    # Kill api + dashboard ports only"
  exit 0
}

# ─── Kill a port ─────────────────────────────────────────────────────────────
kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${YELLOW}Killing port ${port}${NC} (PIDs: $(echo $pids | tr '\n' ', '))"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  else
    echo -e "  ${GREEN}Port ${port}${NC} is free"
  fi
}

# ─── Parse args ──────────────────────────────────────────────────────────────
KILL_ONLY=false
SELECTED_APPS=""

while [ $# -gt 0 ]; do
  case "$1" in
    -k|--kill-only) KILL_ONLY=true; shift ;;
    -h|--help) usage ;;
    *)
      if is_valid_app "$1"; then
        SELECTED_APPS="$SELECTED_APPS $1"
      else
        echo -e "${RED}Unknown app: $1${NC}"
        echo "Valid apps: $ALL_APPS"
        exit 1
      fi
      shift
      ;;
  esac
done

# Default to all apps if none specified
if [ -z "$SELECTED_APPS" ]; then
  SELECTED_APPS="$ALL_APPS"
fi

# ─── Kill ports ──────────────────────────────────────────────────────────────
echo -e "\n${CYAN}Killing ports...${NC}"
for app in $SELECTED_APPS; do
  kill_port "$(get_port "$app")"
done

if $KILL_ONLY; then
  echo -e "\n${GREEN}Done. Ports cleared.${NC}\n"
  exit 0
fi

# ─── Portless: clean https://<app>.localhost URLs ────────────────────────────
# *.localhost auto-resolves to 127.0.0.1. With the portless proxy bound to :443
# each app is reachable port-free at https://<app>.localhost. If :443 is held by
# something other than portless (e.g. Docker), we fall back to
# http://<app>.localhost:<port>.
PORTLESS_BIN="$ROOT_DIR/node_modules/.bin/portless"
[ -x "$PORTLESS_BIN" ] || PORTLESS_BIN="$(command -v portless 2>/dev/null || true)"
USE_PORTLESS=false

# Note: trailing `|| true` is required. With `set -eo pipefail`, an empty lsof
# (nothing listening on :443) exits non-zero, and the `owner="$(port443_cmd)"`
# assignments below would abort the whole script silently right after killing ports.
port443_cmd() { lsof -nP -iTCP:443 -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $1}' || true; }

if [ -n "$PORTLESS_BIN" ] && [ -x "$PORTLESS_BIN" ]; then
  owner="$(port443_cmd)"
  if [ -z "$owner" ]; then
    echo -e "\n${CYAN}Starting portless proxy on :443${NC} (sudo once; first run installs a local CA)..."
    "$PORTLESS_BIN" proxy stop >/dev/null 2>&1 || true   # clear any stale proxy (e.g. on :1355)
    "$PORTLESS_BIN" proxy start -p 443 --https || true
    for _ in 1 2 3 4 5; do sleep 1; owner="$(port443_cmd)"; [ -n "$owner" ] && break; done
  fi
  case "$owner" in
    node|*portless*|Portless*) USE_PORTLESS=true ;;
    "")  echo -e "  ${YELLOW}Could not start portless proxy on :443 — using port URLs.${NC}" ;;
    *)   echo -e "  ${YELLOW}:443 is held by '${owner}' (not portless) — using port URLs.${NC}"
         echo -e "  ${YELLOW}Free :443 to get clean https://<app>.localhost${NC}" ;;
  esac
fi

# Print the URL for an app: clean portless URL, or named host with port.
app_url() {
  if $USE_PORTLESS; then echo "https://$1.localhost"; else echo "http://$1.localhost:$2"; fi
}

# ─── Start apps ─────────────────────────────────────────────────────────────
sleep 1

echo -e "\n${CYAN}Starting apps from:${NC} $ROOT_DIR\n"

PIDS=""
STARTED_APPS=""
for app in $SELECTED_APPS; do
  port=$(get_port "$app")
  cmd=$(get_command "$app")
  log_file="/tmp/ournigeria-${app}.log"

  echo -e "  ${GREEN}Starting ${app}${NC} on port ${port} → ${cmd}"
  (cd "$ROOT_DIR" && $cmd > "$log_file" 2>&1) &
  PIDS="$PIDS $!"
  STARTED_APPS="$STARTED_APPS $app"
done

echo -e "\n${CYAN}Apps started. Logs at /tmp/ournigeria-{app}.log${NC}"
echo -e "${YELLOW}PIDs:${NC}"

# Print PID per app
set -- $STARTED_APPS
pids_arr=($PIDS)
i=0
for app in $STARTED_APPS; do
  echo -e "  ${app}: ${pids_arr[$i]}"
  i=$((i + 1))
done

# ─── Trap for cleanup ───────────────────────────────────────────────────────
cleanup() {
  echo -e "\n${RED}Shutting down...${NC}"
  for pid in $PIDS; do
    kill "$pid" 2>/dev/null || true
  done
  exit 0
}
trap cleanup SIGINT SIGTERM

# ─── Wait for each app to be ready ──────────────────────────────────────────
READY_TIMEOUT=120   # seconds to wait per app before giving up

is_ready() { lsof -ti :"$1" >/dev/null 2>&1; }

echo -e "\n${CYAN}Waiting for apps to start (up to ${READY_TIMEOUT}s each)...${NC}"
FAILED_APPS=""
for app in $STARTED_APPS; do
  port=$(get_port "$app")
  printf "  %-10s" "$app"
  elapsed=0
  while ! is_ready "$port" && [ "$elapsed" -lt "$READY_TIMEOUT" ]; do
    sleep 1
    elapsed=$((elapsed + 1))
    printf "."
  done
  if is_ready "$port"; then
    printf " ${GREEN}ready${NC} (${elapsed}s)\n"
    # Route https://<app>.localhost -> the app's port via the portless proxy.
    if $USE_PORTLESS; then "$PORTLESS_BIN" alias "$app" "$port" --force >/dev/null 2>&1 || true; fi
  else
    printf " ${RED}failed to start (${READY_TIMEOUT}s timeout)${NC}\n"
    FAILED_APPS="$FAILED_APPS $app"
  fi
done

# ─── Show logs for any app that failed to start ─────────────────────────────
for app in $FAILED_APPS; do
  echo -e "\n${RED}── ${app} did not start — last 20 log lines ──${NC}"
  tail -n 20 "/tmp/ournigeria-${app}.log" 2>/dev/null || true
done

# ─── App links (shown once every app has started) ───────────────────────────
echo -e "\n${CYAN}App links:${NC}"
for app in $STARTED_APPS; do
  port=$(get_port "$app")
  url=$(app_url "$app" "$port")
  case " $FAILED_APPS " in
    *" $app "*) status="${RED}(not running)${NC}" ;;
    *)          status="" ;;
  esac
  printf "  ${GREEN}%-10s${NC} ${CYAN}%s${NC} %b\n" "$app" "$url" "$status"
done

echo -e "\n${GREEN}All apps running. Press Ctrl+C to stop all.${NC}"
echo -e "${YELLOW}Follow logs:${NC} tail -f /tmp/ournigeria-*.log\n"

# Wait for children
wait $PIDS 2>/dev/null || true
