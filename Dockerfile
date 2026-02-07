# Multi-stage Dockerfile for Project Cygnus

# Stage 1: Build TypeScript
FROM node:20-alpine AS typescript-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install -D typescript @types/node

# Copy source code
COPY src ./src
COPY agents ./agents
COPY protocols ./protocols

# Build TypeScript
RUN npm run build

# Stage 2: Build Rust contracts
FROM rust:1.75-alpine AS rust-builder

WORKDIR /contracts

# Install build dependencies
RUN apk add --no-cache musl-dev openssl-dev

# Install Soroban CLI
RUN cargo install --locked soroban-cli

# Copy contract source
COPY contracts ./

# Build contracts
RUN cd credit-scoring && cargo build --release --target wasm32-unknown-unknown && \
    cd ../loan && cargo build --release --target wasm32-unknown-unknown && \
    cd ../escrow && cargo build --release --target wasm32-unknown-unknown

# Stage 3: Runtime
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    tini

# Copy built artifacts from TypeScript builder
COPY --from=typescript-builder /app/dist ./dist
COPY --from=typescript-builder /app/node_modules ./node_modules
COPY --from=typescript-builder /app/package*.json ./

# Copy built contracts from Rust builder
COPY --from=rust-builder /contracts/credit-scoring/target/wasm32-unknown-unknown/release/*.wasm ./contracts/
COPY --from=rust-builder /contracts/loan/target/wasm32-unknown-unknown/release/*.wasm ./contracts/
COPY --from=rust-builder /contracts/escrow/target/wasm32-unknown-unknown/release/*.wasm ./contracts/

# Copy configuration
COPY config ./config
COPY scripts ./scripts

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose ports
EXPOSE 3402

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3402/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "dist/index.js"]
