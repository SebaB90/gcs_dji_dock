# 🖥️ Desktop Launcher Guide

## Overview

The GCS DJI Dock application can now be started with a simple **double-click** from your desktop! No need to open terminals or remember commands.

---

## 🚀 Quick Start

### First Time Setup

1. **Run the installer** (only once):
   ```bash
   cd /home/sebab/0_dev/gcs_dji_dock
   ./install_desktop_icons.sh
   ```

2. **Look on your desktop** - you'll see a new icon:
   - 🚁 **GCS DJI Dock** - Start the application

3. **Double-click to launch!**

4. **To stop:** Just close the browser tab when you're done!
   - Or use `./stop_all.sh` from terminal for clean shutdown

---

## 🎯 Using Desktop Icon

### To Start the Application

1. **Double-click** the "GCS DJI Dock" icon on your desktop
2. You may see a dialog asking to "Trust and Launch" or "Allow Launching"
   - ✅ Click **"Trust"** or **"Allow"**
3. A progress window will show:
   - ⏳ "Starting backend server..."
   - ⏳ "Starting frontend..."
   - ⏳ "Opening browser..."
4. Your browser will automatically open to http://localhost:5173
5. Login with:
   - Username: `fieldrobotics`
   - Password: `FieldRobotics2025!GCS`

### To Stop the Application

**Simple way:** Just close the browser tab when you're done! 🔴

**Clean shutdown (recommended):**
```bash
./stop_all.sh
```

This ensures all processes are properly terminated and ports are freed.

---

## 📋 Available Launchers

### Desktop Icon (double-click friendly)

Created on your Desktop:
- `GCS-DJI-Dock.desktop` - Start application (with your custom logo!)

### Application Menu

Search for "GCS DJI Dock" in your application launcher:
- Ubuntu: Press `Super` key and type "GCS"
- GNOME: Activities → type "GCS"
- KDE: Application Menu → search "GCS"

### Command Line (traditional)

Still available for advanced users:
```bash
./launch.sh      # GUI launcher
./start_all.sh   # Terminal launcher
./stop_all.sh    # Terminal stop
./status.sh      # Check status
```

---

## 🎨 Features

### GUI Launcher (`launch.sh`)

✅ **Visual Progress Dialog**
- Shows startup progress with visual feedback
- Displays which services are starting
- Automatically opens browser when ready

✅ **Error Handling**
- Shows error dialogs if startup fails
- Provides helpful troubleshooting messages
- Logs errors for debugging

✅ **Smart Detection**
- Checks if application is already running
- Opens browser to existing instance if found
- Prevents duplicate launches

✅ **Auto Browser Open**
- Automatically opens http://localhost:5173
- Works with default browser
- Shows login credentials in dialog

### GUI Shutdown (`shutdown.sh`)

✅ **Confirmation Dialog**
- Asks before stopping services
- Prevents accidental shutdowns

✅ **Progress Feedback**
- Shows shutdown progress
- Confirms when complete

✅ **Clean Shutdown**
- Gracefully stops all services
- Cleans up PID files
- Frees ports properly

---

## 🔧 Technical Details

### What Happens When You Double-Click?

1. **Launch Icon Clicked:**
   ```
   GCS-DJI-Dock.desktop
   ↓
   launch.sh
   ↓
   start_backend.sh → Starts FastAPI server
   ↓
   start_frontend.sh → Starts Vite dev server
   ↓
   xdg-open http://localhost:5173 → Opens browser
   ```

2. **Dependencies:**
   - `zenity` - For GUI dialogs (optional but recommended)
   - `xdg-open` - For opening browser (standard on Linux)
   - `lsof` - For port checking (standard on Linux)

3. **Files Created:**
   - `backend.pid` - Backend process ID
   - `frontend.pid` - Frontend process ID
   - `backend.log` - Backend output
   - `frontend.log` - Frontend output

---

## 🛠️ Installation Details

### Desktop Files Location

**Desktop icons:**
```
~/Desktop/GCS-DJI-Dock.desktop
~/Desktop/GCS-DJI-Dock-Stop.desktop
```

**Application menu entries:**
```
~/.local/share/applications/GCS-DJI-Dock.desktop
~/.local/share/applications/GCS-DJI-Dock-Stop.desktop
```

### Manual Installation

If the installer script doesn't work, you can copy manually:

```bash
# Copy to desktop
cp GCS-DJI-Dock.desktop ~/Desktop/
cp GCS-DJI-Dock-Stop.desktop ~/Desktop/

# Make executable
chmod +x ~/Desktop/GCS-DJI-Dock.desktop
chmod +x ~/Desktop/GCS-DJI-Dock-Stop.desktop

# Trust files (GNOME)
gio set ~/Desktop/GCS-DJI-Dock.desktop metadata::trusted true
gio set ~/Desktop/GCS-DJI-Dock-Stop.desktop metadata::trusted true
```

