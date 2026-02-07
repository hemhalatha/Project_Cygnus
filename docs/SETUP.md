# Development Environment Setup Guide

This guide walks you through setting up the complete development environment for Project Cygnus.

## System Requirements

- **OS**: Linux, macOS, or WSL2 on Windows
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 10GB free space

## Step-by-Step Installation

### 1. Install Rust and Cargo

Rust is required for building Soroban smart contracts.

```bash
# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow the prompts and select default installation

# Load Rust environment
source $HOME/.cargo/env

# Add WebAssembly target (required for Soroban)
rustup target add wasm32-unknown-unknown

# Verify installation
cargo --version
rustc --version
```

Expected output:
```
cargo 1.75.0 (or later)
rustc 1.75.0 (or later)
```

### 2. Install Stellar CLI

The Stellar CLI is the primary tool for interacting with the Stellar network and deploying Soroban contracts.

```bash
# Install Stellar CLI with optimizations
cargo install --locked stellar-cli --features opt

# This may take 10-15 minutes to compile
```

Verify installation:
```bash
stellar version
```

Expected output:
```
stellar-cli 21.x.x (or later)
```

### 3. Configure Stellar Network

```bash
# Add Stellar testnet configuration
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Verify network configuration
stellar network ls
```

### 4. Create and Fund Testnet Account

```bash
# Generate a new keypair for development
stellar keys generate --global alice --network testnet

# Display the public key
stellar keys address alice

# Fund the account using Friendbot (testnet faucet)
stellar keys fund alice --network testnet

# Verify account balance
stellar keys balance alice --network testnet
```

You should see a balance of 10,000 XLM (testnet tokens).

### 5. Install Node.js Dependencies

```bash
# Install pnpm (faster than npm)
npm install -g pnpm

# Verify installation
pnpm --version
```

### 6. Install Python Dependencies

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Linux/macOS
# or
venv\Scripts\activate  # On Windows

# Install dependencies (will be added as we build)
pip install --upgrade pip
```

### 7. Install Development Tools

```bash
# Install TypeScript globally
pnpm add -g typescript ts-node

# Install testing frameworks
pnpm add -g vitest

# Verify installations
tsc --version
vitest --version
```

## Project Initialization

### 1. Initialize Node.js Project

```bash
# Initialize package.json
pnpm init

# Install core dependencies
pnpm add typescript @types/node
pnpm add -D vitest @vitest/ui
pnpm add stellar-sdk @stellar/stellar-sdk
pnpm add fast-check  # Property-based testing
```

### 2. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 3. Create Project Structure

```bash
# Create directory structure
mkdir -p contracts/{credit-scoring,loan,escrow}
mkdir -p agents/{runtime,plugins,characters}
mkdir -p protocols/{x402,x402-flash,masumi,sokosumi}
mkdir -p tools/{deploy,benchmark,testing}
mkdir -p docs
mkdir -p tests/{unit,property,integration}
```

## Verification

Run these commands to verify your setup:

```bash
# Check Rust
cargo --version

# Check Stellar CLI
stellar version

# Check Node.js
node --version

# Check Python
python3 --version

# Check TypeScript
tsc --version

# Test Stellar connection
stellar network ls

# Check account balance
stellar keys balance alice --network testnet
```

## Troubleshooting

### Stellar CLI Installation Fails

If `cargo install stellar-cli` fails:

1. Update Rust: `rustup update`
2. Try without optimizations: `cargo install --locked stellar-cli`
3. Check system dependencies (build-essential on Linux, Xcode on macOS)

### Friendbot Funding Fails

If `stellar keys fund` fails:

1. Check network connectivity
2. Try the web interface: https://laboratory.stellar.org/#account-creator?network=test
3. Wait a few minutes and retry

### WebAssembly Target Missing

If contract compilation fails:

```bash
rustup target add wasm32-unknown-unknown
```

### Permission Errors

If you get permission errors during installation:

```bash
# Don't use sudo with cargo/rustup
# Instead, ensure ~/.cargo/bin is in your PATH
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## Next Steps

Once your environment is set up:

1. Review the [Requirements Document](~/.kiro/specs/project-cygnus/requirements.md)
2. Study the [Design Document](~/.kiro/specs/project-cygnus/design.md)
3. Start implementing tasks from [tasks.md](~/.kiro/specs/project-cygnus/tasks.md)

## Additional Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [Stellar CLI Reference](https://developers.stellar.org/docs/tools/developer-tools/cli)
- [ElizaOS Documentation](https://elizaos.github.io/eliza/)
- [x402 Protocol Specification](https://github.com/stellar/x402)

## Environment Variables

Create a `.env` file for configuration:

```bash
# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Agent Configuration
AGENT_SECRET_KEY=<your-secret-key>
AGENT_PUBLIC_KEY=<your-public-key>

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

**Important**: Never commit `.env` files to version control. Add to `.gitignore`:

```bash
echo ".env" >> .gitignore
echo "venv/" >> .gitignore
echo "node_modules/" >> .gitignore
echo "target/" >> .gitignore
echo "dist/" >> .gitignore
```

## Ready to Build!

Your development environment is now ready. Start with Task 1.1 in the implementation plan!
