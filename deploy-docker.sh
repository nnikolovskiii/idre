#!/bin/bash

# === CONFIGURATION ===
DOCKER_HUB_USER="nnikolovskii"
SERVER_USER="nnikolovskii"

# 1. DYNAMIC TAGGING
# Get the short git commit hash (e.g., a1b2c3d)
if git rev-parse --git-dir > /dev/null 2>&1; then
    TAG=$(git rev-parse --short HEAD)
    echo "🏷️  Detected Git Hash. Using Tag: $TAG"
else
    echo "❌ Error: Not a git repository. Cannot generate dynamic tag."
    exit 1
fi

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

# 2. BUILD AND PUSH LOOP
for service in "${SERVICES[@]}"; do
    IMAGE_NAME="${service%%:*}"
    BUILD_DIR="${service#*:}"
    FULL_IMAGE_NAME="${DOCKER_HUB_USER}/${IMAGE_NAME}:${TAG}"

    echo "========================================"
    echo "=== Processing $IMAGE_NAME ==="
    echo "========================================"

    echo "-> Building version $TAG from $BUILD_DIR"
    docker build -t $FULL_IMAGE_NAME -f ${BUILD_DIR}/Dockerfile ${BUILD_DIR}
    if [ $? -ne 0 ]; then echo "❌ Build failed for $IMAGE_NAME"; exit 1; fi

    echo "-> Pushing to Docker Hub"
    docker push $FULL_IMAGE_NAME
    if [ $? -ne 0 ]; then echo "❌ Push failed for $IMAGE_NAME"; exit 1; fi
done

# 3. DEPLOYMENT
echo "========================================"
echo "=== Deploying to Server ($SERVER_IP) ==="
echo "========================================"

# We pass the local TAG variable into the SSH command
ssh ${SERVER_USER}@${SERVER_IP} "TAG=${TAG} bash -s" << 'EOF'
    set -e
    cd traefik-stack
    
    # Export the TAG so docker compose sees it
    export TAG
    
    echo "-> Deploying version: $TAG"
    
    # Note: ai.yml must use image: name:${TAG} for this to work
    echo "-> Restarting ai.yml stack..."
    
    # We pass the env var explicitly to ensure compose picks it up
    docker compose -f ai.yml down
    docker compose -f ai.yml pull
    docker compose -f ai.yml up -d --build
EOF

if [ $? -ne 0 ]; then
 echo "❌ Deployment failed."
 exit 1
fi

echo "✅ All services built, pushed, and deployed successfully with tag: $TAG"