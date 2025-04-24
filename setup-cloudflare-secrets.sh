#!/bin/bash
# Setup Cloudflare secrets for multi-tenant deployment

echo "=== Cloudflare DNS Configuration for Multi-Tenant Deployment ==="
echo "This script will help you set up the required Cloudflare credentials"
echo "for multi-tenant DNS configuration."
echo ""

# Check if secrets are already set
if [ -n "$CLOUDFLARE_API_TOKEN" ] && [ -n "$CLOUDFLARE_ZONE_ID" ]; then
  echo "Cloudflare secrets are already set in the environment."
  echo "  API Token: ${CLOUDFLARE_API_TOKEN:0:5}...${CLOUDFLARE_API_TOKEN: -5}"
  echo "  Zone ID:   ${CLOUDFLARE_ZONE_ID}"
  echo ""
  read -p "Do you want to update these values? (y/n): " update_secrets
  if [[ "$update_secrets" != "y" && "$update_secrets" != "Y" ]]; then
    echo "Keeping existing secrets. Exiting..."
    exit 0
  fi
fi

# Instructions for obtaining Cloudflare credentials
echo "To configure Cloudflare DNS for multi-tenant deployment, you need:"
echo "1. A Cloudflare API Token with 'Zone:DNS:Edit' permissions"
echo "2. Your Cloudflare Zone ID for your domain"
echo ""
echo "Instructions to obtain these:"
echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
echo "2. Click 'Create Token'"
echo "3. Select 'Create Custom Token'"
echo "4. Provide a name (e.g., 'Greenlane CRM DNS Manager')"
echo "5. Under 'Permissions', add:"
echo "   - Zone - DNS - Edit"
echo "6. Under 'Zone Resources', select your domain"
echo "7. Click 'Continue to Summary' and then 'Create Token'"
echo ""
echo "To find your Zone ID:"
echo "1. Go to https://dash.cloudflare.com"
echo "2. Select your domain"
echo "3. On the overview page, scroll down to the API section"
echo "4. Your Zone ID is listed there"
echo ""

read -p "Please enter your Cloudflare API Token: " api_token
read -p "Please enter your Cloudflare Zone ID: " zone_id
read -p "Please enter your base domain (e.g., greenlanecloudsolutions.com): " base_domain

# Validate inputs
if [ -z "$api_token" ]; then
  echo "Error: API Token is required."
  exit 1
fi

if [ -z "$zone_id" ]; then
  echo "Error: Zone ID is required."
  exit 1
fi

if [ -z "$base_domain" ]; then
  echo "Using default domain: greenlanecloudsolutions.com"
  base_domain="greenlanecloudsolutions.com"
fi

# Update .env.production file if it exists, or create it
if [ -f .env.production ]; then
  # Update existing file
  if grep -q "CLOUDFLARE_API_TOKEN" .env.production; then
    # Replace existing values
    sed -i "s|CLOUDFLARE_API_TOKEN=.*|CLOUDFLARE_API_TOKEN=$api_token|" .env.production
  else
    # Add new values
    echo "CLOUDFLARE_API_TOKEN=$api_token" >> .env.production
  fi
  
  if grep -q "CLOUDFLARE_ZONE_ID" .env.production; then
    sed -i "s|CLOUDFLARE_ZONE_ID=.*|CLOUDFLARE_ZONE_ID=$zone_id|" .env.production
  else
    echo "CLOUDFLARE_ZONE_ID=$zone_id" >> .env.production
  fi
  
  if grep -q "BASE_DOMAIN" .env.production; then
    sed -i "s|BASE_DOMAIN=.*|BASE_DOMAIN=$base_domain|" .env.production
  else
    echo "BASE_DOMAIN=$base_domain" >> .env.production
  fi
else
  # Create new file
  cat > .env.production << EOF
# Cloudflare DNS Configuration
CLOUDFLARE_API_TOKEN=$api_token
CLOUDFLARE_ZONE_ID=$zone_id
BASE_DOMAIN=$base_domain

# Other production settings
# Add other environment variables here as needed
EOF
fi

# Set environment variables for current session
export CLOUDFLARE_API_TOKEN=$api_token
export CLOUDFLARE_ZONE_ID=$zone_id
export BASE_DOMAIN=$base_domain

echo ""
echo "=== Configuration Complete ==="
echo "Cloudflare credentials have been saved to .env.production"
echo ""
echo "Do you want to verify the credentials by testing the Cloudflare API connection?"
read -p "(y/n): " test_connection

if [[ "$test_connection" == "y" || "$test_connection" == "Y" ]]; then
  echo "Testing Cloudflare API connection..."
  
  # Check if we have node and curl available
  if command -v node &> /dev/null; then
    # Use Node.js to test the API
    node -e "
    const fetch = require('node-fetch');
    
    async function testConnection() {
      try {
        const response = await fetch(
          'https://api.cloudflare.com/client/v4/zones/${zone_id}',
          {
            headers: {
              'Authorization': 'Bearer ${api_token}',
              'Content-Type': 'application/json'
            }
          }
        );
        
        const data = await response.json();
        if (data.success) {
          console.log('\n✓ Connection successful!');
          console.log('Domain: ' + data.result.name);
        } else {
          console.error('\n✗ Connection failed:');
          console.error(data.errors);
        }
      } catch (error) {
        console.error('\n✗ Connection failed:', error.message);
      }
    }
    
    testConnection();
    "
  elif command -v curl &> /dev/null; then
    # Use curl as a fallback
    response=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${zone_id}" \
      -H "Authorization: Bearer ${api_token}" \
      -H "Content-Type: application/json")
    
    if echo "$response" | grep -q '"success":true'; then
      domain=$(echo "$response" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
      echo ""
      echo "✓ Connection successful!"
      echo "Domain: $domain"
    else
      echo ""
      echo "✗ Connection failed:"
      echo "$response"
    fi
  else
    echo "Neither Node.js nor curl is available. Skipping connection test."
  fi
fi

echo ""
echo "Next steps:"
echo "1. Deploy the application: ./deploy-multi-tenant.sh"
echo "2. Create a tenant: node setup-tenant.js <tenant-id> \"Company Name\" admin@example.com"
echo ""