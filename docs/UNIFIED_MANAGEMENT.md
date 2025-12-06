# GCS DJI Dock - Unified Process Management

## 🎯 Overview

The GCS DJI Dock application now features a complete automated process management system that allows you to control both backend and frontend services with simple, unified commands.

---

## 📋 Available Scripts

### 🚀 Unified Commands (Recommended)

| Script | Description | Usage |
|--------|-------------|-------|
| `./start_all.sh` | Start backend + frontend together | Primary startup method |
| `./stop_all.sh` | Stop both services cleanly | Clean shutdown |
| `./restart_all.sh` | Restart everything | After code changes |
| `./status.sh` | Check service status | Quick health check |

### 🔧 Backend Commands

| Script | Description |
|--------|-------------|
| `./start_backend.sh` | Start backend only |
| `./stop_backend.sh` | Stop backend only |
| `./restart_backend.sh` | Restart backend only |

### 🌐 Frontend Commands

| Script | Description |
|--------|-------------|
| `./start_frontend.sh` | Start frontend only |
| `./stop_frontend.sh` | Stop frontend only |
| `./restart_frontend.sh` | Restart frontend only |

---

## ✨ Features

All scripts include:

✅ **Port Conflict Detection**
- Automatically checks if ports 8000 (backend) or 5173 (frontend) are in use
- Shows helpful error messages with solutions
- Prevents duplicate processes

✅ **PID File Management**
- Creates `.pid` files to track running processes
- Cleans up stale PID files automatically
- Enables reliable process control

✅ **Automatic Logging**
- Backend logs → `backend.log`
- Frontend logs → `frontend.log`
- Timestamped entries for debugging

✅ **Health Checks**
- `start_all.sh` verifies backend health before starting frontend
- `status.sh` shows real-time service status
- Built-in health endpoint monitoring

✅ **Graceful Shutdown**
- Sends SIGTERM for clean shutdown
- Waits up to 10 seconds for graceful exit
- Force kills only if necessary
- Closes HTTP connections cleanly
- Clears caches properly

---

## 🚀 Quick Start

### First Time Setup
```bash
# Clone repository
git clone git@github.com:SebaB90/gcs_dji_dock.git
cd gcs_dji_dock

# Install dependencies
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd frontend && npm install && cd ..
```

### Daily Usage
```bash
# Start everything
./start_all.sh

# Check status
./status.sh

# Stop everything
./stop_all.sh
```

---

## 📊 Example Outputs

### `./start_all.sh`
```
🚀 Starting GCS DJI Dock - All Services
========================================

📦 Step 1/2: Starting Backend...
✅ Backend started successfully!
   PID: 12345
   Port: 8000
   URL: http://localhost:8000

⏳ Waiting for backend to be ready...
✅ Backend health check passed

📦 Step 2/2: Starting Frontend...
✅ Frontend started successfully!
   PID: 12346
   Port: 5173
   URL: http://localhost:5173

========================================
✨ All Services Started Successfully!
========================================

🌐 Application URLs:
   Frontend:  http://localhost:5173
   Backend:   http://localhost:8000
   API Docs:  http://localhost:8000/docs

🔐 Default Login:
   Username: fieldrobotics
   Password: FieldRobotics2025!GCS
```

### `./status.sh`
```
📊 GCS DJI Dock - Service Status
==================================

🔧 Backend (Port 8000):
   Status: ✅ Running
   PID: 12345
   Health: ✅ Healthy

🌐 Frontend (Port 5173):
   Status: ✅ Running
   PID: 12346

==================================

🌐 Access URLs:
   Frontend:  http://localhost:5173
   Backend:   http://localhost:8000
   API Docs:  http://localhost:8000/docs
```

### `./stop_all.sh`
```
🛑 Stopping GCS DJI Dock - All Services
========================================

📦 Step 1/2: Stopping Frontend...
✅ Frontend stopped gracefully

📦 Step 2/2: Stopping Backend...
✅ Backend stopped gracefully

========================================
✅ All Services Stopped Successfully!
========================================
```

---

## 🛠️ Generated Files

The scripts automatically create and manage these files:

| File | Purpose | Location |
|------|---------|----------|
| `backend.pid` | Backend process ID | Project root |
| `frontend.pid` | Frontend process ID | Project root |
| `backend.log` | Backend output logs | Project root |
| `frontend.log` | Frontend output logs | Project root |

**Note:** These files are automatically created and cleaned up by the scripts. Don't edit them manually.

---

## 🔧 Advanced Usage

### Development Workflow

```bash
# Morning: Start everything
./start_all.sh

# During development: Monitor logs
tail -f backend.log frontend.log

# After code changes: Quick restart
./restart_all.sh

# Evening: Clean shutdown
./stop_all.sh
```

### Debugging

```bash
# Check what's running
./status.sh

# View recent backend logs
tail -50 backend.log

# View recent frontend logs
tail -50 frontend.log

# Monitor logs in real-time
tail -f backend.log

# Check backend health
curl http://localhost:8000/health

# Check ports
lsof -i :8000  # Backend
lsof -i :5173  # Frontend
```

### Clean Restart

```bash
# Complete clean restart
./stop_all.sh
sleep 2
rm -f *.pid *.log
./start_all.sh
```

---

## 🚨 Troubleshooting

### Port Already in Use

**Problem:** Script reports port 8000 or 5173 already in use.

**Solution:**
```bash
# Option 1: Use restart (recommended)
./restart_all.sh

# Option 2: Manual cleanup
./stop_all.sh
sleep 2
./start_all.sh

# Option 3: Force cleanup
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
./start_all.sh
```

### Service Not Starting

**Backend issues:**
```bash
# Check logs
tail -50 backend.log

# Verify virtual environment
ls -la .venv/bin/python

# Reinstall dependencies
.venv/bin/pip install -r backend/requirements.txt

# Verify .env file
cat backend/.env
```

**Frontend issues:**
```bash
# Check logs
tail -50 frontend.log

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..

# Verify .env file
cat frontend/.env
```

### Service Running But Not Responding

```bash
# Check status
./status.sh

# Verify processes
ps aux | grep uvicorn  # Backend
ps aux | grep vite     # Frontend

# Test connectivity
curl http://localhost:8000/health
curl http://localhost:5173

# Check PID files match
cat backend.pid && ps -p $(cat backend.pid)
cat frontend.pid && ps -p $(cat frontend.pid)
```

### Stale PID Files

The scripts automatically detect and clean stale PID files, but if needed:

```bash
# Manual cleanup
rm -f backend.pid frontend.pid
./start_all.sh
```

---

## 🎯 Best Practices

1. **Always use scripts** instead of manual `uvicorn` or `npm run dev` commands
2. **Check status first** with `./status.sh` before starting services
3. **Use `restart_all.sh`** after code changes for clean updates
4. **Monitor logs** during development: `tail -f backend.log frontend.log`
5. **Clean shutdown** at end of day with `./stop_all.sh`
6. **Check health** periodically: `curl http://localhost:8000/health`

---

## 📈 Performance Benefits

### Before (Manual Management)
- ❌ Manual port checking required
- ❌ Orphaned processes common
- ❌ Log output mixed with terminal
- ❌ No health verification
- ❌ Difficult to track running services

### After (Automated Scripts)
- ✅ Automatic port conflict detection
- ✅ Clean process tracking with PID files
- ✅ Organized logging to files
- ✅ Built-in health checks
- ✅ Real-time status monitoring
- ✅ Graceful shutdown handling
- ✅ One-command launch and stop

---

## 🔐 Security Notes

1. **PID Files**: Contain process IDs only, no sensitive data
2. **Log Files**: May contain authentication tokens - protect in production
3. **Process Owner**: Services run as current user, not root
4. **Port Binding**: Default localhost only, configure for production

---

## 🌐 Production Deployment

For production, consider:

1. **Systemd Services**: Convert scripts to systemd units
2. **Docker**: Containerize with Docker Compose
3. **Process Manager**: Use PM2 or supervisord
4. **Load Balancer**: Add nginx reverse proxy
5. **Monitoring**: Implement Prometheus/Grafana
6. **Logging**: Centralize with ELK or Loki

See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for details.

---

## 📚 Related Documentation

- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [PROCESS_MANAGEMENT.md](PROCESS_MANAGEMENT.md) - Detailed process management
- [CODE_OPTIMIZATION.md](CODE_OPTIMIZATION.md) - Performance optimizations
- [AUTHENTICATION.md](AUTHENTICATION.md) - Authentication system
- [README.md](../README.md) - Main project documentation

---

## 🆘 Getting Help

**Quick Diagnostics:**
```bash
./status.sh                    # What's running?
tail -50 backend.log frontend.log  # Any errors?
lsof -i :8000 -i :5173        # Port conflicts?
```

**Still stuck?**
1. Check troubleshooting sections in docs
2. Review log files for errors
3. Try clean restart: `./stop_all.sh && sleep 2 && ./start_all.sh`
4. Check GitHub issues: [github.com/SebaB90/gcs_dji_dock](https://github.com/SebaB90/gcs_dji_dock)

---

## ✅ Summary

The unified process management system provides:

- 🚀 **One-command startup**: `./start_all.sh`
- 📊 **Status monitoring**: `./status.sh`
- 🛑 **Clean shutdown**: `./stop_all.sh`
- 🔄 **Quick restart**: `./restart_all.sh`
- 📝 **Automatic logging**: `backend.log`, `frontend.log`
- 🔍 **Health checks**: Built-in verification
- 🛡️ **Error handling**: Graceful shutdown and recovery

**Result**: Professional-grade development experience with minimal effort! 🎉
