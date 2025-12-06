# 🚁 GCS DJI Dock - How to Use

## 🖥️ Desktop Icon (EASIEST!)

Look on your desktop for:

### 🚀 GCS DJI Dock
**Double-click this icon to START the application**
- Opens automatically in your browser
- Shows login screen
- Ready in ~10 seconds

**To stop:** Just close the browser tab when done! 🔴
(Or use `./stop_all.sh` from terminal for clean shutdown)

---

## 🔐 Login Credentials

When the browser opens, use:
- **Username:** `fieldrobotics`
- **Password:** `FieldRobotics2025!GCS`

---

## 📋 Quick Commands (Terminal Alternative)

If you prefer command line:

```bash
./start_all.sh      # Start everything
./stop_all.sh       # Stop everything
./restart_all.sh    # Restart everything
./status.sh         # Check what's running
```

---

## 🆘 Having Issues?

### Desktop icon doesn't work?
1. Right-click the icon
2. Click "Allow Launching" or "Trust"
3. Double-click again

### Application not starting?
```bash
# Run from terminal to see errors
./start_all.sh

# Check logs
tail -f backend.log
tail -f frontend.log
```

### Ports already in use?
```bash
./restart_all.sh  # This will fix it!
```

---

## 🌐 URLs

Once started, access:
- **Frontend UI:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📚 Full Documentation

- [Desktop Launcher Guide](docs/DESKTOP_LAUNCHER.md)
- [Quick Start Guide](docs/QUICK_START.md)
- [Complete README](README.md)

---

**Enjoy your GCS DJI Dock! 🚁✨**
