#!/bin/bash

# Project Cygnus - Deployment Verification Script

set -e

echo "=========================================="
echo "Project Cygnus - Deployment Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}!${NC} $1"
}

# 1. Check Node.js version
echo "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js installed: $NODE_VERSION"
else
    check_fail "Node.js not found"
    exit 1
fi

# 2. Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm installed: $NPM_VERSION"
else
    check_fail "npm not found"
    exit 1
fi

# 3. Check dependencies
echo ""
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    check_pass "Root dependencies installed"
else
    check_warn "Root dependencies not installed. Run: npm install"
fi

if [ -d "dashboard/node_modules" ]; then
    check_pass "Dashboard dependencies installed"
else
    check_warn "Dashboard dependencies not installed. Run: cd dashboard && npm install"
fi

# 4. Run tests
echo ""
echo "Running tests..."
if npm test > /dev/null 2>&1; then
    check_pass "Backend tests passing"
else
    check_fail "Backend tests failing"
fi

if cd dashboard && npm test > /dev/null 2>&1; then
    check_pass "Dashboard tests passing"
    cd ..
else
    check_fail "Dashboard tests failing"
    cd ..
fi

# 5. Check build
echo ""
echo "Checking build..."
if cd dashboard && npm run build > /dev/null 2>&1; then
    check_pass "Dashboard builds successfully"
    cd ..
else
    check_fail "Dashboard build failed"
    cd ..
fi

# 6. Check configuration files
echo ""
echo "Checking configuration files..."

files=(
    "dashboard/package.json"
    "dashboard/vite.config.js"
    "dashboard/server/index.js"
    "dashboard/Dockerfile"
    "dashboard/docker-compose.yml"
    "nginx.conf"
    "DEPLOYMENT_GUIDE.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file exists"
    else
        check_fail "$file missing"
    fi
done

# 7. Check Docker (optional)
echo ""
echo "Checking Docker (optional)..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    check_pass "Docker installed: $DOCKER_VERSION"
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        check_pass "Docker Compose installed: $COMPOSE_VERSION"
    else
        check_warn "Docker Compose not found (optional)"
    fi
else
    check_warn "Docker not found (optional for deployment)"
fi

# 8. Check ports
echo ""
echo "Checking ports..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    check_warn "Port 3001 is in use"
else
    check_pass "Port 3001 is available"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    check_warn "Port 5173 is in use"
else
    check_pass "Port 5173 is available"
fi

# 9. Check environment
echo ""
echo "Checking environment..."
if [ -f "dashboard/.env" ]; then
    check_pass "Environment file exists"
else
    check_warn "No .env file found. Copy from .env.example"
fi

# Summary
echo ""
echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review any warnings above"
echo "2. Configure environment variables (dashboard/.env)"
echo "3. Start development: cd dashboard && ./start.sh"
echo "4. Or deploy with Docker: cd dashboard && docker-compose up -d"
echo ""
echo "For more information, see:"
echo "- DEPLOYMENT_GUIDE.md"
echo "- DEPLOYMENT_CHECKLIST.md"
echo "- PRODUCTION_READY.md"
echo ""
