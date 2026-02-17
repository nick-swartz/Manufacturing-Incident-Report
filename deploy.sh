#!/bin/bash

# Azure deployment script for development server
set -e

echo "Starting deployment..."

# Install all dependencies (including dev dependencies for concurrently, etc.)
echo "Installing dependencies..."
npm install

# Install pm2 globally for process management
echo "Installing PM2..."
npm install -g pm2

echo "Deployment complete!"
echo "Note: Application will start with 'npm run dev' via PM2"
