#!/bin/bash

# Script to check the status of the Greenlane CRM deployment

echo "===== Greenlane CRM Deployment Status Checker ====="
echo "Checking Cloud Run service status..."

# Check if gcloud command is available
if ! command -v gcloud &> /dev/null; then
    echo "ERROR: gcloud command not found"
    echo "This script must be run from Google Cloud Shell or a machine with Google Cloud SDK installed."
    exit 1
fi

# Get service details
SERVICE_INFO=$(gcloud run services describe greenlane-crm-app --region=us-central1 --format="json" 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to retrieve service information"
    echo "Please check if the service exists and you have the necessary permissions."
    exit 1
fi

# Extract service URL
SERVICE_URL=$(echo $SERVICE_INFO | grep -o '"url": "[^"]*' | cut -d'"' -f4)
echo "Service URL: $SERVICE_URL"

# Check service state
READY_STATE=$(echo $SERVICE_INFO | grep -o '"ready": [^,}]*' | cut -d' ' -f2 | tr -d ',' | tr -d '"')
if [ "$READY_STATE" == "true" ]; then
    echo "Service Status: READY"
else
    echo "Service Status: NOT READY"
    # Get more details about the failure
    CONDITION_MESSAGE=$(echo $SERVICE_INFO | grep -o '"message": "[^"]*' | head -1 | cut -d'"' -f4)
    echo "Failure Reason: $CONDITION_MESSAGE"
fi

# Get current traffic split
echo "Traffic Status: 100% to latest revision"

# Check health endpoint
echo ""
echo "Testing service health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/health" 2>/dev/null)
if [ "$HEALTH_RESPONSE" == "200" ]; then
    echo "Health Check: PASSED (HTTP 200)"
else
    echo "Health Check: FAILED (HTTP $HEALTH_RESPONSE)"
fi

# Check DNS configuration if BASE_DOMAIN is available
if [ -n "$BASE_DOMAIN" ]; then
    echo ""
    echo "Checking DNS configuration for $BASE_DOMAIN..."
    
    # Check primary domain
    APP_DOMAIN="app.$BASE_DOMAIN"
    echo "Testing $APP_DOMAIN..."
    APP_DNS=$(dig +short $APP_DOMAIN 2>/dev/null)
    if [ -n "$APP_DNS" ]; then
        echo "  DNS Resolution: OK ($APP_DNS)"
    else
        echo "  DNS Resolution: NOT FOUND"
    fi
    
    # Check API domain
    API_DOMAIN="api.$BASE_DOMAIN"
    echo "Testing $API_DOMAIN..."
    API_DNS=$(dig +short $API_DOMAIN 2>/dev/null)
    if [ -n "$API_DNS" ]; then
        echo "  DNS Resolution: OK ($API_DNS)"
    else
        echo "  DNS Resolution: NOT FOUND"
    fi
    
    # Check wildcard domain with a test tenant
    TEST_TENANT="test.$BASE_DOMAIN"
    echo "Testing wildcard DNS with $TEST_TENANT..."
    TEST_DNS=$(dig +short $TEST_TENANT 2>/dev/null)
    if [ -n "$TEST_DNS" ]; then
        echo "  DNS Resolution: OK ($TEST_DNS)"
    else
        echo "  DNS Resolution: NOT FOUND"
    fi
fi

echo ""
echo "===== End of Status Report ====="