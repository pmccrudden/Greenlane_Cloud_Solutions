#!/bin/bash

# Deployment script for Greenlane CRM to Google Cloud Run
# This script uses a robust approach with a dedicated startup file

echo "=== Deploying Greenlane CRM to Cloud Run ==="

# 1. Test the startup script locally
echo "Testing startup script locally..."
NODE_ENV=production PORT=8080 HOST=0.0.0.0 node startup.js &
APP_PID=$!
sleep 5
echo "Sending test request to http://localhost:8080/health"
curl -s http://localhost:8080/health
echo ""
echo "Sending test request to http://localhost:8080/debug"
curl -s http://localhost:8080/debug
echo ""
echo "Stopping test server..."
kill $APP_PID

# 2. Submit build with Cloud Run configuration
echo "Submitting build to Cloud Build..."
gcloud builds submit --config cloudbuild.cloudrun.yaml

# 3. Add IAM policy binding
echo "Setting IAM policy for public access..."
gcloud run services add-iam-policy-binding \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  greenlane-crm-app

# Store the service name in a variable for consistency
SERVICE_NAME="greenlane-crm-app"

# 4. Get the service URL
echo "Retrieving service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=us-central1 --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
  echo "Service deployed successfully to: $SERVICE_URL"
  echo "Testing service health endpoint..."
  curl -s "${SERVICE_URL}/health"
  echo ""
  echo "Testing service debug endpoint..."
  curl -s "${SERVICE_URL}/debug"
  echo ""
  echo "Open this URL in your browser: $SERVICE_URL"
else
  echo "Unable to retrieve service URL. Check deployment logs."
  echo "Retrieving logs to help diagnose the issue..."
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" --limit 20
fi

echo "Deployment completed."