#!/bin/bash

# Auto-detect and update IP configuration
# Always uses network IP (never localhost)

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_LOCAL="$PROJECT_DIR/frontend/.env.local"

# Get current IP
CURRENT_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1 | head -n1)

# If no IP found, exit
if [ -z "$CURRENT_IP" ]; then
    exit 0
fi

# Check if .env.local exists and extract configured IP
if [ -f "$ENV_LOCAL" ]; then
    CONFIGURED_IP=$(grep "VITE_BACKEND_URL" "$ENV_LOCAL" | cut -d'=' -f2 | grep -oP '(?<=http://)[\d\.]+(?=:)')
else
    CONFIGURED_IP=""
fi

# Always update if IP is different or file doesn't exist
if [ "$CONFIGURED_IP" != "$CURRENT_IP" ]; then
    if [ -n "$CONFIGURED_IP" ]; then
        echo "🔄 IP changed: $CONFIGURED_IP → $CURRENT_IP"
    else
        echo "🔄 Configuring network IP: $CURRENT_IP"
    fi
    echo "   Updating frontend/.env.local..."
    
    cat > "$ENV_LOCAL" << EOF
# GCS DJI Dock - Network Access Configuration
# Auto-updated: $(date +"%Y-%m-%d %H:%M:%S")

# Backend API URL - accessible from network
# Current IP: $CURRENT_IP
VITE_BACKEND_URL=http://$CURRENT_IP:8000
EOF
    
    echo "   ✅ Configuration updated"
fi

exit 0
