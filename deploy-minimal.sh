#!/bin/bash

# Super minimal deployment script for Cloud Run

echo "=== Deploying Minimal App to Cloud Run ==="

# 1. Test app locally first
echo "Testing app-minimal.js locally..."
node app-minimal.js &
APP_PID=$!
sleep 3
echo "Sending test request to http://localhost:8080/health"
curl -s http://localhost:8080/health
echo ""
kill $APP_PID

# 2. Submit build with minimal configuration
echo "Submitting build to Cloud Build..."
gcloud builds submit --config cloudbuild.minimal.yaml

# 3. Add IAM policy binding
echo "Setting IAM policy for public access..."
gcloud run services add-iam-policy-binding \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  greenlane-minimal-app

# 4. Get the service URL
echo "Retrieving service URL..."
SERVICE_URL=$(gcloud run services describe greenlane-minimal-app --region=us-central1 --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
  echo "Service deployed successfully to: $SERVICE_URL"
  echo "Testing service health endpoint..."
  curl -s "${SERVICE_URL}/health"
  echo ""
  echo "Open this URL in your browser: $SERVICE_URL"
else
  echo "Unable to retrieve service URL. Check deployment logs."
  echo "Retrieving logs to help diagnose the issue..."
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=greenlane-minimal-app" --limit 20
fi

echo "Deployment completed."