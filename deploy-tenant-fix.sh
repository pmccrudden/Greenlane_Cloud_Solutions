#!/bin/bash

# Deployment script with proper environment variables for tenant handling
# This ensures the database connection is available for tenant verification

echo "=== Deploying Multi-Tenant Fixed Version to Cloud Run ==="

# Check if we're logged in to gcloud
gcloud auth list --filter=status:ACTIVE --format="value(account)" || {
  echo "Not logged in to gcloud. Please run 'gcloud auth login' first."
  exit 1
}

# Make sure we're in the correct GCP project
PROJECT_ID=$(gcloud config get-value project)
echo "Current GCP project: $PROJECT_ID"
if [ "$PROJECT_ID" != "greenlane-cloud-solutions" ]; then
  echo "Switching to greenlane-cloud-solutions project..."
  gcloud config set project greenlane-cloud-solutions
fi

# Load environment variables from .env.production
if [ -f .env.production ]; then
  echo "Loading environment variables from .env.production"
  source .env.production
  
  # Verify critical variables
  if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL is not set in .env.production"
    echo "Multi-tenant functionality will not work without a database connection"
  fi
  
  if [ -z "$BASE_DOMAIN" ]; then
    echo "Setting default BASE_DOMAIN"
    BASE_DOMAIN="greenlanecloudsolutions.com"
  fi
else
  echo "Warning: .env.production file not found"
  echo "Creating a basic .env.production file"
  echo "BASE_DOMAIN=greenlanecloudsolutions.com" > .env.production
  BASE_DOMAIN="greenlanecloudsolutions.com"
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-tenant-fix:latest -f Dockerfile.simple-fix .

# Push the image to GCR
echo "Pushing image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-tenant-fix:latest

# Convert environment variables to --set-env-vars format for gcloud
ENV_VARS="NODE_ENV=production,HOST=0.0.0.0,BASE_DOMAIN=$BASE_DOMAIN"

if [ ! -z "$DATABASE_URL" ]; then
  ENV_VARS="$ENV_VARS,DATABASE_URL=$DATABASE_URL"
fi

if [ ! -z "$STRIPE_SECRET_KEY" ]; then
  ENV_VARS="$ENV_VARS,STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
fi

if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
  ENV_VARS="$ENV_VARS,CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN"
fi

if [ ! -z "$CLOUDFLARE_ZONE_ID" ]; then
  ENV_VARS="$ENV_VARS,CLOUDFLARE_ZONE_ID=$CLOUDFLARE_ZONE_ID"
fi

# Deploy to Cloud Run
echo "Deploying to Cloud Run with environment variables..."
echo "Environment: $ENV_VARS"

gcloud run deploy greenlane-crm-tenant-fix \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-tenant-fix:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --max-instances=10 \
  --min-instances=1 \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=300s \
  --set-env-vars="$ENV_VARS" \
  --quiet

echo "Deployment completed."

# Check service status
echo "Checking service status..."
SERVICE_URL=$(gcloud run services describe greenlane-crm-tenant-fix --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -n "$SERVICE_URL" ]; then
  echo "Service is available at: $SERVICE_URL"
  echo ""
  echo "Testing the endpoints:"
  echo "Main endpoint:"
  curl -s -o /dev/null -w "Status code: %{http_code}\n" "$SERVICE_URL"
  
  echo "Debug endpoint:"
  echo "$SERVICE_URL/debug"
  
  # Save the service hostname to a file for DNS configuration
  SERVICE_HOSTNAME=$(echo "$SERVICE_URL" | sed 's,^https://,,g')
  echo "$SERVICE_HOSTNAME" > service_hostname.txt
  echo "Service hostname saved to service_hostname.txt: $SERVICE_HOSTNAME"
  
  echo ""
  echo "NEXT STEPS:"
  echo "1. Update your Cloudflare Worker with the new service hostname: $SERVICE_HOSTNAME"
  echo "2. Update your Cloudflare DNS records:"
  echo "   node setup-cloudflare-dns.js"
  
  # Open the logs
  echo ""
  echo "View logs:"
  echo "https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%20resource.labels.service_name%3D%22greenlane-crm-tenant-fix%22?project=greenlane-cloud-solutions"
else
  echo "Service not yet available. Check Cloud Run logs for details."
  exit 1
fi