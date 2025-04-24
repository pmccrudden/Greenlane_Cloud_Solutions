#!/bin/bash

# Script to check the deployment status and logs for Greenlane CRM
# This helps diagnose deployment and startup issues

# Default values
SERVICE="greenlane-crm-diagnostic"
REGION="us-central1"
LOG_LINES=100
FORMAT="json"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --service|-s)
      SERVICE="$2"
      shift 2
      ;;
    --region|-r)
      REGION="$2"
      shift 2
      ;;
    --lines|-l)
      LOG_LINES="$2"
      shift 2
      ;;
    --format|-f)
      FORMAT="$2" # json or text
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --service, -s SERVICE  Service name (default: greenlane-crm-diagnostic)"
      echo "  --region, -r REGION    Region (default: us-central1)"
      echo "  --lines, -l LINES      Number of log lines (default: 100)"
      echo "  --format, -f FORMAT    Log format: json or text (default: json)"
      echo "  --help, -h             Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "=== Checking deployment status for $SERVICE in $REGION ==="

# Check if the service exists
if ! gcloud run services describe "$SERVICE" --region="$REGION" &>/dev/null; then
  echo "Error: Service $SERVICE does not exist in region $REGION"
  exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE" --region="$REGION" --format="value(status.url)")
echo "Service URL: $SERVICE_URL"

# Get the service status
echo ""
echo "=== Service Status ==="
gcloud run services describe "$SERVICE" --region="$REGION" | grep -A 20 "status:"

# Try to access the service and the debug endpoint
echo ""
echo "=== Testing Service Access ==="
echo "Checking main endpoint..."
curl -s -o /dev/null -w "Status code: %{http_code}\n" "$SERVICE_URL"

echo "Checking debug endpoint..."
curl -s -o /dev/null -w "Status code: %{http_code}\n" "$SERVICE_URL/debug"

# Get the latest revision name
REVISION=$(gcloud run services describe "$SERVICE" --region="$REGION" --format="value(status.latestCreatedRevisionName)")
echo ""
echo "Latest revision: $REVISION"

# Get logs for the service
echo ""
echo "=== Service Logs ==="
echo "Fetching last $LOG_LINES lines of logs in $FORMAT format..."

if [ "$FORMAT" = "json" ]; then
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE AND resource.labels.revision_name=$REVISION" --limit="$LOG_LINES" --format=json
else
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE AND resource.labels.revision_name=$REVISION" --limit="$LOG_LINES"
fi

echo ""
echo "=== Deployment Check Complete ==="
echo "For continuous log monitoring, run:"
echo "gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE' --limit=10 --format=json --follow"