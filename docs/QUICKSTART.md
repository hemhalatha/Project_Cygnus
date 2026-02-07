# Project Cygnus - Quick Start Guide

Get up and running with Project Cygnus in minutes!

## Prerequisites Check

Ensure you have:
- Node.js v20+ installed
- Python 3.8+ installed
- Git installed
- 10GB free disk space

## One-Command Setup

Run the automated setup script:

```bash
bash scripts/setup.sh
```

This script will:
1. Install Rust and Cargo (if needed)
2. Install Stellar CLI
3. Configure Stellar testnet
4. Generate and fund a testnet account
5. Install Node.js dependencies
6. Create project structure
7. Set up environment variables

## Manual Setup (Alternative)

If you prefer manual setup, follow these steps:

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown
```

### 2. Install Stellar CLI

```bash
cargo install --locked stellar-cli --features opt
```

### 3. Configure Stellar Testnet

```bash
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

### 4. Create and Fund Account

```bash
stellar keys generate --global alice --network testnet
stellar keys fund alice --network testnet
```

### 5. Install Dependencies

```bash
npm install -g pnpm
pnpm install
```

### 6. Create Environment File

```bash
cp .env.example .env
# Edit .env with your keys
```

## Build and Deploy

### Build Smart Contracts

```bash
make build-contracts
```

This compiles all three Soroban contracts:
- Credit Scoring Contract
- Loan Contract
- Escrow Contract

### Deploy to Testnet

```bash
make deploy-testnet
```

Contract IDs will be automatically saved to your `.env` file.

### Build TypeScript Components

```bash
make build-agents
```

## Run Tests

```bash
# Run all tests
make test

# Run only contract tests
make test-contracts

# Run only agent tests
make test-agents

# Run property-based tests
make test-property
```

## Development Workflow

### 1. Start Development Server

```bash
make dev
```

### 2. Watch for Changes

```bash
pnpm run test:watch
```

### 3. Format Code

```bash
make format
```

### 4. Run Linters

```bash
make lint
```

## Project Structure Overview

```
project-cygnus/
├── contracts/              # Soroban smart contracts (Rust)
│   ├── credit-scoring/    # Credit scoring logic
│   ├── loan/              # Loan management
│   └── escrow/            # Escrow protection
├── agents/                # ElizaOS agents (TypeScript)
│   ├── runtime/           # Agent runtime core
│   ├── plugins/           # Protocol plugins
│   └── characters/        # Agent configurations
├── protocols/             # Protocol implementations
│   ├── x402/             # Payment protocol
│   ├── x402-flash/       # Payment channels
│   ├── masumi/           # Identity management
│   └── sokosumi/         # Coordination protocol
├── tools/                # Development tools
│   ├── deploy/           # Deployment scripts
│   ├── benchmark/        # Performance testing
│   └── testing/          # Test utilities
└── tests/                # Test suites
    ├── unit/             # Unit tests
    ├── property/         # Property-based tests
    └── integration/      # Integration tests
```

## Common Commands

```bash
# Setup environment
make setup

# Build everything
make build

# Run all tests
make test

# Deploy to testnet
make deploy-testnet

# Clean build artifacts
make clean

# Format code
make format

# Run linters
make lint

# Check contract sizes
make check-sizes

# Start dev server
make dev
```

## Verify Installation

Run these commands to verify everything is set up correctly:

```bash
# Check tools
stellar version
cargo --version
node --version
pnpm --version

# Check network configuration
stellar network ls

# Check account balance
stellar keys balance alice --network testnet

# Check contract builds
make check-sizes
```

## Next Steps

1. **Read the Documentation**
   - [Requirements](~/.kiro/specs/project-cygnus/requirements.md)
   - [Design](~/.kiro/specs/project-cygnus/design.md)
   - [Tasks](~/.kiro/specs/project-cygnus/tasks.md)

2. **Start Implementing**
   - Begin with Task 1.2: XDR serialization utilities
   - Follow the task list in order
   - Run tests after each task

3. **Join the Community**
   - Report issues on GitHub
   - Contribute improvements
   - Share your agents!

## Troubleshooting

### Stellar CLI Installation Fails

```bash
# Update Rust first
rustup update

# Try without optimizations
cargo install --locked stellar-cli
```

### Account Funding Fails

Try the web interface: https://laboratory.stellar.org/#account-creator?network=test

### Contract Build Fails

```bash
# Ensure WebAssembly target is installed
rustup target add wasm32-unknown-unknown

# Clean and rebuild
make clean
make build-contracts
```

### Tests Fail

```bash
# Ensure contracts are built
make build-contracts

# Ensure dependencies are installed
pnpm install

# Run tests with verbose output
pnpm test -- --reporter=verbose
```

## Getting Help

- **Documentation**: See `SETUP.md` for detailed setup instructions
- **Stellar Docs**: https://developers.stellar.org/
- **Soroban Docs**: https://soroban.stellar.org/
- **Issues**: Report bugs and request features on GitHub

## Quick Reference

### Environment Variables

Key variables in `.env`:
- `STELLAR_NETWORK`: Network to use (testnet/mainnet)
- `AGENT_SECRET_KEY`: Your agent's secret key
- `CREDIT_SCORING_CONTRACT_ID`: Deployed contract ID
- `LOAN_CONTRACT_ID`: Deployed contract ID
- `ESCROW_CONTRACT_ID`: Deployed contract ID

### Stellar CLI Commands

```bash
# Generate keypair
stellar keys generate --global <name> --network testnet

# Fund account
stellar keys fund <name> --network testnet

# Check balance
stellar keys balance <name> --network testnet

# Deploy contract
stellar contract deploy --wasm <path> --source <name> --network testnet

# Invoke contract
stellar contract invoke --id <contract-id> --source <name> --network testnet -- <function> <args>
```

## Success Indicators

You're ready to build when:
- `stellar version` works
- `cargo --version` works
- `make build-contracts` succeeds
- `make deploy-testnet` succeeds
- `make test` passes
- Account has testnet XLM balance

Happy building!
