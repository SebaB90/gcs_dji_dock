#!/bin/bash

# GCS DJI Dock - Backend Start Script
# Starts the backend server with proper process management

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
PID_FILE="$SCRIPT_DIR/backend.pid"
LOG_FILE="$SCRIPT_DIR/backend.log"
VENV_PATH="$SCRIPT_DIR/.venv"
PORT=8000

echo "🚀 Starting GCS DJI Dock Backend..."

# Check if port is already in use
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "⚠️  Port $PORT is already in use!"
    echo ""
    echo "Options:"
    echo "  1. Stop the existing backend: ./stop_backend.sh"
    echo "  2. Restart the backend: ./restart_backend.sh"
    echo "  3. Kill process manually: lsof -ti:$PORT | xargs kill -9"
    echo ""
    exit 1
fi

# Check if PID file exists
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Backend already running (PID: $OLD_PID)"
        echo "Use ./restart_backend.sh to restart or ./stop_backend.sh to stop"
        exit 1
    else
        echo "🧹 Cleaning up stale PID file..."
        rm -f "$PID_FILE"
    fi
fi

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    echo "❌ Virtual environment not found at $VENV_PATH"
    echo "Please run: python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt"
    exit 1
fi

# Start the backend
echo "📝 Logging to: $LOG_FILE"
cd "$BACKEND_DIR" || exit 1

nohup "$VENV_PATH/bin/python" -m uvicorn app.main:app --host 0.0.0.0 --port $PORT > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!

# Save PID
echo $BACKEND_PID > "$PID_FILE"

# Wait a moment and check if it started successfully
sleep 2

if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "✅ Backend started successfully!"
    echo "   PID: $BACKEND_PID"
    echo "   Port: $PORT"
    echo "   URL: http://localhost:$PORT"
    echo ""
    echo "Commands:"
    echo "  - View logs: tail -f $LOG_FILE"
    echo "  - Stop: ./stop_backend.sh"
    echo "  - Restart: ./restart_backend.sh"
    echo "  - Health check: curl http://localhost:$PORT/health"
else
    echo "❌ Failed to start backend!"
    echo "Check logs: cat $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
