#!/bin/sh
set -e

INFISICAL_ENV="${INFISICAL_ENV:-prod}"

echo "Running database migrations (env: $INFISICAL_ENV)..."

# Resolve the baseline migration if it exists, ignoring errors if it's already applied
echo "Resolving baseline migration..."
infisical run --env "$INFISICAL_ENV" --path /api -- npx prisma migrate resolve --applied 0_baseline --schema=./prisma/schema || true

MAX_RETRIES=5
RETRY=0
until infisical run --env "$INFISICAL_ENV" --path /api -- npx prisma migrate deploy --schema=./prisma/schema; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "Migration failed after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Migration failed, retrying in 5s... ($RETRY/$MAX_RETRIES)"
  sleep 5
done

echo "Starting API server..."
exec infisical run --env "$INFISICAL_ENV" --path /api -- node dist/main.js
