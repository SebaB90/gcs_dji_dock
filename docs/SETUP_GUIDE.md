# 🚀 GCS DJI Dock - Complete Setup Guide

Complete guide for installing, configuring, and launching the GCS DJI Dock application.

---

## ⚡ Quick Start - 30 Seconds

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

✨ **Done!** Open http://localhost:5173

**Default Login:**
- Username: `fieldrobotics`
- Password: `FieldRobotics2025!GCS`

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

## 🔐 Authentication Setup

### Default Credentials

The application comes pre-configured with:
- **Username**: `fieldrobotics`
- **Password**: `FieldRobotics2025!GCS`

### Changing Credentials

Edit `backend/.env`:
```env
GCS_USERNAME=your_username
GCS_PASSWORD=your_password
GCS_FULLNAME=Your Full Name
GCS_EMAIL=your@email.com
```

Then restart the backend:
```bash
./restart_backend.sh
```

### JWT Configuration

The authentication system uses JWT tokens with these settings (in `backend/.env`):

```env
SECRET_KEY=gcs-dji-dock-super-secret-key-change-this-in-production-2025
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**⚠️ For Production:**
Generate a secure SECRET_KEY:
```bash
openssl rand -hex 32
```

---

## 🌐 Network Access Setup

To access the dashboard from other devices on your network (tablets, phones, other computers):

### Automatic Setup (Recommended)

```bash
./setup_network_access.sh
```

This script:
- ✅ Detects your server's IP address
- ✅ Configures the frontend for network access
- ✅ Opens firewall ports
- ✅ Provides access instructions

### Manual Setup

**1. Find Your Server's IP:**
```bash
hostname -I | awk '{print $1}'
# Example output: 192.168.1.100
```

**2. Configure Frontend:**

Create `frontend/.env.local`:
```env
VITE_BACKEND_URL=http://192.168.1.100:8000
```
(Replace with your actual server IP)

**3. Open Firewall Ports:**
```bash
sudo ufw allow 8000/tcp comment "GCS Backend"
sudo ufw allow 5173/tcp comment "GCS Frontend"
sudo ufw reload
```

**4. Restart Services:**
```bash
./restart_all.sh
```

**5. Access from Other Devices:**
```
http://192.168.1.100:5173
```

---

## 🖥️ Desktop Launcher (Optional)

Launch the application with a double-click from your desktop!

### Installation

```bash
./install_desktop_icons.sh
```

This creates:
- Desktop icon for launching the app
- Application menu entry
- GUI launcher with progress dialogs

### Using the Desktop Launcher

1. **Double-click** the "GCS DJI Dock" icon on your desktop
2. Click **"Trust"** or **"Allow"** if prompted
3. Watch the progress window
4. Browser automatically opens to login screen
5. To stop: Close the browser or run `./stop_all.sh`

---

## 📊 Monitoring & Logs

### Check Status
```bash
./status.sh
```

### View Logs
```bash
# Real-time monitoring
tail -f backend.log
tail -f frontend.log

# Both logs together
tail -f backend.log frontend.log

# Last 50 lines
tail -50 backend.log
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# With authentication token
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/telemetry
```

---

## 🚨 Troubleshooting

### Port Already in Use

**Quick fix:**
```bash
./restart_all.sh
```

**Manual fix:**
```bash
./stop_all.sh
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
./start_all.sh
```

### Service Not Starting

**Backend issues:**
```bash
# Check logs
tail -50 backend.log

# Verify dependencies
.venv/bin/pip install -r backend/requirements.txt

# Check .env file exists
cat backend/.env
```

**Frontend issues:**
```bash
# Check logs
tail -50 frontend.log

# Reinstall dependencies
cd frontend && npm install && cd ..
```

### Cannot Login

1. Verify backend is running: `./status.sh`
2. Check credentials in `backend/.env`
3. Check browser console for errors (F12)
4. Try: `curl http://localhost:8000/health`

### Network Access Not Working

1. Verify frontend configuration: `cat frontend/.env.local`
2. Check firewall: `sudo ufw status | grep -E "8000|5173"`
3. Test from other device: `curl http://YOUR_IP:8000/health`
4. Restart frontend after config changes: `./restart_frontend.sh`

---

## ✅ Production Deployment Checklist

Before deploying to production:

### Security
- [ ] Generate production SECRET_KEY: `openssl rand -hex 32`
- [ ] Set strong password (min 12 characters)
- [ ] Enable HTTPS
- [ ] Configure CORS properly (not `allow_origins=["*"]`)
- [ ] Review security settings

### Configuration
- [ ] Update all environment variables
- [ ] Set `ACCESS_TOKEN_EXPIRE_MINUTES` appropriately
- [ ] Configure production database
- [ ] Setup backup strategy

### Deployment
- [ ] Use production ASGI server (gunicorn + uvicorn)
- [ ] Setup reverse proxy (nginx/caddy)
- [ ] Configure systemd service or Docker
- [ ] Setup monitoring and logging
- [ ] Test all features

### Testing
- [ ] Login/logout flow
- [ ] All API endpoints
- [ ] Network access from multiple devices
- [ ] Session timeout
- [ ] Error scenarios

---

## 🎯 Development Workflow

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

---

## 📁 Generated Files

The scripts automatically create and manage:

| File | Purpose |
|------|---------|
| `backend.pid` | Backend process ID |
| `frontend.pid` | Frontend process ID |
| `backend.log` | Backend output logs |
| `frontend.log` | Frontend output logs |

**Note:** Don't edit these files manually.

---

## 🔧 Advanced Configuration

### Custom Port

Edit `start_backend.sh`:
```bash
PORT=8000  # Change to desired port
```

### Development Mode (Auto-reload)

```bash
cd backend
../.venv/bin/uvicorn app.main:app --reload --port 8000
```

### Adding Multiple Users

Edit `backend/app/main.py`:
```python
USERS_DB = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("admin_password"),
        "full_name": "Administrator",
        "email": "admin@company.com",
    },
    "operator": {
        "username": "operator",
        "hashed_password": pwd_context.hash("operator_password"),
        "full_name": "Operator User",
        "email": "operator@company.com",
    },
}
```

---

## 📚 Related Documentation

- [USER_GUIDE.md](USER_GUIDE.md) - Complete user guide for features
- [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation
- [NETWORK_GUIDE.md](NETWORK_GUIDE.md) - Detailed network setup
- [DEVELOPER_NOTES.md](DEVELOPER_NOTES.md) - Technical details for developers

---

## 🆘 Getting Help

**Quick Diagnostics:**
```bash
./status.sh                          # What's running?
tail -50 backend.log frontend.log    # Any errors?
lsof -i :8000 -i :5173              # Port conflicts?
```

**Still stuck?**
1. Check logs for errors
2. Verify configuration files
3. Try clean restart: `./stop_all.sh && sleep 2 && ./start_all.sh`
4. Review troubleshooting sections

---

**You're ready to start using your GCS DJI Dock dashboard! 🚁✨**
