#!/bin/bash

# VidLiSync Backend Startup Script

set -e

echo "Starting VidLiSync Backend..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "Error: SUPABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "Error: SUPABASE_SERVICE_KEY environment variable is required"
    exit 1
fi

# Set defaults
export PORT=${PORT:-8000}
export HOST=${HOST:-0.0.0.0}
export WORKERS=${WORKERS:-1}
export LOG_LEVEL=${LOG_LEVEL:-info}

echo "Configuration:"
echo "  Host: $HOST"
echo "  Port: $PORT"
echo "  Workers: $WORKERS"
echo "  Log Level: $LOG_LEVEL"

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application
echo "Starting FastAPI application..."
exec uvicorn app.main:app \
    --host "$HOST" \
    --port "$PORT" \
    --workers "$WORKERS" \
    --log-level "$LOG_LEVEL" \
    --access-log \
    --loop uvloop \
    --http httptools