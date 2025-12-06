#!/bin/bash

# GCS DJI Dock - Frontend Start Script
# Starts the frontend server with proper process management

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PID_FILE="$SCRIPT_DIR/frontend.pid"
LOG_FILE="$SCRIPT_DIR/frontend.log"
PORT=5173

echo "🚀 Starting GCS DJI Dock Frontend..."

# Check if port is already in use
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "⚠️  Port $PORT is already in use!"
    echo ""
    echo "Options:"
    echo "  1. Stop the existing frontend: ./stop_frontend.sh"
    echo "  2. Restart the frontend: ./restart_frontend.sh"
    echo "  3. Kill process manually: lsof -ti:$PORT | xargs kill -9"
    echo ""
    exit 1
fi

# Check if PID file exists
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Frontend already running (PID: $OLD_PID)"
        echo "Use ./restart_frontend.sh to restart or ./stop_frontend.sh to stop"
        exit 1
    else
        echo "🧹 Cleaning up stale PID file..."
        rm -f "$PID_FILE"
    fi
fi

# Check if node_modules exists
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd "$FRONTEND_DIR" || exit 1
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies!"
        exit 1
    fi
fi

# Start the frontend
echo "📝 Logging to: $LOG_FILE"
cd "$FRONTEND_DIR" || exit 1

nohup npm run dev > "$LOG_FILE" 2>&1 &
FRONTEND_PID=$!

# Save PID
echo $FRONTEND_PID > "$PID_FILE"

# Wait a moment and check if it started successfully
sleep 3

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "✅ Frontend started successfully!"
    echo "   PID: $FRONTEND_PID"
    echo "   Port: $PORT"
    echo "   URL: http://localhost:$PORT"
    echo ""
    echo "Commands:"
    echo "  - View logs: tail -f $LOG_FILE"
    echo "  - Stop: ./stop_frontend.sh"
    echo "  - Restart: ./restart_frontend.sh"
    echo "  - Open browser: xdg-open http://localhost:$PORT"
else
    echo "❌ Failed to start frontend!"
    echo "Check logs: cat $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi
