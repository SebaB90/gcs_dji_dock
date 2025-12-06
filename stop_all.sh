#!/bin/bash

# GCS DJI Dock - Stop All Services
# Stops both backend and frontend

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🛑 Stopping GCS DJI Dock - All Services"
echo "========================================"
echo ""

# Stop Frontend first (faster to stop)
echo "📦 Step 1/2: Stopping Frontend..."
"$SCRIPT_DIR/stop_frontend.sh"

echo ""

# Stop Backend
echo "📦 Step 2/2: Stopping Backend..."
"$SCRIPT_DIR/stop_backend.sh"

echo ""
echo "========================================"
echo "✅ All Services Stopped Successfully!"
echo "========================================"
echo ""
