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
  echo "Attempting to retrieve from Google Cloud Secret Manager..."
  
  # Check if the secrets exist in Google Cloud Secret Manager
  if gcloud secrets describe cloudflare-api-token --project=greenlane-cloud-solutions &>/dev/null; then
    echo "Found Cloudflare API Token in Secret Manager. Retrieving..."
    export CLOUDFLARE_API_TOKEN=$(gcloud secrets versions access latest --secret=cloudflare-api-token --project=greenlane-cloud-solutions)
  else
    echo "Cloudflare API Token not found in Secret Manager."
    read -sp "Enter Cloudflare API Token: " CLOUDFLARE_API_TOKEN
    echo ""
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
      echo "Error: Cloudflare API Token is required."
      exit 1
    fi
    export CLOUDFLARE_API_TOKEN
  fi
  
  if gcloud secrets describe cloudflare-zone-id --project=greenlane-cloud-solutions &>/dev/null; then
    echo "Found Cloudflare Zone ID in Secret Manager. Retrieving..."
    export CLOUDFLARE_ZONE_ID=$(gcloud secrets versions access latest --secret=cloudflare-zone-id --project=greenlane-cloud-solutions)
  else
    echo "Cloudflare Zone ID not found in Secret Manager."
    read -sp "Enter Cloudflare Zone ID: " CLOUDFLARE_ZONE_ID
    echo ""
    if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
      echo "Error: Cloudflare Zone ID is required."
      exit 1
    fi
    export CLOUDFLARE_ZONE_ID
  fi
fi

# Run the Cloudflare DNS setup script
echo "Updating Cloudflare DNS settings..."
# Make variables available to Node.js script
export NODE_ENV=production
export SERVICE_HOSTNAME=$SERVICE_HOSTNAME
export BASE_DOMAIN=$BASE_DOMAIN

# Use the CommonJS version of the script (.cjs extension)
node setup-cloudflare-dns.cjs

echo "DNS update process completed."
echo "Note: DNS changes may take some time to propagate globally (typically 5-30 minutes)."
echo "Once propagated, your application will be available at:"
echo " - https://$BASE_DOMAIN (marketing site)"
echo " - https://app.$BASE_DOMAIN (main app)"
echo " - https://api.$BASE_DOMAIN (API endpoints)"
echo " - https://<tenant-name>.$BASE_DOMAIN (for each tenant)"