#!/bin/bash

# === CONFIGURATION ===
DOCKER_HUB_USER="nnikolovskii"
TAG="latest"
SERVER_USER="nnikolovskii"

# Get SERVER_IP from environment variable or use default as fallback
SERVER_IP="${SERVER_IP:-79.125.164.129}"

# Check if SERVER_IP is set
if [ -z "$SERVER_IP" ]; then
    echo "❌ Error: SERVER_IP environment variable is not set"
    echo "Usage: SERVER_IP=<your-server-ip> ./deploy-docker.sh"
    exit 1
fi

# Define Services: "ImageName:BuildDirectory"
SERVICES=(
  "gc-frontend:/home/nnikolovskii/dev/general-chat/frontend"
  "gc-backend:/home/nnikolovskii/dev/general-chat/backend"
  "gc-ai:/home/nnikolovskii/dev/general-chat/ai-agent"
)

# 1. BUILD AND PUSH LOOP
for service in "${SERVICES[@]}"; do
    IMAGE_NAME="${service%%:*}"
    BUILD_DIR="${service#*:}"
    FULL_IMAGE_NAME="${DOCKER_HUB_USER}/${IMAGE_NAME}:${TAG}"

    echo "========================================"
    echo "=== Processing $IMAGE_NAME ==="
    echo "========================================"

    echo "-> Building from $BUILD_DIR"
    docker build -t $FULL_IMAGE_NAME -f ${BUILD_DIR}/Dockerfile ${BUILD_DIR}
    if [ $? -ne 0 ]; then echo "❌ Build failed for $IMAGE_NAME"; exit 1; fi

    echo "-> Pushing to Docker Hub"
    docker push $FULL_IMAGE_NAME
    if [ $? -ne 0 ]; then echo "❌ Push failed for $IMAGE_NAME"; exit 1; fi
done

# 2. DEPLOYMENT
echo "========================================"
echo "=== Deploying to Server ($SERVER_IP) ==="
echo "========================================"

ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
    set -e
    cd traefik-stack
    
    echo "-> Restarting ai.yml stack..."
    docker compose -f ai.yml down
    docker compose -f ai.yml pull
    docker compose -f ai.yml up -d --build
EOF

if [ $? -ne 0 ]; then
 echo "❌ Deployment failed."
 exit 1
fi

echo "✅ All services built, pushed, and deployed successfully."