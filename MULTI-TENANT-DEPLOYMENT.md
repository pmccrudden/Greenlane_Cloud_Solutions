# Multi-Tenant Deployment Guide for Greenlane CRM

This document provides detailed instructions for deploying Greenlane CRM in a multi-tenant architecture with custom domain and subdomain support.

## Prerequisites

1. Google Cloud Platform account with Cloud Run and Container Registry enabled
2. Cloudflare account with access to DNS settings for your domain
3. Domain registered and configured with Cloudflare
4. PostgreSQL database (Neon or other provider)
5. Environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `CLOUDFLARE_API_TOKEN`: API token with DNS editing permissions
   - `CLOUDFLARE_ZONE_ID`: Zone ID for your domain
   - `BASE_DOMAIN`: Your domain (e.g. greenlanecloudsolutions.com)
   - `STRIPE_SECRET_KEY`: For payment processing (optional)
   - `STRIPE_PRICE_ID_MONTHLY`: For subscription plans (optional)
   - `STRIPE_PRICE_ID_ANNUAL`: For subscription plans (optional)

## Deployment Steps

### 1. Initial Setup

1. Clone the repository
2. Configure environment variables:
   ```bash
   export CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
   export CLOUDFLARE_ZONE_ID="your-cloudflare-zone-id" 
   export BASE_DOMAIN="greenlanecloudsolutions.com"
   export DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>"
   export STRIPE_SECRET_KEY="your-stripe-secret-key"
   ```

### 2. Deploy the Application to Cloud Run

1. Build and deploy using the ESM-enhanced Docker configuration:
   ```bash
   chmod +x deploy-production-domain.sh
   ./deploy-production-domain.sh
   ```

2. Verify the application is running by checking the URL provided at the end of the deployment.

### 3. Configure DNS and Subdomains

1. The deployment script will automatically create the necessary DNS records in Cloudflare:
   - `app.greenlanecloudsolutions.com` - Main application
   - `api.greenlanecloudsolutions.com` - API endpoint
   - `*.greenlanecloudsolutions.com` - Wildcard for tenant subdomains

2. Wait for DNS propagation (can take 5-15 minutes)

### 4. Create Initial Tenant

1. Use the tenant creation script to set up your first tenant:
   ```bash
   node setup-tenant.js acme "Acme Corporation" admin@acme.com
   ```

2. This will create:
   - A new tenant in the database
   - Admin user for the tenant
   - DNS record for `acme.greenlanecloudsolutions.com`
   - Default modules for the tenant

3. Access the tenant's instance at `https://acme.greenlanecloudsolutions.com`

### 5. Setup Demo Data (Optional)

1. For testing or demonstration purposes, you can create a demo tenant with sample data:
   ```bash
   node setup-demo-tenant.js
   ```

### 6. Verify Multi-tenant Access

1. Test the main application at `https://app.greenlanecloudsolutions.com`
2. Test the tenant subdomain at `https://acme.greenlanecloudsolutions.com`
3. Verify that data is correctly isolated between tenants

## Troubleshooting

### DNS Issues

- Check if DNS propagation is complete using `dig` or online DNS lookup tools
- Verify Cloudflare API token permissions
- Ensure Cloudflare nameservers are correctly configured for your domain

### Application Errors

- Check Cloud Run logs for application errors
- Test the application directly using the Cloud Run URL
- Validate that required environment variables are correctly set

### Database Connection Issues

- Test database connectivity from local environment
- Check if IP restrictions are in place on the database
- Verify connection string format

### Tenant Creation Issues

- Check if subdomain is valid (3-20 characters, lowercase letters, numbers, and hyphens only)
- Verify the tenant ID doesn't already exist in the database
- Check for errors in the setup script output

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloudflare DNS API Documentation](https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records)
- [Neon PostgreSQL Documentation](https://neon.tech/docs)

## Maintenance and Updates

To update the application:

1. Push changes to the repository
2. Re-run the deployment script:
   ```bash
   ./deploy-production-domain.sh
   ```