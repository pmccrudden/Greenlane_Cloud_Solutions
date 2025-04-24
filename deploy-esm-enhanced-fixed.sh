#!/bin/bash

# Enhanced ES Module deployment script for Cloud Run
# Uses enhanced diagnostic ESM server with frontend build fix

echo "=== Deploying Enhanced ESM Server to Cloud Run ==="

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

# Clean dist directory to avoid any previous build artifacts
echo "Cleaning dist directory..."
rm -rf ./dist
mkdir -p ./dist/public

# Build the frontend explicitly to ensure it exists
echo "Building frontend with Vite..."
export NODE_ENV=production
npm run build

# Verify the frontend was built successfully
if [ -f "./dist/public/index.html" ]; then
  echo "Frontend build successful!"
  ls -la ./dist/public/
else
  echo "WARNING: Frontend build may have failed. Creating fallback index.html"
  mkdir -p ./dist/public
  echo '<html><head><title>Greenlane CRM</title><script>window.location.href = "/debug";</script></head><body><h1>Greenlane CRM</h1><p>Loading application...</p></body></html>' > ./dist/public/index.html
fi

# Copy files to ensure static content is available
echo "Ensuring frontend files are available..."
mkdir -p ./dist/public/assets
cp -r ./client/src/assets ./dist/public/ 2>/dev/null || echo "No assets directory to copy"

# Build the Docker image locally
echo "Building enhanced ESM Docker image..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-esm-enhanced:latest -f Dockerfile.esm-enhanced .

# Push the image to GCR
echo "Pushing image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-esm-enhanced:latest

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy greenlane-crm-esm-enhanced \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-esm-enhanced:latest \
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
SERVICE_URL=$(gcloud run services describe greenlane-crm-esm-enhanced --region=us-central1 --format="value(status.url)" 2>/dev/null)

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
  
  # Open the logs
  echo ""
  echo "View logs:"
  echo "https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%20resource.labels.service_name%3D%22greenlane-crm-esm-enhanced%22?project=greenlane-cloud-solutions"
else
  echo "Service not yet available. Check Cloud Run logs for details."
  exit 1
fi