#!/bin/bash

# GCS DJI Dock - Backend Stop Script
# Cleanly stops the backend server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/backend.pid"

echo "🛑 Stopping GCS DJI Dock Backend..."

# Check if PID file exists
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    
    # Check if process is running
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "📍 Found backend process (PID: $PID)"
        kill -TERM "$PID" 2>/dev/null
        
        # Wait for graceful shutdown (max 10 seconds)
        for i in {1..10}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                echo "✅ Backend stopped gracefully"
                rm -f "$PID_FILE"
                exit 0
            fi
            sleep 1
        done
        
        # Force kill if still running
        echo "⚠️  Forcing shutdown..."
        kill -9 "$PID" 2>/dev/null
        rm -f "$PID_FILE"
        echo "✅ Backend stopped (forced)"
    else
        echo "⚠️  PID file exists but process not running"
        rm -f "$PID_FILE"
    fi
else
    echo "📝 No PID file found, checking for running process..."
    
    # Find process by port
    PORT_PID=$(lsof -ti:8000 2>/dev/null)
    
    if [ ! -z "$PORT_PID" ]; then
        echo "📍 Found process on port 8000 (PID: $PORT_PID)"
        kill -TERM $PORT_PID 2>/dev/null
        sleep 2
        
        # Check if still running
        if lsof -ti:8000 > /dev/null 2>&1; then
            echo "⚠️  Forcing shutdown..."
            kill -9 $PORT_PID 2>/dev/null
        fi
        echo "✅ Backend stopped"
    else
        echo "ℹ️  No backend process found on port 8000"
    fi
fi

# Double-check port is free
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "⚠️  Port 8000 still in use, forcing cleanup..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    echo "✅ Port 8000 cleared"
fi

echo "✨ Done!"
