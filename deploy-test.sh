#!/bin/bash

# Script to test deploying to Cloud Run

echo "Building and deploying to Cloud Run..."

echo "Building Docker image locally..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-app:test .

echo "Running container locally to test..."
docker run -d -p 8080:8080 --name gcr-test gcr.io/greenlane-cloud-solutions/greenlane-crm-app:test

echo "Waiting 5 seconds for container to start..."
sleep 5

echo "Checking logs..."
docker logs gcr-test

echo "Checking if server is responding..."
curl http://localhost:8080/health || echo "Server not responding"

echo "Testing complete. Cleaning up..."
docker stop gcr-test
docker rm gcr-test

echo "Submitting to Cloud Build..."
gcloud builds submit --config cloudbuild.yaml

echo "Deployment completed."
echo "You will need to run the IAM fix script with: bash fix-cloud-run-iam.sh"