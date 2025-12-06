#!/bin/bash

# GCS DJI Dock - Status Check
# Shows the current status of all services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📊 GCS DJI Dock - Service Status"
echo "=================================="
echo ""

# Check Backend
echo "🔧 Backend (Port 8000):"
if [ -f "$SCRIPT_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/backend.pid")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo "   Status: ✅ Running"
        echo "   PID: $BACKEND_PID"
        
        # Health check
        HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "   Health: ✅ Healthy"
        else
            echo "   Health: ⚠️  Not responding"
        fi
    else
        echo "   Status: ⚠️  Stopped (stale PID file)"
    fi
else
    if lsof -ti:8000 > /dev/null 2>&1; then
        PID=$(lsof -ti:8000)
        echo "   Status: ⚠️  Running (no PID file)"
        echo "   PID: $PID"
    else
        echo "   Status: ❌ Stopped"
    fi
fi

echo ""

# Check Frontend
echo "🌐 Frontend (Port 5173):"
if [ -f "$SCRIPT_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/frontend.pid")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        echo "   Status: ✅ Running"
        echo "   PID: $FRONTEND_PID"
    else
        echo "   Status: ⚠️  Stopped (stale PID file)"
    fi
else
    if lsof -ti:5173 > /dev/null 2>&1; then
        PID=$(lsof -ti:5173)
        echo "   Status: ⚠️  Running (no PID file)"
        echo "   PID: $PID"
    else
        echo "   Status: ❌ Stopped"
    fi
fi

echo ""
echo "=================================="
echo ""

# Show quick commands
echo "📋 Quick Commands:"
echo "   Start all:   ./start_all.sh"
echo "   Stop all:    ./stop_all.sh"
echo "   Restart all: ./restart_all.sh"
echo "   View logs:   tail -f backend.log frontend.log"
echo ""

# Show URLs if services are running
if lsof -ti:8000 > /dev/null 2>&1 && lsof -ti:5173 > /dev/null 2>&1; then
    echo "🌐 Access URLs:"
    echo "   Frontend:  http://localhost:5173"
    echo "   Backend:   http://localhost:8000"
    echo "   API Docs:  http://localhost:8000/docs"
    echo ""
fi
