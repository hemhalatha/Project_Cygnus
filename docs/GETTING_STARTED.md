# Getting Started with Project Cygnus

This guide will walk you through running and testing Project Cygnus from scratch.

## Prerequisites Check

First, verify you have the required tools installed:

```bash
# Check Node.js (need v20+)
node --version

# Check npm
npm --version

# Check Rust (need 1.75+)
rustc --version
cargo --version

# Check Stellar CLI
stellar version

# Check Python (need 3.8+)
python3 --version
```

If any are missing, see the installation section below.

## Quick Installation (If Needed)

### Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown
```

### Install Stellar CLI
```bash
cargo install --locked stellar-cli --features opt
```

### Install pnpm (optional but recommended)
```bash
npm install -g pnpm
```

## Step 1: Initial Setup

### 1.1 Install Project Dependencies

```bash
# Install Node.js dependencies
npm install

# Or with pnpm
pnpm install
```

### 1.2 Configure Stellar Network

```bash
# Add testnet configuration
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Verify configuration
stellar network ls
```

### 1.3 Create and Fund Test Account

```bash
# Generate a keypair
stellar keys generate --global alice --network testnet

# Get your public key
stellar keys address alice

# Fund the account (get free testnet XLM)
stellar keys fund alice --network testnet

# Check balance
stellar keys balance alice --network testnet
```

You should see 10,000 XLM in your testnet account.

### 1.4 Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your keys
nano .env
```

Add your keys:
```bash
STELLAR_NETWORK=testnet
AGENT_SECRET_KEY=<your-secret-key-from-stellar-keys>
```

## Step 2: Build Smart Contracts

### 2.1 Build All Contracts

```bash
# Build all three Soroban contracts
make build-contracts
```

This compiles:
- Credit Scoring Contract
- Loan Management Contract
- Escrow Contract

Expected output:
```
Building credit-scoring contract...
[OK] Credit scoring contract built
Building loan contract...
[OK] Loan contract built
Building escrow contract...
[OK] Escrow contract built
```

### 2.2 Check Contract Sizes

```bash
make check-sizes
```

This shows the compiled WASM file sizes.

## Step 3: Run Tests

### 3.1 Run TypeScript Tests

```bash
# Run all tests
npm test

# Or with pnpm
pnpm test
```

### 3.2 Run Contract Tests

```bash
# Test Rust contracts
cd contracts
cargo test --all

# Or use make
cd ..
make test-contracts
```

### 3.3 Run Specific Tests

```bash
# Run only XDR tests
npm test -- xdr

# Run only circuit breaker tests
npm test -- CircuitBreaker

# Run tests in watch mode
npm run test:watch
```

## Step 4: Deploy to Testnet

### 4.1 Deploy Contracts

```bash
# Deploy all contracts to testnet
make deploy-testnet
```

This will:
1. Build all contracts
2. Deploy to Stellar testnet
3. Save contract IDs to .env file

Expected output:
```
Deploying Project Cygnus contracts to Stellar testnet
[OK] Credit Scoring Contract deployed: CXXX...
[OK] Loan Contract deployed: LXXX...
[OK] Escrow Contract deployed: EXXX...
Deployment Complete!
```

### 4.2 Verify Deployment

Check your .env file for the contract IDs:
```bash
cat .env | grep CONTRACT_ID
```

## Step 5: Start the Dashboard

### 5.1 Quick Start (Automated)

```bash
cd dashboard
./start.sh
```

This will:
1. Install dashboard dependencies
2. Start the backend server (port 3001)
3. Start the frontend (port 3000)
4. Open in your browser

### 5.2 Manual Start (Alternative)

Terminal 1 - Backend:
```bash
cd dashboard
npm install
npm run server
```

Terminal 2 - Frontend:
```bash
cd dashboard
npm run dev
```

Then open http://localhost:3000 in your browser.

## Step 6: Using the Dashboard

### 6.1 Monitor System Status

The dashboard shows:
- Active agents
- Deployed contracts
- Payment channels
- Transaction throughput

### 6.2 View Performance Metrics

Monitor:
- Settlement finality (target: <5s)
- Channel latency (target: <100ms)
- Error rate (target: <5/min)

### 6.3 Deploy from Dashboard

Use the deployment panel to:
1. Click "Build Contracts" to rebuild
2. Click "Run Tests" to test
3. Click "Deploy to Testnet" to deploy
4. Watch the status messages

### 6.4 View Logs

The log viewer shows:
- Real-time system logs
- Color-coded by severity
- Auto-scroll option
- Last 100 entries

## Step 7: Run the Agent (Optional)

### 7.1 Start Agent Runtime

```bash
# Build TypeScript code
npm run build

# Run the agent
npm run dev
```

### 7.2 Monitor Agent Activity

