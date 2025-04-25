#!/bin/bash
# Digital Journey Fix Deployment Script
# This script updates the Cloudflare worker to properly handle digital journeys and email templates

echo "Deploying Digital Journey Fix for Greenlane CRM"

# Find the current Cloud Run service hostname
if [ -f "service_hostname.txt" ]; then
  SERVICE_HOSTNAME=$(cat service_hostname.txt)
  echo "Using existing service hostname: $SERVICE_HOSTNAME"
else
  echo "Finding service hostname..."
  SERVICE_NAME=$(gcloud run services list --platform managed --region=us-central1 --format="value(name)" | grep -E 'tenant-login-fix')
  
  if [ -z "$SERVICE_NAME" ]; then
    echo "Error: Could not find the tenant login fix service"
    echo "Attempting to use fixed name: greenlane-crm-tenant-login-fix"
    SERVICE_NAME="greenlane-crm-tenant-login-fix"
  fi
  
  echo "Found service: $SERVICE_NAME"
  
  # Get the service URL
  SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --platform managed \
    --region=us-central1 \
    --format="value(status.url)")
  
  SERVICE_HOSTNAME=${SERVICE_URL#https://}
  echo "Service hostname: $SERVICE_HOSTNAME"
  echo $SERVICE_HOSTNAME > service_hostname.txt
fi

# Update the Cloudflare Worker
echo "Creating Cloudflare Worker file with the correct hostname..."
sed "s/const CLOUD_RUN_URL = \".*\";/const CLOUD_RUN_URL = \"$SERVICE_HOSTNAME\";/" \
  cloudflare-worker-digital-journey-fix.js > cloudflare-worker-updated.js

echo ""
echo "✅ Success! The updated Cloudflare Worker is in 'cloudflare-worker-updated.js'"
echo ""
echo "Please copy the contents of 'cloudflare-worker-updated.js' to your Cloudflare Worker in the Cloudflare dashboard"
echo ""
echo "Once deployed, you should be able to access digital journeys and email templates without errors"