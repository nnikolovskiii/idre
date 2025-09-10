#!/bin/bash

# === CONFIGURATION ===
DOCKER_HUB_USER="nnikolovskii"
IMAGE_NAME="general-chat-ai"
TAG="latest"
FULL_IMAGE_NAME="${DOCKER_HUB_USER}/${IMAGE_NAME}:${TAG}"

BUILD_DIR="/home/nnikolovskii/dev/general-chat/ai-agent"
# =====================

echo "=== Building Docker image from $BUILD_DIR ==="
docker build -t $FULL_IMAGE_NAME -f ${BUILD_DIR}/Dockerfile ${BUILD_DIR}

if [ $? -ne 0 ]; then
  echo "❌ Docker build failed."
  exit 1
fi

echo "=== Pushing image to Docker Hub ==="
docker push $FULL_IMAGE_NAME

if [ $? -ne 0 ]; then
  echo "❌ Docker push failed."
  exit 1
fi
