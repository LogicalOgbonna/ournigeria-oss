#!/usr/bin/env bash
# Shared helper: ensure the Infisical CLI is installed.
#
#   source "<dir>/ensure-infisical.sh"
#   ensure_infisical            # returns 0 if present/installed, non-zero otherwise
#
# Installs cross-platform via npm (@infisical/cli). Node/npm is already a project
# prerequisite, and that package's preinstall unpacks the correct binary for the
# current OS/arch — so no manual OS detection is needed.
#
# Sourcing this file has no side effects (it only defines a function).

ensure_infisical() {
  command -v infisical >/dev/null 2>&1 && return 0

  printf '\033[1;33m==> Infisical CLI not found — installing via npm (@infisical/cli)...\033[0m\n'

  if ! command -v npm >/dev/null 2>&1; then
    printf '\033[0;31m    npm not found. Install Node.js (which bundles npm), then re-run.\033[0m\n'
    return 1
  fi

  if ! npm install -g @infisical/cli; then
    printf '\033[0;31m    "npm install -g @infisical/cli" failed.\033[0m\n'
    printf '    If this is a permissions (EACCES) error, either re-run with sudo, or point\n'
    printf '    npm at a user-writable prefix and add its bin to PATH, e.g.:\n'
    printf '      npm config set prefix "$HOME/.npm-global"\n'
    printf '      export PATH="$HOME/.npm-global/bin:$PATH"\n'
    printf '    then re-run.\n'
    return 1
  fi

  if command -v infisical >/dev/null 2>&1; then
    printf '\033[0;32m==> Infisical CLI installed: %s\033[0m\n' "$(infisical --version 2>/dev/null | head -1)"
    return 0
  fi

  printf '\033[1;33m==> Installed, but "infisical" is not on your PATH.\033[0m\n'
  printf '    Add your npm global bin dir (see: npm bin -g) to PATH, then open a new shell.\n'
  return 1
}
