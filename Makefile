.PHONY: help setup build test clean deploy

# Default target
help:
	@echo "Project Cygnus - Machine Economy Stack"
	@echo "======================================="
	@echo ""
	@echo "Available targets:"
	@echo "  setup          - Run development environment setup"
	@echo "  build          - Build all components"
	@echo "  build-contracts - Build Soroban smart contracts"
	@echo "  build-agents   - Build TypeScript agents"
	@echo "  test           - Run all tests"
	@echo "  test-contracts - Run contract tests"
	@echo "  test-agents    - Run agent tests"
	@echo "  test-property  - Run property-based tests"
	@echo "  deploy-testnet - Deploy contracts to testnet"
	@echo "  clean          - Clean build artifacts"
	@echo "  lint           - Run linters"
	@echo "  format         - Format code"

# Setup development environment
setup:
	@echo "Running setup script..."
	@bash scripts/setup.sh

# Build all components
build: build-contracts build-agents

# Build Soroban contracts
build-contracts:
	@echo "Building credit scoring contract..."
	@cd contracts/credit-scoring && cargo build --target wasm32-unknown-unknown --release
	@echo "Building loan contract..."
	@cd contracts/loan && cargo build --target wasm32-unknown-unknown --release
	@echo "Building escrow contract..."
	@cd contracts/escrow && cargo build --target wasm32-unknown-unknown --release
	@echo "✓ All contracts built successfully"

# Build TypeScript agents
build-agents:
	@echo "Building TypeScript components..."
	@pnpm run build
	@echo "✓ TypeScript build complete"

# Run all tests
test: test-contracts test-agents

# Run contract tests
test-contracts:
	@echo "Testing credit scoring contract..."
	@cd contracts/credit-scoring && cargo test
	@echo "Testing loan contract..."
	@cd contracts/loan && cargo test
	@echo "Testing escrow contract..."
	@cd contracts/escrow && cargo test

# Run agent tests
test-agents:
	@echo "Running TypeScript tests..."
	@pnpm test

# Run property-based tests
test-property:
	@echo "Running property-based tests..."
	@pnpm test:property

# Deploy contracts to testnet
deploy-testnet:
	@echo "Deploying contracts to Stellar testnet..."
	@bash scripts/deploy-testnet.sh

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist/
	@rm -rf contracts/*/target/
	@rm -rf node_modules/
	@echo "✓ Clean complete"

# Run linters
lint:
	@echo "Running linters..."
	@pnpm run lint
	@cd contracts/credit-scoring && cargo clippy
	@cd contracts/loan && cargo clippy
	@cd contracts/escrow && cargo clippy

# Format code
format:
	@echo "Formatting code..."
	@pnpm run format
	@cd contracts/credit-scoring && cargo fmt
	@cd contracts/loan && cargo fmt
	@cd contracts/escrow && cargo fmt
	@echo "✓ Code formatted"

# Install dependencies
install:
	@echo "Installing dependencies..."
	@pnpm install
	@echo "✓ Dependencies installed"

# Run development server
dev:
	@echo "Starting development server..."
	@pnpm run dev

# Check contract sizes
check-sizes:
	@echo "Checking contract sizes..."
	@ls -lh contracts/credit-scoring/target/wasm32-unknown-unknown/release/*.wasm 2>/dev/null || echo "Credit scoring contract not built"
	@ls -lh contracts/loan/target/wasm32-unknown-unknown/release/*.wasm 2>/dev/null || echo "Loan contract not built"
	@ls -lh contracts/escrow/target/wasm32-unknown-unknown/release/*.wasm 2>/dev/null || echo "Escrow contract not built"

# Optimize contracts
optimize-contracts:
	@echo "Optimizing contracts with wasm-opt..."
	@which wasm-opt || (echo "wasm-opt not found. Install with: cargo install wasm-opt" && exit 1)
	@wasm-opt -Oz contracts/credit-scoring/target/wasm32-unknown-unknown/release/credit_scoring.wasm -o contracts/credit-scoring/target/wasm32-unknown-unknown/release/credit_scoring_opt.wasm
	@wasm-opt -Oz contracts/loan/target/wasm32-unknown-unknown/release/loan_contract.wasm -o contracts/loan/target/wasm32-unknown-unknown/release/loan_contract_opt.wasm
	@wasm-opt -Oz contracts/escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm -o contracts/escrow/target/wasm32-unknown-unknown/release/escrow_contract_opt.wasm
	@echo "✓ Contracts optimized"
