# Project Cygnus Dashboard Guide

## Overview

The Project Cygnus Dashboard provides a clean, professional web interface for monitoring, visualizing, and managing your autonomous agent deployment.

## Features

### Real-time Monitoring
- Live system status updates via WebSocket
- Active agents, deployed contracts, payment channels
- Transaction throughput and rates

### Performance Metrics
- Settlement finality tracking (target: <5s)
- Payment channel latency (target: <100ms)
- Error rate monitoring (target: <5/min)
- Visual progress bars with color-coded status

### Smart Contract Status
- View all deployed contracts
- Monitor contract invocation counts
- Check deployment status
- Contract address display

### Deployment Controls
- Build contracts with one click
- Run test suite
- Deploy to testnet
- Deploy to Docker
- Deploy to Kubernetes
- Real-time deployment status feedback

### Log Viewer
- Real-time system logs
- Auto-scroll functionality
- Color-coded log levels (ERROR, WARN, INFO, DEBUG)
- Last 100 log entries displayed

## Quick Start

### Option 1: Automated Startup (Recommended)

```bash
cd dashboard
./start.sh
```

This will:
1. Install dependencies (if needed)
2. Start the backend server
3. Start the frontend
4. Open the dashboard in your browser

### Option 2: Manual Startup

Terminal 1 (Backend):
```bash
cd dashboard
npm install
npm run server
```

Terminal 2 (Frontend):
```bash
cd dashboard
npm run dev
```

Then open http://localhost:3000 in your browser.

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: Project Cygnus | Connection Status | Network   │
├─────────────────────────────────────────────────────────┤
│  Status Cards:                                          │
│  [Agents] [Contracts] [Channels] [Transactions]        │
├──────────────────────────┬──────────────────────────────┤
│  Performance Metrics     │  Smart Contract Status       │
│  - Settlement Finality   │  - Credit Scoring            │
│  - Channel Latency       │  - Loan Management           │
│  - Error Rate            │  - Escrow                    │
├──────────────────────────┴──────────────────────────────┤
│  Deployment & Operations                                │
│  [Build] [Test] [Deploy to Testnet/Docker/K8s]        │
├─────────────────────────────────────────────────────────┤
│  System Logs (Real-time)                               │
│  [Timestamp] [Level] [Message]                         │
└─────────────────────────────────────────────────────────┘
```

## Using the Dashboard

### Monitoring System Status

The status cards at the top show:
- **Active Agents**: Number of running agents vs total
- **Smart Contracts**: Deployed contracts vs total
- **Payment Channels**: Active channels
- **Transactions**: Total count and rate per minute

Color indicators:
- Green: All systems operational
- Yellow: Warning state
- Red: Critical issue
- Blue: Informational

### Viewing Performance Metrics

The metrics panel shows real-time performance:
- **Settlement Finality**: Time for transactions to finalize on Stellar
- **Channel Latency**: Off-chain payment channel response time
- **Error Rate**: Errors per minute

Each metric has:
- Current value
- Target threshold
- Visual progress bar
- Color-coded status

### Managing Deployments

Use the deployment panel to:

1. **Build Contracts**
   - Compiles all Soroban smart contracts
   - Shows build output and errors
   - Status: [OK] or [ERROR]

2. **Run Tests**
   - Executes the full test suite
   - Displays test results
   - Shows pass/fail status

3. **Deploy to Testnet**
   - Deploys contracts to Stellar testnet
   - Funds accounts via Friendbot
   - Updates contract IDs

4. **Deploy to Docker**
   - Starts Docker Compose stack
   - Launches all services
   - Includes monitoring stack

5. **Deploy to Kubernetes**
   - Applies K8s manifests
   - Creates namespace and resources
   - Configures auto-scaling

### Reading Logs

The log viewer shows:
- **Timestamp**: When the event occurred
- **Level**: ERROR, WARN, INFO, or DEBUG
- **Message**: Description of the event

Features:
- Auto-scroll toggle (keeps latest logs visible)
- Color-coded by severity
- Last 100 entries retained
- Real-time updates via WebSocket

## API Integration

The dashboard communicates with the backend via:

### REST API (HTTP)
- GET /api/status - System status
- GET /api/metrics - Performance metrics
- GET /api/logs - Recent logs
- GET /api/contracts - Contract status
- POST /api/build - Build contracts
- POST /api/test - Run tests
- POST /api/deploy - Deploy to target

### WebSocket (Real-time)
- ws://localhost:3001
- Receives live updates for status, metrics, and logs
- Connection status shown in header

## Customization

### Changing Colors

Edit `dashboard/src/index.css`:
```css
:root {
  --primary: #4a90e2;    /* Blue */
  --success: #27ae60;    /* Green */
  --warning: #f39c12;    /* Orange */
  --danger: #e74c3c;     /* Red */
}
```

### Adjusting Thresholds

Edit `dashboard/src/components/MetricsChart.jsx`:
```javascript
// Settlement finality threshold (ms)
const settlementThreshold = 5000;

