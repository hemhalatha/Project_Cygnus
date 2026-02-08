# Project Cygnus Dashboard

Modern, minimal, and analytical dashboard for monitoring and managing the Project Cygnus machine economy stack on Stellar blockchain.

## Features

- **Wallet Integration**: Connect Freighter or Albedo wallets
- **Real-time Monitoring**: Live metrics and transaction tracking
- **Agent Management**: Fund and manage autonomous agents
- **Contract Deployment**: Deploy and monitor smart contracts
- **Loan Management**: P2P lending interface
- **Trading Operations**: Execute trades through agents

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Express.js + WebSocket
- **Blockchain**: Stellar SDK
- **Styling**: Modern CSS with dark theme

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start both frontend and backend
./start.sh

# Or start separately:
npm run server  # Backend on port 3001
npm run dev     # Frontend on port 5173
```

### Production Build

```bash
# Build for production
./build.sh

# Or manually:
npm run build
npm run preview
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Environment Variables

Create a `.env` file in the dashboard directory:

```env
PORT=3001
NODE_ENV=production
STELLAR_NETWORK=testnet
```

## API Endpoints

### Backend Server (Port 3001)

- `GET /health` - Health check
- `GET /api/status` - System status
- `GET /api/metrics` - Performance metrics
- `GET /api/logs` - System logs
- `GET /api/contracts` - Contract status
- `POST /api/build` - Build contracts
- `POST /api/test` - Run tests
- `POST /api/deploy` - Deploy to target

### WebSocket

Connect to `ws://localhost:3001` for real-time updates:
- System status updates
- Metrics updates
- Log streaming

## Project Structure

```
dashboard/
├── src/
│   ├── components/      # React components
│   │   ├── Header.jsx
│   │   ├── StatusCards.jsx
│   │   ├── WalletConnector.jsx
│   │   └── ...
│   ├── services/        # Business logic
│   │   ├── WalletService.ts
│   │   ├── ContractService.ts
│   │   └── TransactionService.ts
│   ├── adapters/        # Wallet adapters
│   ├── types/           # TypeScript types
│   └── App.jsx          # Main app component
├── server/
│   └── index.js         # Backend server
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose config
└── package.json         # Dependencies
```

## Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Deployment

### Docker

The easiest way to deploy is using Docker:

```bash
docker-compose up -d
```

### Manual Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the backend:
   ```bash
   npm run server
   ```

3. Serve the built frontend using a static file server or reverse proxy (nginx, Apache, etc.)

### Environment Setup

For production deployment:

1. Set `NODE_ENV=production`
2. Configure proper CORS settings
3. Use HTTPS for wallet connections
4. Set up proper logging and monitoring

## Wallet Support

### Freighter

Browser extension wallet for Stellar. Install from:
https://www.freighter.app/

### Albedo

Web-based Stellar wallet. No installation required.
https://albedo.link/

## Troubleshooting

### Wallet Not Detected

- Ensure Freighter extension is installed and enabled
- Check browser console for errors
- Try refreshing the page

### Connection Issues

- Verify backend server is running on port 3001
- Check CORS configuration
- Ensure Stellar network is accessible

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`
- Check Node.js version (requires v20+)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
