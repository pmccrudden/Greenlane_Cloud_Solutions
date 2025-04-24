#!/bin/bash

# Direct deployment script with fixing the missing package.json issue
# This script builds locally and deploys directly to Cloud Run

echo "=== Direct Deploying Greenlane CRM to Cloud Run (with package.json fix) ==="

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

# Create a temporary Dockerfile that ensures package.json is correctly copied
cat > Dockerfile.fix << 'EOF'
# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN ls -la

# Stage 2: Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Explicitly copy package files - this was missing before
COPY package.json ./
COPY package-lock.json ./

RUN npm ci --only=production

# Copy build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/stripeConfig.json ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server

# Verify files are present - this will show in the build logs
RUN echo "Verifying files in /app:"
RUN ls -la /app
RUN echo "Contents of /app/dist:"
RUN ls -la /app/dist || echo "dist directory missing!"
RUN echo "Checking for critical files:"
RUN ls -la /app/package.json || echo "package.json missing!"
RUN ls -la /app/server.js || echo "server.js missing!"

ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 8080

# Use node directly instead of npm to avoid package.json dependency
CMD ["node", "server.js"]
EOF

# Build the Docker image locally with the fixed Dockerfile
echo "Building Docker image locally..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-fixed:latest -f Dockerfile.fix .

# Push the image to GCR
echo "Pushing image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-fixed:latest

# Deploy directly to Cloud Run with explicit --no-command flag
echo "Deploying to Cloud Run..."
gcloud run deploy greenlane-crm-fixed \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-fixed:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --max-instances=2 \
  --min-instances=1 \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=600s \
  --set-env-vars="NODE_ENV=production,BASE_DOMAIN=greenlanecloudsolutions.com,CRM_DOMAIN=crm.greenlanecloudsolutions.com,API_DOMAIN=api.greenlanecloudsolutions.com,HOST=0.0.0.0" \
  --update-secrets=/app/.env=greenlane-env:latest \
  --quiet

echo "Deployment completed."

# Check service status
echo "Checking service status..."
SERVICE_URL=$(gcloud run services describe greenlane-crm-fixed --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -n "$SERVICE_URL" ]; then
  echo "Service is available at: $SERVICE_URL"
else
  echo "Service not yet available. Check Cloud Run logs for details."
fi