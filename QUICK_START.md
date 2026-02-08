# Project Cygnus - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Verify Setup
```bash
./verify-deployment.sh
```

### Step 2: Choose Deployment Method

#### Option A: Development (Fastest)
```bash
cd dashboard
./start.sh
```
Opens at: http://localhost:5173

#### Option B: Docker (Recommended)
```bash
cd dashboard
docker-compose up -d
```

#### Option C: Production Build
```bash
cd dashboard
./build.sh
npm run server
```

### Step 3: Connect Wallet
1. Open the dashboard
2. Click "Connect Wallet" button in header
3. Choose Freighter or Albedo
4. Approve connection

## 📋 Common Commands

### Development
```bash
cd dashboard
npm run dev      # Start frontend
npm run server   # Start backend
./start.sh       # Start both
```

### Testing
```bash
npm test                  # Backend tests
cd dashboard && npm test  # Dashboard tests
```

### Docker
```bash
cd dashboard
docker-compose up -d      # Start
docker-compose logs -f    # View logs
docker-compose down       # Stop
```

### Health Check
```bash
curl http://localhost:3001/health
```

## 🔧 Configuration

Edit `dashboard/.env`:
```env
PORT=3001
NODE_ENV=development
STELLAR_NETWORK=testnet
```

## 📚 Documentation

- **DEPLOYMENT_GUIDE.md** - Full deployment guide
- **DEPLOYMENT_CHECKLIST.md** - Pre-deployment checklist
- **PRODUCTION_READY.md** - Production summary
- **READY_TO_DEPLOY.md** - Deployment instructions
- **COMPLETION_SUMMARY.md** - What was done

## 🆘 Troubleshooting

### Port in Use
```bash
lsof -i :3001
kill -9 <PID>
```

### Build Fails
```bash
rm -rf node_modules
npm install
```

### Docker Issues
```bash
docker-compose down -v
docker-compose up -d --build
```

## ✅ Verification Checklist

- [ ] Node.js v20+ installed
- [ ] Dependencies installed
- [ ] Tests passing
- [ ] Build successful
- [ ] Ports available (3001, 5173)
- [ ] Environment configured

## 🎯 What's Included

✅ Modern dark theme UI
✅ Wallet integration (Freighter/Albedo)
✅ Real-time metrics
✅ Docker deployment
✅ Production-ready server
✅ Comprehensive docs

## 🚀 Deploy Now!

```bash
# Quick start
cd dashboard && ./start.sh

# Production
cd dashboard && docker-compose up -d
```

**That's it! You're ready to go! 🎉**
