#!/bin/bash

# GCS DJI Dock - Stop Backend
# Stops the FastAPI backend service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/backend.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  Backend is not running (no PID file)"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "⚠️  Backend is not running (stale PID)"
    rm -f "$PID_FILE"
    exit 0
fi

echo "🛑 Stopping backend (PID: $PID)..."
kill "$PID"

# Wait for process to stop
for i in {1..10}; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ Backend stopped"
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
if ps -p "$PID" > /dev/null 2>&1; then
    echo "⚠️  Force killing backend..."
    kill -9 "$PID"
    rm -f "$PID_FILE"
fi

echo "✅ Backend stopped"
