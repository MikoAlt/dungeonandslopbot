#!/bin/sh
HOST="$1"
PORT="${2:-5432}"
shift 2

echo "Waiting for PostgreSQL at $HOST:$PORT..."

until pg_isready -h "$HOST" -p "$PORT" -U dungeonbot -d dungeonandslop; do
  echo "PostgreSQL is unavailable - waiting..."
  sleep 2
done

echo "PostgreSQL is up!"

exec "$@"
