# Project Cygnus - Setup Guide

This guide will help you set up the complete development environment for Project Cygnus.

## Prerequisites

- **Conda/Miniconda** (recommended) or **Python 3.11+**
- **Git**
- **Sudo access** (for installing system dependencies)

## Quick Setup

We provide two setup scripts depending on your needs:

### Option 1: Conda Environment Setup (Recommended)

This option sets up everything in an isolated conda environment.

```bash
# 1. Create and activate conda environment
conda create -n cygnus-dev python=3.11
conda activate cygnus-dev

# 2. Run the setup script
./setup-conda-env.sh
```

### Option 2: Complete System Setup

This option installs system dependencies and sets up the environment. It will prompt for your sudo password.

```bash
# Run the complete setup script
./setup-with-sudo.sh
```

## What Gets Installed

Both scripts will install:

1. **Node.js 20** - JavaScript runtime
2. **npm** - Node package manager
3. **Rust 1.75+** - For Soroban smart contracts
4. **wasm32-unknown-unknown** - WebAssembly target for Rust
5. **Soroban CLI** - Stellar smart contract development tools
6. **Project dependencies** - All npm and cargo packages
7. **Build tools** - make, cmake, pkg-config, etc.

## Manual Setup

If you prefer to set up manually:

### 1. Install Node.js

```bash
# Via conda (recommended)
conda install -c conda-forge nodejs=20

# Or download from https://nodejs.org/
```

### 2. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown
```

### 3. Install Soroban CLI

```bash
cargo install --locked soroban-cli --features opt
```

### 4. Install Project Dependencies

```bash
# Install npm packages
npm install

# Generate Cargo.lock files for contracts
cd contracts/credit-scoring && cargo generate-lockfile && cd ../..
cd contracts/loan && cargo generate-lockfile && cd ../..
cd contracts/escrow && cargo generate-lockfile && cd ../..
```

### 5. Build the Project

```bash
npm run build
```

### 6. Run Tests

```bash
npm test
```

## Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   ```bash
   nano .env  # or use your preferred editor
   ```

## Verifying Installation

Check that all tools are installed correctly:

```bash
# Check Node.js
node --version  # Should be v20.x.x

# Check npm
npm --version   # Should be 10.x.x

# Check Rust
rustc --version # Should be 1.75.x or higher

# Check Cargo
cargo --version # Should be 1.75.x or higher

# Check Soroban
soroban --version

# Check wasm32 target
rustup target list | grep wasm32-unknown-unknown
```

## Development Workflow

### TypeScript Development

```bash
# Start development mode with watch
npm run dev

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```

### Smart Contract Development

```bash
# Navigate to a contract
cd contracts/credit-scoring

# Build the contract
cargo build --release --target wasm32-unknown-unknown

# Run contract tests
cargo test

# Deploy to testnet (requires Soroban CLI)
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/credit_scoring.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet
```

### Running the Dashboard

```bash
cd dashboard
npm install
npm run dev
```

## Troubleshooting

### Rust Installation Issues

If Rust installation fails:
```bash
# Manually install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add to PATH
source $HOME/.cargo/env

# Add to your shell profile
echo 'source $HOME/.cargo/env' >> ~/.bashrc  # or ~/.zshrc
```

### Node.js Version Issues

If you have the wrong Node.js version:
```bash
# Using conda
conda install -c conda-forge nodejs=20

# Or use nvm
nvm install 20
nvm use 20
```

### Permission Issues

If you get permission errors:
```bash
# Fix npm permissions
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Soroban CLI Installation Issues

If Soroban installation fails:
```bash
# Try installing with specific version
cargo install --locked soroban-cli@20.0.0 --features opt

# Or install from source
git clone https://github.com/stellar/soroban-cli
cd soroban-cli
cargo install --path .
```

## Conda Environment Management

```bash
# Activate environment
conda activate cygnus-dev

# Deactivate environment
conda deactivate

# List environments
conda env list

# Remove environment (if needed)
conda env remove -n cygnus-dev

# Export environment
conda env export > environment.yml

# Create from exported environment
conda env create -f environment.yml
```

## CI/CD Integration

The project uses GitHub Actions for CI/CD. The workflow automatically:

1. Runs linting and formatting checks
2. Executes all tests
3. Builds TypeScript and Rust contracts
4. Creates Docker images
5. Deploys to staging/production

See `.github/workflows/ci.yml` for details.

## Additional Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the error messages carefully
3. Check that all prerequisites are installed
4. Ensure you're in the correct conda environment
5. Try running the setup script again

## Next Steps

After setup is complete:

1. Read the [README.md](../README.md) for project overview
2. Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions
3. Review the [API documentation](../docs/) (if available)
4. Start developing!
