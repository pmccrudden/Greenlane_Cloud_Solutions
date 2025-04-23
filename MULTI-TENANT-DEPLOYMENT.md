# Multi-Tenant GreenLane CRM Deployment Guide

This guide outlines the steps to deploy the GreenLane CRM multi-tenant application to Google Cloud Run and set up Cloudflare DNS for custom subdomain support.

## Prerequisites

- Google Cloud account with billing enabled
- Cloudflare account with your domain (greenlanecloudsolutions.com) configured
- Google Cloud SDK installed and configured
- Git repository cloned locally

## Deployment Process Overview

1. **Deploy minimal server to Cloud Run**
2. **Set up Cloudflare secrets in Google Cloud**
3. **Configure Cloudflare DNS for multi-tenant setup**
4. **Deploy the full application**
5. **Verify deployment and DNS configuration**

## Step 1: Deploy minimal server to Cloud Run

The minimal server provides a lightweight placeholder that will pass Cloud Run's health checks and allow DNS configuration while you work on the full application deployment.

```bash
# Make the deployment script executable
chmod +x deploy-minimal-cloud.sh

# Run the deployment script
./deploy-minimal-cloud.sh
```

This will create a service called `greenlane-minimal` on Cloud Run.

## Step 2: Set up Cloudflare secrets in Google Cloud

To securely manage your Cloudflare credentials:

```bash
# Make the script executable
chmod +x setup-cloudflare-secrets.sh

# Run the script (requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID in environment)
./setup-cloudflare-secrets.sh
```

This script will:
- Create secrets in Google Cloud Secret Manager
- Configure the Cloud Run service to access these secrets
- Provide instructions for using the secrets in your Google Cloud Shell

## Step 3: Fix Cloud Run IAM Permissions

Before configuring DNS, you need to ensure the Cloud Run service account has access to the Cloudflare secrets:

```bash
# Make the script executable
chmod +x fix-cloud-run-iam.sh

# Run the script to fix IAM permissions
./fix-cloud-run-iam.sh
```

This script will:
- Grant the Cloud Run service account access to the Cloudflare secrets
- Wait for IAM policy changes to propagate
- Update the service to apply the new permissions

## Step 4: Configure Cloudflare DNS for multi-tenant setup

Once the minimal server is deployed and secrets are configured:

```bash
# Make the DNS update script executable
chmod +x update-dns-from-minimal.sh

# Run the DNS update script
./update-dns-from-minimal.sh
```

This will configure Cloudflare DNS with:
- `app.greenlanecloudsolutions.com` → Cloud Run service
- `api.greenlanecloudsolutions.com` → Cloud Run service
- `*.greenlanecloudsolutions.com` → Cloud Run service (wildcard for tenant subdomains)

The DNS configuration uses a CommonJS script (setup-cloudflare-dns.cjs) that doesn't depend on external packages, making it more reliable for deployment environments.

## Step 5: Deploy the full application

Once DNS is configured, you can deploy the full application:

```bash
# Make the deployment script executable
chmod +x deploy-esm-app.sh

# Deploy using ESM app configuration
./deploy-esm-app.sh
```

The ESM app deployment:
- Uses ES modules for the application
- Deploys to a new Cloud Run service named `greenlane-crm-app`
- Connects to the same PostgreSQL database
- Serves the frontend React application
- Provides API endpoints for the application

### Environment Files for Deployment

The deployment relies on environment files in the project root:

1. `.env.deploy` - Used during the build process
2. `.env.production` - Used by the containerized application

Make sure these files exist and contain the required environment variables listed in the "Environment Variables Required" section below.

## Step 6: Verify deployment and DNS configuration

To check that everything is working correctly:

```bash
# Make the verification script executable
chmod +x check-deployment-status.sh

# Run the verification script
./check-deployment-status.sh
```

This will check:
- Cloud Run service status
- DNS resolution for key domains
- Connectivity tests

## Troubleshooting

### Cloud Run Deployment Issues

- **Health check failures**: Ensure your app binds to the port specified by the `PORT` environment variable (default: 8080) immediately on startup
- **Container startup timeout**: Simplify your startup process to ensure quick binding to the port
- **Secret access issues**: Check that service account has access to Secret Manager secrets

### ES Module Compatibility Issues

- **ES modules not loading**: Make sure your package.json has `"type": "module"` and required changes to import syntax
- **CommonJS versus ES Module confusion**: Use the .cjs extension for CommonJS files
- **Server not starting**: Consider using a bootstrap approach with a minimal server for health checks

### DNS Configuration Issues

- **DNS not resolving**: Cloudflare DNS changes can take 5-30 minutes to propagate globally
- **API authentication errors**: Verify your Cloudflare API token has Zone:DNS:Edit permissions
- **CNAME conflicts**: Check for existing DNS records that might conflict

### Cloud Run Service Permission Issues

- **Cannot access Secret Manager**: Run the `fix-cloud-run-iam.sh` script to grant proper permissions
- **IAM policy changes not taking effect**: Wait a few minutes for propagation and redeploy the service

## Environment Variables Required

The application requires several environment variables to function properly:

### Cloudflare Variables
- `CLOUDFLARE_API_TOKEN`: API token from Cloudflare with Zone:DNS:Edit permissions
- `CLOUDFLARE_ZONE_ID`: The zone ID for your domain in Cloudflare

### Database Variables
- `DATABASE_URL`: URL to your PostgreSQL database
- `PGHOST`: PostgreSQL host
- `PGPORT`: PostgreSQL port
- `PGUSER`: PostgreSQL username
- `PGPASSWORD`: PostgreSQL password
- `PGDATABASE`: PostgreSQL database name

### Stripe Variables (For payment processing)
- `STRIPE_SECRET_KEY`: Secret key from Stripe
- `VITE_STRIPE_PUBLIC_KEY`: Public key from Stripe (for frontend)
- `STRIPE_PRICE_ID_MONTHLY`: ID for monthly subscription price
- `STRIPE_PRICE_ID_ANNUAL`: ID for annual subscription price

### AI Integration
- `ANTHROPIC_API_KEY`: API key for Anthropic Claude integration

### Application Variables
- `BASE_DOMAIN`: Base domain for the application (default: greenlanecloudsolutions.com)
- `PORT`: Port for the server to listen on (default: 8080)
- `NODE_ENV`: Environment (production, development)

## Next Steps

After successful deployment:

1. **Set up tenant provisioning**: Configure the system to automatically create and configure new tenants
2. **Implement CI/CD pipeline**: Set up automated deployments from your Git repository
3. **Configure monitoring and alerts**: Set up Cloud Monitoring for your application
4. **Implement backup strategy**: Set up database backups and disaster recovery
5. **Scale horizontally**: Configure Cloud Run autoscaling based on load

## Reference

- Cloud Run Documentation: https://cloud.google.com/run/docs
- Cloudflare API Documentation: https://developers.cloudflare.com/api
- GreenLane CRM API Documentation: [Internal Link - TBD]