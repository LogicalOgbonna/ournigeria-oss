#!/usr/bin/env bash
set -eo pipefail

# ─── App config (bash 3.2 compatible) ───────────────────────────────────────
ALL_APPS="api web dashboard ingest awanaija"

get_port() {
  case "$1" in
    api)       echo 3001 ;;
    web)       echo 3000 ;;
    dashboard) echo 3004 ;;
    ingest)    echo 3002 ;;
    awanaija)  echo 3003 ;;
  esac
}

get_command() {
  case "$1" in
    api)       echo "pnpm api:dev" ;;
    web)       echo "pnpm web:dev" ;;
    dashboard) echo "pnpm dashboard:dev" ;;
    ingest)    echo "pnpm ingest:dev" ;;
    awanaija)  echo "pnpm awanaija:dev" ;;
  esac
}

is_valid_app() {
  case "$1" in
    api|web|dashboard|ingest|awanaija) return 0 ;;
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
  echo "Apps: api, web, dashboard, ingest, awanaija"
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

echo -e "\n${GREEN}All apps running. Press Ctrl+C to stop all.${NC}\n"

# Tail all logs together
tail -f /tmp/ournigeria-*.log 2>/dev/null &
TAIL_PID=$!

# Wait for children
wait $PIDS 2>/dev/null || true
kill $TAIL_PID 2>/dev/null || true
