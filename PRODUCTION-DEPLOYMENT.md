# GreenLane CRM Production Deployment Guide

This guide provides detailed instructions for deploying GreenLane CRM to production with multi-tenant capabilities. The system is designed to be deployed to Google Cloud Run with Cloudflare DNS integration for subdomain-based tenant isolation.

## Architecture Overview

GreenLane CRM uses a multi-tenant architecture with the following components:

- **Frontend**: React application served from the same Cloud Run service
- **Backend**: Node.js/Express API with tenant isolation
- **Database**: PostgreSQL with schema-based multi-tenancy
- **DNS**: Cloudflare managed DNS with wildcard subdomains

Each tenant will have their own subdomain (e.g., `acme.greenlanecloudsolutions.com`) that points to the shared infrastructure.

## Prerequisites

Before deployment, make sure you have the following:

1. Google Cloud Platform account and `gcloud` CLI installed
2. Docker installed locally
3. Cloudflare account with your domain registered
4. Cloudflare API token with appropriate permissions
5. Stripe account for payment processing

## Quick Start Deployment

For a complete automated deployment including demo tenants, use:

```bash
# Set up Cloudflare configuration first
./setup-cloudflare-secrets.sh

# Then run the full deployment with demo tenants
./deploy-production-with-demo.sh
```

This script handles everything including:
- Setting up GCP project and services
- Building and deploying to Cloud Run
- Configuring Cloudflare DNS
- Creating demo tenants with sample data
- Verifying the deployment

## Manual Deployment Steps

### Environment Setup

Create two environment files:

1. `.env.deploy` - For deployment variables (not committed to repository)
2. `.env.production` - For runtime environment variables (will be stored as secrets)

### .env.deploy Example

```
GOOGLE_PROJECT_ID=greenlane-crm
GOOGLE_REGION=us-central1
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id
BASE_DOMAIN=greenlanecloudsolutions.com
SERVICE_HOSTNAME=your-service-hostname.a.run.app
```

### .env.production Example

```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:password@host:port/dbname
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
ANTHROPIC_API_KEY=sk-ant-...
BASE_DOMAIN=greenlanecloudsolutions.com
SESSION_SECRET=a_long_random_string
```

### Cloudflare DNS Setup

1. Set up Cloudflare secrets with the provided helper script:

```bash
./setup-cloudflare-secrets.sh
```

2. Or manually obtain your Cloudflare Zone ID using:

```bash
node get-cloudflare-zone-info.js greenlanecloudsolutions.com
```

3. Set up the DNS records for your domain:

```bash
node setup-cloudflare-dns.js
```

This will create:
- `app.greenlanecloudsolutions.com` - Main application
- `api.greenlanecloudsolutions.com` - API endpoint
- `*.greenlanecloudsolutions.com` - Wildcard for tenant subdomains

### Building and Deploying

1. Create a Google Secret for your environment variables:

```bash
gcloud secrets create greenlane-env --data-file=.env.production
```

2. Deploy the application using the multi-tenant deployment script:

```bash
bash deploy-multi-tenant.sh
```

## Tenant Management

### Creating a Standard Tenant

Use the tenant setup script to create a standard tenant:

```bash
node setup-tenant.js acme "Acme Corporation" admin@acme.com
```

### Creating a Demo Tenant with Sample Data

To create a demo tenant with comprehensive sample data for demos and prospects:

```bash
node setup-demo-tenant.js demo "Demo Account" demo@example.com
```

This creates a fully populated tenant with:
- Sample accounts, contacts, deals, and projects
- Demo support tickets
- All premium modules enabled
- Realistic data relationships

### Subdomain Validation

When creating tenants, the system performs comprehensive subdomain validation:
- Format validation (3-20 chars, alphanumeric + hyphens)
- Reserved name checking (app, api, admin, etc.)
- DNS record verification
- Database tenant verification

## Stripe Integration

### Webhook Configuration

1. In your Stripe Dashboard, create a webhook endpoint:
   - URL: `https://api.greenlanecloudsolutions.com/api/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`

2. Add the webhook secret to your environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Product Configuration

Set up your Stripe products and add their IDs to your environment variables:

```
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
```

## Monitoring and Maintenance

### Logs

View application logs in Google Cloud Run:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=greenlane-crm-app" --limit=50
```

### Updating the Application

1. Make your changes to the codebase
2. Run the deployment script again:
   ```bash
   bash deploy-multi-tenant.sh
   ```

### New Tenant Onboarding

When new tenants sign up through the application:

1. The system verifies subdomain availability using Cloudflare API
2. After payment, the system creates the tenant record and configures modules
3. The tenant is immediately accessible via their subdomain
4. Cloudflare DNS is automatically updated with the new tenant subdomain

## Troubleshooting

### DNS Issues

If tenant subdomains are not resolving:

1. Verify Cloudflare DNS records:
   ```bash
   node get-cloudflare-zone-info.js
   ```

2. Check if the wildcard record is properly set up
3. Note that DNS propagation can take up to 24 hours

### Database Connection Issues

Verify database connectivity:

```bash
gcloud compute ssh your-postgres-instance --command="psql -h localhost -U postgres -c 'SELECT current_database();'"
```

### Stripe Webhook Issues

1. Check Stripe Dashboard for webhook delivery attempts
2. Verify the webhook secret is correctly set
3. Inspect application logs for webhook processing errors

## Security Considerations

1. All tenant subdomains use HTTPS enforced by Cloudflare
2. Database access is restricted by tenant ID in queries
3. Cross-Origin Resource Sharing (CORS) is configured to restrict access
4. Environment secrets are stored in Google Secret Manager

## Scaling Considerations

The current architecture supports:

- Horizontal scaling of the application via Cloud Run
- Tenant isolation at the database level
- Shared infrastructure to reduce costs

For very high traffic, consider:
- Dedicated database instances for high-traffic tenants
- CDN caching for static assets
- Regional deployments for reduced latency

## Advanced Features

### Custom Domain Support (Future)

The architecture is designed to support future custom domain capabilities:
- Tenant admins can provide their own domain
- DNS verification and certificate management
- Custom domain mapping in the application

### Tenant Data Migration

For moving data between tenants or environments:
- Use the database export/import features
- Ensure tenant IDs are properly updated
- Verify relationships are maintained