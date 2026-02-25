#!/bin/sh
set -e

echo "Running database migrations..."
infisical run --env prod -- npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "Starting API server..."
exec infisical run --env prod -- node dist/main.js
