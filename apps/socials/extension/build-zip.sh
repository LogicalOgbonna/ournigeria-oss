#!/usr/bin/env bash
# Package the unpacked extension into a distributable zip for a GitHub Release.
# Version comes from manifest.json — bump it there before packaging.
set -euo pipefail
cd "$(dirname "$0")"

ver=$(node -p "require('./manifest.json').version")
out="ournigeria-session-capture-v${ver}.zip"
rm -f "$out"

zip -q "$out" \
  manifest.json \
  background.js capture.js content.js \
  popup.html popup.js \
  options.html options.js \
  theme.css \
  icon16.png icon32.png icon48.png icon128.png \
  README.md

echo "built $out ($(du -h "$out" | cut -f1))"
