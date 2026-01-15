#!/bin/bash

# GCS DJI Dock - Debug Launcher
# Starts the application and opens terminals with live logs

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Start services
echo "🚀 Starting GCS DJI Dock in debug mode..."
cd "$PROJECT_DIR"
./scripts/start.sh

# Wait a moment for services to start
sleep 3

# Open backend log terminal
gnome-terminal --tab --title="Backend Logs" -- bash -c "
    echo '📦 Backend Logs - http://localhost:8000'
    echo '================================================'
    tail -f '$PROJECT_DIR/logs/backend.log'
" &

# Open frontend log terminal
gnome-terminal --tab --title="Frontend Logs" -- bash -c "
    echo '🌐 Frontend Logs - http://localhost:5173'
    echo '================================================'
    tail -f '$PROJECT_DIR/logs/frontend.log'
" &

# Wait a bit more for services to be fully ready
sleep 3

# Check if services started successfully
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    # Open browser
    xdg-open http://localhost:5173 &>/dev/null &
    
    # Show notification
    if command -v zenity &> /dev/null; then
        zenity --info \
            --title="GCS DJI Dock - Debug Mode" \
            --text="✅ Application started in debug mode!\n\n🌐 Browser: http://localhost:5173\n📦 Backend Logs: Terminal 1\n🌐 Frontend Logs: Terminal 2\n\n🔐 Login:\n   Username: fieldrobotics\n   Password: FieldRobotics2025!GCS" \
            --width=450 \
            --timeout=5 2>/dev/null &
    fi
else
    # Show error
    if command -v zenity &> /dev/null; then
        zenity --error \
            --title="GCS DJI Dock - Debug Mode" \
            --text="❌ Failed to start application\n\nCheck the log terminals for details." \
            --width=400 2>/dev/null
    fi
    exit 1
fi
