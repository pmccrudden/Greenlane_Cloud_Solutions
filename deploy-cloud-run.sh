#!/bin/bash
# Cloud Run Deployment Script

# Configuration - Update these values
PROJECT_ID="greenlane-crm"
SERVICE_NAME="greenlane-crm-app"
REGION="us-central1"
MAX_INSTANCES=10
MIN_INSTANCES=1
MEMORY="1Gi"
CPU="1"
CONCURRENCY=80
TIMEOUT="300s"
DOMAIN="app.greenlanecloudsolutions.com"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment to Google Cloud Run...${NC}"

# Step 1: Build and tag the Docker image
echo -e "${GREEN}Building Docker image...${NC}"
docker build -t "gcr.io/$PROJECT_ID/$SERVICE_NAME" .

# Step 2: Push the image to Google Container Registry
echo -e "${GREEN}Pushing image to Google Container Registry...${NC}"
docker push "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Step 3: Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --max-instances $MAX_INSTANCES \
  --min-instances $MIN_INSTANCES \
  --memory $MEMORY \
  --cpu $CPU \
  --concurrency $CONCURRENCY \
  --timeout $TIMEOUT \
  --set-env-vars "NODE_ENV=production" \
  --update-secrets="/app/.env=greenlane-env:latest"

# Step 4: Map the domain (if provided)
if [ ! -z "$DOMAIN" ]; then
  echo -e "${GREEN}Mapping domain $DOMAIN to the service...${NC}"
  gcloud beta run domain-mappings create \
    --service $SERVICE_NAME \
    --region $REGION \
    --domain $DOMAIN
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "You can access your service at:"
gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)'