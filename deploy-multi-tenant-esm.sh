#!/bin/bash
# Multi-tenant deployment script for ESM version

# Load environment variables
if [ -f .env.deploy ]; then
  echo "Loading environment variables from .env.deploy"
  export $(grep -v '^#' .env.deploy | xargs)
else
  echo "Warning: .env.deploy file not found"
fi

if [ -f .env.production ]; then
  echo "Loading environment variables from .env.production"
  export $(grep -v '^#' .env.production | xargs)
else
  echo "Warning: .env.production file not found"
fi

# Run the multi-tenant deployment script
echo "Starting multi-tenant deployment (ESM)..."
node deploy-multi-tenant-esm.js

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo "Multi-tenant deployment (ESM) completed successfully!"
  echo ""
  echo "You can now set up tenants with:"
  echo "1. Use API to create tenants through the app"
  echo "2. Add DNS records for existing tenants with: node add-tenant-subdomain.js <tenant-id>"
  echo ""
  echo "Main application: https://app.greenlanecloudsolutions.com"
  echo "API endpoint: https://api.greenlanecloudsolutions.com"
  echo "Tenant subdomains: https://<tenant-id>.greenlanecloudsolutions.com"
else
  echo "Multi-tenant deployment (ESM) failed."
  exit 1
fi