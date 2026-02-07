# Project Cygnus Dashboard

A clean, professional web-based dashboard for monitoring, visualizing, and managing Project Cygnus deployments.

## Features

- **Real-time Monitoring**: Live system status, metrics, and logs via WebSocket
- **Performance Metrics**: Settlement finality, channel latency, and error rates
- **Contract Status**: Monitor deployed smart contracts and their activity
- **Deployment Controls**: Build, test, and deploy with one click
- **Log Viewer**: Real-time system logs with filtering and auto-scroll
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Quick Start

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Start the Backend Server

```bash
npm run server
```

The backend API will run on `http://localhost:3001`

### 3. Start the Frontend (in a new terminal)

```bash
npm run dev
```

The dashboard will open at `http://localhost:3000`

## Architecture

```
dashboard/
├── src/
│   ├── components/       # React components
│   │   ├── Header.jsx           # Top navigation bar
│   │   ├── StatusCards.jsx      # System status overview
│   │   ├── MetricsChart.jsx     # Performance metrics
│   │   ├── ContractStatus.jsx   # Smart contract monitoring
│   │   ├── DeploymentPanel.jsx  # Deployment controls
│   │   └── LogViewer.jsx        # Real-time logs
│   ├── App.jsx           # Main application
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── server/
│   └── index.js          # Express + WebSocket server
├── package.json
└── vite.config.js
```

## API Endpoints

### GET /api/status
Returns current system status:
```json
{
  "agents": { "active": 3, "total": 3 },
  "contracts": { "deployed": 3, "total": 3 },
  "channels": { "active": 5, "total": 10 },
  "transactions": { "count": 1247, "rate": 12 }
}
```

### GET /api/metrics
Returns performance metrics:
```json
{
  "settlement": [3200, 3400, 3100],
  "latency": [45, 52, 48],
  "errors": [2, 1, 3]
}
```

### GET /api/logs
Returns recent system logs (last 100 entries)

### GET /api/contracts
Returns smart contract status

### POST /api/build
Builds smart contracts
```bash
curl -X POST http://localhost:3001/api/build
```

### POST /api/test
Runs test suite
```bash
curl -X POST http://localhost:3001/api/test
```

### POST /api/deploy
Deploys to specified target
```bash
curl -X POST http://localhost:3001/api/deploy \
  -H "Content-Type: application/json" \
  -d '{"target": "testnet"}'
```

Supported targets: `testnet`, `docker`, `kubernetes`

## WebSocket Events

The dashboard uses WebSocket for real-time updates:

- **status**: System status updates
- **metrics**: Performance metrics updates
- **log**: New log entries

## Development

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Configuration

### Backend Port

Edit `dashboard/server/index.js`:
```javascript
const PORT = 3001; // Change this
```

### Frontend Proxy

Edit `dashboard/vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3001', // Change this
  },
}
```

## Customization

### Colors

Edit `dashboard/src/index.css`:
```css
:root {
  --primary: #4a90e2;
  --success: #27ae60;
  --warning: #f39c12;
  --danger: #e74c3c;
  --dark: #0a0e27;
  --card-bg: #1a1f3a;
  --border: #2a2f4a;
}
```

### Metrics Thresholds

Edit `dashboard/src/components/MetricsChart.jsx`:
```javascript
const getStatusColor = (value, threshold) => {
  if (value < threshold * 0.7) return 'var(--success)';
  if (value < threshold) return 'var(--warning)';
  return 'var(--danger)';
};
```

## Deployment

### Docker

Create `dashboard/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000 3001
CMD ["npm", "run", "server"]
```

Build and run:
```bash
docker build -t cygnus-dashboard .
docker run -p 3000:3000 -p 3001:3001 cygnus-dashboard
```

### Production Server

Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server/index.js --name cygnus-dashboard
pm2 startup
pm2 save
```

## Troubleshooting

### WebSocket Connection Failed

- Check that the backend server is running on port 3001
- Verify firewall settings allow WebSocket connections
- Check browser console for connection errors

### API Requests Failing

- Ensure backend server is running
- Check CORS configuration in `server/index.js`
- Verify API endpoint URLs in frontend code

### Build Commands Not Working

- Ensure you're running the dashboard from the project root
- Check that `make` commands are available
- Verify paths in `server/index.js` deployment commands

## License

MIT

## Support

For issues and questions, refer to the main Project Cygnus documentation.
