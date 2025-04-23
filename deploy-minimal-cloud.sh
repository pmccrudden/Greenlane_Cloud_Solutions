#!/bin/bash

# Script to deploy a minimal Cloud Run service that will definitely pass health checks
# This creates a simple placeholder app that can be used for DNS setup

echo "=== Deploying Minimal Cloud Run App for Greenlane CRM ==="

# Test the minimal server locally
echo "Testing minimal server locally..."
node app-minimal-cloud.js &
APP_PID=$!
sleep 2
echo "Sending test request to http://localhost:8080/health"
curl -s http://localhost:8080/health
echo ""
kill $APP_PID

# Submit build 
echo "Submitting build to Cloud Build..."
gcloud builds submit --config cloudbuild.minimal-cloud.yaml

# Add IAM policy binding
echo "Setting IAM policy for public access..."
gcloud run services add-iam-policy-binding \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  greenlane-minimal

# Get the service URL
echo "Retrieving service URL..."
SERVICE_URL=$(gcloud run services describe greenlane-minimal --region=us-central1 --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
  echo "Service deployed successfully to: $SERVICE_URL"
  echo "Testing service health endpoint..."
  curl -s "${SERVICE_URL}/health"
  echo ""
  echo "Open this URL in your browser: $SERVICE_URL"
  
  # Save service URL for Cloudflare DNS configuration
  echo "Saving service URL for DNS configuration..."
  echo "${SERVICE_URL}" | sed 's/https:\/\///' > service_hostname.txt
  echo "The service hostname is saved to service_hostname.txt for use with Cloudflare DNS setup."
else
  echo "Unable to retrieve service URL. Check deployment logs."
  echo "Retrieving logs to help diagnose the issue..."
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=greenlane-minimal" --limit 20
fi

echo "Deployment completed."