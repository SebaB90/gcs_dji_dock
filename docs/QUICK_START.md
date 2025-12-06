# 🚀 Quick Start Guide - GCS DJI Dock

## One-Command Launch

```bash
# Clone and setup
git clone git@github.com:SebaB90/gcs_dji_dock.git
cd gcs_dji_dock

# Install dependencies
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd frontend && npm install && cd ..

# Launch everything!
./start_all.sh
```

That's it! 🎉

---

## 📋 Essential Commands

```bash
./start_all.sh      # 🚀 Start backend + frontend
./stop_all.sh       # 🛑 Stop everything
./restart_all.sh    # 🔄 Restart everything
./status.sh         # 📊 Check service status
```

---

## 🌐 Access Points

After running `./start_all.sh`:

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🔐 Default Login

```
Username: fieldrobotics
Password: FieldRobotics2025!GCS
```

---

## 📊 Monitoring

```bash
# Check status
./status.sh

# View logs
tail -f backend.log
tail -f frontend.log

# Health check
curl http://localhost:8000/health
```

---

## 🛠️ Individual Service Control

**Backend only:**
```bash
./start_backend.sh
./stop_backend.sh
./restart_backend.sh
```

**Frontend only:**
```bash
./start_frontend.sh
./stop_frontend.sh
./restart_frontend.sh
```

---

## 🚨 Common Issues

**Port already in use?**
```bash
./restart_all.sh  # Stops and restarts everything
```

**Service not responding?**
```bash
tail -50 backend.log   # Check backend logs
tail -50 frontend.log  # Check frontend logs
```

**Clean restart:**
```bash
./stop_all.sh
sleep 2
./start_all.sh
```

---

## 📁 Generated Files

Scripts create these files automatically:
- `backend.log` - Backend output
- `frontend.log` - Frontend output
- `backend.pid` - Backend process ID
- `frontend.pid` - Frontend process ID

---

## 🎯 Development Workflow

```bash
# Day 1: Initial setup
git clone ...
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd frontend && npm install && cd ..

# Every day: Quick start
./start_all.sh

# After code changes
./restart_all.sh

# End of day
./stop_all.sh
```

---

## ⚡ Pro Tips

1. **Check status anytime**: `./status.sh`
2. **Monitor both logs**: `tail -f backend.log frontend.log`
3. **Open in browser**: http://localhost:5173 (opens automatically after start)
4. **API testing**: http://localhost:8000/docs (Swagger UI)
5. **Quick health check**: `curl http://localhost:8000/health`

---

## 📚 Full Documentation

- [README.md](../README.md) - Complete project documentation
- [AUTHENTICATION.md](AUTHENTICATION.md) - Security and login system
- [PROCESS_MANAGEMENT.md](PROCESS_MANAGEMENT.md) - Advanced process management
- [CODE_OPTIMIZATION.md](CODE_OPTIMIZATION.md) - Performance improvements
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Deployment guide

---

## 🆘 Need Help?

**Service not starting?**
1. Run `./status.sh` to check what's running
2. Check logs: `tail -50 backend.log frontend.log`
3. Verify ports: `lsof -i :8000` and `lsof -i :5173`
4. Clean restart: `./stop_all.sh && sleep 2 && ./start_all.sh`

**Still having issues?**
- Check [Troubleshooting section](../README.md#-troubleshooting) in README
- Review [PROCESS_MANAGEMENT.md](PROCESS_MANAGEMENT.md) for detailed guides

---

## ✅ You're Ready!

Start coding and enjoy your GCS DJI Dock dashboard! 🚁
