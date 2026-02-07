#!/bin/bash

# Project Cygnus - Conda Environment Setup Script
# This script sets up a complete development environment in conda

set -e  # Exit on error

echo "=========================================="
echo "Project Cygnus - Environment Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if conda is available
if ! command -v conda &> /dev/null; then
    echo -e "${RED}Error: conda is not installed or not in PATH${NC}"
    echo "Please install Miniconda or Anaconda first"
    exit 1
fi

# Environment name
ENV_NAME="cygnus-dev"

echo -e "${GREEN}Step 1: Creating/Updating conda environment '${ENV_NAME}'${NC}"
echo ""

# Check if environment exists
if conda env list | grep -q "^${ENV_NAME} "; then
    echo "Environment '${ENV_NAME}' already exists. Updating..."
    conda activate ${ENV_NAME}
else
    echo "Creating new environment '${ENV_NAME}'..."
    conda create -n ${ENV_NAME} python=3.11 -y
    conda activate ${ENV_NAME}
fi

echo ""
echo -e "${GREEN}Step 2: Installing Node.js and npm via conda${NC}"
conda install -c conda-forge nodejs=20 -y

echo ""
echo -e "${GREEN}Step 3: Installing Rust toolchain${NC}"
echo "This will install Rust in your home directory (~/.cargo)"

# Check if Rust is already installed
if command -v rustc &> /dev/null; then
    echo "Rust is already installed: $(rustc --version)"
    echo "Updating Rust..."
    rustup update
else
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.75.0
    source "$HOME/.cargo/env"
fi

# Add wasm32 target for Soroban contracts
echo "Adding wasm32-unknown-unknown target..."
rustup target add wasm32-unknown-unknown

echo ""
echo -e "${GREEN}Step 4: Installing Stellar CLI (soroban)${NC}"
if command -v soroban &> /dev/null; then
    echo "Soroban CLI is already installed: $(soroban --version)"
else
    echo "Installing Soroban CLI..."
    cargo install --locked soroban-cli --features opt
fi

echo ""
echo -e "${GREEN}Step 5: Installing project npm dependencies${NC}"
npm install

echo ""
echo -e "${GREEN}Step 6: Generating Cargo.lock files for contracts${NC}"
for contract_dir in contracts/*/; do
    if [ -f "${contract_dir}Cargo.toml" ]; then
        echo "Generating Cargo.lock for ${contract_dir}..."
        (cd "${contract_dir}" && cargo generate-lockfile)
    fi
done

echo ""
echo -e "${GREEN}Step 7: Installing additional development tools${NC}"

# Install useful conda packages
conda install -c conda-forge \
    git \
    make \
    jq \
    -y

echo ""
echo -e "${GREEN}Step 8: Setting up environment variables${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo "Please edit .env file with your configuration"
    else
        echo "No .env.example found, skipping .env creation"
    fi
fi

echo ""
echo -e "${GREEN}Step 9: Building the project${NC}"
npm run build

echo ""
echo -e "${GREEN}Step 10: Running tests to verify setup${NC}"
npm test

echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Your conda environment '${ENV_NAME}' is ready!"
echo ""
echo "To activate the environment, run:"
echo -e "  ${YELLOW}conda activate ${ENV_NAME}${NC}"
echo ""
echo "Installed tools:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - Rust: $(rustc --version)"
echo "  - Cargo: $(cargo --version)"
if command -v soroban &> /dev/null; then
    echo "  - Soroban CLI: $(soroban --version)"
fi
echo ""
echo "Available commands:"
echo "  npm run dev          - Run development server"
echo "  npm run build        - Build the project"
echo "  npm test             - Run tests"
echo "  npm run lint         - Run linter"
echo "  npm run format       - Format code"
echo ""
echo "To deactivate the environment:"
echo -e "  ${YELLOW}conda deactivate${NC}"
echo ""
