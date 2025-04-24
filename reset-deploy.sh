#!/bin/bash

# Reset and deploy script for Greenlane CRM
# This script resets any persisted Cloud Run configuration before deploying

echo "=== Resetting and Deploying Greenlane CRM to Cloud Run ==="

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

# First, delete the existing service to reset all configuration
echo "Deleting existing Cloud Run service to reset configuration..."
gcloud run services delete greenlane-crm-app --region=us-central1 --quiet || {
  echo "Service doesn't exist or couldn't be deleted. Continuing with deployment..."
}

# Now deploy with clean configuration
echo "Submitting build to Cloud Build..."
gcloud builds submit --config cloudbuild.yaml

echo "Deployment submitted. Check the Cloud Build logs for progress."

# Wait a bit and then check service status
sleep 15
echo "Checking service status..."
gcloud run services describe greenlane-crm-app --region=us-central1 || {
  echo "Service not yet available. Check Cloud Build logs for details."
}