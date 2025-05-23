#!/bin/sh
set -e

echo "Container entrypoint script started. NODE_ENV: $NODE_ENV"

echo "Running database migrations..."

npx sequelize-cli db:migrate --env production

echo "Database migrations finished."

echo "Starting application server..."
exec "$@"