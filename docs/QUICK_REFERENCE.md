# Project Cygnus - Quick Reference

## One-Line Quick Start

```bash
npm install && make build-contracts && make deploy-testnet && cd dashboard && ./start.sh
```

## Essential Commands

### Setup
```bash
npm install                          # Install dependencies
stellar keys generate --global alice # Create account
stellar keys fund alice             # Fund with testnet XLM
```

### Build
```bash
make build-contracts                # Build smart contracts
npm run build                       # Build TypeScript
make build                          # Build everything
```

### Test
```bash
npm test                            # Run all tests
make test-contracts                 # Test contracts
npm run test:watch                  # Watch mode
```

### Deploy
```bash
make deploy-testnet                 # Deploy to Stellar testnet
docker-compose up -d                # Deploy with Docker
kubectl apply -f k8s/               # Deploy to Kubernetes
```

### Dashboard
```bash
cd dashboard && ./start.sh          # Start dashboard (auto)
npm run server                      # Backend only
npm run dev                         # Frontend only
```

### Clean
```bash
make clean                          # Clean all artifacts
npm run clean                       # Clean TypeScript build
```

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Dashboard Frontend | 3000 | http://localhost:3000 |
| Dashboard Backend | 3001 | http://localhost:3001 |
| Agent API | 3402 | http://localhost:3402 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3000 | http://localhost:3000 |

## File Locations

| Item | Location |
|------|----------|
| Smart Contracts | `contracts/` |
| TypeScript Source | `src/` |
| Agent Code | `agents/` |
| Protocols | `protocols/` |
| Tests | `tests/` |
| Dashboard | `dashboard/` |
| Config | `config/` |
| Scripts | `scripts/` |

## Environment Variables

```bash
STELLAR_NETWORK=testnet
AGENT_SECRET_KEY=<your-key>
CREDIT_SCORING_CONTRACT_ID=<contract-id>
LOAN_CONTRACT_ID=<contract-id>
ESCROW_CONTRACT_ID=<contract-id>
```

## Stellar CLI Commands

```bash
stellar keys generate --global <name>    # Generate keypair
stellar keys fund <name>                 # Fund account
stellar keys balance <name>              # Check balance
stellar keys address <name>              # Get public key
stellar contract deploy --wasm <file>    # Deploy contract
stellar contract invoke --id <id>        # Invoke contract
```

## Makefile Targets

```bash
make setup              # Initial setup
make build              # Build everything
make build-contracts    # Build contracts only
make build-agents       # Build TypeScript only
make test               # Run all tests
make test-contracts     # Test contracts
make test-agents        # Test TypeScript
make deploy-testnet     # Deploy to testnet
make clean              # Clean artifacts
make check-sizes        # Check contract sizes
make lint               # Run linter
make format             # Format code
```

## NPM Scripts

```bash
npm run build           # Build TypeScript
npm run dev             # Development mode
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:property   # Property-based tests
npm run lint            # Run ESLint
npm run format          # Format with Prettier
npm run clean           # Clean build
```

## Dashboard API Endpoints

```bash
GET  /api/status        # System status
GET  /api/metrics       # Performance metrics
GET  /api/logs          # Recent logs
GET  /api/contracts     # Contract status
POST /api/build         # Build contracts
POST /api/test          # Run tests
POST /api/deploy        # Deploy to target
```

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| stellar not found | `cargo install --locked stellar-cli` |
| cargo not found | Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Port in use | `lsof -ti:3000 \| xargs kill -9` |
| Build fails | `rustup target add wasm32-unknown-unknown` |
| Tests fail | `make build-contracts` first |
| Dashboard won't start | Check Node.js version: `node --version` |

## Status Indicators

| Color | Meaning |
|-------|---------|
| Green | Operational |
| Yellow | Warning |
| Red | Critical |
| Blue | Informational |

## Performance Targets

| Metric | Target |
|--------|--------|
| Settlement Finality | < 5 seconds |
| Channel Latency | < 100 ms |
| Error Rate | < 5 per minute |
| Agent Decision | < 1 second |

## Directory Structure

```
project-cygnus/
├── contracts/          # Soroban smart contracts (Rust)
├── agents/            # Agent implementations (TypeScript)
├── protocols/         # Protocol implementations
├── src/               # Core TypeScript code
├── tests/             # Test suites
├── dashboard/         # Monitoring dashboard
├── config/            # Configuration files
├── scripts/           # Utility scripts
├── k8s/               # Kubernetes manifests
├── monitoring/        # Prometheus/Grafana config
└── docs/              # Documentation
```

## Testing Quick Reference

```bash
# Run all tests
npm test

# Run specific test file
npm test -- xdr.test.ts

# Run tests matching pattern
npm test -- Circuit

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage

# Contract tests
cd contracts && cargo test

# Property-based tests
npm run test:property
```

## Docker Commands

```bash
# Build image
docker build -t project-cygnus .

# Run container
docker run -p 3402:3402 project-cygnus

# Docker Compose
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f      # View logs
docker-compose ps           # List services
```

## Kubernetes Commands

```bash
# Deploy
kubectl apply -f k8s/

# Check status
kubectl get all -n project-cygnus

# View logs
kubectl logs -f deployment/cygnus-agent -n project-cygnus

# Scale
kubectl scale deployment/cygnus-agent --replicas=5 -n project-cygnus

# Delete
kubectl delete -f k8s/
```

## Git Workflow

```bash
# Clone repository
git clone <repo-url>
cd Project_Cygnus

# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "Add feature"

# Push changes
git push origin feature/my-feature
```

## Useful Aliases (Optional)

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias cygnus-build='make build-contracts'
alias cygnus-test='npm test'
alias cygnus-deploy='make deploy-testnet'
alias cygnus-dash='cd dashboard && ./start.sh'
alias cygnus-clean='make clean'
```

## Documentation Links

- [Getting Started](GETTING_STARTED.md) - Complete setup guide
- [Project Status](PROJECT_STATUS.md) - Current status
- [Dashboard Guide](DASHBOARD_GUIDE.md) - Dashboard usage
- [Setup Guide](SETUP.md) - Detailed setup
- [Quick Start](QUICKSTART.md) - Fast track
- [Deployment](DEPLOYMENT.md) - Deployment guide

## Support Resources

- **Documentation**: Check markdown files in root directory
- **Logs**: Dashboard log viewer or terminal output
- **Browser Console**: F12 for frontend errors
- **Backend Logs**: Check terminal running `npm run server`

## Version Requirements

| Tool | Minimum Version |
|------|----------------|
| Node.js | 20.0.0 |
| npm | 9.0.0 |
| Rust | 1.75.0 |
| Stellar CLI | 21.0.0 |
| Python | 3.8.0 |

## Quick Health Check

```bash
# Check all prerequisites
node --version && \
npm --version && \
cargo --version && \
stellar version && \
python3 --version && \
echo "All tools installed!"
```

## Emergency Reset

If everything breaks:

```bash
# Clean everything
make clean
rm -rf node_modules
rm -rf dashboard/node_modules
rm -rf target

# Reinstall
npm install
cd dashboard && npm install && cd ..

# Rebuild
make build-contracts
npm run build

# Redeploy
make deploy-testnet
```

## Success Checklist

- [ ] All tools installed
- [ ] Dependencies installed
- [ ] Contracts build successfully
- [ ] Tests pass
- [ ] Contracts deployed
- [ ] Dashboard running
- [ ] WebSocket connected
- [ ] Metrics updating

You're ready to go!
