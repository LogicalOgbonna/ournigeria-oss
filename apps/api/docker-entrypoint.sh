#!/bin/sh
set -e

INFISICAL_ENV="${INFISICAL_ENV:-prod}"

echo "Running database migrations (env: $INFISICAL_ENV)..."

MAX_RETRIES=5
RETRY=0
until infisical run --env "$INFISICAL_ENV" -- npx prisma migrate deploy --schema=./prisma/schema.prisma; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "Migration failed after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Migration failed, retrying in 5s... ($RETRY/$MAX_RETRIES)"
  sleep 5
done

echo "Starting API server..."
exec infisical run --env "$INFISICAL_ENV" -- node dist/main.js
