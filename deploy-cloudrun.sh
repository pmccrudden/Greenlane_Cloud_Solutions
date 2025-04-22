#!/bin/bash

# Script to deploy to Cloud Run with proper error handling

echo "=== Greenlane CRM Deployment Script ==="
echo "Setting up environment..."

# 1. Apply IAM policy first to avoid warnings during deployment
echo "Setting IAM policy for public access..."
gcloud beta run services add-iam-policy-binding \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  greenlane-crm-app || true  # Continue even if this fails (service might not exist yet)

# 2. Build and submit to Cloud Build
echo "Building and deploying to Cloud Run..."
gcloud builds submit --config cloudbuild.yaml

# 3. Try the IAM policy again after service has been created
echo "Re-applying IAM policy after service creation..."
gcloud beta run services add-iam-policy-binding \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  greenlane-crm-app

# 4. Test the service
echo "Retrieving service URL..."
SERVICE_URL=$(gcloud run services describe greenlane-crm-app --region=us-central1 --format="value(status.url)")

if [ -n "$SERVICE_URL" ]; then
  echo "Service deployed to: $SERVICE_URL"
  echo "Testing service health endpoint..."
  curl -s "${SERVICE_URL}/health" || echo "Health endpoint not responding. Service may still be starting."
else
  echo "Unable to retrieve service URL. Deployment may have failed."
fi

echo "Deployment process completed."