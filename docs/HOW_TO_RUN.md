# How to Run and Test Project Cygnus

## TL;DR - Fastest Way to Start

```bash
# One command to rule them all
npm install && make build-contracts && make deploy-testnet && cd dashboard && ./start.sh
```

Then open http://localhost:3000

---

## Detailed Instructions

### Prerequisites

You need:
- Node.js 20+
- Rust 1.75+
- Stellar CLI 21+

Check what you have:
```bash
node --version
cargo --version
stellar version
```

Install missing tools:
```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown

# Stellar CLI
cargo install --locked stellar-cli --features opt
```

---

## Running the Project

### Option 1: Quick Start (Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Setup Stellar account
stellar keys generate --global alice --network testnet
stellar keys fund alice --network testnet

# 3. Build and deploy
make build-contracts
make deploy-testnet

# 4. Start dashboard
cd dashboard
./start.sh
```

### Option 2: Step by Step

**Step 1: Install Dependencies**
```bash
npm install
```

**Step 2: Configure Stellar**
```bash
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

**Step 3: Create Account**
```bash
stellar keys generate --global alice --network testnet
stellar keys fund alice --network testnet
stellar keys balance alice --network testnet
```

**Step 4: Build Contracts**
```bash
make build-contracts
```

**Step 5: Run Tests**
```bash
npm test
```

**Step 6: Deploy**
```bash
make deploy-testnet
```

**Step 7: Start Dashboard**
```bash
cd dashboard
npm install
./start.sh
```

---

## Testing the Project

### Run All Tests
```bash
npm test
```

### Run Specific Tests
```bash
# XDR tests
npm test -- xdr

# Circuit breaker tests
npm test -- CircuitBreaker

# Contract tests
cd contracts && cargo test
```

### Watch Mode
```bash
npm run test:watch
```

### From Dashboard
1. Open http://localhost:3000
2. Click "Run Tests" button
3. View results in status message

---

## Using the Dashboard

### Access
Open http://localhost:3000 in your browser

### Features

**1. System Status (Top Cards)**
- Active agents count
- Deployed contracts
- Payment channels
- Transaction rate

**2. Performance Metrics (Left Panel)**
- Settlement finality
- Channel latency
- Error rate
- Visual progress bars

**3. Contract Status (Right Panel)**
- List of deployed contracts
- Contract addresses
- Invocation counts
- Deployment status

**4. Deployment Controls (Middle)**
- Build Contracts button
- Run Tests button
- Deploy to Testnet button
- Deploy to Docker button
- Deploy to Kubernetes button

**5. Log Viewer (Bottom)**
- Real-time logs
- Color-coded by severity
- Auto-scroll toggle
- Last 100 entries

### Dashboard Controls

**Build Contracts:**
```
Click "Build Contracts" → Wait for status → Check logs
```

**Run Tests:**
```
Click "Run Tests" → Wait for completion → View results
```

**Deploy:**
```
Click "Deploy to Testnet" → Monitor progress → Check status
```

---

## Deployment Options

### Local Development
```bash
# Start dashboard
cd dashboard
./start.sh
```

### Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Kubernetes
```bash
# Deploy
kubectl apply -f k8s/

# Check status
kubectl get all -n project-cygnus

# View logs
kubectl logs -f deployment/cygnus-agent -n project-cygnus

# Scale
kubectl scale deployment/cygnus-agent --replicas=5 -n project-cygnus
```

---

## Common Tasks

### Rebuild Everything
```bash
make clean
make build-contracts
npm run build
```

### Redeploy Contracts
```bash
make deploy-testnet
```

### Restart Dashboard
```bash
cd dashboard
# Press Ctrl+C to stop
./start.sh
```

### View Logs
```bash
# Dashboard logs (in browser)
Open http://localhost:3000 → Scroll to bottom

# Backend logs (in terminal)
cd dashboard
npm run server

# Contract deployment logs
make deploy-testnet
```

### Check Contract Status
```bash
# View in dashboard
Open http://localhost:3000 → Check "Smart Contracts" panel

# Or via CLI
cat .env | grep CONTRACT_ID
```

---

## Verification Checklist

After running, verify:

