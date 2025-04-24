#!/bin/bash

# Simplified deployment script for Greenlane CRM

echo "=== Running simplified deployment for Greenlane CRM ==="

# Submit build to Cloud Build
echo "Submitting build to Cloud Build..."
gcloud builds submit --config cloudbuild.yaml --project=greenlane-cloud-solutions

echo "Deployment submitted. Check the Cloud Build logs for progress."