---

## 🚨 Troubleshooting

### "Untrusted Application" Warning

**Problem:** First double-click shows "Untrusted Application" dialog.

**Solution:** Click **"Trust and Launch"** or **"Mark as Trusted"**. This only happens once.

---

### Icon Doesn't Appear on Desktop

**Ubuntu/GNOME:**
```bash
# Enable desktop icons
gsettings set org.gnome.desktop.background show-desktop-icons true

# Or use GNOME Extensions to enable desktop icons
```

**Alternative:** Use the application menu instead (search for "GCS DJI Dock")

---

### Nothing Happens When Clicking

**Check if GUI tools are installed:**
```bash
# Install zenity for GUI dialogs (recommended)
sudo apt install zenity

# Test the launcher from terminal
./launch.sh
```

**Check file permissions:**
```bash
ls -l ~/Desktop/GCS-DJI-Dock.desktop
# Should show: -rwxr-xr-x (executable)

# If not executable:
chmod +x ~/Desktop/GCS-DJI-Dock.desktop
```

---

### Application Doesn't Start

**View error messages:**
1. Open terminal
2. Run `./launch.sh` manually
3. Check error output
4. View logs: `cat backend.log frontend.log`

**Common causes:**
- Dependencies not installed
- Virtual environment missing
- Ports already in use

**Solution:**
```bash
# Run the terminal version for detailed errors
./start_all.sh
```

---

### Browser Doesn't Open Automatically

**Manual access:**
- Open browser manually
- Navigate to http://localhost:5173

**Fix auto-open:**
```bash
# Test default browser
xdg-open http://localhost:5173

# If that fails, set default browser
xdg-settings set default-web-browser firefox.desktop
# or
xdg-settings set default-web-browser google-chrome.desktop
```

---

## 🎯 Advanced Configuration

### Change Desktop Icon

```bash
# Edit the .desktop file
nano ~/Desktop/GCS-DJI-Dock.desktop

# Change the Icon= line to any image path
Icon=/path/to/your/custom-icon.png
```

### Disable GUI Dialogs

If you prefer silent startup without dialogs:

```bash
# Edit launch.sh
nano launch.sh

# Set GUI=false at the top
GUI=false
```

### Run on System Startup

**Create autostart entry:**
```bash
mkdir -p ~/.config/autostart
cp GCS-DJI-Dock.desktop ~/.config/autostart/
```

**Note:** Only recommended for production deployments.

---

## 📊 Comparison: Desktop vs Terminal

| Feature | Desktop Icon | Terminal Command |
|---------|-------------|------------------|
| Ease of use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Visual feedback | ✅ Progress dialogs | ✅ Text output |
| Error messages | ✅ GUI popups | ✅ Terminal text |
| Browser auto-open | ✅ Yes | ❌ Manual |
| Startup speed | Same | Same |
| Debugging | ⚠️ Check logs | ✅ Direct output |
| Client demos | ⭐⭐⭐⭐⭐ Perfect! | ⭐⭐ Technical |

---

## 💡 Best Practices

### For Development
- Use **desktop icon** for quick daily starts
- Use **terminal commands** when debugging
- Keep logs open in terminal: `tail -f backend.log frontend.log`

### For Demos
- Use **desktop icon** - professional and clean
- Test startup before client arrives
- Keep browser window clean (close extra tabs)

### For Production
- Use **systemd service** instead
- See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)

---

## 🔄 Updates

After pulling new code or making changes:

```bash
# No need to reinstall icons!
# Just use the desktop icon as normal

# Or from terminal:
./restart_all.sh
```

The desktop icons always point to the latest code.

---

## 🗑️ Uninstallation

To remove desktop icons:

```bash
# Remove from desktop
rm ~/Desktop/GCS-DJI-Dock*.desktop

# Remove from applications menu
rm ~/.local/share/applications/GCS-DJI-Dock*.desktop

# Update application database
update-desktop-database ~/.local/share/applications
```

---

## ✅ Summary

You can now:
- ✅ **Double-click** desktop icon to start
- ✅ See **visual progress** during startup
- ✅ Get **error notifications** if something fails
- ✅ **Browser opens automatically** to login screen
- ✅ **Double-click stop icon** for clean shutdown
- ✅ Find app in **application menu** (search "GCS")

**Perfect for:**
- Daily development workflow
- Client demonstrations
- Non-technical users
- Quick testing

**Still available:**
- All terminal commands (`./start_all.sh`, etc.)
- Complete process management
- Detailed logs and debugging

---

## 📚 Related Documentation

- [QUICK_START.md](QUICK_START.md) - Complete quick start guide
- [UNIFIED_MANAGEMENT.md](UNIFIED_MANAGEMENT.md) - Process management details
- [README.md](../README.md) - Main documentation

---

**Enjoy your one-click GCS DJI Dock launcher! 🚁✨**
