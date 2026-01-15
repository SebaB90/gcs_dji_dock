#!/bin/bash

# GCS DJI Dock - Stop All Services
# Stops both backend and frontend

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🛑 Stopping GCS DJI Dock"
echo "========================"
echo ""

STOPPED=0

# Stop Frontend
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat "frontend.pid")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        echo "🌐 Stopping Frontend (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null
        sleep 1
        # Force kill if still running
        if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
            kill -9 "$FRONTEND_PID" 2>/dev/null
        fi
        echo "   ✅ Frontend stopped"
        STOPPED=1
    fi
    rm "frontend.pid"
else
    # Check if port is in use
    if lsof -ti:5173 > /dev/null 2>&1; then
        echo "🌐 Stopping Frontend (found on port 5173)..."
        kill $(lsof -ti:5173) 2>/dev/null
        echo "   ✅ Frontend stopped"
        STOPPED=1
    fi
fi

# Stop Backend
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat "backend.pid")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo "📦 Stopping Backend (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null
        sleep 1
        # Force kill if still running
        if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
            kill -9 "$BACKEND_PID" 2>/dev/null
        fi
        echo "   ✅ Backend stopped"
        STOPPED=1
    fi
    rm "backend.pid"
else
    # Check if port is in use
    if lsof -ti:8000 > /dev/null 2>&1; then
        echo "📦 Stopping Backend (found on port 8000)..."
        kill $(lsof -ti:8000) 2>/dev/null
        echo "   ✅ Backend stopped"
        STOPPED=1
    fi
fi

echo ""
if [ $STOPPED -eq 1 ]; then
    echo "========================"
    echo "✅ All Services Stopped"
    echo "========================"
else
    echo "ℹ️  No services were running"
fi
echo ""
