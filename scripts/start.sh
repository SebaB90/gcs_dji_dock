#!/bin/bash

# GCS DJI Dock - Start All Services
# Starts both backend and frontend with health checks

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Starting GCS DJI Dock"
echo "========================"
echo ""

# Auto-detect and update IP if needed
if [ -f "$PROJECT_DIR/scripts/check-ip.sh" ]; then
    bash "$PROJECT_DIR/scripts/check-ip.sh"
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Run setup first:"
    echo "  python3 -m venv .venv"
    echo "  .venv/bin/pip install -r backend/requirements.txt"
    exit 1
fi

# Start Backend
echo "📦 Starting Backend..."
source .venv/bin/activate
cd backend

# Kill any existing backend process (by PID file)
if [ -f "$PROJECT_DIR/backend.pid" ]; then
    OLD_PID=$(cat "$PROJECT_DIR/backend.pid")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "   Stopping old backend process (PID: $OLD_PID)..."
        kill "$OLD_PID" 2>/dev/null
        sleep 2
    fi
    rm "$PROJECT_DIR/backend.pid"
fi

# Kill any process using port 8000 (cleanup)
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   Cleaning up port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Start new backend
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$PROJECT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_DIR/backend.pid"
echo "   ✅ Backend started (PID: $BACKEND_PID)"

cd "$PROJECT_DIR"

# Wait for backend
echo "   ⏳ Waiting for backend to be ready..."
for i in {1..15}; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo "   ✅ Backend health check passed"
        break
    fi
    sleep 1
done

echo ""

# Start Frontend
echo "🌐 Starting Frontend..."
cd frontend

# Kill any existing frontend process (by PID file)
if [ -f "$PROJECT_DIR/frontend.pid" ]; then
    OLD_PID=$(cat "$PROJECT_DIR/frontend.pid")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "   Stopping old frontend process (PID: $OLD_PID)..."
        kill "$OLD_PID" 2>/dev/null
        sleep 2
    fi
    rm "$PROJECT_DIR/frontend.pid"
fi

# Kill any process using port 5173 (cleanup)
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "   Cleaning up port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Frontend dependencies not found!"
    echo "Run: cd frontend && npm install"
    exit 1
fi

# Start new frontend
nohup npm run dev > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_DIR/frontend.pid"
echo "   ✅ Frontend started (PID: $FRONTEND_PID)"

cd "$PROJECT_DIR"

echo ""
echo "========================"
echo "✨ All Services Started!"
echo "========================"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "🔐 Login: fieldrobotics / FieldRobotics2025!GCS"
echo ""
echo "📊 Check status: ./scripts/status.sh"
echo "🛑 Stop all:     ./scripts/stop.sh"
echo ""
