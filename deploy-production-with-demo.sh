#!/bin/bash
# Comprehensive deployment script for GreenLane CRM with demo tenant setup
# This script handles:
# 1. Cloud Run deployment
# 2. DNS configuration
# 3. Demo tenant setup

# Configuration - Update these values or use environment variables
PROJECT_ID="${GOOGLE_PROJECT_ID:-greenlane-crm}"
SERVICE_NAME="${GOOGLE_SERVICE_NAME:-greenlane-crm-app}"
REGION="${GOOGLE_REGION:-us-central1}"
MAX_INSTANCES=10
MIN_INSTANCES=1
MEMORY="1Gi"
CPU="1"
CONCURRENCY=80
TIMEOUT="300s"
BASE_DOMAIN="${BASE_DOMAIN:-greenlanecloudsolutions.com}"
PRIMARY_DOMAIN="app.${BASE_DOMAIN}"
API_DOMAIN="api.${BASE_DOMAIN}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_section() {
  echo -e "\n${BOLD}${BLUE}==== $1 ====${NC}\n"
}

print_step() {
  echo -e "${GREEN}$1${NC}"
}

print_warning() {
  echo -e "${YELLOW}$1${NC}"
}

print_error() {
  echo -e "${RED}$1${NC}"
}

check_requirements() {
  print_section "Checking Requirements"
  
  # Check if gcloud is installed
  if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
    exit 1
  fi
  
  # Check if docker is installed
  if ! command -v docker &> /dev/null; then
    print_error "docker is not installed. Please install it from https://docs.docker.com/get-docker/"
    exit 1
  }
  
  # Check if node is installed
  if ! command -v node &> /dev/null; then
    print_error "node is not installed. Please install it from https://nodejs.org/"
    exit 1
  }
  
  # Check if required environment variables are set
  if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    print_error "CLOUDFLARE_API_TOKEN environment variable is not set"
    print_warning "Run ./setup-cloudflare-secrets.sh to set up Cloudflare configuration"
    exit 1
  fi
  
  if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    print_error "CLOUDFLARE_ZONE_ID environment variable is not set"
    print_warning "Run ./setup-cloudflare-secrets.sh to set up Cloudflare configuration"
    exit 1
  }
  
  print_step "All requirements satisfied"
}

