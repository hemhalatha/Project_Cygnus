# Project Cygnus - Deployment Guide

## Overview

This guide covers deploying Project Cygnus to various environments including Docker, Kubernetes, and cloud platforms.

## Prerequisites

- Docker 24.0+
- Kubernetes 1.28+
- kubectl configured
- Node.js 20+
- Rust 1.75+
- Stellar CLI

## Quick Start with Docker

### 1. Build the Image

```bash
docker build -t project-cygnus:latest .
```

### 2. Run with Docker Compose

```bash
docker-compose up -d
```

This starts:
- Cygnus Agent (port 3402)
- Prometheus (port 9090)
- Grafana (port 3000)
- Loki (port 3100)
- Promtail

### 3. Access Services

- **Agent**: http://localhost:3402
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Apply Configuration

```bash
kubectl apply -f k8s/configmap.yaml
```

### 3. Deploy Application

```bash
kubectl apply -f k8s/deployment.yaml
```

### 4. Verify Deployment

```bash
kubectl get pods -n project-cygnus
kubectl get services -n project-cygnus
kubectl logs -f deployment/cygnus-agent -n project-cygnus
```

### 5. Scale Deployment

```bash
kubectl scale deployment/cygnus-agent --replicas=5 -n project-cygnus
```

## Configuration

### Environment Variables

```bash
# Stellar Network
export STELLAR_NETWORK=testnet  # or mainnet
export STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
export STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Application
export NODE_ENV=production
export LOG_LEVEL=info
export X402_SERVER_PORT=3402

# Security
export RATE_LIMITING_ENABLED=true
export CIRCUIT_BREAKER_ENABLED=true
```

### Configuration Files

Edit `config/testnet.json` or `config/mainnet.json` for environment-specific settings.

## Monitoring

### Prometheus Metrics

Access metrics at: `http://localhost:3402/metrics`

Key metrics:
- `cygnus_settlement_duration_seconds` - Settlement finality time
- `cygnus_channel_latency_milliseconds` - Payment channel latency
- `cygnus_errors_total` - Error counters by severity
- `cygnus_transactions_total` - Transaction counters by type
- `cygnus_circuit_breaker_state` - Circuit breaker status
- `cygnus_active_loans` - Active loan count
- `cygnus_active_escrows` - Active escrow count
- `cygnus_credit_score` - Agent credit score

### Grafana Dashboards

1. Access Grafana at http://localhost:3000
2. Login with admin/admin
3. Import dashboard from `monitoring/grafana/dashboards/cygnus-dashboard.json`

### Alerts

Prometheus alerts are configured in `monitoring/alerts/cygnus-alerts.yml`:
- High error rate
- High latency
- Circuit breaker open
- Agent down
- Resource exhaustion

## Health Checks

### Liveness Probe

```bash
curl http://localhost:3402/health
```

Returns 200 if agent is alive.

### Readiness Probe

```bash
curl http://localhost:3402/ready
```

Returns 200 if agent is ready to accept traffic.

## Scaling

### Horizontal Scaling

```bash
# Docker Compose
docker-compose up -d --scale cygnus-agent=3

# Kubernetes
kubectl scale deployment/cygnus-agent --replicas=5 -n project-cygnus
```

### Vertical Scaling

Update resource limits in `k8s/deployment.yaml`:

```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

## Security

### Secrets Management

Use Kubernetes secrets for sensitive data:

```bash
kubectl create secret generic cygnus-secrets \
  --from-literal=stellar-secret-key=YOUR_SECRET_KEY \
  -n project-cygnus
```

### Network Policies

Apply network policies to restrict traffic:

```bash
kubectl apply -f k8s/network-policy.yaml
```

### TLS/SSL

Configure TLS for production:

```bash
kubectl create secret tls cygnus-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n project-cygnus
```

## Backup and Recovery

### Database Backup

```bash
# Backup persistent data
kubectl exec -n project-cygnus deployment/cygnus-agent -- \
  tar czf /tmp/backup.tar.gz /app/data

kubectl cp project-cygnus/cygnus-agent-xxx:/tmp/backup.tar.gz ./backup.tar.gz
```

### Configuration Backup

```bash
kubectl get configmap cygnus-config -n project-cygnus -o yaml > config-backup.yaml
```

## Troubleshooting

### Check Logs

```bash
# Docker
docker-compose logs -f cygnus-agent

# Kubernetes
kubectl logs -f deployment/cygnus-agent -n project-cygnus
```

### Debug Pod

```bash
kubectl run -it --rm debug --image=busybox --restart=Never -n project-cygnus -- sh
```

### Common Issues

**Issue**: Agent fails to start
- Check configuration files
- Verify Stellar network connectivity
- Check resource limits

**Issue**: High latency
- Check Prometheus metrics
- Review circuit breaker status
- Scale horizontally

**Issue**: Memory leaks
- Monitor memory metrics
- Check for unclosed connections
- Review error logs

## Performance Tuning

### Node.js Options

```bash
export NODE_OPTIONS="--max-old-space-size=2048"
```

### Kubernetes Resource Tuning

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

### Connection Pooling

Configure in `config/*.json`:

```json
{
  "agent": {
    "maxConcurrentOperations": 20
  }
}
```

## CI/CD Integration

### GitHub Actions

The project includes a complete CI/CD pipeline in `.github/workflows/ci.yml`:

- Lint and format check
- Unit tests
- Contract tests
- Build Docker image
- Deploy to staging/production

### Required Secrets

Configure in GitHub repository settings:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `KUBE_CONFIG_STAGING`
- `KUBE_CONFIG_PRODUCTION`

## Production Checklist

- [ ] Configure production Stellar network
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Set resource limits
- [ ] Enable TLS/SSL
- [ ] Configure secrets management
- [ ] Set up log aggregation
- [ ] Configure auto-scaling
- [ ] Test disaster recovery
- [ ] Document runbooks
- [ ] Set up on-call rotation
- [ ] Conduct security audit

## Support

For issues and questions:
- GitHub Issues: https://github.com/project-cygnus/issues
- Documentation: https://docs.projectcygnus.io
- Community: https://discord.gg/projectcygnus
