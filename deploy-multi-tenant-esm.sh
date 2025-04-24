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

# Deploy the ESM enhanced application
echo "Starting ESM Enhanced deployment..."
./deploy-esm-enhanced.sh

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo "ESM Enhanced deployment completed successfully!"
  
  # Set up Cloudflare DNS
  echo "Setting up Cloudflare DNS..."
  node setup-cloudflare-dns.js
  
  if [ $? -eq 0 ]; then
    echo ""
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
    echo "DNS setup failed. You can manually set up DNS records later."
    echo "See MULTI-TENANT-DEPLOYMENT.md for instructions."
    exit 1
  fi
else
  echo "ESM Enhanced deployment failed."
  exit 1
fi