#!/bin/bash

# GCS DJI Dock - GUI Launcher
# Double-click friendly startup script with visual feedback

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Use zenity for GUI dialogs if available, otherwise use terminal
if command -v zenity &> /dev/null; then
    GUI=true
else
    GUI=false
fi

# Function to show GUI message
show_message() {
    local title="$1"
    local message="$2"
    local type="$3"  # info, error, question
    
    if [ "$GUI" = true ]; then
        zenity --$type --title="$title" --text="$message" --width=400 2>/dev/null
    else
        echo "$title: $message"
    fi
}

# Function to show progress
show_progress() {
    local message="$1"
    
    if [ "$GUI" = true ]; then
        (
            echo "# $message"
            sleep 1
        ) | zenity --progress --title="GCS DJI Dock" --text="Starting..." --pulsate --auto-close 2>/dev/null &
        PROGRESS_PID=$!
    else
        echo "$message"
    fi
}

# Check if services are already running
if [ -f "$SCRIPT_DIR/backend.pid" ] && [ -f "$SCRIPT_DIR/frontend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/backend.pid")
    FRONTEND_PID=$(cat "$SCRIPT_DIR/frontend.pid")
    
    if ps -p "$BACKEND_PID" > /dev/null 2>&1 && ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        show_message "GCS DJI Dock" "Application is already running!\n\nFrontend: http://localhost:5173\nBackend: http://localhost:8000\n\nUse stop_all.sh to stop it first." "info"
        
        # Open browser
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:5173 2>/dev/null &
        fi
        exit 0
    fi
fi

# Start services
cd "$SCRIPT_DIR" || exit 1

# Show starting message
if [ "$GUI" = true ]; then
    (
        echo "10"; echo "# Checking dependencies..."
        sleep 1
        
        echo "30"; echo "# Starting backend server..."
        "$SCRIPT_DIR/start_backend.sh" > /tmp/gcs_startup.log 2>&1
        
        echo "60"; echo "# Waiting for backend..."
        sleep 3
        
        echo "80"; echo "# Starting frontend..."
        "$SCRIPT_DIR/start_frontend.sh" >> /tmp/gcs_startup.log 2>&1
        
        echo "100"; echo "# Opening browser..."
        sleep 2
    ) | zenity --progress --title="GCS DJI Dock" --text="Starting application..." --percentage=0 --auto-close 2>/dev/null
else
    echo "🚀 Starting GCS DJI Dock..."
    "$SCRIPT_DIR/start_all.sh"
fi

# Check if startup was successful
sleep 2

if lsof -ti:8000 > /dev/null 2>&1 && lsof -ti:5173 > /dev/null 2>&1; then
    # Success!
    if [ "$GUI" = true ]; then
        zenity --info \
            --title="GCS DJI Dock - Ready!" \
            --text="✅ Application started successfully!\n\n🌐 Opening browser...\n\nFrontend: http://localhost:5173\nBackend: http://localhost:8000\n\n🔐 Login:\nUsername: fieldrobotics\nPassword: FieldRobotics2025!GCS\n\n💡 To stop: Close browser or run ./stop_all.sh" \
            --width=450 2>/dev/null &
    else
        echo "✅ Application started successfully!"
        echo "🌐 Frontend: http://localhost:5173"
        echo "🔐 Username: fieldrobotics / Password: FieldRobotics2025!GCS"
        echo "💡 To stop: ./stop_all.sh"
    fi
    
    # Open browser
    sleep 1
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:5173 2>/dev/null &
    elif command -v firefox &> /dev/null; then
        firefox http://localhost:5173 2>/dev/null &
    elif command -v google-chrome &> /dev/null; then
        google-chrome http://localhost:5173 2>/dev/null &
    fi
else
    # Failed
    show_message "GCS DJI Dock - Error" "❌ Failed to start application!\n\nCheck logs:\n- backend.log\n- frontend.log\n\nOr run ./start_all.sh in terminal for details." "error"
    exit 1
fi
