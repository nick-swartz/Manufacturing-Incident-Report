# Deployment Guide

## Production Build Complete! ✅

Your application has been built and is ready for deployment.

## 📦 What Was Built

```
apps/backend/dist/          → Compiled Node.js server
apps/frontend/dist/         → Optimized static web files
packages/shared/dist/       → Shared types
```

---

## 🧪 Test Production Build Locally

Before deploying, test it locally:

```bash
# Stop development server (Ctrl+C if running)

# Set production environment
export NODE_ENV=production  # Mac/Linux
# OR
set NODE_ENV=production     # Windows CMD
# OR
$env:NODE_ENV="production"  # Windows PowerShell

# Run production server
cd apps/backend
node dist/server.js
```

**Access:** http://localhost:3001 (both frontend AND backend on same port!)

---

## 🚀 Deploy to Internal Server

### Prerequisites

- Windows or Linux server
- Node.js 18+ installed
- Access to copy files to server

### Step 1: Prepare Server

```bash
# On server, install Node.js
# Download from: https://nodejs.org (LTS version)

# Verify installation
node --version  # Should be 18+
npm --version
```

### Step 2: Copy Files to Server

**Option A: Using ZIP**
```bash
# On your computer
cd manufacturing-incident-system
zip -r incident-system-prod.zip apps package.json package-lock.json .env

# Copy to server via file share, USB, or SCP
# Then on server:
unzip incident-system-prod.zip
```

**Option B: Using Git** (if you have internal Git)
```bash
# On server
git clone [your-repo-url]
cd manufacturing-incident-system
```

### Step 3: Install Dependencies on Server

```bash
# On server
cd manufacturing-incident-system
npm install --production
```

### Step 4: Configure Environment

```bash
# Create/edit .env file on server
nano .env  # or use notepad/vim
```

Make sure these are set:
```env
NODE_ENV=production
PORT=3001
JIRA_URL=https://pingit.atlassian.net
JIRA_EMAIL=nicksw@ping.com
JIRA_API_TOKEN=your-token
JIRA_PROJECT_KEY=PHXMIS
TEAMS_WEBHOOK_URL=your-webhook
DATABASE_PATH=./data/incidents.db
UPLOAD_DIR=./uploads
```

### Step 5: Create Required Directories

```bash
mkdir -p data uploads
```

### Step 6: Run the Server

**Option A: Simple (stops when terminal closes)**
```bash
cd apps/backend
node dist/server.js
```

**Option B: PM2 (recommended - keeps running)**
```bash
# Install PM2 globally
npm install -g pm2

# Start server
cd manufacturing-incident-system
pm2 start apps/backend/dist/server.js --name incidents

# Make it start on server reboot
pm2 startup
pm2 save

# View logs
pm2 logs incidents

# Other useful PM2 commands
pm2 stop incidents
pm2 restart incidents
pm2 status
```

**Option C: Windows Service** (for Windows servers)
```bash
# Install node-windows
npm install -g node-windows

# Create service script (I can provide this)
```

### Step 7: Access the Application

```
Internal URL: http://server-name:3001
OR: http://server-ip-address:3001
```

### Step 8: Configure Firewall (if needed)

```bash
# Windows: Allow port 3001
netsh advfirewall firewall add rule name="Incident System" dir=in action=allow protocol=TCP localport=3001

# Linux: Allow port 3001
sudo ufw allow 3001/tcp
```

---

## 🌐 Optional: Set Up Domain Name

Instead of `http://server-ip:3001`, use a friendly name:

### Option 1: Internal DNS (ask IT)
```
incidents.yourcompany.com → server-ip:3001
```

### Option 2: Hosts File (temporary, per-computer)
```
# On each user's computer, edit:
# Windows: C:\Windows\System32\drivers\etc\hosts
# Mac/Linux: /etc/hosts

# Add line:
192.168.1.100   incidents
```
Then users can access: `http://incidents:3001`

---

## 🔒 Optional: Add HTTPS

### Using IIS (Windows Server)

1. Install IIS with URL Rewrite and ARR
2. Create reverse proxy:
```
https://incidents.company.com → http://localhost:3001
```
3. Install SSL certificate

### Using Nginx (Linux)

```nginx
server {
    listen 443 ssl;
    server_name incidents.company.com;

    ssl_certificate /path/to/cert.crt;
    ssl_certificate_key /path/to/cert.key;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 💾 Backup Strategy

### Automated Daily Backup Script

**Linux/Mac:**
```bash
#!/bin/bash
# save as backup.sh

BACKUP_DIR="/backups/incident-system"
DATE=$(date +%Y%m%d)

# Backup database
cp data/incidents.db "$BACKUP_DIR/incidents-$DATE.db"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" uploads/

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete
```

Run daily via cron:
```bash
0 2 * * * /path/to/backup.sh
```

**Windows:**
```batch
@echo off
REM save as backup.bat

set BACKUP_DIR=C:\Backups\IncidentSystem
set DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%

copy data\incidents.db "%BACKUP_DIR%\incidents-%DATE%.db"
```

Run daily via Task Scheduler.

---

## 📊 Monitoring

### Check if Server is Running

```bash
# Using PM2
pm2 status

# Using curl
curl http://localhost:3001/health
```

### View Logs

```bash
# PM2 logs
pm2 logs incidents

# Or direct log files (if configured)
tail -f logs/application.log
```

### Monitor Resource Usage

```bash
# PM2 monitoring
pm2 monit

# System resources
top  # Linux/Mac
taskmgr  # Windows
```

---

## 🔄 Updating the Application

When you make changes:

```bash
# 1. On your computer: Build new version
npm run build

# 2. Copy dist folders to server
# apps/backend/dist → server:/path/apps/backend/dist
# apps/frontend/dist → server:/path/apps/frontend/dist

# 3. On server: Restart
pm2 restart incidents

# OR if not using PM2
# Stop server (Ctrl+C)
# Start again: node dist/server.js
```

---

## 🆘 Troubleshooting

### Server won't start

**Check logs:**
```bash
pm2 logs incidents --lines 50
```

**Common issues:**
- Port 3001 already in use: Change PORT in .env
- Database error: Check DATABASE_PATH exists
- Jira connection: Verify JIRA_API_TOKEN

### Users can't access

**Check firewall:**
```bash
# Test from server itself
curl http://localhost:3001/health

# Test from user's computer
curl http://server-ip:3001/health
```

### Submissions failing

**Check Jira credentials:**
```bash
# View environment
pm2 env incidents

# Check logs for Jira errors
pm2 logs incidents | grep -i jira
```

---

## 📞 Support Checklist

Before contacting IT:

- [ ] Server IP/name: _______________
- [ ] Port number: 3001
- [ ] Can access from server? (curl localhost:3001/health)
- [ ] Can access from your computer? (browser)
- [ ] Firewall ports opened?
- [ ] PM2 status shows "online"?
- [ ] .env file configured correctly?
- [ ] Database file exists? (ls data/incidents.db)

---

## 🎯 Quick Reference

**Start:** `pm2 start apps/backend/dist/server.js --name incidents`
**Stop:** `pm2 stop incidents`
**Restart:** `pm2 restart incidents`
**Logs:** `pm2 logs incidents`
**Status:** `pm2 status`
**Backup:** `cp data/incidents.db backups/`

**Health Check:** http://localhost:3001/health
**Application:** http://localhost:3001

---

**Need help?** Reference this guide or contact your system administrator.
