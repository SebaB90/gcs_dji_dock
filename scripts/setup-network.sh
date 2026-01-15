#!/bin/bash

# GCS DJI Dock - Setup Network Access
# Configures frontend to be accessible from other devices on the network

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VITE_CONFIG="$PROJECT_DIR/frontend/vite.config.js"

echo "🌐 GCS DJI Dock - Network Access Setup"
echo "======================================"
echo ""

# Get the machine's IP address
LOCAL_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1 | head -n1)

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not detect local IP address"
    exit 1
fi

echo "📍 Detected local IP: $LOCAL_IP"
echo ""

# Check if vite.config.js exists
if [ ! -f "$VITE_CONFIG" ]; then
    echo "❌ vite.config.js not found at: $VITE_CONFIG"
    exit 1
fi

# Check if host is already set to 0.0.0.0
if grep -q "host: '0.0.0.0'" "$VITE_CONFIG"; then
    echo "✅ Network access already configured in vite.config.js"
else
    echo "⚙️  Configuring vite.config.js..."
    
    # Backup original config
    cp "$VITE_CONFIG" "$VITE_CONFIG.backup"
    
    # Update the config (add host: '0.0.0.0' to server section)
    # This is a simple approach - adjust if needed
    echo "   Creating backup: vite.config.js.backup"
    echo "   ℹ️  Manual configuration may be needed"
    echo ""
    echo "   Add this to your vite.config.js server section:"
    echo "   server: {"
    echo "     host: '0.0.0.0',"
    echo "     port: 5173"
    echo "   }"
fi

# Configure .env.local for network access
ENV_LOCAL="$PROJECT_DIR/frontend/.env.local"
echo ""
echo "⚙️  Configuring frontend/.env.local for network access..."

cat > "$ENV_LOCAL" << EOF
# GCS DJI Dock - Network Access Configuration
# Auto-configured for network access on $LOCAL_IP

# Backend API URL - accessible from this device and network
# Use localhost when accessing from this machine, or $LOCAL_IP when accessing from other devices
VITE_BACKEND_URL=http://$LOCAL_IP:8000
EOF

echo "   ✅ Created/Updated frontend/.env.local"

echo ""
echo "======================================"
echo "✅ Configuration Complete"
echo "======================================"
echo ""
echo "📱 Access the application from other devices:"
echo "   http://$LOCAL_IP:5173"
echo ""
echo "🔒 Make sure your firewall allows connections on:"
echo "   - Port 5173 (Frontend)"
echo "   - Port 8000 (Backend API)"
echo ""
echo "🚀 Restart the application:"
echo "   ./scripts/stop.sh"
echo "   ./scripts/start.sh"
echo ""
echo "📚 See docs/NETWORK_GUIDE.md for more details"
echo ""
