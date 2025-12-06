#!/bin/bash

# GCS DJI Dock - Desktop Icon Installer
# Creates desktop shortcuts for easy access

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$HOME/Desktop"

echo "🖥️  GCS DJI Dock - Desktop Icon Installer"
echo "=========================================="
echo ""

# Check if Desktop directory exists
if [ ! -d "$DESKTOP_DIR" ]; then
    echo "❌ Desktop directory not found: $DESKTOP_DIR"
    echo "Creating Desktop directory..."
    mkdir -p "$DESKTOP_DIR"
fi

# Update paths in desktop file to current location
sed -i "s|Exec=.*launch.sh|Exec=$SCRIPT_DIR/launch.sh|g" "$SCRIPT_DIR/GCS-DJI-Dock.desktop"
sed -i "s|Icon=.*appLogo.png|Icon=$SCRIPT_DIR/frontend/public/appLogo.png|g" "$SCRIPT_DIR/GCS-DJI-Dock.desktop"

# Copy desktop file
echo "📋 Installing desktop shortcut..."

cp "$SCRIPT_DIR/GCS-DJI-Dock.desktop" "$DESKTOP_DIR/"

# Make it executable
chmod +x "$DESKTOP_DIR/GCS-DJI-Dock.desktop"

# Mark as trusted (for GNOME)
if command -v gio &> /dev/null; then
    gio set "$DESKTOP_DIR/GCS-DJI-Dock.desktop" metadata::trusted true 2>/dev/null
fi

# Also install to applications menu
APPS_DIR="$HOME/.local/share/applications"
mkdir -p "$APPS_DIR"

cp "$SCRIPT_DIR/GCS-DJI-Dock.desktop" "$APPS_DIR/"

# Update desktop database
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$APPS_DIR" 2>/dev/null
fi

echo ""
echo "=========================================="
echo "✅ Installation Complete!"
echo "=========================================="
echo ""
echo "Desktop icon created at:"
echo "  📍 $DESKTOP_DIR/GCS-DJI-Dock.desktop"
echo ""
echo "Also added to Applications menu:"
echo "  🔍 Search for 'GCS DJI Dock' in your app launcher"
echo ""
echo "Usage:"
echo "  🚀 Double-click 'GCS DJI Dock' icon to start"
echo "  🛑 To stop: Just close the browser tab (or use ./stop_all.sh)"
echo ""
echo "Note: On first click, your system may ask you to"
echo "      'Trust and Launch' - click Allow/Trust."
echo ""
