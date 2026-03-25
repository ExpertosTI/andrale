#!/bin/bash
# Wedding Invitation - Docker Stack Deployment
# Target: michellemike.renace.tech (Docker Swarm / Traefik)

# Configuration
REMOTE_HOST="renace.tech"
REMOTE_USER="root"
REMOTE_PATH="/var/www/miki"
STACK_NAME="miki-wedding"

echo "------------------------------------------------"
echo "🚀 Starting Docker Stack deployment to renace.tech"
echo "------------------------------------------------"

# 1. Ensure local changes are pushed
echo "Checking Git status..."
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes. Please commit and push to ExpertosTI/miki before deploying."
    exit 1
fi

# 2. Remote Deployment
echo "Connecting to ${REMOTE_HOST}..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << EOF
    # Ensure directory exists and is a git repo
    if [ ! -d "${REMOTE_PATH}" ]; then
        echo "Creating project directory..."
        mkdir -p /var/www
        git clone https://github.com/ExpertosTI/miki.git ${REMOTE_PATH}
    fi

    cd ${REMOTE_PATH}
    
    echo "Pulling latest changes from GitHub..."
    git pull origin main

    echo "Deploying Docker Stack: ${STACK_NAME}..."
    # Ensure external network exists (standard in Renace ecosystem)
    docker network ls | grep traefik-public > /dev/null || docker network create --driver overlay traefik-public

    # Deploy the stack
    # Note: Using docker stack deploy --with-registry-auth if needed
    docker stack deploy -c docker-compose.yml ${STACK_NAME}

    echo "Cleaning up old images..."
    docker image prune -f
EOF

if [ $? -eq 0 ]; then
    echo "------------------------------------------------"
    echo "✅ Stack Deployment Successful!"
    echo "URL: https://michellemike.renace.tech"
    echo "------------------------------------------------"
else
    echo "------------------------------------------------"
    echo "❌ Deployment Failed. Check server logs."
    echo "------------------------------------------------"
fi
