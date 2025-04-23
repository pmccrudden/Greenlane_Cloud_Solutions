#!/bin/bash

# Script to check the status of Greenlane CRM deployments

echo "=== Checking Greenlane CRM Deployment Status ==="

# Check minimal deployment
echo "Checking minimal deployment (greenlane-minimal)..."
MINIMAL_STATUS=$(gcloud run services describe greenlane-minimal --region=us-central1 --format="value(status.conditions[0].type),value(status.conditions[0].status),value(status.conditions[0].message)")
MINIMAL_URL=$(gcloud run services describe greenlane-minimal --region=us-central1 --format="value(status.url)")

if [[ "$MINIMAL_STATUS" == *"True"* ]]; then
  echo "✅ Minimal deployment is HEALTHY"
  echo "   URL: $MINIMAL_URL"
  
  # Test the health endpoint
  echo "   Testing health endpoint..."
  HEALTH_RESPONSE=$(curl -s "${MINIMAL_URL}/health")
  echo "   Health response: $HEALTH_RESPONSE"
else
  echo "❌ Minimal deployment has issues:"
  echo "   $MINIMAL_STATUS"
  
  # Check logs for minimal deployment
  echo "   Recent logs for minimal deployment:"
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=greenlane-minimal" --limit 5
fi

echo ""

# Check full app deployment
echo "Checking full app deployment (greenlane-crm-app)..."
FULL_STATUS=$(gcloud run services describe greenlane-crm-app --region=us-central1 --format="value(status.conditions[0].type),value(status.conditions[0].status),value(status.conditions[0].message)" 2>/dev/null)
FULL_URL=$(gcloud run services describe greenlane-crm-app --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -z "$FULL_STATUS" ]; then
  echo "ℹ️ Full app deployment not found"
elif [[ "$FULL_STATUS" == *"True"* ]]; then
  echo "✅ Full app deployment is HEALTHY"
  echo "   URL: $FULL_URL"
else
  echo "❌ Full app deployment has issues:"
  echo "   $FULL_STATUS"
  
  # Check logs for full deployment
  echo "   Recent logs for full deployment:"
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=greenlane-crm-app" --limit 5
fi

echo ""

# Check DNS configuration
echo "Checking DNS configuration for greenlanecloudsolutions.com..."
BASE_DOMAIN="greenlanecloudsolutions.com"

# Check main domain
echo "Resolving app.$BASE_DOMAIN..."
APP_DNS=$(dig +short app.$BASE_DOMAIN)
if [ -n "$APP_DNS" ]; then
  echo "✅ app.$BASE_DOMAIN resolves to: $APP_DNS"
else
  echo "❌ app.$BASE_DOMAIN does not resolve"
fi

# Check API domain
echo "Resolving api.$BASE_DOMAIN..."
API_DNS=$(dig +short api.$BASE_DOMAIN)
if [ -n "$API_DNS" ]; then
  echo "✅ api.$BASE_DOMAIN resolves to: $API_DNS"
else
  echo "❌ api.$BASE_DOMAIN does not resolve"
fi

# Check test tenant domain
echo "Resolving test.$BASE_DOMAIN (sample tenant)..."
TEST_DNS=$(dig +short test.$BASE_DOMAIN)
if [ -n "$TEST_DNS" ]; then
  echo "✅ test.$BASE_DOMAIN resolves to: $TEST_DNS"
else
  echo "❌ test.$BASE_DOMAIN does not resolve"
fi

echo ""
echo "Deployment status check completed."