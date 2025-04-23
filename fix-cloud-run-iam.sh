#!/bin/bash

# Script to fix Cloud Run service account permissions
# This gives the service account access to Secret Manager secrets

echo "=== Fixing Cloud Run Service Account Permissions ==="

# Get the service account email
SERVICE_ACCOUNT="869018523985-compute@developer.gserviceaccount.com"
echo "Using service account: $SERVICE_ACCOUNT"

# Add Secret Manager Secret Accessor role to the service account for Cloudflare API Token
echo "Granting Secret Manager Secret Accessor role for cloudflare-api-token..."
gcloud secrets add-iam-policy-binding cloudflare-api-token \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=greenlane-cloud-solutions

# Add Secret Manager Secret Accessor role to the service account for Cloudflare Zone ID
echo "Granting Secret Manager Secret Accessor role for cloudflare-zone-id..."
gcloud secrets add-iam-policy-binding cloudflare-zone-id \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=greenlane-cloud-solutions

# Wait for IAM policy changes to propagate
echo "Waiting for IAM policy changes to propagate (30 seconds)..."
sleep 30

# Update the service to trigger a new revision
echo "Updating service to apply new permissions..."
gcloud run services update greenlane-minimal \
  --region=us-central1 \
  --update-env-vars=PERMISSION_UPDATE="$(date +%s)" \
  --project=greenlane-cloud-solutions

echo ""
echo "Permission fixes have been applied."
echo "Please wait a minute or two for a new revision to be created and deployed."
echo "Then run the check-deployment-status.sh script again to verify the fix."
echo ""