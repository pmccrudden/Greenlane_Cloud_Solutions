#!/bin/bash
# Deploy Cloudflare Worker Auth Login Fix
# This script updates the Cloudflare worker script with the correct Cloud Run service URL
# from service_hostname.txt file

# Get current service hostname
SERVICE_HOSTNAME=$(cat service_hostname.txt)
if [ -z "$SERVICE_HOSTNAME" ]; then
  echo "Error: service_hostname.txt not found or empty"
  echo "Please run the deployment script first to generate the service hostname"
  exit 1
fi

echo "Updating Cloudflare Worker with Service URL: $SERVICE_HOSTNAME"

# Update the Cloudflare worker script with the current service hostname
sed -i "s|const CLOUD_RUN_URL = \".*\"|const CLOUD_RUN_URL = \"$SERVICE_HOSTNAME\"|" cloudflare-worker-auth-login-fix.js

if [ $? -eq 0 ]; then
  echo "✅ Updated Cloudflare Worker script with correct service URL"
  echo ""
  echo "Next steps:"
  echo "1. Copy the contents of cloudflare-worker-auth-login-fix.js"
  echo "2. Go to Cloudflare Dashboard > Workers & Pages > Your Worker"
  echo "3. Paste the updated code and deploy"
  echo ""
  echo "Once the Cloudflare Worker is updated, your tenant login SSO should work correctly"
else
  echo "❌ Failed to update Cloudflare Worker script"
  echo "Please manually edit cloudflare-worker-auth-login-fix.js and replace"
  echo "CLOUD_RUN_URL with: $SERVICE_HOSTNAME"
fi