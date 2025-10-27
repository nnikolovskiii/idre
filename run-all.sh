#!/bin/bash

# Script to run all services
# Exit on any error
set -e

echo "Starting all services..."

# Go to ai-agent directory and run docker-compose up
echo "Starting ai-agent with docker-compose..."
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

docker compose up -d
cd ..

# Stop any process on port 8001
echo "Stopping any process on port 8001..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true

# Go to backend directory and run poetry command in background
echo "Starting backend..."
cd backend
poetry lock
poetry install
poetry run python src/backend/main.py &
cd ..

# Stop any process on port 5173
echo "Stopping any process on port 5173..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Go to frontend directory and run npm dev
# Frontend
echo "Starting frontend..."
cd frontend
npm install
npm run dev
cd ..

echo "All services started!"
