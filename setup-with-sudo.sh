#!/bin/bash

# Project Cygnus - Complete Setup Script with System Dependencies
# This script will prompt for sudo password when needed

set -e  # Exit on error

echo "=========================================="
echo "Project Cygnus - Complete Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect OS
if [ -f /etc/arch-release ]; then
    OS="arch"
    PKG_MANAGER="pacman"
elif [ -f /etc/debian_version ]; then
    OS="debian"
    PKG_MANAGER="apt"
elif [ -f /etc/redhat-release ]; then
    OS="redhat"
    PKG_MANAGER="yum"
else
    OS="unknown"
fi

echo -e "${BLUE}Detected OS: ${OS}${NC}"
echo ""

# Check if running in conda environment
if [ -z "$CONDA_DEFAULT_ENV" ]; then
    echo -e "${YELLOW}Warning: Not running in a conda environment${NC}"
    echo "It's recommended to create and activate a conda environment first:"
    echo "  conda create -n cygnus-dev python=3.11"
    echo "  conda activate cygnus-dev"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}Running in conda environment: ${CONDA_DEFAULT_ENV}${NC}"
fi

echo ""
echo -e "${GREEN}Step 1: Installing system dependencies${NC}"
echo "This step requires sudo access..."
echo ""

case $OS in
    arch)
        echo "Installing packages via pacman..."
        sudo pacman -S --needed --noconfirm \
            base-devel \
            git \
            curl \
            wget \
            openssl \
            pkg-config \
            jq \
            make \
            cmake
        ;;
    debian)
        echo "Installing packages via apt..."
        sudo apt update
        sudo apt install -y \
            build-essential \
            git \
            curl \
            wget \
            libssl-dev \
            pkg-config \
            jq \
            make \
            cmake
        ;;
    redhat)
        echo "Installing packages via yum..."
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y \
            git \
            curl \
            wget \
            openssl-devel \
            pkg-config \
            jq \
            make \
            cmake
        ;;
    *)
        echo -e "${YELLOW}Unknown OS, skipping system package installation${NC}"
        echo "Please install build-essential, git, curl, openssl-dev, pkg-config manually"
        ;;
esac

echo ""
echo -e "${GREEN}Step 2: Installing/Updating Node.js${NC}"

if [ -n "$CONDA_DEFAULT_ENV" ]; then
    echo "Installing Node.js via conda..."
    conda install -c conda-forge nodejs=20 -y
else
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js not found and not in conda environment${NC}"
        echo "Please install Node.js 20+ manually or use conda"
        exit 1
    else
        echo "Node.js already installed: $(node --version)"
    fi
fi

echo ""
echo -e "${GREEN}Step 3: Installing Rust toolchain${NC}"

if command -v rustc &> /dev/null; then
    echo "Rust is already installed: $(rustc --version)"
    echo "Updating Rust..."
    rustup update stable
    rustup default stable
else
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.75.0
    source "$HOME/.cargo/env"
fi

# Ensure cargo is in PATH for this session
export PATH="$HOME/.cargo/bin:$PATH"

# Add wasm32 target
echo "Adding wasm32-unknown-unknown target..."
rustup target add wasm32-unknown-unknown

echo ""
echo -e "${GREEN}Step 4: Installing Stellar/Soroban CLI${NC}"

if command -v soroban &> /dev/null; then
    echo "Soroban CLI already installed: $(soroban --version)"
else
    echo "Installing Soroban CLI (this may take a few minutes)..."
    cargo install --locked soroban-cli --features opt
fi

echo ""
echo -e "${GREEN}Step 5: Installing project dependencies${NC}"

echo "Installing npm packages..."
npm install

echo ""
echo -e "${GREEN}Step 6: Setting up Rust contracts${NC}"

for contract_dir in contracts/*/; do
    if [ -f "${contract_dir}Cargo.toml" ]; then
        contract_name=$(basename "$contract_dir")
        echo "Setting up ${contract_name} contract..."
        (cd "${contract_dir}" && cargo generate-lockfile && cargo fetch)
    fi
done

echo ""
echo -e "${GREEN}Step 7: Creating environment configuration${NC}"

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Created .env file from .env.example"
        echo -e "${YELLOW}Please edit .env with your configuration${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Step 8: Building the project${NC}"

echo "Building TypeScript..."
npm run build

echo ""
echo -e "${GREEN}Step 9: Running tests${NC}"

echo "Running test suite..."
npm test

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Environment Summary:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - Rust: $(rustc --version)"
echo "  - Cargo: $(cargo --version)"
if command -v soroban &> /dev/null; then
    echo "  - Soroban: $(soroban --version)"
fi
if [ -n "$CONDA_DEFAULT_ENV" ]; then
    echo "  - Conda env: ${CONDA_DEFAULT_ENV}"
fi
echo ""
echo "Available commands:"
echo "  ${YELLOW}npm run dev${NC}          - Start development server"
echo "  ${YELLOW}npm run build${NC}        - Build the project"
echo "  ${YELLOW}npm test${NC}             - Run tests"
echo "  ${YELLOW}npm run lint${NC}         - Run linter"
echo "  ${YELLOW}npm run format${NC}       - Format code"
echo ""
echo "Rust contract commands:"
echo "  ${YELLOW}cd contracts/<name>${NC}  - Navigate to contract"
echo "  ${YELLOW}cargo build --release --target wasm32-unknown-unknown${NC}"
echo "  ${YELLOW}cargo test${NC}           - Run contract tests"
echo ""
