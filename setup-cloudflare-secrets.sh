#!/bin/bash

# Script to set up Cloudflare API secrets in Google Cloud
# This creates or updates the secrets without exposing them in the repository

echo "=== Setting up Cloudflare Secrets in Google Cloud ==="

# Check if the secrets are already in the environment (set by Replit)
if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo "Error: Cloudflare credentials not found in environment."
  echo "Make sure CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are properly set."
  exit 1
fi

# Create or update the secrets in Google Cloud Secret Manager
echo "Creating/updating Cloudflare API Token secret..."
echo -n "$CLOUDFLARE_API_TOKEN" | gcloud secrets create cloudflare-api-token \
  --replication-policy="automatic" \
  --data-file=- \
  --project=greenlane-cloud-solutions \
  || echo -n "$CLOUDFLARE_API_TOKEN" | gcloud secrets versions add cloudflare-api-token \
  --data-file=- \
  --project=greenlane-cloud-solutions

echo "Creating/updating Cloudflare Zone ID secret..."
echo -n "$CLOUDFLARE_ZONE_ID" | gcloud secrets create cloudflare-zone-id \
  --replication-policy="automatic" \
  --data-file=- \
  --project=greenlane-cloud-solutions \
  || echo -n "$CLOUDFLARE_ZONE_ID" | gcloud secrets versions add cloudflare-zone-id \
  --data-file=- \
  --project=greenlane-cloud-solutions

# Update the cloud run service to use these secrets
echo "Updating Cloud Run service with Cloudflare secrets..."
gcloud run services update greenlane-minimal \
  --region=us-central1 \
  --set-secrets=CLOUDFLARE_API_TOKEN=cloudflare-api-token:latest,CLOUDFLARE_ZONE_ID=cloudflare-zone-id:latest \
  --project=greenlane-cloud-solutions

echo ""
echo "Cloudflare secrets have been set up in Google Cloud."
echo "You can now run the DNS update script directly on Google Cloud Shell."
echo ""
echo "Usage in Google Cloud Shell:"
echo "  ./update-dns-from-minimal.sh"
echo ""
echo "Alternatively, you can manually set the environment variables in your Cloud Shell session:"
echo "  export CLOUDFLARE_API_TOKEN=\$(gcloud secrets versions access latest --secret=cloudflare-api-token)"
echo "  export CLOUDFLARE_ZONE_ID=\$(gcloud secrets versions access latest --secret=cloudflare-zone-id)"
echo ""