# Multi-Tenant Deployment Guide for Greenlane CRM

This guide outlines how to deploy and configure the Greenlane CRM application with multi-tenant support using Google Cloud Run and Cloudflare DNS.

## Prerequisites

- Google Cloud SDK (gcloud) installed and configured
- Cloudflare account with API token
- Domain name configured in Cloudflare DNS
- Greenlane CRM codebase with latest changes

## Step 1: Deploy to Google Cloud Run

The `deploy-esm-app.sh` script handles the deployment to Google Cloud Run.

```bash
# Make the script executable
chmod +x deploy-esm-app.sh

# Run the deployment script
./deploy-esm-app.sh
```

This will build and deploy the container to Cloud Run with the following configuration:
- ES Module support for proper Node.js compatibility
- Two-phase server startup for reliable health checks
- Minimum 1 instance for fast response times
- Maximum 10 instances for auto-scaling

## Step 2: Set Up Cloudflare DNS for Multi-Tenant Support

### 2.1 Set Required Environment Variables

```bash
# Cloudflare API token with Zone:DNS:Edit permissions
export CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"

# Cloudflare Zone ID for your domain (from Cloudflare Dashboard)
export CLOUDFLARE_ZONE_ID="your_cloudflare_zone_id"

# Base domain for your application
export BASE_DOMAIN="greenlanecloudsolutions.com"
```

### 2.2 Update DNS Records

```bash
# Make the script executable
chmod +x update-cloudflare-dns.sh

# Run the script to update DNS records
./update-cloudflare-dns.sh
```

This script will create or update the following DNS records:
- `app.$BASE_DOMAIN` → Cloud Run service URL
- `api.$BASE_DOMAIN` → Cloud Run service URL
- `*.$BASE_DOMAIN` → Cloud Run service URL (wildcard for tenant subdomains)

## Step 3: Configure Environment Variables in Cloud Run

Update the Cloud Run service with the required environment variables:

```bash
gcloud run services update greenlane-crm-app \
  --region=us-central1 \
  --set-env-vars="NODE_ENV=production,BASE_DOMAIN=$BASE_DOMAIN"
```

## Step 4: Create Initial Tenant

After the DNS changes have propagated, create your first tenant:

```bash
# Run the tenant creation script
node --experimental-modules setup-tenant.js \
  --name "Demo Company" \
  --domain "demo" \
  --adminEmail "admin@example.com" \
  --adminPassword "securePassword"
```

This will create:
- A new tenant record in the database
- An admin user for the tenant
- Basic demo data for the tenant

## Step 5: Verify Multi-Tenant Setup

After setup is complete, your application should be accessible at:

1. Main application: `https://app.$BASE_DOMAIN`
2. API endpoint: `https://api.$BASE_DOMAIN`
3. Tenant sites: `https://<tenant-subdomain>.$BASE_DOMAIN`

For example, the demo tenant would be at `https://demo.$BASE_DOMAIN`

## Troubleshooting

### DNS Propagation Issues

- Cloudflare DNS changes usually propagate quickly, but can take up to 24 hours in some cases
- Verify DNS records in Cloudflare Dashboard
- Use `dig <subdomain>.$BASE_DOMAIN` to check DNS resolution

### Cloud Run Connectivity

- Check if the Cloud Run service is deployed and running
- Verify the service URL is correct using `gcloud run services describe greenlane-crm-app --region=us-central1`
- Check service logs for any errors: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=greenlane-crm-app"`

### Database Connection Issues

- Verify that Cloud Run service has access to the database
- Check database connection string in environment variables
- Review logs for database connection errors

## Next Steps

1. Set up automated tenant provisioning through the marketing website
2. Configure monitoring and alerts for the production service
3. Establish backup and disaster recovery procedures
4. Implement staging environment for testing changes before production