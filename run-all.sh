#!/bin/bash

# Script to run all services
# Exit on any error
set -e

echo "Starting all services..."

# Go to ai-agent directory and run docker-compose up
# This now includes the backend service and frontend
echo "Starting infrastructure, ai-agent, backend, and frontend with docker-compose..."
cd ai-agent

# Ask user if they want to run langgraph build
echo "Do you want to run 'poetry run langgraph build -t task-agent'? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]
then
    echo "Running langgraph build..."
    poetry run langgraph build -t task-agent
else
    echo "Skipping langgraph build..."
fi

cd ..
docker compose up -d --build

echo "All services started!"
echo "Frontend is available at http://localhost:5173"
echo "Backend is available at http://localhost:8001"
echo "LangGraph API is available at http://localhost:8123"
