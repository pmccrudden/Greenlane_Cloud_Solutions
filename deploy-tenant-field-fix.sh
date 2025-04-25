#!/bin/bash
# Enhanced deploy script for ensuring tenant field visibility in the login form
# This script includes modifications to the Cloudflare Worker and application code

set -e

# Check if we're running in Cloud Shell
if [ -z "$CLOUD_SHELL" ]; then
  echo "This script is designed to run in Google Cloud Shell."
  echo "If not running in Cloud Shell, make sure you have gcloud, Docker, and the Cloudflare API token configured."
fi

echo "🚀 Deploying tenant field fix to Cloud Run and Cloudflare..."

# Source environment variables
if [ -f .env.production ]; then
  source .env.production
  echo "✅ Loaded .env.production"
elif [ -f .env.deploy ]; then
  source .env.deploy
  echo "✅ Loaded .env.deploy"
else
  echo "❌ ERROR: Neither .env.production nor .env.deploy found!"
  echo "Please create one of these files with the required environment variables."
  exit 1
fi

# Check required environment variables
if [ -z "$PROJECT_ID" ]; then
  echo "❌ ERROR: PROJECT_ID not set in environment."
  exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ ERROR: CLOUDFLARE_API_TOKEN not set in environment."
  exit 1
fi

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo "❌ ERROR: CLOUDFLARE_ZONE_ID not set in environment."
  exit 1
fi

# Set default service name and create a unique name with date/time stamp
SERVICE_BASE="greenlane-crm-tenant-field-fix"
TIMESTAMP=$(date +%y%m%d-%H%M)
SERVICE_NAME="${SERVICE_BASE}-${TIMESTAMP}"

echo "📦 Building and deploying service: $SERVICE_NAME"

# Make sure we're logged in to GCP
gcloud auth login --brief --no-launch-browser || true
gcloud config set project $PROJECT_ID

# Build and deploy to Cloud Run
echo "🔨 Building and deploying to Cloud Run..."
gcloud builds submit --config=cloudbuild.simple.yaml \
  --substitutions=_SERVICE_NAME=${SERVICE_NAME},_REGION=us-central1 .

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 10

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=us-central1 --format='value(status.url)' | sed 's/https:\/\///')
echo "✅ Deployed to: $SERVICE_URL"

# Save the service URL to a file
echo $SERVICE_URL > service_hostname.txt
echo "✅ Service hostname saved to service_hostname.txt"

# Update the Cloudflare worker with the new service URL
echo "📝 Updating Cloudflare Worker with new service URL..."
sed "s/REPLACE_WITH_YOUR_SERVICE_HOSTNAME/$SERVICE_URL/g" cloudflare-worker-tenant-login-fix.js > worker-updated.js

# Deploy to Cloudflare
echo "☁️ Deploying Cloudflare Worker..."
curl -X PUT "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/workers/scripts/greenlane-multi-tenant" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -F "metadata=@-;type=application/json;filename=metadata.json" \
  -F "script=@worker-updated.js;type=application/javascript" \
  --form-string "metadata={\"body_part\":\"script\",\"bindings\":[{\"name\":\"ENVIRONMENT\",\"type\":\"secret_text\",\"text\":\"production\"}]}" \
  | jq '.success'

# Configure routes for the worker
echo "🛣️ Setting up Cloudflare Worker routes..."
MAIN_DOMAIN="greenlanecloudsolutions.com"
ROUTE="*.$MAIN_DOMAIN/*"

# Create or update the route
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"pattern\":\"$ROUTE\",\"script\":\"greenlane-multi-tenant\"}" | jq '.success'

echo "✅ Cloudflare Worker deployed and configured!"

# Final message
echo "✅ Tenant field fix deployment complete!"
echo "📝 Notes:"
echo "   - The service is available at: https://$SERVICE_URL"
echo "   - Requests to *.greenlanecloudsolutions.com will be handled by the updated Cloudflare Worker"
echo "   - The app subdomain (app.greenlanecloudsolutions.com) now sets X-Show-Tenant-Field header"
echo "   - The SignInForm component has been updated to look for this header"
echo ""
echo "🔍 To verify the fix:"
echo "   1. Visit app.greenlanecloudsolutions.com/signin"
echo "   2. The tenant field should now be visible on the sign-in form"
echo ""
echo "If you're not seeing the field, try clearing your browser cache or use incognito mode."