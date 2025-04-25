#!/bin/bash
# Deploy tenant authentication fix
# This script builds and deploys the fixed tenant authentication system

# Configuration
SERVICE_NAME="greenlane-crm-tenant-auth-fix"
REGION="us-central1"
SERVICE_ACCOUNT="greenlane-crm-service-account@greenlane-cloud-solutions.iam.gserviceaccount.com"
ENV_FILE=".env.production"

echo "Deploying Tenant Authentication Fix"
echo "=================================="

# Step 1: Copy the fixed tenant auth files to the main files
echo "Copying fixed tenant authentication files..."
cp client/src/lib/tenant-auth-fix.js client/src/lib/tenant-auth.ts
cp client/src/components/auth/SignInForm-fix.tsx client/src/components/auth/SignInForm.tsx

# Step 2: Build the application
echo "Building the application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Please check the errors above."
  exit 1
fi

echo "✅ Build successful"

# Step 3: Deploy to Cloud Run with tenant auth fix
echo "Deploying to Cloud Run..."

# Update Dockerfile to include VITE_STRIPE_PUBLIC_KEY
cat > Dockerfile.tenant-auth-fix << EOF
FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV VITE_STRIPE_PUBLIC_KEY=pk_test_12345
ENV PORT=8080

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
EOF

# Load environment variables
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
else
  echo "⚠️ Warning: $ENV_FILE not found. Using default environment variables."
fi

# Build and deploy using Cloud Build
gcloud builds submit --tag gcr.io/greenlane-cloud-solutions/$SERVICE_NAME \
  --project=greenlane-cloud-solutions \
  --substitutions=_ENV_FILE=$ENV_FILE,_PORT=8080,_SERVICE_NAME=$SERVICE_NAME

if [ $? -ne 0 ]; then
  echo "❌ Build submission failed. Please check the errors above."
  exit 1
fi

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/greenlane-cloud-solutions/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --service-account $SERVICE_ACCOUNT \
  --allow-unauthenticated \
  --project=greenlane-cloud-solutions \
  --set-env-vars="VITE_STRIPE_PUBLIC_KEY=pk_test_12345"

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed. Please check the errors above."
  exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project=greenlane-cloud-solutions \
  --format='value(status.url)')

SERVICE_HOSTNAME=$(echo $SERVICE_URL | sed 's/https:\/\///')

# Save the service hostname for other scripts
echo $SERVICE_HOSTNAME > service_hostname.txt

echo "✅ Tenant authentication fix deployed successfully"
echo "Service URL: $SERVICE_URL"
echo "Service Hostname: $SERVICE_HOSTNAME"

echo ""
echo "Next steps:"
echo "1. Run './fix-api-routes.sh' to update API routes"
echo "2. Run './deploy-cloudflare-auth-fix.sh' to update the Cloudflare Worker"
echo "3. Update the Cloudflare Worker in the Cloudflare dashboard"

# Done
exit 0