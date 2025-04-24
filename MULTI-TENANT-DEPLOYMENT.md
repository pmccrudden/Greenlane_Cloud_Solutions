# Multi-Tenant Deployment Guide for Greenlane CRM

This guide explains how to deploy the Greenlane CRM platform in a multi-tenant configuration and set up new tenants.

## Prerequisites

1. Google Cloud project with Cloud Run and Cloud SQL enabled
2. Cloudflare account with a registered domain
3. Required environment variables set (see below)

## Required Environment Variables

Create two files in the project root directory:

### .env.deploy

```
# Google Cloud settings
PROJECT_ID=your-gcloud-project-id
REGION=us-central1
SERVICE_NAME=greenlane-crm-esm-enhanced

# Database settings
DB_INSTANCE_NAME=your-db-instance-name
DB_NAME=greenlane_crm
DB_USERNAME=postgres
```

### .env.production

```
# Application settings
SESSION_SECRET=your-session-secret
PORT=8080

# Cloudflare credentials
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ZONE_ID=your-cloudflare-zone-id
CLOUDFLARE_DOMAIN=greenlanecloudsolutions.com

# Stripe settings
STRIPE_SECRET_KEY=your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_PRICE_ID_MONTHLY=your-stripe-price-id-monthly
STRIPE_PRICE_ID_ANNUAL=your-stripe-price-id-annual

# AI integration settings
ANTHROPIC_API_KEY=your-anthropic-api-key

# Database URL for Google Cloud SQL
DATABASE_URL=postgresql://postgres:password@/greenlane_crm?host=/cloudsql/your-project:your-region:your-instance
```

## Deployment Process

### 1. Deploy the ESM Enhanced Application

```bash
# Make the script executable (if needed)
chmod +x deploy-multi-tenant-esm.sh

# Run the deployment script
./deploy-multi-tenant-esm.sh
```

This script will:
1. Deploy the application to Google Cloud Run
2. Configure Cloudflare DNS for the main domain and wildcard subdomains
3. Output the URLs for accessing the application

### 2. Create Tenants

You can create tenants using the interactive setup script:

```bash
node complete-tenant-setup.js
```

Follow the prompts to enter:
- Tenant ID (used as subdomain)
- Company name
- Admin email
- Admin password

The script will:
1. Create the tenant in the database
2. Set up the admin user
3. Configure default modules
4. Create the DNS record for the tenant subdomain

### 3. Adding DNS Records for Existing Tenants

If you have existing tenants that need DNS records, you can use:

```bash
node add-tenant-subdomain.js <tenant-id>
```

This will create a CNAME record pointing `<tenant-id>.greenlanecloudsolutions.com` to the Cloud Run service.

## Using the Application

After deployment, the following URLs will be available:

- Main application: `https://app.greenlanecloudsolutions.com`
- API endpoint: `https://api.greenlanecloudsolutions.com`
- Tenant applications: `https://<tenant-id>.greenlanecloudsolutions.com`

## Troubleshooting

### DNS Issues

- DNS changes may take time to propagate (typically 5-30 minutes)
- Verify Cloudflare settings in the Cloudflare dashboard
- Check that the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` are correct

### Database Connection Issues

- Make sure the Cloud SQL instance is running
- Verify the database connection string in `.env.production`
- Check the Cloud Run service account has access to the Cloud SQL instance

### Application Errors

- View logs in Google Cloud Console
- Try setting the `DEBUG=true` environment variable for more detailed logs
- Verify all required environment variables are set

## Advanced Configuration

### Custom Domains for Tenants

For premium tenants who want their own domain instead of a subdomain:

1. Create a CNAME record in the tenant's domain pointing to the Cloud Run service
2. Update the tenant in the database to use the custom domain
3. Configure Cloudflare (or other provider) to handle the DNS and SSL