// Channel latency threshold (ms)
const latencyThreshold = 100;

// Error rate threshold (per minute)
const errorThreshold = 5;
```

### Adding New Metrics

1. Update backend in `dashboard/server/index.js`:
```javascript
let metrics = {
  settlement: [],
  latency: [],
  errors: [],
  yourMetric: [], // Add here
};
```

2. Update frontend in `dashboard/src/components/MetricsChart.jsx`:
```javascript
// Add new metric display
```

## Troubleshooting

### Dashboard Won't Start

**Issue**: `npm install` fails
- Solution: Ensure Node.js 18+ is installed
- Run: `node --version`

**Issue**: Port 3000 or 3001 already in use
- Solution: Kill existing processes
- Run: `lsof -ti:3000 | xargs kill -9`
- Run: `lsof -ti:3001 | xargs kill -9`

### WebSocket Not Connecting

**Issue**: "Disconnected" status in header
- Check backend server is running
- Verify port 3001 is accessible
- Check browser console for errors

### Deployment Commands Fail

**Issue**: Build/deploy buttons show errors
- Ensure you're in the project root directory
- Verify `make` commands work from terminal
- Check that required tools are installed (Rust, Stellar CLI)

### No Real-time Updates

**Issue**: Metrics and logs not updating
- Check WebSocket connection status
- Verify backend server is running
- Check browser console for errors
- Try refreshing the page

## Production Deployment

### Using PM2

```bash
cd dashboard
npm install -g pm2
pm2 start server/index.js --name cygnus-dashboard
pm2 startup
pm2 save
```

### Using Docker

```bash
cd dashboard
docker build -t cygnus-dashboard .
docker run -d -p 3000:3000 -p 3001:3001 cygnus-dashboard
```

### Behind Nginx

```nginx
server {
    listen 80;
    server_name dashboard.projectcygnus.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

## Security Considerations

### Production Checklist

- [ ] Change default ports
- [ ] Add authentication middleware
- [ ] Enable HTTPS/WSS
- [ ] Restrict CORS origins
- [ ] Add rate limiting
- [ ] Implement API keys
- [ ] Use environment variables for secrets
- [ ] Enable audit logging
- [ ] Set up firewall rules
- [ ] Use reverse proxy (Nginx/Caddy)

### Authentication Example

Add to `dashboard/server/index.js`:
```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (token === 'Bearer YOUR_SECRET_TOKEN') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.use('/api', authMiddleware);
```

## Performance Tips

1. **Reduce Update Frequency**: Adjust intervals in `server/index.js`
2. **Limit Log Retention**: Keep fewer logs in memory
3. **Enable Compression**: Add gzip middleware
4. **Use CDN**: Serve static assets from CDN
5. **Optimize Bundle**: Run production build

## Support

For issues and questions:
- Check the main Project Cygnus documentation
- Review the dashboard README.md
- Check browser console for errors
- Verify backend logs for issues

## License

MIT - Same as Project Cygnus
