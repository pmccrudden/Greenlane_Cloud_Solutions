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

## Step 3: Configure Cloudflare DNS for multi-tenant setup

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

## Step 4: Deploy the full application

Once DNS is configured, you can deploy the full application:

```bash
# Deploy using ESM app configuration
./deploy-esm-app.sh
```

## Step 5: Verify deployment and DNS configuration

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

### DNS Configuration Issues

- **DNS not resolving**: Cloudflare DNS changes can take 5-30 minutes to propagate globally
- **API authentication errors**: Verify your Cloudflare API token has Zone:DNS:Edit permissions
- **CNAME conflicts**: Check for existing DNS records that might conflict

## Next Steps

After successful deployment:

1. **Set up tenant provisioning**: Configure the system to automatically create and configure new tenants
2. **Implement CI/CD pipeline**: Set up automated deployments from your Git repository
3. **Configure monitoring and alerts**: Set up Cloud Monitoring for your application
4. **Implement backup strategy**: Set up database backups and disaster recovery

## Reference

- Cloud Run Documentation: https://cloud.google.com/run/docs
- Cloudflare API Documentation: https://developers.cloudflare.com/api
- GreenLane CRM API Documentation: [Internal Link - TBD]