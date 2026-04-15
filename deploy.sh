#!/bin/bash
set -e

REPO_DIR="/root/proyectos/secasan"
STACK_NAME="secasan"
BRANCH="feature/marketplace-and-deploy"

echo "🚀 Iniciando despliegue de SeCasan en la rama $BRANCH..."

# 1. Sync code
if [ -d "$REPO_DIR" ]; then
    cd "$REPO_DIR"
    git fetch origin $BRANCH
    git reset --hard origin/$BRANCH
else
    # First time clone (User must have SSH keys setup)
    git clone -b $BRANCH https://github.com/ExpertosTI/www.renace.tech.git $REPO_DIR
    cd $REPO_DIR
fi

# 2. Check env
if [ ! -f ".env" ]; then
    echo "WEDDING_ADMIN_KEY=secasan123" > .env
    echo "⚠️ .env creado con valores por defecto. Edítalo si es necesario."
fi

# 3. Build image
echo "📦 Construyendo imagen Docker..."
docker compose build

# 4. Ensure Network
docker network ls | grep RenaceNet > /dev/null || docker network create --driver overlay RenaceNet

# 5. Deploy Stack
echo "🚢 Lanzando Stack SeCasan..."
set -a; source .env; set +a
docker stack deploy -c docker-compose.yml $STACK_NAME

# 6. Force update to pick up new image
docker service update --force ${STACK_NAME}_main

echo "✅ Despliegue completado."
echo "🌍 Revisa en: https://secasan.renace.tech"
