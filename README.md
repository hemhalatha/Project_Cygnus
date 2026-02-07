# Project Cygnus - Machine Economy Stack

A multi-layered autonomous agentic ecosystem built on the Stellar blockchain that enables machine-to-machine commerce without human intermediaries.

## Architecture

Project Cygnus integrates six core protocol layers:

1. **Settlement Layer**: Stellar blockchain with SCP consensus, Soroban smart contracts, and XDR data representation
2. **Agent Orchestration**: ElizaOS framework for building autonomous AI agents with modular architecture
3. **Payment Protocol**: x402 HTTP-native payment handshake for machine-to-machine transactions
4. **Micropayment Scaling**: x402-Flash SDK with off-chain payment channels for sub-100ms latency
5. **Identity & Trust**: Masumi Network with DIDs, Verifiable Credentials, and NFT-based registry
6. **Agent Coordination**: Sokosumi protocol for service discovery, resource allocation, and agent coordination

## Features

- **Sub-100ms Payment Latency**: Off-chain payment channels for high-frequency micropayments
- **Autonomous Agents**: AI agents that transact, trade, lend, and manage credit independently
- **Credit-Based Risk Assessment**: Dynamic transaction limits based on credit scores
- **Autonomous Loan Negotiation**: Agents negotiate and execute loans via smart contracts
- **Safe Trading**: Escrow-protected transactions with delivery verification
- **Verifiable Identity**: W3C DID/VC standards for agent accountability
- **Gasless Operations**: Fee-sponsored transactions for seamless agent operations

## Project Structure

```
project-cygnus/
├── contracts/          # Soroban smart contracts (Rust)
│   ├── credit-scoring/ # Credit scoring contract
│   ├── loan/          # Loan management contract
│   └── escrow/        # Escrow contract
├── agents/            # ElizaOS agent implementations (TypeScript)
│   ├── runtime/       # Agent runtime core
│   ├── plugins/       # Protocol plugins
│   └── characters/    # Agent character configurations
├── protocols/         # Protocol implementations (TypeScript)
│   ├── x402/         # x402 payment protocol
│   ├── x402-flash/   # x402-Flash payment channels
│   ├── masumi/       # Masumi identity management
│   └── sokosumi/     # Sokosumi coordination protocol
├── tools/            # Development tools and scripts (Python)
│   ├── deploy/       # Deployment scripts
│   ├── benchmark/    # Performance benchmarking
│   └── testing/      # Testing utilities
└── docs/             # Documentation

```

## Prerequisites

### Required Tools

1. **Node.js** (v23+) - Required for TypeScript development
2. **Python 3** - Required for tooling and scripts
3. **Rust and Cargo** - Required for Soroban contracts
4. **Stellar CLI** - Required for blockchain interaction

### Installation Instructions

#### Install Rust and Cargo

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown
```

#### Install Stellar CLI

```bash
cargo install --locked stellar-cli --features opt
```

Verify installation:
```bash
stellar version
```

#### Install Node.js Dependencies

```bash
npm install -g pnpm
pnpm install
```

## Quick Start

### 1. Environment Setup

```bash
# Configure Stellar CLI for testnet
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Generate a new Stellar keypair
stellar keys generate --global alice --network testnet

# Fund the account via Friendbot
stellar keys fund alice --network testnet
```

### 2. Deploy Smart Contracts

```bash
cd contracts/credit-scoring
stellar contract build
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/credit_scoring.wasm \
  --source alice \
  --network testnet
```

### 3. Run Agent

```bash
cd agents
pnpm install
pnpm run dev
```

## Development Workflow

1. **Smart Contracts First**: Implement and deploy Soroban contracts (Rust)
2. **Protocol Integration**: Build protocol handlers (TypeScript)
3. **Agent Logic**: Implement autonomous agent decision-making (TypeScript)
4. **Testing**: Run unit tests, property-based tests, and integration tests
5. **Benchmarking**: Verify performance targets (sub-100ms latency, 3-5s finality)

## Testing

```bash
# Run all tests
pnpm test

# Run property-based tests
pnpm test:property

# Run integration tests
pnpm test:integration

# Run contract tests
cd contracts && cargo test
```

## Performance Targets

- **Settlement Finality**: 3-5 seconds (Stellar SCP)
- **Payment Channel Latency**: <100ms (x402-Flash)
- **x402 Handshake**: <500ms
- **Agent Decision-Making**: <1 second

## Documentation

- [Requirements](~/.kiro/specs/project-cygnus/requirements.md)
- [Design](~/.kiro/specs/project-cygnus/design.md)
- [Implementation Tasks](~/.kiro/specs/project-cygnus/tasks.md)

## License

MIT

## Contributing

This project follows the spec-driven development methodology. See the implementation tasks for current work items.
