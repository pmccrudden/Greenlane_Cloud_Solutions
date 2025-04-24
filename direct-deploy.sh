#!/bin/bash

# Direct deployment script for Greenlane CRM
# This script builds locally and deploys directly to Cloud Run

echo "=== Direct Deploying Greenlane CRM to Cloud Run ==="

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

# Build the Docker image locally
echo "Building Docker image locally..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-app:latest .

# Push the image to GCR
echo "Pushing image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-app:latest

# Deploy directly to Cloud Run with explicit --no-command flag
echo "Deploying to Cloud Run..."
gcloud run deploy greenlane-crm-app \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-app:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --max-instances=10 \
  --min-instances=1 \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=600s \
  --set-env-vars="NODE_ENV=production,BASE_DOMAIN=greenlanecloudsolutions.com,CRM_DOMAIN=crm.greenlanecloudsolutions.com,API_DOMAIN=api.greenlanecloudsolutions.com,HOST=0.0.0.0" \
  --update-secrets=/app/.env=greenlane-env:latest \
  --cpu-boost \
  --clear-command \
  --clear-args \
  --quiet

echo "Deployment completed."

# Check service status
echo "Checking service status..."
gcloud run services describe greenlane-crm-app --region=us-central1 || {
  echo "Service not yet available. Check Cloud Run logs for details."
}