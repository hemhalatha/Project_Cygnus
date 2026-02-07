#!/bin/bash

# Project Cygnus - Development Environment Setup Script
# This script automates the setup process described in SETUP.md

set -e  # Exit on error

echo "🚀 Project Cygnus - Development Environment Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js v20+ from https://nodejs.org/"
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_status "Python installed: $PYTHON_VERSION"
else
    print_error "Python 3 not found. Please install Python 3.8+"
    exit 1
fi

# Check Rust/Cargo
if command_exists cargo; then
    CARGO_VERSION=$(cargo --version)
    print_status "Rust/Cargo installed: $CARGO_VERSION"
else
    print_warning "Rust/Cargo not found. Installing..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    print_status "Rust/Cargo installed successfully"
fi

# Add WebAssembly target
echo ""
echo "Adding WebAssembly target..."
rustup target add wasm32-unknown-unknown
print_status "WebAssembly target added"

# Check Stellar CLI
if command_exists stellar; then
    STELLAR_VERSION=$(stellar version)
    print_status "Stellar CLI installed: $STELLAR_VERSION"
else
    print_warning "Stellar CLI not found. Installing (this may take 10-15 minutes)..."
    cargo install --locked stellar-cli --features opt
    print_status "Stellar CLI installed successfully"
fi

# Install pnpm
echo ""
echo "Installing pnpm..."
if ! command_exists pnpm; then
    npm install -g pnpm
    print_status "pnpm installed"
else
    print_status "pnpm already installed"
fi

# Configure Stellar network
echo ""
echo "Configuring Stellar testnet..."
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015" 2>/dev/null || true
print_status "Stellar testnet configured"

# Generate keypair
echo ""
echo "Generating Stellar keypair..."
if stellar keys ls | grep -q "alice"; then
    print_warning "Keypair 'alice' already exists"
else
    stellar keys generate --global alice --network testnet
    print_status "Keypair 'alice' generated"
fi

# Fund account
echo ""
echo "Funding testnet account..."
stellar keys fund alice --network testnet 2>/dev/null || print_warning "Account may already be funded"
print_status "Account funded"

# Display public key
ALICE_PUBLIC=$(stellar keys address alice)
echo ""
echo "Your testnet public key: $ALICE_PUBLIC"

# Check balance
echo ""
echo "Checking account balance..."
BALANCE=$(stellar keys balance alice --network testnet 2>/dev/null || echo "Unable to fetch balance")
echo "Balance: $BALANCE"

# Create project directories
echo ""
echo "Creating project structure..."
mkdir -p contracts/{credit-scoring,loan,escrow}/src
mkdir -p agents/{runtime,plugins,characters}
mkdir -p protocols/{x402,x402-flash,masumi,sokosumi}
mkdir -p tools/{deploy,benchmark,testing}
mkdir -p docs
mkdir -p tests/{unit,property,integration}
mkdir -p src
print_status "Project directories created"

# Install Node.js dependencies
echo ""
echo "Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    pnpm install
    print_status "Dependencies installed"
else
    print_warning "package.json not found, skipping dependency installation"
fi

# Create .env file
echo ""
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    
    # Populate with generated keys
    ALICE_SECRET=$(stellar keys show alice)
    sed -i "s|AGENT_SECRET_KEY=|AGENT_SECRET_KEY=$ALICE_SECRET|" .env
    sed -i "s|AGENT_PUBLIC_KEY=|AGENT_PUBLIC_KEY=$ALICE_PUBLIC|" .env
    
    print_status ".env file created"
else
    print_warning ".env file already exists, skipping"
fi

# Create Python virtual environment
echo ""
echo "Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    print_status "Python virtual environment created"
else
    print_warning "Virtual environment already exists"
fi

# Summary
echo ""
echo "=================================================="
echo "✨ Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Review SETUP.md for detailed information"
echo "2. Activate Python venv: source venv/bin/activate"
echo "3. Start implementing tasks from ~/.kiro/specs/project-cygnus/tasks.md"
echo ""
echo "Quick verification:"
echo "  stellar version"
echo "  cargo --version"
echo "  node --version"
echo "  pnpm --version"
echo ""
echo "Your testnet account:"
echo "  Public Key: $ALICE_PUBLIC"
echo "  Balance: $BALANCE"
echo ""
echo "Happy building! 🚀"
