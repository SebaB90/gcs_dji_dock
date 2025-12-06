#!/bin/bash

# GCS DJI Dock - Frontend Stop Script
# Cleanly stops the frontend server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/frontend.pid"

echo "🛑 Stopping GCS DJI Dock Frontend..."

# Check if PID file exists
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    
    # Check if process is running
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "📍 Found frontend process (PID: $PID)"
        kill -TERM "$PID" 2>/dev/null
        
        # Wait for graceful shutdown (max 10 seconds)
        for i in {1..10}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                echo "✅ Frontend stopped gracefully"
                rm -f "$PID_FILE"
                exit 0
            fi
            sleep 1
        done
        
        # Force kill if still running
        echo "⚠️  Forcing shutdown..."
        kill -9 "$PID" 2>/dev/null
        rm -f "$PID_FILE"
        echo "✅ Frontend stopped (forced)"
    else
        echo "⚠️  PID file exists but process not running"
        rm -f "$PID_FILE"
    fi
else
    echo "📝 No PID file found, checking for running process..."
    
    # Find process by port
    PORT_PID=$(lsof -ti:5173 2>/dev/null)
    
    if [ ! -z "$PORT_PID" ]; then
        echo "📍 Found process on port 5173 (PID: $PORT_PID)"
        kill -TERM $PORT_PID 2>/dev/null
        sleep 2
        
        # Check if still running
        if lsof -ti:5173 > /dev/null 2>&1; then
            echo "⚠️  Forcing shutdown..."
            kill -9 $PORT_PID 2>/dev/null
        fi
        echo "✅ Frontend stopped"
    else
        echo "ℹ️  No frontend process found on port 5173"
    fi
fi

# Double-check port is free
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "⚠️  Port 5173 still in use, forcing cleanup..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    echo "✅ Port 5173 cleared"
fi

echo "✨ Done!"
