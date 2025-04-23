#!/bin/bash

# Simple deployment script for Cloud Run

echo "=== Deploying Simple App to Cloud Run ==="

# 1. Test the app locally
echo "Testing app.js locally..."
node app.js &
APP_PID=$!
sleep 2
echo "Sending test request to http://localhost:8080/health"
curl -s http://localhost:8080/health
echo ""
kill $APP_PID

# 2. Submit build with simple configuration
echo "Submitting build to Cloud Build..."
gcloud builds submit --config cloudbuild.simple.yaml

# 3. Add IAM policy binding
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
else
  echo "Unable to retrieve service URL. Check deployment logs."
fi

echo "Deployment completed."