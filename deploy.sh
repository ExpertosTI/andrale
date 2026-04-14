#!/bin/bash
# ==============================================================================
# Wedding Invitation Deployment (Andreína & Alejandro)
# ==============================================================================
# Protocol: RENACE.TECH (Local Build + Swarm Stack)

set -e

REPO_URL="https://github.com/ExpertosTI/andreina-alejandro.git"
PROJECT_DIR="/var/www/andreinalejandro"
STACK_NAME="andreina-alejandro-wedding"
SERVICE_NAME="andreina-alejandro-wedding_wedding"

echo "========================================================"
echo "🚀 Starting Deployment (Andreína & Alejandro Wedding)..."
echo "========================================================"

# 1. Sync Code
if [ -d "$PROJECT_DIR" ]; then
    echo "📁 Updating existing directory $PROJECT_DIR..."
    cd "$PROJECT_DIR"
    git fetch origin main
    git reset --hard origin/main
else
    echo "📥 Cloning repository to $PROJECT_DIR..."
    git clone $REPO_URL $PROJECT_DIR
    cd $PROJECT_DIR
fi

# 2. Build and deploy
echo "🐳 Building Docker image locally..."
docker compose build

echo "🚀 Deploying stack to Docker Swarm (RenaceNet)..."
# Ensure RenaceNet exists (Standard Renace Protocol)
docker network ls | grep RenaceNet > /dev/null || docker network create --driver overlay RenaceNet

docker stack deploy -c docker-compose.yml $STACK_NAME

# 3. Force Pickup
echo "🔄 Forcing Swarm to pick up the new local image..."
docker service update --force $SERVICE_NAME 2>/dev/null || true

# 4. Clean up
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo "========================================================"
echo "✅ Deployment successful!"
echo "📡 URL: https://andreina-alejandro.renace.tech"
echo "========================================================"
