#!/bin/bash

# Production deployment script for Cloud Run
# Uses CommonJS server and optimized Dockerfile

echo "=== Deploying Greenlane CRM to Cloud Run (Production) ==="

# Check if we're logged in to gcloud
gcloud auth list --filter=status:ACTIVE --format="value(account)" || {
  echo "Not logged in to gcloud. Please run 'gcloud auth login' first."
  exit 1
}

# Make sure we're in the correct GCP project
PROJECT_ID=$(gcloud config get-value project)
echo "Current GCP project: $PROJECT_ID"
if [ "$PROJECT_ID" != "greenlane-cloud-solutions" ]; then
  echo "Switching to greenlane-cloud-solutions project..."
  gcloud config set project greenlane-cloud-solutions
fi

# Prepare the server.js file
echo "Preparing server file..."
cp server.cjs server.js

# Build the Docker image locally
echo "Building Docker image locally..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-prod:latest -f Dockerfile.production .

# Push the image to GCR
echo "Pushing image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-prod:latest

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy greenlane-crm-prod \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-prod:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --max-instances=10 \
  --min-instances=1 \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=300s \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0" \
  --quiet

echo "Deployment completed."

# Check service status
echo "Checking service status..."
SERVICE_URL=$(gcloud run services describe greenlane-crm-prod --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -n "$SERVICE_URL" ]; then
  echo "Service is available at: $SERVICE_URL"
  echo ""
  echo "Testing the endpoint..."
  curl -s -o /dev/null -w "Status code: %{http_code}\n" "$SERVICE_URL"
  
  echo ""
  echo "Debug endpoint:"
  echo "$SERVICE_URL/debug"
else
  echo "Service not yet available. Check Cloud Run logs for details."
fi