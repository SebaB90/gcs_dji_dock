#!/bin/bash

# GCS DJI Dock - Service Status Check
# Shows the current status of all services

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "📊 GCS DJI Dock - Service Status"
echo "================================="
echo ""

# Check Backend
echo "🔧 Backend (Port 8000):"
BACKEND_RUNNING=false

if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat "backend.pid")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo "   Status: ✅ Running"
        echo "   PID: $BACKEND_PID"
        BACKEND_RUNNING=true
        
        # Health check
        if curl -s http://localhost:8000/health >/dev/null 2>&1; then
            echo "   Health: ✅ Healthy"
            echo "   URL: http://localhost:8000"
        else
            echo "   Health: ⚠️  Not responding"
        fi
    else
        echo "   Status: ⚠️  Stopped (stale PID file)"
        rm "backend.pid"
    fi
else
    if lsof -ti:8000 > /dev/null 2>&1; then
        PID=$(lsof -ti:8000)
        echo "   Status: ⚠️  Running (no PID file)"
        echo "   PID: $PID"
        BACKEND_RUNNING=true
    else
        echo "   Status: ❌ Stopped"
    fi
fi

echo ""

# Check Frontend
echo "🌐 Frontend (Port 5173):"
FRONTEND_RUNNING=false

if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat "frontend.pid")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        echo "   Status: ✅ Running"
        echo "   PID: $FRONTEND_PID"
        FRONTEND_RUNNING=true
        
        # Check if responding
        if curl -s http://localhost:5173 >/dev/null 2>&1; then
            echo "   URL: http://localhost:5173"
        fi
    else
        echo "   Status: ⚠️  Stopped (stale PID file)"
        rm "frontend.pid"
    fi
else
    if lsof -ti:5173 > /dev/null 2>&1; then
        PID=$(lsof -ti:5173)
        echo "   Status: ⚠️  Running (no PID file)"
        echo "   PID: $PID"
        FRONTEND_RUNNING=true
    else
        echo "   Status: ❌ Stopped"
    fi
fi

echo ""
echo "================================="

# Summary
if $BACKEND_RUNNING && $FRONTEND_RUNNING; then
    echo "✅ All services running"
elif $BACKEND_RUNNING || $FRONTEND_RUNNING; then
    echo "⚠️  Some services not running"
else
    echo "❌ No services running"
fi

echo ""

# Show quick actions
if $BACKEND_RUNNING && $FRONTEND_RUNNING; then
    echo "🌐 Open: http://localhost:5173"
    echo "🛑 Stop: ./scripts/stop.sh"
else
    echo "🚀 Start: ./scripts/start.sh"
fi

echo ""
