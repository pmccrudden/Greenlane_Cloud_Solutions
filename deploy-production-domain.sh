#!/bin/bash

# Production deployment script with domain mapping for Greenlane CRM
# This script deploys the application and sets up custom domain mappings

echo "=== Deploying Greenlane CRM to Production with Custom Domain ==="

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

# Build the Docker image using ESM Enhanced configuration
echo "Building ESM Enhanced Docker image for production..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-production:latest -f Dockerfile.esm-enhanced .

# Push the image to GCR
echo "Pushing image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-production:latest

# Deploy to Cloud Run with production settings
echo "Deploying to Cloud Run..."
gcloud run deploy greenlane-crm-app \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-production:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --max-instances=10 \
  --min-instances=1 \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=300s \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0" \
  --quiet

echo "Deployment completed."

# Get the service URL and save it
SERVICE_URL=$(gcloud run services describe greenlane-crm-app --region=us-central1 --format="value(status.url)" 2>/dev/null)
SERVICE_HOSTNAME=$(echo $SERVICE_URL | cut -d'/' -f3)

if [ -n "$SERVICE_HOSTNAME" ]; then
  echo "Service is available at: $SERVICE_URL"
  echo $SERVICE_HOSTNAME > service_hostname.txt
  echo "Service hostname saved to service_hostname.txt"
  
  # Set up environment for DNS configuration
  echo "Setting up environment for DNS configuration..."
  export SERVICE_HOSTNAME=$SERVICE_HOSTNAME
  export BASE_DOMAIN=greenlanecloudsolutions.com
  
  # Run the Cloudflare DNS setup script
  echo "Configuring Cloudflare DNS..."
  node setup-cloudflare-dns.js
  
  echo ""
  echo "Domain configuration completed."
  echo "Your application should now be accessible at:"
  echo "  - https://app.greenlanecloudsolutions.com (main application)"
  echo "  - https://<tenant-name>.greenlanecloudsolutions.com (tenant subdomains)"
  echo ""
  echo "Note: DNS propagation may take some time (usually 5-15 minutes, but can take longer)."
else
  echo "Service URL could not be determined. Check Cloud Run logs for details."
fi