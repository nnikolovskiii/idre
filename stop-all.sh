#!/bin/bash

# Script to run all services
# Exit on any error
set -e

echo "Starting all services..."

# Go to ai-agent directory and run docker-compose up
echo "Starting ai-agent with docker-compose..."
cd ai-agent


docker compose down
cd ..

# Stop any process on port 8001
echo "Stopping any process on port 8001..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true


# Stop any process on port 5173
echo "Stopping any process on port 5173..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "All services stoped successfuly!"
