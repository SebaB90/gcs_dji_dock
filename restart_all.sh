#!/bin/bash

# GCS DJI Dock - Restart All Services
# Stops and starts both backend and frontend

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Restarting GCS DJI Dock - All Services"
echo "=========================================="
echo ""

# Stop all services
"$SCRIPT_DIR/stop_all.sh"

echo ""
echo "⏳ Waiting for cleanup..."
sleep 3
echo ""

# Start all services
"$SCRIPT_DIR/start_all.sh"
