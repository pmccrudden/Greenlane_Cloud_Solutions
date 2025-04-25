#!/bin/bash
# Fix API routes for tenant authentication
# This script updates the Cloud Run service configuration to ensure API requests work correctly
# for the tenant login system, especially for /api/auth/login endpoints

# Get current Cloud Run service URL
SERVICE_HOSTNAME=$(cat service_hostname.txt)
if [ -z "$SERVICE_HOSTNAME" ]; then
  echo "Error: service_hostname.txt not found or empty"
  echo "Please run the deployment script first to generate the service hostname"
  exit 1
fi

# Configuration
REGION="us-central1"  # Change if your region is different
SERVICE_NAME="greenlane-crm-tenant-login-fix"  # Update with your service name

echo "Updating Cloud Run service to fix API routes..."
echo "Service: $SERVICE_NAME"
echo "Hostname: $SERVICE_HOSTNAME"
echo "Region: $REGION"

# Update service to fix API routes
gcloud run services update $SERVICE_NAME \
  --set-env-vars="API_BASE_URL=https://$SERVICE_HOSTNAME" \
  --region=$REGION

if [ $? -eq 0 ]; then
  echo "✅ API routes successfully updated to use $SERVICE_HOSTNAME"
  echo "Now update your Cloudflare Worker with the latest code to handle the auth login properly"
else
  echo "❌ Failed to update API routes"
  echo "Please check that you have the correct service name and region"
fi