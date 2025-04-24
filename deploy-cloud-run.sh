#!/bin/bash

# Simple but effective deployment script for Greenlane CRM to Google Cloud Run
# This script uses standard patterns and avoids unnecessary complexity

echo "=== Deploying Greenlane CRM to Cloud Run ==="

# 1. Ensure server.js works properly
echo "Testing server.js locally..."
node -c server.js || { echo "server.js syntax check failed"; exit 1; }

# 2. Make sure we're in the correct GCP project
PROJECT_ID=$(gcloud config get-value project)
echo "Current GCP project: $PROJECT_ID"
if [ "$PROJECT_ID" != "greenlane-cloud-solutions" ]; then
  echo "Switching to greenlane-cloud-solutions project..."
  gcloud config set project greenlane-cloud-solutions
fi

# 3. Update environment variables file if it exists
if [ -f ".env.production" ]; then
  echo "Updating greenlane-env secret with .env.production..."
  gcloud secrets create greenlane-env --data-file=.env.production --replication-policy="automatic" || \
  gcloud secrets versions add greenlane-env --data-file=.env.production
fi

# 4. Submit build to Cloud Build
echo "Submitting build to Cloud Build..."
gcloud builds submit --config cloudbuild.yaml

# 5. Add IAM policy binding for public access
echo "Setting IAM policy for public access..."
gcloud run services add-iam-policy-binding \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  greenlane-crm-app

# 6. Get the service URL
echo "Retrieving service URL..."
SERVICE_URL=$(gcloud run services describe greenlane-crm-app --region=us-central1 --format="value(status.url)")

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
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=greenlane-crm-app" --limit 20
fi

echo "Deployment completed."