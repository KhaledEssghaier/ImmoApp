# Backend Startup Scripts

This directory contains PowerShell scripts to easily manage all backend services.

## 📜 Available Scripts

### 1. `start-all-simple.ps1` (Recommended)
Opens each service in a **separate terminal window** with its own logs.

**Usage:**
```powershell
.\start-all-simple.ps1
```

**Features:**
- ✅ Each service runs in its own window
- ✅ See logs for each service separately
- ✅ Easy to identify which service has issues
- ✅ Close individual windows to stop specific services

**To stop:** Close each terminal window or use `stop-all.ps1`

---

### 2. `start-all.ps1` (Advanced)
Starts all services as **background jobs** in a single terminal.

**Usage:**
```powershell
.\start-all.ps1
```

**Features:**
- ✅ All services in one terminal
- ✅ Shows status of all services
- ⚠️ Logs are not visible by default

**To view logs:**
```powershell
Receive-Job -Name "API-Gateway" -Keep
Receive-Job -Name "Auth-Service" -Keep
Receive-Job -Name "Property-Service" -Keep
Receive-Job -Name "Chat-Service" -Keep
Receive-Job -Name "Notification-Service" -Keep
```

**To stop:** Press `Ctrl+C` in the terminal

---

### 3. `stop-all.ps1`
Stops all running Node.js backend services.

**Usage:**
```powershell
.\stop-all.ps1
```

**Features:**
- ✅ Kills all Node.js processes
- ✅ Useful when services don't stop properly
- ⚠️ Will stop ALL Node.js processes on your system

---

## 🚀 Quick Start Guide

### First Time Setup
1. Make sure MongoDB Atlas is configured in all `.env` files
2. Make sure Redis is running (if using chat/notifications)
3. Install dependencies in each service:
   ```powershell
   cd api-gateway; npm install
   cd ../auth-service; npm install
   cd ../property-service; npm install
   cd ../chat-service; npm install
   cd ../notification-service; npm install
   ```

### Daily Development
```powershell
# Start all services (opens separate windows)
.\start-all-simple.ps1

# When done, stop all services
.\stop-all.ps1
```

---

## 📋 Service Ports

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 3000 | http://localhost:3000 |
| Auth Service | 3001 | http://localhost:3001 |
| Property Service | 3002 | http://localhost:3002 |
| Chat Service | 3005 | http://localhost:3005 |
| Notification Service | 3006 | http://localhost:3006 |

---

## 🔧 Troubleshooting

### Port Already in Use
If you get "port already in use" errors:
```powershell
# Stop all services
.\stop-all.ps1

# Check if ports are still in use
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3002
netstat -ano | findstr :3005
netstat -ano | findstr :3006

# If still occupied, kill the process manually
Stop-Process -Id <PID> -Force
```

### MongoDB Connection Issues
- Check your MongoDB Atlas connection string in `.env` files
- Verify your IP is whitelisted in MongoDB Atlas
- Test connection: https://cloud.mongodb.com

### Redis Connection Issues
- Make sure Redis is running: `redis-server`
- Or start with Docker: `docker run -d -p 6379:6379 redis:7-alpine`

### Service Won't Start
1. Check the service logs in its terminal window
2. Verify all dependencies are installed: `npm install`
3. Check `.env` file exists and is configured correctly
4. Try starting the service individually:
   ```powershell
   cd <service-directory>
   npm run start:dev
   ```

---

## 💡 Tips

- **Use `start-all-simple.ps1`** for daily development (easier to debug)
- **Use `start-all.ps1`** for production-like testing
- Always **stop services** with `stop-all.ps1` before shutting down
- Keep terminal windows organized by service name
- Check logs regularly for errors or warnings
