# START HERE - Project Cygnus

## Welcome to Project Cygnus!

This is your starting point. Follow these steps in order.

---

## Step 1: Install Prerequisites (5 minutes)

Open a terminal and run these commands:

```bash
# Check what you have
node --version    # Need 20+
cargo --version   # Need 1.75+
stellar version   # Need 21+
```

**If anything is missing:**

```bash
# Install Rust (if needed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown

# Install Stellar CLI (if needed)
cargo install --locked stellar-cli --features opt

# Verify installations
cargo --version
stellar version
```

---

## Step 2: Setup Project (2 minutes)

```bash
# Install Node.js dependencies
npm install

# Setup Stellar testnet
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Create and fund test account
stellar keys generate --global alice --network testnet
stellar keys fund alice --network testnet

# Verify you have funds
stellar keys balance alice --network testnet
```

You should see: `10000.0000000 XLM`

---

## Step 3: Build & Test (3 minutes)

```bash
# Build smart contracts
make build-contracts

# Run tests
npm test
```

**Expected output:**
```
[OK] Credit scoring contract built
[OK] Loan contract built
[OK] Escrow contract built
Tests: 3 passed
```

---

## Step 4: Deploy (2 minutes)

```bash
# Deploy to Stellar testnet
make deploy-testnet
```

**Expected output:**
```
[OK] Credit Scoring Contract deployed: CXXX...
[OK] Loan Contract deployed: LXXX...
[OK] Escrow Contract deployed: EXXX...
Deployment Complete!
```

---

## Step 5: Start Dashboard (1 minute)

```bash
# Start the monitoring dashboard
cd dashboard
./start.sh
```

**Your browser will open to:** http://localhost:3000

You should see:
- System status cards
- Performance metrics
- Contract status
- Real-time logs

---

## Step 6: Verify Everything Works

In the dashboard:

1. **Check Connection Status** (top right)
   - Should show "Connected" in green

2. **View Status Cards** (top section)
   - Agents: 3/3
   - Contracts: 3/3
   - Channels: Active
   - Transactions: Counting

3. **Monitor Metrics** (left panel)
   - Settlement finality: ~3-4s
   - Channel latency: ~50ms
   - Error rate: <5/min

4. **Try Deployment** (middle section)
   - Click "Build Contracts"
   - Click "Run Tests"
   - Watch status messages

5. **View Logs** (bottom section)
   - Real-time log streaming
   - Color-coded by severity
   - Auto-scroll enabled

---

## You're Done!

Project Cygnus is now running. Here's what you can do next:

### Explore the Dashboard
- Monitor system performance
- View contract activity
- Check real-time logs
- Try deployment buttons

### Run Commands
```bash
# Build contracts
make build-contracts

# Run tests
npm test

# Deploy
make deploy-testnet

# Clean up
make clean
```

### Read Documentation
- [GETTING_STARTED.md](GETTING_STARTED.md) - Detailed guide
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command reference
- [DASHBOARD_GUIDE.md](DASHBOARD_GUIDE.md) - Dashboard help
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Project overview

---

## Quick Troubleshooting

### Dashboard won't start?
```bash
# Kill any processes on ports 3000/3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Try again
cd dashboard
./start.sh
```

### Tests failing?
```bash
# Rebuild contracts first
make build-contracts
npm test
```

### Deployment failing?
```bash
# Check your account has funds
stellar keys balance alice --network testnet

# If no funds, refund
stellar keys fund alice --network testnet
```

### WebSocket not connecting?
```bash
# Restart the backend
cd dashboard
npm run server
```

---

## Need Help?

1. **Check the logs** in the dashboard
2. **Read the documentation** (links above)
3. **Check browser console** (press F12)
4. **Verify prerequisites** are installed

---

## Summary

You've successfully:
- [x] Installed prerequisites
- [x] Setup the project
- [x] Built smart contracts
- [x] Ran tests
- [x] Deployed to testnet
- [x] Started the dashboard

**Project Cygnus is ready to use!**

Open http://localhost:3000 and start monitoring your autonomous machine economy.

---

## What's Running?

| Service | Port | Status |
|---------|------|--------|
| Dashboard Frontend | 3000 | Running |
| Dashboard Backend | 3001 | Running |
| Smart Contracts | Testnet | Deployed |
| WebSocket | 3001 | Connected |

---

## Next Steps

1. **Explore Features**
   - Try the deployment buttons
   - Monitor performance metrics
   - View real-time logs

2. **Customize**
   - Modify agent configurations
   - Adjust thresholds
   - Change dashboard colors

3. **Develop**
   - Add new features
   - Write more tests
   - Extend functionality

4. **Deploy to Production**
   - Use Docker: `docker-compose up -d`
   - Use Kubernetes: `kubectl apply -f k8s/`
   - See [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Congratulations! You're now running Project Cygnus.**

Happy building!