Watch the dashboard for:
- Agent status changes
- Transaction activity
- Performance metrics
- System logs

## Common Commands Reference

### Building
```bash
make build              # Build everything
make build-contracts    # Build only contracts
make build-agents       # Build only TypeScript
npm run build          # Build TypeScript
```

### Testing
```bash
make test              # Run all tests
make test-contracts    # Test contracts only
npm test              # Test TypeScript
npm run test:watch    # Watch mode
```

### Deployment
```bash
make deploy-testnet    # Deploy to testnet
docker-compose up -d   # Deploy with Docker
kubectl apply -f k8s/  # Deploy to Kubernetes
```

### Cleaning
```bash
make clean             # Clean all build artifacts
npm run clean         # Clean TypeScript build
```

### Dashboard
```bash
cd dashboard
./start.sh            # Start dashboard (automated)
npm run server        # Start backend only
npm run dev           # Start frontend only
```

## Troubleshooting

### Issue: "stellar: command not found"

**Solution**: Install Stellar CLI
```bash
cargo install --locked stellar-cli --features opt
```

### Issue: "cargo: command not found"

**Solution**: Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Issue: Contract build fails

**Solution**: Add WebAssembly target
```bash
rustup target add wasm32-unknown-unknown
```

### Issue: Account funding fails

**Solution**: Use web interface
- Go to https://laboratory.stellar.org/#account-creator?network=test
- Enter your public key
- Click "Get test network lumens"

### Issue: Tests fail

**Solution**: Ensure contracts are built first
```bash
make build-contracts
npm test
```

### Issue: Dashboard won't start

**Solution**: Check ports are available
```bash
# Kill processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Try again
cd dashboard
./start.sh
```

### Issue: WebSocket not connecting

**Solution**: Ensure backend is running
```bash
# Check if backend is running
curl http://localhost:3001/api/status

# If not, start it
cd dashboard
npm run server
```

## Testing Checklist

Use this checklist to verify everything works:

### Basic Setup
- [ ] Node.js installed and working
- [ ] Rust and Cargo installed
- [ ] Stellar CLI installed
- [ ] Dependencies installed (`npm install`)
- [ ] Testnet account created and funded

### Smart Contracts
- [ ] Contracts build successfully (`make build-contracts`)
- [ ] Contract tests pass (`make test-contracts`)
- [ ] Contracts deploy to testnet (`make deploy-testnet`)
- [ ] Contract IDs saved to .env

### TypeScript Code
- [ ] TypeScript builds (`npm run build`)
- [ ] TypeScript tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)

### Dashboard
- [ ] Dashboard dependencies installed
- [ ] Backend server starts (`npm run server`)
- [ ] Frontend starts (`npm run dev`)
- [ ] Dashboard loads at http://localhost:3000
- [ ] WebSocket connects (green indicator)
- [ ] Status cards show data
- [ ] Metrics display correctly
- [ ] Logs stream in real-time

### Deployment
- [ ] Build button works
- [ ] Test button works
- [ ] Deploy to testnet works
- [ ] Status messages appear

## Next Steps

Once everything is running:

1. **Explore the Dashboard**
   - Monitor system metrics
   - View contract status
   - Check logs

2. **Run Deployments**
   - Try building contracts
   - Run the test suite
   - Deploy to different targets

3. **Customize**
   - Modify agent configurations
   - Adjust performance thresholds
   - Customize dashboard colors

4. **Develop**
   - Add new features
   - Write more tests
   - Extend functionality

## Getting Help

If you encounter issues:

1. **Check Documentation**
   - README.md - Project overview
   - SETUP.md - Detailed setup
   - QUICKSTART.md - Fast track
   - DASHBOARD_GUIDE.md - Dashboard help

2. **Check Logs**
   - Dashboard logs viewer
   - Terminal output
   - Browser console (F12)

3. **Verify Prerequisites**
   - Run version checks
   - Ensure all tools installed
   - Check network connectivity

4. **Common Solutions**
   - Restart services
   - Clear build artifacts (`make clean`)
   - Reinstall dependencies
   - Check firewall settings

## Success Indicators

You'll know everything is working when:

- All tests pass
- Contracts deploy successfully
- Dashboard shows "Connected" status
- Metrics update in real-time
- Logs stream continuously
- Deployment buttons work
- No errors in console

## Summary

To get started quickly:

```bash
# 1. Install dependencies
npm install

# 2. Setup Stellar
stellar keys generate --global alice --network testnet
stellar keys fund alice --network testnet

# 3. Build and test
make build-contracts
npm test

# 4. Deploy
make deploy-testnet

# 5. Start dashboard
cd dashboard
./start.sh
```

Then open http://localhost:3000 and start monitoring!

You're now ready to run and test Project Cygnus!
