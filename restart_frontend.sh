#!/bin/bash

# GCS DJI Dock - Frontend Restart Script
# Stops and starts the frontend server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Restarting GCS DJI Dock Frontend..."

# Stop the frontend
"$SCRIPT_DIR/stop_frontend.sh"

# Wait a moment for cleanup
sleep 2

# Start the frontend
"$SCRIPT_DIR/start_frontend.sh"
