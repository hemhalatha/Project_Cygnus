# Project Cygnus - Deployment Guide

Complete guide for deploying Project Cygnus to various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: v20.0.0 or higher
- **npm**: v9.0.0 or higher
- **Docker**: v20.0.0 or higher (for Docker deployment)
- **Docker Compose**: v2.0.0 or higher (for Docker deployment)

### Optional

- **Rust**: v1.75+ (for contract development)
- **Soroban CLI**: Latest version (for Stellar contracts)
- **kubectl**: For Kubernetes deployment

## Local Development

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd Project_Cygnus

# Install dependencies
npm install
cd dashboard && npm install && cd ..

# Start the dashboard
cd dashboard
./start.sh
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend on `http://localhost:5173`

### Manual Start

```bash
# Terminal 1: Start backend
cd dashboard
npm run server

# Terminal 2: Start frontend
cd dashboard
npm run dev
```

### Running Tests

```bash
# Backend tests
npm test

# Dashboard tests
cd dashboard
npm test
```

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start
cd dashboard
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Manual Docker Build

```bash
# Build image
cd dashboard
docker build -t cygnus-dashboard .

# Run container
docker run -d \
  -p 3001:3001 \
  -p 5173:5173 \
  --name cygnus-dashboard \
  cygnus-dashboard
```

### Docker Health Check

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' cygnus-dashboard
```

## Production Deployment

### Build for Production

```bash
cd dashboard
./build.sh
```

This creates optimized production builds in `dashboard/dist/`.

### Deployment Options

#### Option 1: Node.js Server

```bash
# Build frontend
cd dashboard
npm run build

# Start backend (serves API and static files)
NODE_ENV=production npm run server
```

#### Option 2: Separate Static Hosting

1. Build frontend:
   ```bash
   cd dashboard
   npm run build
   ```

2. Deploy `dist/` folder to static hosting (Vercel, Netlify, S3, etc.)

3. Deploy backend separately:
   ```bash
   NODE_ENV=production npm run server
   ```

4. Update frontend to point to backend API URL

#### Option 3: Kubernetes

```bash
# Apply Kubernetes configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml

# Check deployment
kubectl get pods -n cygnus
kubectl logs -f deployment/cygnus-dashboard -n cygnus
```

### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/dashboard/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## Environment Configuration

### Development Environment

Create `dashboard/.env`:

```env
NODE_ENV=development
PORT=3001
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
LOG_LEVEL=debug
```

### Production Environment

Create `dashboard/.env`:

```env
NODE_ENV=production
PORT=3001
STELLAR_NETWORK=mainnet
STELLAR_HORIZON_URL=https://horizon.stellar.org
LOG_LEVEL=info

# Contract addresses
CREDIT_SCORING_CONTRACT=CXXX...
LOAN_CONTRACT=LXXX...
ESCROW_CONTRACT=EXXX...
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3001` | No |
| `STELLAR_NETWORK` | Stellar network | `testnet` | No |
| `STELLAR_HORIZON_URL` | Horizon API URL | testnet URL | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `CREDIT_SCORING_CONTRACT` | Contract address | - | Yes (prod) |
| `LOAN_CONTRACT` | Contract address | - | Yes (prod) |
| `ESCROW_CONTRACT` | Contract address | - | Yes (prod) |

## Monitoring and Logging

### Health Checks

```bash
# Check backend health
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2024-..."}
```

### Logs

```bash
# Docker logs
docker-compose logs -f

# Application logs (if using PM2)
pm2 logs cygnus-dashboard

# System logs
journalctl -u cygnus-dashboard -f
```

### Metrics

Access metrics at:
- System status: `http://localhost:3001/api/status`
- Performance metrics: `http://localhost:3001/api/metrics`
- Contract status: `http://localhost:3001/api/contracts`

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Docker Issues

```bash
# Remove all containers and rebuild
docker-compose down -v
docker-compose up -d --build

# Clear Docker cache
docker system prune -a
```

### Build Failures

```bash
# Clear caches
rm -rf node_modules package-lock.json
rm -rf dashboard/node_modules dashboard/package-lock.json

# Reinstall
npm install
cd dashboard && npm install
```

### Wallet Connection Issues

1. Ensure HTTPS is used in production
2. Check CORS configuration
3. Verify wallet extension is installed
4. Check browser console for errors

### Performance Issues

1. Enable production mode: `NODE_ENV=production`
2. Use CDN for static assets
3. Enable gzip compression
4. Implement caching strategies
5. Use load balancer for multiple instances

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Enable rate limiting
- [ ] Implement authentication for admin endpoints
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable security headers
- [ ] Regular security audits

## Scaling

### Horizontal Scaling

```bash
# Docker Compose with replicas
docker-compose up -d --scale dashboard=3
```

### Load Balancing

Use nginx or HAProxy to distribute traffic across multiple instances.

### Database

For production, consider adding:
- PostgreSQL for persistent data
- Redis for caching and sessions
- MongoDB for logs and metrics

## Backup and Recovery

### Backup

```bash
# Backup configuration
tar -czf cygnus-backup-$(date +%Y%m%d).tar.gz \
  dashboard/.env \
  dashboard/dist \
  deployment-info.json

# Backup Docker volumes
docker run --rm -v cygnus_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/volumes-backup.tar.gz /data
```

### Recovery

```bash
# Restore configuration
tar -xzf cygnus-backup-YYYYMMDD.tar.gz

# Restart services
docker-compose up -d
```

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: See `docs/` directory
- Email: support@projectcygnus.io

## License

MIT License - see LICENSE file for details
