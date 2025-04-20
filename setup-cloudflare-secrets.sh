#!/bin/bash
# Script to set up Cloudflare secrets for multi-tenant GreenLane CRM deployment

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up Cloudflare secrets for GreenLane CRM multi-tenant deployment${NC}"
echo -e "${YELLOW}This script will help you set up the necessary Cloudflare secrets for your deployment.${NC}"
echo 

# Check if .env.deploy exists
if [ -f .env.deploy ]; then
  echo -e "${YELLOW}Existing .env.deploy file found. Do you want to update it? (y/n)${NC}"
  read -r update_file
  if [[ "$update_file" != "y" && "$update_file" != "Y" ]]; then
    echo -e "${YELLOW}Exiting without changes.${NC}"
    exit 0
  fi
fi

# Prompt for Cloudflare API Token
echo -e "${GREEN}Enter your Cloudflare API Token:${NC}"
echo -e "${YELLOW}(You can create one at https://dash.cloudflare.com/profile/api-tokens)${NC}"
echo -e "${YELLOW}Required permissions: Zone.Zone Settings, Zone.DNS${NC}"
read -r cloudflare_api_token

# Validate Cloudflare API Token
if [ -z "$cloudflare_api_token" ]; then
  echo -e "${RED}Error: Cloudflare API Token is required.${NC}"
  exit 1
fi

# Prompt for domain
echo -e "${GREEN}Enter your domain name (e.g., greenlanecloudsolutions.com):${NC}"
read -r domain

# Validate domain
if [ -z "$domain" ]; then
  echo -e "${RED}Error: Domain name is required.${NC}"
  exit 1
fi

# Get Cloudflare Zone ID
echo -e "${BLUE}Fetching zone information for domain: ${domain}${NC}"

# Export the API token for Node.js script to use
export CLOUDFLARE_API_TOKEN="$cloudflare_api_token"

# Run the get-cloudflare-zone-info.js script
zone_info=$(node get-cloudflare-zone-info.js "$domain")

# Check if the script was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Error fetching zone information. Make sure your API token has the correct permissions.${NC}"
  exit 1
fi

# Extract zone ID from the script output
zone_id=$(echo "$zone_info" | grep "CLOUDFLARE_ZONE_ID=" | cut -d'=' -f2)

if [ -z "$zone_id" ]; then
  echo -e "${RED}Error: Could not extract Zone ID from the API response.${NC}"
  echo -e "${RED}Please check that your domain is registered with Cloudflare and your API token has access to it.${NC}"
  exit 1
fi

# Prompt for service hostname
echo -e "${GREEN}Enter your Cloud Run service hostname:${NC}"
echo -e "${YELLOW}(e.g., greenlane-crm-app-xxxxx-uc.a.run.app)${NC}"
echo -e "${YELLOW}Leave blank if not yet deployed - you can update later${NC}"
read -r service_hostname

# Create or update .env.deploy file
echo -e "${BLUE}Creating/updating .env.deploy file...${NC}"

# Create a temporary file
temp_env=$(mktemp)

# Write to the temporary file
cat > "$temp_env" << EOF
# Cloudflare configuration
CLOUDFLARE_API_TOKEN=$cloudflare_api_token
CLOUDFLARE_ZONE_ID=$zone_id
BASE_DOMAIN=$domain
EOF

# Add service hostname if provided
if [ -n "$service_hostname" ]; then
  echo "SERVICE_HOSTNAME=$service_hostname" >> "$temp_env"
fi

# Move the temporary file to .env.deploy
mv "$temp_env" .env.deploy

echo -e "${GREEN}Configuration saved to .env.deploy${NC}"
echo 

# Prompt to run DNS setup script
echo -e "${YELLOW}Do you want to set up Cloudflare DNS records now? (y/n)${NC}"
read -r setup_dns

if [[ "$setup_dns" == "y" || "$setup_dns" == "Y" ]]; then
  if [ -z "$service_hostname" ]; then
    echo -e "${RED}Cannot set up DNS without a service hostname.${NC}"
    echo -e "${YELLOW}You can run setup-cloudflare-dns.js manually later after you have a service hostname.${NC}"
  else
    echo -e "${BLUE}Setting up DNS records...${NC}"
    node setup-cloudflare-dns.js
  fi
fi

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Deploy your application with: ${BLUE}bash deploy-multi-tenant.sh${NC}"
echo -e "2. Test tenant creation with: ${BLUE}node setup-tenant.js acme \"Acme Corporation\" admin@acme.com${NC}"