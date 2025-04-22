#!/bin/bash

# Script to test the Docker container locally

echo "=== Testing Docker Container Locally ==="

# Clean up any existing test containers
echo "Cleaning up any existing test containers..."
docker rm -f gcr-test 2>/dev/null || true

# Build the Docker image
echo "Building Docker image..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-app:test .

# Run the container
echo "Running container locally to test..."
docker run -d -p 8080:8080 --name gcr-test gcr.io/greenlane-cloud-solutions/greenlane-crm-app:test

# Wait for container to start
echo "Waiting 5 seconds for container to start..."
sleep 5

# Check logs
echo "Checking logs..."
docker logs gcr-test

# Check if server is responding
echo "Checking if server is responding..."
curl -s http://localhost:8080/health && echo " - Health endpoint is working!" || echo " - Health endpoint is NOT working!"
curl -s http://localhost:8080/debug && echo " - Debug endpoint is working!" || echo " - Debug endpoint is NOT working!"

echo "Test results are above. Check the logs for more details."
echo "Keep container running? (y/n)"
read answer

if [ "$answer" != "y" ]; then
  echo "Cleaning up test container..."
  docker stop gcr-test
  docker rm gcr-test
  echo "Test container removed."
else
  echo "Test container is still running at http://localhost:8080"
  echo "Stop it later with: docker stop gcr-test && docker rm gcr-test"
fi