#!/bin/bash

# GCS DJI Dock - Desktop Launcher
# Shows progress dialogs and launches the application

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if zenity is available for GUI dialogs
if ! command -v zenity &> /dev/null; then
    # Fallback to terminal if zenity not available
    gnome-terminal -- bash -c "$PROJECT_DIR/scripts/start.sh; echo ''; echo 'Press Enter to close...'; read"
    exit 0
fi

# Function to show progress
show_progress() {
    zenity --progress --title="GCS DJI Dock" --text="$1" --pulsate --auto-close --no-cancel 2>/dev/null &
    PROGRESS_PID=$!
}

# Function to kill progress
kill_progress() {
    kill $PROGRESS_PID 2>/dev/null
}

# Start services
show_progress "Starting backend and frontend..."
cd "$PROJECT_DIR"
./scripts/start.sh > "$PROJECT_DIR/logs/startup.log" 2>&1 &
STARTUP_PID=$!

# Wait for services to start (max 20 seconds)
for i in {1..20}; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1 && \
       curl -s http://localhost:5173 >/dev/null 2>&1; then
        break
    fi
    sleep 1
done

kill_progress

# Check if services started successfully
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    # Show success message
    zenity --info \
        --title="GCS DJI Dock" \
        --text="✅ Application started successfully!\n\n🌐 Opening browser to http://localhost:5173\n\n🔐 Login credentials:\n   Username: fieldrobotics\n   Password: FieldRobotics2025!GCS" \
        --width=400 \
        --timeout=3 2>/dev/null &
    
    # Open browser
    sleep 1
    xdg-open http://localhost:5173 &>/dev/null &
else
    # Show error message
    zenity --error \
        --title="GCS DJI Dock" \
        --text="❌ Failed to start application\n\nCheck the logs:\n  tail -f logs/backend.log\n  tail -f logs/frontend.log\n\nOr run from terminal:\n  ./scripts/start.sh" \
        --width=400 2>/dev/null
    exit 1
fi
