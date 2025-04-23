#!/bin/bash

# This script updates Cloudflare DNS settings to point to the deployed Cloud Run service

# Set variables 
export BASE_DOMAIN="greenlanecloudsolutions.com"

# Get Cloud Run service URL
echo "Retrieving Cloud Run service URL..."
export SERVICE_HOSTNAME=$(gcloud run services describe greenlane-crm-app --region=us-central1 --format="value(status.url)" | sed 's/https:\/\///')

if [ -z "$SERVICE_HOSTNAME" ]; then
  echo "ERROR: Could not retrieve Cloud Run service URL"
  echo "Please check if the service is deployed correctly."
  exit 1
fi

echo "Cloud Run service hostname: $SERVICE_HOSTNAME"

# Check for Cloudflare credentials
if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo "Cloudflare credentials not found in environment."
  echo "Please set the following environment variables:"
  echo "  CLOUDFLARE_API_TOKEN - Your Cloudflare API token"
  echo "  CLOUDFLARE_ZONE_ID - Zone ID for your domain $BASE_DOMAIN"
  exit 1
fi

# Run the Cloudflare DNS setup script
echo "Updating Cloudflare DNS settings..."
node --experimental-modules setup-cloudflare-dns.js

echo "DNS update process completed."
echo "Note: DNS changes may take some time to propagate globally."
echo "Once propagated, your application will be available at:"
echo " - https://app.$BASE_DOMAIN"
echo " - https://api.$BASE_DOMAIN"
echo " - https://<tenant-name>.$BASE_DOMAIN"