setup_gcp_project() {
  print_section "Setting Up Google Cloud Project"
  
  # Set the GCP project
  print_step "Setting GCP project to: $PROJECT_ID"
  gcloud config set project $PROJECT_ID
  
  # Enable required APIs
  print_step "Enabling required GCP APIs"
  gcloud services enable cloudbuild.googleapis.com run.googleapis.com secretmanager.googleapis.com
  
  # Check if .env.production exists
  if [ ! -f .env.production ]; then
    print_warning "Warning: .env.production file not found. Creating a template..."
    cat > .env.production << EOF
NODE_ENV=production
PORT=8080
DATABASE_URL=${DATABASE_URL:-postgresql://postgres:password@localhost:5432/greenlanecrmdb}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-sk_test_your_stripe_secret_key}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-whsec_your_stripe_webhook_secret}
BASE_DOMAIN=${BASE_DOMAIN}
SESSION_SECRET=${SESSION_SECRET:-$(openssl rand -hex 32)}
EOF
    print_warning "Please update .env.production with your actual secrets before continuing"
    print_warning "Press Enter to continue or Ctrl+C to abort..."
    read
  fi
  
  # Create or update the GCP secret
  print_step "Creating/updating GCP secret for environment variables"
  if gcloud secrets describe greenlane-env &>/dev/null; then
    # Secret exists, update it
    gcloud secrets versions add greenlane-env --data-file=.env.production
  else
    # Secret doesn't exist, create it
    gcloud secrets create greenlane-env --data-file=.env.production
  fi
}

deploy_to_cloud_run() {
  print_section "Deploying to Google Cloud Run"
  
  # Build and tag the Docker image
  print_step "Building Docker image"
  docker build -t "gcr.io/$PROJECT_ID/$SERVICE_NAME" .
  
  # Push the image to Google Container Registry
  print_step "Pushing image to Google Container Registry"
  docker push "gcr.io/$PROJECT_ID/$SERVICE_NAME"
  
  # Deploy to Cloud Run
  print_step "Deploying to Cloud Run"
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
  
  # Get the deployed service URL
  SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')
  SERVICE_HOSTNAME=$(echo $SERVICE_URL | sed 's/https:\/\///')
  
  print_step "Service deployed to: ${SERVICE_URL}"
  
  # Export the service hostname for DNS configuration
  export SERVICE_HOSTNAME=$SERVICE_HOSTNAME
}

configure_dns() {
  print_section "Configuring DNS"
  
  # Map the primary domain
  print_step "Mapping primary domain ${PRIMARY_DOMAIN} to the service"
  gcloud beta run domain-mappings create \
    --service $SERVICE_NAME \
    --region $REGION \
    --domain $PRIMARY_DOMAIN
  
  # Map the API domain
  print_step "Mapping API domain ${API_DOMAIN} to the service"
  gcloud beta run domain-mappings create \
    --service $SERVICE_NAME \
    --region $REGION \
    --domain $API_DOMAIN
  
  # Set up Cloudflare DNS records
  print_step "Setting up Cloudflare DNS records"
  node setup-cloudflare-dns.js
  
  print_step "DNS configuration complete"
}

create_demo_tenants() {
  print_section "Creating Demo Tenants"
  
  # Create a 'demo' tenant
  print_step "Creating 'demo' tenant"
  node setup-demo-tenant.js demo "GreenLane Demo" demo@greenlanecloudsolutions.com "demopassword"
  
  # Create a 'prospect' tenant
  print_step "Creating 'prospect' tenant"
  node setup-demo-tenant.js prospect "Prospect Showcase" prospect@greenlanecloudsolutions.com "prospectdemo"
  
  print_step "Demo tenants created successfully"
}

verify_deployment() {
  print_section "Verifying Deployment"
  
  # Check if the main service is responding
  print_step "Checking main service"
  if curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}" | grep -q "200\|301\|302"; then
    print_step "✓ Main service is responding"
  else
    print_warning "⚠ Main service is not responding properly"
  fi
  
  # Check if the primary domain is working (this might not work immediately due to DNS propagation)
  print_step "Checking primary domain (may fail if DNS hasn't propagated)"
  if curl -s -o /dev/null -w "%{http_code}" "https://${PRIMARY_DOMAIN}" | grep -q "200\|301\|302"; then
    print_step "✓ Primary domain is responding"
  else
    print_warning "⚠ Primary domain is not responding - DNS may not have propagated yet"
  fi
  
  # Check demo tenant (will likely fail until DNS propagates)
  print_step "Checking demo tenant (may fail if DNS hasn't propagated)"
  if curl -s -o /dev/null -w "%{http_code}" "https://demo.${BASE_DOMAIN}" | grep -q "200\|301\|302"; then
    print_step "✓ Demo tenant domain is responding"
  else
    print_warning "⚠ Demo tenant domain is not responding - DNS may not have propagated yet"
  fi
}

show_summary() {
  print_section "Deployment Summary"
  
  echo -e "${BOLD}GreenLane CRM has been deployed to Google Cloud Run${NC}"
  echo
  echo -e "${BOLD}Service Information:${NC}"
  echo -e "Service URL: ${SERVICE_URL}"
  echo -e "Region: ${REGION}"
  echo
  echo -e "${BOLD}Domain Information:${NC}"
  echo -e "Main Application: https://${PRIMARY_DOMAIN}"
  echo -e "API Endpoint: https://${API_DOMAIN}"
  echo
  echo -e "${BOLD}Demo Tenants:${NC}"
  echo -e "Demo Tenant: https://demo.${BASE_DOMAIN}"
  echo -e "  Username: demo@greenlanecloudsolutions.com"
  echo -e "  Password: demopassword"
  echo
  echo -e "Prospect Tenant: https://prospect.${BASE_DOMAIN}"
  echo -e "  Username: prospect@greenlanecloudsolutions.com"
  echo -e "  Password: prospectdemo"
  echo
  echo -e "${YELLOW}Note: DNS changes may take up to 24 hours to fully propagate globally.${NC}"
  echo -e "${YELLOW}If the domains are not immediately accessible, please try again later.${NC}"
}

# Main execution flow
check_requirements
setup_gcp_project
deploy_to_cloud_run
configure_dns
create_demo_tenants
verify_deployment
show_summary

print_section "Next Steps"
echo -e "1. Share the demo tenant URL with prospects: https://demo.${BASE_DOMAIN}"
echo -e "2. Monitor the application logs: gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}'"
echo -e "3. To create additional tenants: node setup-tenant.js <tenant-id> \"<company-name>\" <admin-email>"