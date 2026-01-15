#!/bin/bash

# GCS DJI Dock - Start Backend
# Starts the FastAPI backend service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
PID_FILE="$SCRIPT_DIR/backend.pid"
LOG_FILE="$SCRIPT_DIR/backend.log"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  Backend is already running (PID: $PID)"
        exit 0
    else
        echo "🧹 Removing stale PID file..."
        rm -f "$PID_FILE"
    fi
fi

echo "🔧 Starting backend server..."

# Check if virtual environment exists
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "❌ Virtual environment not found. Creating one..."
    cd "$BACKEND_DIR"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source "$BACKEND_DIR/venv/bin/activate"
fi

# Start backend
cd "$BACKEND_DIR"
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!

echo $BACKEND_PID > "$PID_FILE"
echo "✅ Backend started (PID: $BACKEND_PID)"
echo "📋 Logs: $LOG_FILE"
