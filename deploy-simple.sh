#!/bin/bash

# Simple deployment script for Cloud Run

echo "=== Deploying Simple App to Cloud Run ==="

# 1. Test the app locally
echo "Testing app.cjs locally..."
node app.cjs &
APP_PID=$!
sleep 3
echo "Sending test request to http://localhost:8080/health"
curl -s http://localhost:8080/health
echo ""
echo "Sending test request to http://localhost:8080/debug"
curl -s http://localhost:8080/debug
echo ""
kill $APP_PID

# 2. Submit build with simple configuration
echo "Submitting build to Cloud Build..."
gcloud builds submit --config cloudbuild.simple.yaml

# 3. Add IAM policy binding - force a wait first
echo "Waiting 10 seconds for deployment to stabilize..."
sleep 10

echo "Setting IAM policy for public access..."
gcloud beta run services add-iam-policy-binding \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  greenlane-simple-app

# 4. Get the service URL
echo "Retrieving service URL..."
SERVICE_URL=$(gcloud run services describe greenlane-simple-app --region=us-central1 --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
  echo "Service deployed successfully to: $SERVICE_URL"
  echo "Testing service health endpoint..."
  curl -s "${SERVICE_URL}/health"
  echo ""
  echo "Open this URL in your browser: $SERVICE_URL"
  
  echo ""
  echo "Here are the logs from the deployed service:"
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=greenlane-simple-app" --limit 20 --format json
else
  echo "Unable to retrieve service URL. Check deployment logs."
  echo "Retrieving logs to help diagnose the issue..."
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=greenlane-simple-app" --limit 20 --format json
fi

echo "Deployment completed."