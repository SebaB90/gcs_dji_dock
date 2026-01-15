# 🌐 GCS DJI Dock - Network Access Guide

Complete guide for accessing the dashboard from multiple devices on your local network.

---

## 📋 Prerequisites

- All devices must be on the **same local network** (WiFi/Ethernet)
- Your server machine's firewall must allow incoming connections
- You need to know your server's IP address

---

## 🚀 Quick Setup (Automated)

The fastest way to enable network access:

```bash
./setup_network_access.sh
```

This script automatically:
- ✅ Detects your server's IP address
- ✅ Configures frontend for network access
- ✅ Opens firewall ports (8000, 5173)
- ✅ Provides access instructions
- ✅ Restarts services

After running, access from other devices:
```
http://YOUR_SERVER_IP:5173
```

---

## 🔧 Manual Setup Instructions

If you prefer manual configuration or the script doesn't work:

### Step 1: Find Your Server's IP Address

On your server machine (where the dashboard runs):

```bash
# Method 1 (simplest)
hostname -I | awk '{print $1}'

# Method 2 (detailed)
ip addr show | grep "inet " | grep -v 127.0.0.1

# Example output: 192.168.1.100
```

**Common IP address formats:**
- Home networks: `192.168.x.x` or `10.0.x.x`
- Office networks: `172.16.x.x` to `172.31.x.x`

📝 **Write down this IP address** - you'll need it for configuration.

---

### Step 2: Configure Frontend for Network Access

The frontend needs to be configured to accept connections from any IP address.

**Edit `frontend/vite.config.js`:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
    strictPort: true
  }
})
```

---

### Step 3: Configure Backend API URL

The frontend needs to know where to find the backend API when accessed from other devices.

**Create/Edit `frontend/.env.local`:**

```env
# Replace 192.168.1.100 with YOUR server's actual IP address
VITE_BACKEND_URL=http://192.168.1.100:8000
```

**Important:** 
- ✅ Use your **actual server IP** (from Step 1)
- ❌ Don't use `localhost` or `127.0.0.1` (only works on server machine)

---

### Step 4: Configure Firewall

Allow incoming connections on ports 8000 and 5173:

**For UFW (Ubuntu/Debian):**

```bash
sudo ufw allow 8000/tcp comment "GCS Backend"
sudo ufw allow 5173/tcp comment "GCS Frontend"
sudo ufw reload
sudo ufw status
```

**For firewalld (Fedora/RHEL/CentOS):**

```bash
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

**For iptables:**

```bash
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

---

### Step 5: Restart Services

Apply all changes:

```bash
./restart_all.sh
```

---

## 🌐 Access from Other Devices

Once configured, access the dashboard from any device on your network:

```
http://192.168.1.100:5173
```

Replace `192.168.1.100` with your **actual server IP** from Step 1.

### Login

Use the default credentials:
- **Username**: `fieldrobotics`
- **Password**: `FieldRobotics2025!GCS`

---

## ✅ Verification Checklist

Test connectivity from another device:

**1. Ping the server:**
```bash
ping 192.168.1.100
# Should receive replies
```

**2. Test backend API:**
```bash
curl http://192.168.1.100:8000/health
# Should return: {"status":"healthy","timestamp":"..."}
```

**3. Test frontend:**

Open a browser and navigate to:
```
http://192.168.1.100:5173
```

You should see the login screen.

**4. Test authentication:**

After logging in, try switching camera sources or creating a mission to verify full functionality.

---

## 📱 Mobile Access Example

**Scenario:** You want to access from your tablet/phone

1. **Connect device to same WiFi** as server
2. **Open browser** on mobile device
3. **Navigate to:** `http://192.168.1.100:5173`
4. **Login** with credentials
5. **Use the dashboard** - all features should work

---

## 🚨 Troubleshooting

### Problem: "Connection refused" or "Unable to connect"

**Check 1: Firewall**
```bash
# Verify ports are open
sudo ufw status | grep -E "8000|5173"
# or
sudo firewall-cmd --list-ports
```

**Check 2: Services running**
```bash
./status.sh
# Both services should show ✅ Running
```

**Check 3: Network connectivity**
```bash
# From client device, test backend
curl http://YOUR_SERVER_IP:8000/health

# Test frontend port
telnet YOUR_SERVER_IP 5173
```

**Check 4: Correct IP address**
```bash
# Verify server IP hasn't changed (DHCP)
hostname -I
```

