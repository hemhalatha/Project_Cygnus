# Project Cygnus Backend Guide

## Overview

Project Cygnus is an autonomous agentic ecosystem on the Stellar blockchain that enables machine-to-machine commerce through autonomous trading, lending, and payment protocols.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Run the Autonomous Agent

```bash
# Start on testnet (recommended for development)
npm run dev start testnet

# Or start on mainnet (production)
npm run dev start mainnet
```

The agent service will:
- ✅ Start an HTTP server on port 3402
- ✅ Initialize the autonomous agent
- ✅ Begin monitoring for trading/lending opportunities
- ✅ Execute transactions autonomously within configured limits

## Available Commands

### Development

```bash
npm run dev              # Show system status
npm run dev status       # Show system status
npm run dev start        # Start autonomous agent (testnet)
npm run dev start testnet # Start on testnet
npm run dev start mainnet # Start on mainnet
npm run dev init testnet  # Initialize system only
```

### Production

```bash
npm run build            # Compile TypeScript
npm start                # Run compiled code
```

### Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:property    # Run property-based tests
```

## HTTP Endpoints

Once the agent service is running, the following endpoints are available:

### Health Check
```bash
curl http://localhost:3402/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### System Status
```bash
curl http://localhost:3402/status
```

Response:
```json
{
  "name": "Project Cygnus",
  "version": "0.7.0",
  "status": "running",
  "uptime": 123.45,
  "memory": {...},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Metrics (Prometheus Format)
```bash
curl http://localhost:3402/metrics
```

## Configuration

### Environment Variables

```bash
# HTTP server configuration
export PORT=3402          # Server port (default: 3402)
export HOST=0.0.0.0       # Server host (default: 0.0.0.0)

# Stellar network
export STELLAR_NETWORK=testnet  # testnet or mainnet
```

### Agent Configuration

The agent is configured in `src/cli.ts` with the following defaults:

```typescript
{
  characterFile: './agents/characters/example-trader.json',
  stellarNetwork: 'testnet',
  riskTolerance: 0.6,
  spendingLimits: {
    maxSingleTransaction: 1000,
    dailyLimit: 5000,
    weeklyLimit: 20000,
  }
}
```

### Network Configuration

Network-specific settings are in:
- `config/testnet.json` - Testnet configuration
- `config/mainnet.json` - Mainnet configuration

## Architecture

### Core Components

1. **Autonomous Agent** (`agents/AutonomousAgent.ts`)
   - Fully autonomous trading and lending agent
   - Integrates all protocols and decision-making logic

2. **Agent Runtime** (`agents/runtime/AgentRuntime.ts`)
   - Lifecycle management
   - Plugin coordination
   - State management

3. **Trading Manager** (`agents/logic/TradingManager.ts`)
   - Autonomous trading with escrow protection
   - Opportunity evaluation
   - Risk assessment

4. **Loan Negotiator** (`agents/logic/LoanNegotiator.ts`)
   - Autonomous lending/borrowing
   - Credit scoring integration
   - Loan management

5. **HTTP Server** (`src/server.ts`)
   - Health checks
   - Metrics export (Prometheus)
   - Status endpoints

### Protocols

- **X402** - Payment proof protocol (on-chain and channels)
- **X402 Flash** - Payment channel implementation
- **Masumi** - Decentralized identity (DIDs, VCs)
- **Sokosumi** - Agent coordination and discovery

### Smart Contracts

Located in `contracts/`:
- `loan/` - Loan management contract
- `escrow/` - Escrow protection contract
- `credit-scoring/` - Credit scoring contract

Build contracts:
```bash
cd contracts/loan && cargo build --release --target wasm32-unknown-unknown
cd contracts/escrow && cargo build --release --target wasm32-unknown-unknown
cd contracts/credit-scoring && cargo build --release --target wasm32-unknown-unknown
```

## Docker Deployment

### Build Image

```bash
sudo docker build -t project-cygnus .
```

### Run Container

```bash
sudo docker run -d \
  --name cygnus-agent \
  -p 3402:3402 \
  -e STELLAR_NETWORK=testnet \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/logs:/app/logs \
  project-cygnus
```

### Using Docker Compose

```bash
sudo docker-compose up -d
```

## Monitoring

### Logs

Logs are written to `./logs/` directory:
- `error.log` - Error logs
- `combined.log` - All logs

### Metrics

Prometheus metrics are available at `http://localhost:3402/metrics`

Example metrics:
- Transaction counts
- Success/failure rates
- Response times
- Memory usage
- Agent activity

## Troubleshooting

### Port Already in Use

```bash
# Change the port
PORT=3403 npm run dev start testnet
```

### Docker Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or use sudo
sudo docker build -t project-cygnus .
```

### Agent Not Starting

Check:
1. Network configuration in `config/`
2. Stellar network connectivity
3. Character file exists
4. Sufficient permissions for logs directory

## Development

### Project Structure

```
Project_Cygnus/
├── src/                    # TypeScript source
│   ├── stellar/           # Stellar SDK integration
│   ├── monitoring/        # Metrics and monitoring
│   ├── utils/             # Utilities
│   ├── config/            # Configuration management
│   ├── server.ts          # HTTP server
│   ├── agent-service.ts   # Agent service manager
│   └── cli.ts             # CLI entry point
├── agents/                # Autonomous agent logic
│   ├── runtime/          # Agent runtime
│   ├── logic/            # Decision-making logic
│   └── AutonomousAgent.ts
├── protocols/            # Protocol implementations
│   ├── x402/            # Payment proof protocol
│   ├── masumi/          # Identity protocol
│   └── sokosumi/        # Coordination protocol
├── contracts/           # Soroban smart contracts
│   ├── loan/
│   ├── escrow/
│   └── credit-scoring/
└── tests/              # Test suites

```

### Adding New Features

1. Implement logic in `agents/logic/`
2. Integrate in `agents/AutonomousAgent.ts`
3. Add tests in `tests/`
4. Update configuration if needed

## Support

For issues or questions:
- Check logs in `./logs/`
- Review configuration in `config/`
- Ensure Stellar network connectivity
- Verify smart contracts are deployed

## License

MIT
