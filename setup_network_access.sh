#!/bin/bash

# GCS DJI Dock - Network Access Setup Script
# Automatically configures the dashboard for network access

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "🌐 GCS DJI Dock - Network Access Setup"
echo "======================================"
echo ""

# Detect server IP
echo "🔍 Detecting server IP address..."
SERVER_IP=$(hostname -I | awk '{print $1}')

if [ -z "$SERVER_IP" ]; then
    echo "❌ Could not detect IP address automatically"
    echo "Please enter your server's IP address manually:"
    read -p "IP Address: " SERVER_IP
fi

echo "✅ Server IP detected: $SERVER_IP"
echo ""

# Create .env.local
echo "📝 Configuring frontend..."
cat > "$FRONTEND_DIR/.env.local" << EOF
# GCS DJI Dock - Network Access Configuration
# Auto-generated on $(date)

# Backend API URL (accessible from network)
VITE_BACKEND_URL=http://$SERVER_IP:8000
EOF

echo "✅ Created $FRONTEND_DIR/.env.local"
echo ""

# Check firewall
echo "🔥 Checking firewall configuration..."

if command -v ufw &> /dev/null; then
    echo "Detected UFW firewall"
    echo "Opening ports 8000 and 5173..."
    
    sudo ufw allow 8000/tcp comment "GCS Backend" 2>/dev/null
    sudo ufw allow 5173/tcp comment "GCS Frontend" 2>/dev/null
    
    echo "✅ Firewall rules added"
    
elif command -v firewall-cmd &> /dev/null; then
    echo "Detected firewalld"
    echo "Opening ports 8000 and 5173..."
    
    sudo firewall-cmd --permanent --add-port=8000/tcp 2>/dev/null
    sudo firewall-cmd --permanent --add-port=5173/tcp 2>/dev/null
    sudo firewall-cmd --reload 2>/dev/null
    
    echo "✅ Firewall rules added"
    
else
    echo "⚠️  No supported firewall detected (ufw/firewalld)"
    echo "You may need to manually configure your firewall:"
    echo "  - Allow TCP port 8000 (Backend)"
    echo "  - Allow TCP port 5173 (Frontend)"
fi

echo ""
echo "======================================"
echo "✨ Network Access Configuration Complete!"
echo "======================================"
echo ""
echo "📋 Configuration Summary:"
echo "   Server IP: $SERVER_IP"
echo "   Backend URL: http://$SERVER_IP:8000"
echo "   Frontend URL: http://$SERVER_IP:5173"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Restart services to apply changes:"
echo "   ./restart_all.sh"
echo ""
echo "2. Access from other devices on your network:"
echo "   http://$SERVER_IP:5173"
echo ""
echo "3. Verify connectivity:"
echo "   curl http://$SERVER_IP:8000/health"
echo ""
echo "📱 Mobile/Tablet Access:"
echo "   - Connect to same WiFi network"
echo "   - Open browser"
echo "   - Navigate to: http://$SERVER_IP:5173"
echo ""
echo "📖 Full documentation:"
echo "   docs/NETWORK_ACCESS.md"
echo ""