---

### Problem: Frontend loads but "Network Error" when logging in

**Cause:** Frontend can't reach backend API

**Solution:** Check `frontend/.env.local`:
```env
VITE_BACKEND_URL=http://YOUR_SERVER_IP:8000
```

Must use server's IP, not `localhost`.

After changing, restart:
```bash
./restart_frontend.sh
```

---

### Problem: CORS errors in browser console

**Cause:** Backend CORS policy too restrictive

**Solution:** Edit `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local network
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then restart:
```bash
./restart_backend.sh
```

---

### Problem: Can access but features don't work

**Most Common Cause:** Not logged in on the other device

**Solution:**
1. Verify you're logged in (look for logout button in sidebar)
2. If not, login with credentials
3. Check browser console (F12) for errors

**Other Checks:**

1. **Check Network Configuration:**
```bash
cat frontend/.env.local
# Should show: VITE_BACKEND_URL=http://YOUR_SERVER_IP:8000
```

2. **Test Backend Connectivity:**

From the other device, open browser console (F12) and run:
```javascript
fetch('http://YOUR_SERVER_IP:8000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

3. **Check Authentication:**

After logging in, verify token exists:
```javascript
// In browser console (F12)
localStorage.getItem('gcs_token')
// Should show a JWT token
```

---

## 🔐 Security Considerations

### Local Network (Home/Office)

✅ **Safe for local networks** - devices on same WiFi/LAN

⚠️ **Firewall enabled** - only ports 8000 and 5173 open

### Public Internet (Not Recommended)

❌ **DO NOT expose directly to internet** without:
- HTTPS/SSL encryption
- Strong authentication
- VPN or secure tunnel
- Proper security hardening

---

## 🎯 Quick Reference

| What | Command/URL |
|------|-------------|
| **Find server IP** | `hostname -I \| awk '{print $1}'` |
| **Access frontend** | `http://YOUR_IP:5173` |
| **Access backend** | `http://YOUR_IP:8000` |
| **API docs** | `http://YOUR_IP:8000/docs` |
| **Test backend** | `curl http://YOUR_IP:8000/health` |
| **Open firewall** | `sudo ufw allow 8000/tcp && sudo ufw allow 5173/tcp` |
| **Restart all** | `./restart_all.sh` |

---

## 💡 Tips

1. **Static IP recommended:** Configure your router to assign a static IP to the server to prevent address changes

2. **Bookmark the URL:** On mobile devices, add to home screen for easy access

3. **QR Code:** Generate a QR code for `http://YOUR_IP:5173` for quick mobile access

4. **Router settings:** Some routers block device-to-device communication - check "AP Isolation" or "Client Isolation" settings (should be disabled)

5. **VPN access:** For remote access outside your network, set up a VPN instead of port forwarding

---

## 📊 Network Diagram

```
┌─────────────────────────────────────────┐
│         Your Local Network              │
│         (192.168.1.0/24)                │
│                                          │
│  ┌──────────────────┐                   │
│  │  Server PC       │                   │
│  │  192.168.1.100   │                   │
│  │                  │                   │
│  │  ┌────────────┐  │                   │
│  │  │ Backend    │  │  Port 8000        │
│  │  │ :8000      │◄─┼───────────────┐   │
│  │  └────────────┘  │               │   │
│  │                  │               │   │
│  │  ┌────────────┐  │               │   │
│  │  │ Frontend   │  │  Port 5173    │   │
│  │  │ :5173      │◄─┼───────┐       │   │
│  │  └────────────┘  │       │       │   │
│  └──────────────────┘       │       │   │
│                              │       │   │
│  ┌──────────────┐            │       │   │
│  │  Tablet      │            │       │   │
│  │  Browser     ├────────────┘       │   │
│  └──────────────┘                    │   │
│                                      │   │
│  ┌──────────────┐                    │   │
│  │  Phone       │                    │   │
│  │  Browser     ├────────────────────┘   │
│  └──────────────┘                        │
│                                          │
└─────────────────────────────────────────┘
```

---

## 📞 Support

If you encounter issues:

1. Check `./status.sh` - services running?
2. Review logs: `tail -f backend.log frontend.log`
3. Test from server first: `curl http://localhost:8000/health`
4. Then test from network: `curl http://YOUR_IP:8000/health`
5. Check firewall rules
6. Verify `.env.local` configuration

---

**Enjoy accessing your dashboard from any device on your network! 🌐✨**
