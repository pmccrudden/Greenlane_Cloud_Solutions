#!/bin/bash

# Simplified deployment script focused on frontend fix
# Builds and deploys a container with proper frontend files

echo "=== Deploying Frontend-Fixed Version to Cloud Run ==="

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

# Build and push the Docker image with fixed frontend
echo "Building Docker image with frontend fix..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-frontend-fix:latest -f Dockerfile.frontend-fix .

echo "Pushing image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-frontend-fix:latest

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy greenlane-crm-frontend-fix \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-frontend-fix:latest \
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

# Check service status
echo "Checking service status..."
SERVICE_URL=$(gcloud run services describe greenlane-crm-frontend-fix --region=us-central1 --format="value(status.url)" 2>/dev/null)

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
  
  # Update Cloudflare DNS records to point to this new service
  echo ""
  echo "To update Cloudflare DNS records for this new service, run:"
  echo "node setup-cloudflare-dns.js"
  
  # Open the logs
  echo ""
  echo "View logs:"
  echo "https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%20resource.labels.service_name%3D%22greenlane-crm-frontend-fix%22?project=greenlane-cloud-solutions"
else
  echo "Service not yet available. Check Cloud Run logs for details."
  exit 1
fi