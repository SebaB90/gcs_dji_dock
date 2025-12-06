#!/bin/bash

# GCS DJI Dock - Backend Restart Script
# Stops and starts the backend server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Restarting GCS DJI Dock Backend..."

# Stop the backend
"$SCRIPT_DIR/stop_backend.sh"

# Wait a moment for cleanup
sleep 2

# Start the backend
"$SCRIPT_DIR/start_backend.sh"
