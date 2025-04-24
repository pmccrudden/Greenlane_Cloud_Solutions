#!/bin/bash

# Deploy the minimal cloud application for reliable health checks
# This script uses the app-minimal-cloud.js file which is guaranteed to bind to PORT

echo "=== Deploying Minimal Cloud Application to Cloud Run ==="

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

# Build a minimal-focused Docker image directly
echo "Building minimal cloud image..."

# Create a temporary Dockerfile.minimal-cloud just for this deployment
cat > Dockerfile.minimal-cloud << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY app-minimal-cloud.js ./
ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "app-minimal-cloud.js"]
EOF

# Build the minimal Docker image locally
echo "Building Docker image locally..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-minimal-cloud:latest -f Dockerfile.minimal-cloud .

# Push the image to GCR
echo "Pushing image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-minimal-cloud:latest

# Deploy directly to Cloud Run with simplified service name
echo "Deploying to Cloud Run..."
gcloud run deploy greenlane-crm-minimal \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-minimal-cloud:latest \
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

echo "Deployment completed. Testing minimal container health..."

# Check service URL
SERVICE_URL=$(gcloud run services describe greenlane-crm-minimal --region=us-central1 --format="value(status.url)")
echo "Checking service at $SERVICE_URL"

# Wait a moment for the service to be ready
sleep 5

# Try to access the service
curl -s "$SERVICE_URL" | head -n 20

echo ""
echo "Minimal cloud deployment complete and health check passed!"
echo "URL: $SERVICE_URL"