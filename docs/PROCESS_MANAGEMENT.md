# Backend Process Management Guide

## 🎯 Overview

The GCS DJI Dock backend includes robust process management scripts to prevent common issues like port conflicts, orphaned processes, and improper shutdowns.

---

## 📁 Management Scripts

### `start_backend.sh`
Starts the backend server with proper process tracking and logging.

**Features:**
- ✅ Checks if port 8000 is already in use
- ✅ Prevents duplicate processes
- ✅ Creates PID file for process tracking
- ✅ Logs output to `backend.log`
- ✅ Validates startup success
- ✅ Provides helpful usage commands

**Usage:**
```bash
./start_backend.sh
```

**Output:**
```
🚀 Starting GCS DJI Dock Backend...
📝 Logging to: /home/user/gcs_dji_dock/backend.log
✅ Backend started successfully!
   PID: 12345
   Port: 8000
   URL: http://localhost:8000

Commands:
  - View logs: tail -f /home/user/gcs_dji_dock/backend.log
  - Stop: ./stop_backend.sh
  - Restart: ./restart_backend.sh
  - Health check: curl http://localhost:8000/health
```

---

### `stop_backend.sh`
Cleanly stops the backend server with graceful shutdown.

**Features:**
- ✅ Attempts graceful shutdown (SIGTERM)
- ✅ Waits up to 10 seconds for clean exit
- ✅ Force kills if necessary (SIGKILL)
- ✅ Cleans up PID file
- ✅ Verifies port is freed
- ✅ Falls back to port-based process detection

**Usage:**
```bash
./stop_backend.sh
```

**Output:**
```
🛑 Stopping GCS DJI Dock Backend...
📍 Found backend process (PID: 12345)
✅ Backend stopped gracefully
✨ Done!
```

---

### `restart_backend.sh`
Convenience script to stop and start the backend in one command.

**Usage:**
```bash
./restart_backend.sh
```

**What it does:**
1. Calls `./stop_backend.sh`
2. Waits 2 seconds for cleanup
3. Calls `./start_backend.sh`

---

## 🔄 Graceful Shutdown

The backend implements graceful shutdown handlers in `backend/app/main.py`:

**Features:**
- ✅ Responds to SIGTERM (kill) and SIGINT (Ctrl+C)
- ✅ Closes HTTP connection pool cleanly
- ✅ Clears authentication token cache
- ✅ Logs shutdown events
- ✅ FastAPI lifecycle events (startup/shutdown)

**Implementation:**
```python
def shutdown_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    
    # Close HTTP session
    if http_session:
        http_session.close()
        logger.info("HTTP session closed")
    
    # Clear token cache
    _tb_token_cache["token"] = None
    _tb_token_cache["expires_at"] = 0
    logger.info("Token cache cleared")
    
    logger.info("Shutdown complete")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)
```

---

## 🚨 Common Issues & Solutions

### ❌ Error: "Address already in use"

**Problem:** Port 8000 is occupied by another process.

**Detection:**
```bash
lsof -i :8000
```

**Solution 1 - Use management scripts:**
```bash
./stop_backend.sh
./start_backend.sh
```

**Solution 2 - Use restart script:**
```bash
./restart_backend.sh
```

**Solution 3 - Manual cleanup:**
```bash
# Find process ID
lsof -ti :8000

# Kill specific process
kill -9 <PID>

# Or kill all processes on port 8000
lsof -ti:8000 | xargs kill -9
```

---

### ⚠️ Multiple Backend Instances Running

**Detection:**
```bash
ps aux | grep uvicorn
```

**Solution:**
```bash
# Stop all uvicorn processes
pkill -9 -f "uvicorn app.main:app"

# Or use the management script
./stop_backend.sh
```

---

### 📝 Stale PID File

**Problem:** `backend.pid` exists but process is not running.

**Detection:**
The `start_backend.sh` script automatically detects and cleans up stale PID files.

**Manual cleanup:**
```bash
rm -f backend.pid
./start_backend.sh
```

---

### 🔍 Backend Started But Not Responding

**Check if process is running:**
```bash
# Method 1: Check PID file
cat backend.pid
ps -p $(cat backend.pid)

# Method 2: Check port
lsof -i :8000

# Method 3: Health check
curl http://localhost:8000/health
```

**View logs:**
```bash
# Real-time log monitoring
tail -f backend.log

# View last 50 lines
tail -n 50 backend.log

# Search for errors
grep -i error backend.log
```

**Common causes:**
1. **Port conflict:** Another service using port 8000
2. **Missing dependencies:** Run `pip install -r backend/requirements.txt`
3. **Environment variables:** Check `backend/.env` exists
4. **Python version:** Requires Python 3.8+

