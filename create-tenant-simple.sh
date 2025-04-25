#!/bin/bash
# Simple script to create a tenant directly using curl

# Source environment variables
source .env.production

# Use the most recent service
SERVICE_URL=$(cat service_hostname.txt)
echo "Service URL: $SERVICE_URL"

# Call the API directly using curl
echo "Creating tenant..."
curl -X POST "https://${SERVICE_URL}/api/admin/setup-tenant" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "greenlane",
    "companyName": "Greenlane Enterprises",
    "adminEmail": "greenlane.enterprisesltd@gmail.com",
    "adminPassword": "SnowBomb42!?",
    "modules": ["core", "accounts", "contacts", "deals", "projects", "tickets"]
  }'

echo ""
echo "Done! If successful, you can now access your tenant at:"
echo "https://greenlane.greenlanecloudsolutions.com"
echo "Login with: greenlane.enterprisesltd@gmail.com / SnowBomb42!?"