- [ ] Dashboard loads at http://localhost:3000
- [ ] Connection status shows "Connected" (green)
- [ ] Status cards show data (agents, contracts, etc.)
- [ ] Metrics update in real-time
- [ ] Contract status panel shows 3 contracts
- [ ] Logs stream continuously
- [ ] Build button works
- [ ] Test button works
- [ ] Deploy button works

---

## Troubleshooting

### Dashboard Issues

**Problem:** Dashboard won't start
```bash
# Solution: Kill processes and restart
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
cd dashboard && ./start.sh
```

**Problem:** WebSocket not connecting
```bash
# Solution: Restart backend
cd dashboard
npm run server
```

**Problem:** No data showing
```bash
# Solution: Check backend is running
curl http://localhost:3001/api/status
```

### Build Issues

**Problem:** Contract build fails
```bash
# Solution: Add WebAssembly target
rustup target add wasm32-unknown-unknown
make build-contracts
```

**Problem:** TypeScript build fails
```bash
# Solution: Clean and rebuild
npm run clean
npm run build
```

### Test Issues

**Problem:** Tests fail
```bash
# Solution: Ensure contracts are built
make build-contracts
npm test
```

**Problem:** Contract tests fail
```bash
# Solution: Update Rust
rustup update
cd contracts && cargo test
```

### Deployment Issues

**Problem:** Deployment fails
```bash
# Solution: Check account balance
stellar keys balance alice --network testnet

# If no funds
stellar keys fund alice --network testnet
```

**Problem:** Contract IDs not saved
```bash
# Solution: Check .env file exists
ls -la .env

# If missing
cp .env.example .env
make deploy-testnet
```

---

## Performance Monitoring

### Via Dashboard
1. Open http://localhost:3000
2. View "Performance Metrics" panel
3. Monitor:
   - Settlement finality (target: <5s)
   - Channel latency (target: <100ms)
   - Error rate (target: <5/min)

### Via Prometheus (if using Docker)
1. Open http://localhost:9090
2. Query metrics:
   - `cygnus_settlement_duration_seconds`
   - `cygnus_channel_latency_milliseconds`
   - `cygnus_errors_total`

### Via Grafana (if using Docker)
1. Open http://localhost:3000
2. Login: admin/admin
3. View "Cygnus Dashboard"

---

## Development Workflow

### Making Changes

1. **Edit Code**
   ```bash
   # Edit files in src/, agents/, protocols/, etc.
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Test**
   ```bash
   npm test
   ```

4. **Deploy**
   ```bash
   make deploy-testnet
   ```

5. **Verify**
   ```bash
   # Check dashboard for updates
   ```

### Adding New Features

1. **Write Code**
2. **Write Tests**
3. **Run Tests**: `npm test`
4. **Build**: `npm run build`
5. **Deploy**: `make deploy-testnet`
6. **Monitor**: Check dashboard

---

## Stopping Everything

### Stop Dashboard
```bash
# In terminal running dashboard
Press Ctrl+C
```

### Stop Docker
```bash
docker-compose down
```

### Stop Kubernetes
```bash
kubectl delete -f k8s/
```

### Clean Up
```bash
make clean
rm -rf node_modules
rm -rf dashboard/node_modules
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Install | `npm install` |
| Build | `make build-contracts` |
| Test | `npm test` |
| Deploy | `make deploy-testnet` |
| Dashboard | `cd dashboard && ./start.sh` |
| Clean | `make clean` |

| URL | Service |
|-----|---------|
| http://localhost:3000 | Dashboard |
| http://localhost:3001 | API |
| http://localhost:9090 | Prometheus |

---

## Getting Help

1. **Read Documentation**
   - [START_HERE.md](START_HERE.md) - Quick start
   - [GETTING_STARTED.md](GETTING_STARTED.md) - Detailed guide
   - [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Commands
   - [DASHBOARD_GUIDE.md](DASHBOARD_GUIDE.md) - Dashboard help

2. **Check Logs**
   - Dashboard log viewer
   - Terminal output
   - Browser console (F12)

3. **Verify Setup**
   - Run version checks
   - Check account balance
   - Verify network connectivity

---

## Success!

You should now have:
- Smart contracts built and deployed
- Dashboard running and connected
- Real-time monitoring active
- All tests passing

**Next:** Explore the dashboard, try deployments, and start building!

Open http://localhost:3000 to get started.
