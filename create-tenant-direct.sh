#!/bin/bash
# Deploy a Cloud Run instance to run the tenant creation script directly

# Source environment variables
source .env.production

# Use the most recent service
SERVICE_URL=$(cat service_hostname.txt)
echo "Service URL: $SERVICE_URL"

# Create a Cloud Build job that runs the tenant creation script
gcloud builds submit --no-source --substitutions=_SERVICE_URL=$SERVICE_URL --config=- << EOF
steps:
- name: 'gcr.io/cloud-builders/curl'
  entrypoint: 'bash'
  args:
  - '-c'
  - |
    curl -X POST "https://${_SERVICE_URL}/api/admin/setup-tenant" \
      -H "Content-Type: application/json" \
      -d '{
        "tenantId": "greenlane",
        "companyName": "Greenlane Enterprises",
        "adminEmail": "greenlane.enterprisesltd@gmail.com",
        "adminPassword": "SnowBomb42!?",
        "modules": ["core", "accounts", "contacts", "deals", "projects", "tickets"]
      }'
EOF
