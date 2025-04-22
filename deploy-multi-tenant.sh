#!/bin/bash
# Multi-Tenant Cloud Run Deployment Script with Cloudflare DNS Integration

# Configuration - Update these values
PROJECT_ID="greenlane-cloud-solutions"
SERVICE_NAME="greenlane-crm-app"
REGION="us-central1"
MAX_INSTANCES=10
MIN_INSTANCES=1
MEMORY="1Gi"
CPU="1"
CONCURRENCY=80
TIMEOUT="300s"
BASE_DOMAIN="greenlanecloudsolutions.com"
PRIMARY_DOMAIN="app.${BASE_DOMAIN}"
API_DOMAIN="api.${BASE_DOMAIN}"
CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID}"  # Your Cloudflare Zone ID for the domain

# Load secrets from environment
if [ -f ".env.deploy" ]; then
  source .env.deploy
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment to Google Cloud Run with Multi-Tenant support...${NC}"

# Check required environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo -e "${RED}Error: CLOUDFLARE_API_TOKEN environment variable is required for domain management${NC}"
  echo "Create a .env.deploy file with CLOUDFLARE_API_TOKEN=your_token or export it before running this script"
  exit 1
fi

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
  echo -e "${RED}Error: CLOUDFLARE_ZONE_ID is required for Cloudflare domain management${NC}"
  exit 1
fi

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
  --set-env-vars "NODE_ENV=production,BASE_DOMAIN=${BASE_DOMAIN}" \
  --update-secrets="/app/.env=greenlane-env:latest"

# Step 4: Get the deployed service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')
SERVICE_HOSTNAME=$(echo $SERVICE_URL | sed 's/https:\/\///')

echo -e "${GREEN}Service deployed to: ${SERVICE_URL}${NC}"

# Step 5: Map the primary domain
echo -e "${GREEN}Mapping primary domain ${PRIMARY_DOMAIN} to the service...${NC}"
gcloud beta run domain-mappings create \
  --service $SERVICE_NAME \
  --region $REGION \
  --domain $PRIMARY_DOMAIN

# Step 6: Map the API domain
echo -e "${GREEN}Mapping API domain ${API_DOMAIN} to the service...${NC}"
gcloud beta run domain-mappings create \
  --service $SERVICE_NAME \
  --region $REGION \
  --domain $API_DOMAIN

# Step 7: Set up Cloudflare DNS for the primary domain and API domain
echo -e "${BLUE}Setting up Cloudflare DNS for primary and API domains...${NC}"

# Function to create or update Cloudflare CNAME record
create_or_update_cname() {
  local subdomain=$1
  local target=$2
  local record_name="${subdomain}.${BASE_DOMAIN}"
  
  # Check if record exists
  existing_record=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${record_name}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json")
  
  record_id=$(echo $existing_record | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | head -1)
  
  if [ -z "$record_id" ]; then
    # Create new record
    echo -e "${BLUE}Creating CNAME record for ${record_name} → ${target}${NC}"
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '{"type":"CNAME","name":"'"${subdomain}"'","content":"'"${target}"'","ttl":1,"proxied":true}'
  else
    # Update existing record
    echo -e "${BLUE}Updating CNAME record for ${record_name} → ${target}${NC}"
    curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${record_id}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '{"type":"CNAME","name":"'"${subdomain}"'","content":"'"${target}"'","ttl":1,"proxied":true}'
  fi
}

# Create/update 'app' CNAME record
create_or_update_cname "app" $SERVICE_HOSTNAME

# Create/update 'api' CNAME record
create_or_update_cname "api" $SERVICE_HOSTNAME

# Step 8: Set up Cloudflare DNS wildcard for customer subdomains
echo -e "${BLUE}Setting up Cloudflare DNS wildcard for tenant subdomains...${NC}"

# Create/update wildcard CNAME record
create_or_update_cname "*" $SERVICE_HOSTNAME

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "Primary application URL: https://${PRIMARY_DOMAIN}"
echo -e "API URL: https://${API_DOMAIN}"
echo -e "Tenant URLs will be available as: https://[tenant-name].${BASE_DOMAIN}"
echo -e "${YELLOW}Note: DNS changes may take some time to propagate.${NC}"