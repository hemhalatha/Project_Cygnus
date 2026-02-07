#!/bin/bash

# Project Cygnus Dashboard Startup Script

set -e

echo "=================================================="
echo "Project Cygnus Dashboard"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[INFO]${NC} Installing dependencies..."
    npm install
    echo -e "${GREEN}[OK]${NC} Dependencies installed"
    echo ""
fi

# Start backend server in background
echo -e "${YELLOW}[INFO]${NC} Starting backend server..."
npm run server &
SERVER_PID=$!
echo -e "${GREEN}[OK]${NC} Backend server started (PID: $SERVER_PID)"
echo ""

# Wait for server to be ready
sleep 2

# Start frontend
echo -e "${YELLOW}[INFO]${NC} Starting frontend..."
echo ""
echo "=================================================="
echo "Dashboard will open at: http://localhost:3000"
echo "Backend API running at: http://localhost:3001"
echo "=================================================="
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Trap Ctrl+C to kill both processes
trap "echo ''; echo 'Stopping servers...'; kill $SERVER_PID 2>/dev/null; exit" INT TERM

# Start frontend (this will block)
npm run dev

# If we get here, frontend was stopped
kill $SERVER_PID 2>/dev/null
