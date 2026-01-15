#!/bin/bash

# GCS DJI Dock - Start Frontend
# Starts the Vite frontend development server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PID_FILE="$SCRIPT_DIR/frontend.pid"
LOG_FILE="$SCRIPT_DIR/frontend.log"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  Frontend is already running (PID: $PID)"
        exit 0
    else
        echo "🧹 Removing stale PID file..."
        rm -f "$PID_FILE"
    fi
fi

echo "🌐 Starting frontend server..."

# Check if node_modules exists
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "❌ Node modules not found. Installing..."
    cd "$FRONTEND_DIR"
    npm install
fi

# Start frontend
cd "$FRONTEND_DIR"
nohup npm run dev > "$LOG_FILE" 2>&1 &
FRONTEND_PID=$!

echo $FRONTEND_PID > "$PID_FILE"
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo "📋 Logs: $LOG_FILE"
