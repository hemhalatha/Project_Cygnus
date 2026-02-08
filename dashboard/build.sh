#!/bin/bash

# Project Cygnus Dashboard Build Script

set -e

echo "Building Project Cygnus Dashboard for production..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

echo "Build complete! Output in dist/ directory"
echo ""
echo "To serve production build:"
echo "  npm run preview"
echo ""
echo "To start backend server:"
echo "  npm run server"
