#!/bin/bash

# GCS DJI Dock - Start All Services
# Starts both backend and frontend with health checks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting GCS DJI Dock - All Services"
echo "========================================"
echo ""

# Start Backend
echo "📦 Step 1/2: Starting Backend..."
"$SCRIPT_DIR/start_backend.sh"
BACKEND_STATUS=$?

if [ $BACKEND_STATUS -ne 0 ]; then
    echo ""
    echo "❌ Backend failed to start!"
    echo "Fix the backend issue before starting frontend."
    exit 1
fi

echo ""
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Check backend health
HEALTH_CHECK=$(curl -s http://localhost:8000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Backend health check passed"
else
    echo "⚠️  Backend health check failed, but continuing..."
fi

echo ""
echo "📦 Step 2/2: Starting Frontend..."
"$SCRIPT_DIR/start_frontend.sh"
FRONTEND_STATUS=$?

if [ $FRONTEND_STATUS -ne 0 ]; then
    echo ""
    echo "❌ Frontend failed to start!"
    echo "Backend is running, but frontend has issues."
    exit 1
fi

echo ""
echo "========================================"
echo "✨ All Services Started Successfully!"
echo "========================================"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📊 Monitoring:"
echo "   Backend logs:  tail -f backend.log"
echo "   Frontend logs: tail -f frontend.log"
echo "   Health check:  curl http://localhost:8000/health"
echo ""
echo "🛑 Stop all services:"
echo "   ./stop_all.sh"
echo ""
echo "🔄 Restart all services:"
echo "   ./restart_all.sh"
echo ""
echo "🔐 Default Login:"
echo "   Username: fieldrobotics"
echo "   Password: FieldRobotics2025!GCS"
echo ""
