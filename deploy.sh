#!/bin/bash
# Wedding Invitation Deployment Script
# Target: michellemike.renace.tech

# Configuration
PROJECT_DIR=$(pwd)
# Update these with your specific server credentials
REMOTE_HOST="renace.tech"
REMOTE_PATH="/var/www/michellemike.renace.tech"
REMOTE_USER="root"

echo "------------------------------------------------"
echo "🚀 Starting deployment to michellemike.renace.tech"
echo "------------------------------------------------"

# Optional: Compressed assets check (ensure videos are optimized)
echo "Checking assets..."
if [ ! -d "assets" ]; then
    echo "❌ Error: assets directory not found!"
    exit 1
fi

# Deployment via Rsync
echo "Uploading files..."
rsync -avz --progress \
    --exclude '.git' \
    --exclude '.DS_Store' \
    --exclude '.idea' \
    --exclude 'brain' \
    --exclude 'deploy.sh' \
    ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}

if [ $? -eq 0 ]; then
    echo "------------------------------------------------"
    echo "✅ Deployment Successful!"
    echo "URL: https://michellemike.renace.tech"
    echo "------------------------------------------------"
else
    echo "------------------------------------------------"
    echo "❌ Deployment Failed. Please check connection."
    echo "------------------------------------------------"
fi
