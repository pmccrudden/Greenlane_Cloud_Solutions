#!/bin/bash
# Deploy the Greenlane CRM application to Google Cloud Run with multi-tenant configuration

# Exit on any error
set -e

# Load environment variables from file if exists
if [ -f .env.production ]; then
  echo "Loading environment variables from .env.production..."
  export $(grep -v '^#' .env.production | xargs)
fi

# Check required environment variables
REQUIRED_VARS=(
  "DATABASE_URL" 
  "CLOUDFLARE_API_TOKEN" 
  "CLOUDFLARE_ZONE_ID"
)

MISSING_VARS=()
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    MISSING_VARS+=("$VAR")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "Error: The following required environment variables are missing:"
  for VAR in "${MISSING_VARS[@]}"; do
    echo "  - $VAR"
  done
  echo "Please set them in .env.production or export them before running this script."
  exit 1
fi

# Set default values
BASE_DOMAIN=${BASE_DOMAIN:-"greenlanecloudsolutions.com"}
APP_NAME=${APP_NAME:-"greenlane-crm-app"}
REGION=${REGION:-"us-central1"}
SERVICE_ACCOUNT=${SERVICE_ACCOUNT:-""}
MIN_INSTANCES=${MIN_INSTANCES:-0}
MAX_INSTANCES=${MAX_INSTANCES:-10}
MEMORY=${MEMORY:-"512Mi"}
CPU=${CPU:-"1"}
TIMEOUT=${TIMEOUT:-"300s"}

echo "=== Deploying Greenlane CRM Multi-Tenant Application ==="
echo "Base domain: $BASE_DOMAIN"
echo "App name: $APP_NAME"
echo "Region: $REGION"

# Get the project ID from gcloud config
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
  echo "Error: Unable to determine project ID. Please run 'gcloud config set project YOUR_PROJECT_ID' first."
  exit 1
fi

echo "Project ID: $PROJECT_ID"

# Build and deploy the container
echo "Building and deploying container..."

# Build the container
gcloud builds submit \
  --config cloudbuild.esm-enhanced.yaml \
  --substitutions _APP_NAME=$APP_NAME,_REGION=$REGION,_DATABASE_URL="$DATABASE_URL"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $APP_NAME --platform managed --region $REGION --format 'value(status.url)')
if [ -z "$SERVICE_URL" ]; then
  echo "Error: Unable to get service URL. Deployment may have failed."
  exit 1
fi

# Extract hostname from the URL (remove https:// prefix)
SERVICE_HOSTNAME=${SERVICE_URL#https://}
echo "Service hostname: $SERVICE_HOSTNAME"

# Save the service hostname to a file (for Cloudflare setup)
echo "$SERVICE_HOSTNAME" > service_hostname.txt

# Configure Cloudflare DNS
echo "Setting up Cloudflare DNS for multi-tenant operation..."
node setup-cloudflare-dns.js

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Greenlane CRM is now deployed with multi-tenant support:"
echo "- Cloud Run URL: $SERVICE_URL"
echo "- Main application: https://app.$BASE_DOMAIN"
echo "- API endpoint: https://api.$BASE_DOMAIN"
echo "- Tenant subdomains: https://<tenant-id>.$BASE_DOMAIN"
echo ""
echo "Next steps:"
echo "1. Create an initial tenant: node setup-tenant.js <tenant-id> \"Company Name\" admin@example.com"
echo "2. Wait for DNS propagation (5-15 minutes)"
echo "3. Access the application at the URLs above"
echo ""
echo "For more information, see MULTI-TENANT-DEPLOYMENT.md"