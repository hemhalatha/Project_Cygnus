#!/bin/bash

# Project Cygnus Dashboard Startup Script

set -e

echo "Starting Project Cygnus Dashboard..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start backend server in background
echo "Starting backend server..."
npm run server &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Start frontend
echo "Starting frontend..."
npm run dev

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT
