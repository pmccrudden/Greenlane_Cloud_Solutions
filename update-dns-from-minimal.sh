#!/bin/bash

# Script to set up Cloudflare DNS using the minimal service URL

echo "=== Setting up Cloudflare DNS for Greenlane CRM ==="

# Set base domain
export BASE_DOMAIN="greenlanecloudsolutions.com"

# Check if service_hostname.txt exists and read it
if [ -f "service_hostname.txt" ]; then
  export SERVICE_HOSTNAME=$(cat service_hostname.txt)
  echo "Using service hostname: $SERVICE_HOSTNAME"
else
  # If not, try to get it from gcloud
  echo "service_hostname.txt not found, retrieving from Cloud Run..."
  export SERVICE_HOSTNAME=$(gcloud run services describe greenlane-minimal --region=us-central1 --format="value(status.url)" | sed 's/https:\/\///')
  
  if [ -z "$SERVICE_HOSTNAME" ]; then
    echo "ERROR: Could not retrieve Cloud Run service hostname"
    echo "Please deploy the minimal service first with deploy-minimal-cloud.sh"
    exit 1
  fi
  
  echo "Service hostname retrieved: $SERVICE_HOSTNAME"
  # Save it for future use
  echo "$SERVICE_HOSTNAME" > service_hostname.txt
fi

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
node setup-cloudflare-dns.js

echo "DNS update process completed."
echo "Note: DNS changes may take some time to propagate globally (typically 5-30 minutes)."
echo "Once propagated, your application will be available at:"
echo " - https://$BASE_DOMAIN (marketing site)"
echo " - https://app.$BASE_DOMAIN (main app)"
echo " - https://api.$BASE_DOMAIN (API endpoints)"
echo " - https://<tenant-name>.$BASE_DOMAIN (for each tenant)"