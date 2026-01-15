#!/bin/bash

# GCS DJI Dock - GUI Launcher
# Shows progress dialogs and launches the application

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if zenity is available
if ! command -v zenity &> /dev/null; then
    # Fallback to terminal if zenity not available
    gnome-terminal -- bash -c "$SCRIPT_DIR/start_all.sh; echo ''; echo 'Press Enter to close...'; read"
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

# Start backend
show_progress "Starting backend server..."
cd "$SCRIPT_DIR"
./start_all.sh > /tmp/gcs_startup.log 2>&1 &
STARTUP_PID=$!

# Wait for services to start (max 15 seconds)
for i in {1..15}; do
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
    zenity --info --title="GCS DJI Dock" --text="✅ Application started successfully!\n\n🌐 Opening browser to http://localhost:5173\n\n🔐 Login credentials:\n   Username: fieldrobotics\n   Password: FieldRobotics2025!GCS" --width=400 --timeout=3 2>/dev/null &
    
    # Open browser
    sleep 1
    xdg-open http://localhost:5173 &>/dev/null &
else
    # Show error message
    zenity --error --title="GCS DJI Dock" --text="❌ Failed to start application!\n\nCheck logs:\n   tail -f backend.log\n   tail -f frontend.log" --width=400 2>/dev/null
    exit 1
fi
