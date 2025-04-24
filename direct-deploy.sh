#!/bin/bash

# Direct deployment script for Greenlane CRM with enhanced diagnostics
# This script builds locally and deploys directly to Cloud Run

echo "=== Direct Deploying Greenlane CRM to Cloud Run with Enhanced Diagnostics ==="

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

# Create a temporary Dockerfile with enhanced diagnostics
cat > Dockerfile.diagnostics << 'EOF'
# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production stage with diagnostics
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/stripeConfig.json ./stripeConfig.json 
ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 8080
# Install diagnostic tools
RUN apk add --no-cache curl

# Enable more verbose Node.js logging
ENV NODE_DEBUG=module,fs,http,net
ENV NODE_OPTIONS="--trace-warnings --trace-uncaught"
CMD ["node", "server.js"]
EOF

# Build the Docker image locally with the diagnostic Dockerfile
echo "Building diagnostic Docker image locally..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-diagnostic:latest -f Dockerfile.diagnostics .

# Push the image to GCR
echo "Pushing diagnostic image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-diagnostic:latest

# Deploy directly to Cloud Run with explicit --no-command flag
echo "Deploying diagnostic build to Cloud Run..."
gcloud run deploy greenlane-crm-diagnostic \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-diagnostic:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --max-instances=2 \
  --min-instances=1 \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=600s \
  --set-env-vars="NODE_ENV=production,BASE_DOMAIN=greenlanecloudsolutions.com,CRM_DOMAIN=crm.greenlanecloudsolutions.com,API_DOMAIN=api.greenlanecloudsolutions.com,HOST=0.0.0.0,DEBUG=*" \
  --update-secrets=/app/.env=greenlane-env:latest \
  --clear-command \
  --clear-args \
  --quiet

echo "Diagnostic deployment completed."

# Check service status
echo "Checking service status..."
SERVICE_URL=$(gcloud run services describe greenlane-crm-diagnostic --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -n "$SERVICE_URL" ]; then
  echo "Service is available at: $SERVICE_URL"
  echo ""
  echo "Checking diagnostic endpoint..."
  curl -s "$SERVICE_URL/debug" || echo "Could not reach diagnostic endpoint"
  echo ""
  echo "To check detailed logs, run:"
  echo "gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=greenlane-crm-diagnostic' --limit=50 --format=json"
else
  echo "Service not yet available. Check Cloud Run logs for details."
fi