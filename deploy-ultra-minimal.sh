#!/bin/bash

# Ultra-minimal deployment script for Cloud Run
# This script creates and deploys the simplest possible Node.js server

echo "=== Deploying Ultra-Minimal Server to Cloud Run ==="

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

# Create a temporary Dockerfile for the ultra-minimal server
cat > Dockerfile.minimal << 'EOF'
FROM node:16-alpine
WORKDIR /app
COPY app-minimal.js .
ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "app-minimal.js"]
EOF

# Build the Docker image locally
echo "Building ultra-minimal Docker image locally..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-minimal:latest -f Dockerfile.minimal .

# Push the image to GCR
echo "Pushing image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-minimal:latest

# Deploy to Cloud Run with minimal config
echo "Deploying to Cloud Run..."
gcloud run deploy greenlane-crm-minimal \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-minimal:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --max-instances=2 \
  --min-instances=1 \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=60s \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0" \
  --quiet

echo "Deployment completed."

# Check service status
echo "Checking service status..."
SERVICE_URL=$(gcloud run services describe greenlane-crm-minimal --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -n "$SERVICE_URL" ]; then
  echo "Service is available at: $SERVICE_URL"
  echo ""
  echo "Testing the endpoint..."
  curl -s -o /dev/null -w "Status code: %{http_code}\n" "$SERVICE_URL"
else
  echo "Service not yet available. Check Cloud Run logs for details."
fi