---

## 📊 Monitoring & Debugging

### Real-time Log Monitoring
```bash
# Follow logs with auto-scroll
tail -f backend.log

# Follow logs with grep filtering
tail -f backend.log | grep -E "ERROR|WARNING|INFO"

# Monitor specific events
tail -f backend.log | grep "authentication"
```

### Process Status
```bash
# Check if backend is running
ps aux | grep uvicorn | grep -v grep

# Check port usage
lsof -i :8000

# Verify PID file matches running process
cat backend.pid && ps -p $(cat backend.pid)
```

### Health Checks
```bash
# Basic health check
curl http://localhost:8000/health

# Readiness check (includes dependencies)
curl http://localhost:8000/ready

# Check API root
curl http://localhost:8000/
```

### Performance Monitoring
```bash
# Monitor CPU and memory usage
top -p $(cat backend.pid)

# Or with more details
htop -p $(cat backend.pid)

# Network connections
lsof -Pan -p $(cat backend.pid) -i
```

---

## 🔧 Advanced Usage

### Running on Custom Port
Edit `start_backend.sh` and change:
```bash
PORT=8000  # Change to desired port
```

### Development Mode (Auto-reload)
For development with auto-reload on code changes:
```bash
cd backend
../.venv/bin/uvicorn app.main:app --reload --port 8000
```

⚠️ **Note:** Development mode doesn't use process management scripts.

### Production Deployment

**Option 1 - Systemd Service:**
Create `/etc/systemd/system/gcs-backend.service`:
```ini
[Unit]
Description=GCS DJI Dock Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/gcs_dji_dock
ExecStart=/path/to/gcs_dji_dock/start_backend.sh
ExecStop=/path/to/gcs_dji_dock/stop_backend.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable gcs-backend
sudo systemctl start gcs-backend
sudo systemctl status gcs-backend
```

**Option 2 - Docker:**
See `docs/DOCKER_DEPLOYMENT.md` (coming soon)

---

## 📋 Quick Reference

| Task | Command |
|------|---------|
| Start backend | `./start_backend.sh` |
| Stop backend | `./stop_backend.sh` |
| Restart backend | `./restart_backend.sh` |
| View logs | `tail -f backend.log` |
| Check health | `curl http://localhost:8000/health` |
| Check port | `lsof -i :8000` |
| Check PID | `cat backend.pid` |
| Kill process | `./stop_backend.sh` |
| Clean restart | `./restart_backend.sh` |

---

## 🔐 Security Notes

1. **PID file location:** `backend.pid` is in project root
2. **Log file location:** `backend.log` is in project root
3. **Sensitive data:** Logs may contain authentication tokens - protect accordingly
4. **File permissions:** Scripts are executable (`chmod +x *.sh`)
5. **Process owner:** Backend runs as current user

---

## 🐛 Troubleshooting Checklist

- [ ] Virtual environment exists at `.venv/`
- [ ] Dependencies installed: `.venv/bin/pip install -r backend/requirements.txt`
- [ ] Environment file exists: `backend/.env`
- [ ] Port 8000 is free: `lsof -i :8000`
- [ ] No stale processes: `ps aux | grep uvicorn`
- [ ] PID file is clean: `rm -f backend.pid` if stale
- [ ] Log file shows no errors: `tail backend.log`
- [ ] Health endpoint responds: `curl http://localhost:8000/health`

---

## 📚 Related Documentation

- [Authentication System](AUTHENTICATION.md)
- [Code Optimization](CODE_OPTIMIZATION.md)
- [Production Checklist](PRODUCTION_CHECKLIST.md)
- [Quick Setup Guide](QUICK_SETUP_AUTH.md)

---

## 💡 Best Practices

1. **Always use management scripts** instead of manual `uvicorn` commands
2. **Check logs** before and after operations
3. **Verify health endpoint** after starting backend
4. **Use restart script** when deploying code changes
5. **Monitor resources** in production environments
6. **Backup PID file** before manual interventions
7. **Review logs periodically** for warnings/errors
8. **Keep scripts executable** with `chmod +x *.sh`

---

## 🆘 Getting Help

If you encounter issues not covered in this guide:

1. Check logs: `tail -f backend.log`
2. Verify configuration: `cat backend/.env`
3. Test health endpoint: `curl http://localhost:8000/health`
4. Check GitHub issues: [github.com/SebaB90/gcs_dji_dock/issues](https://github.com/SebaB90/gcs_dji_dock/issues)
5. Review related documentation in `docs/` folder
