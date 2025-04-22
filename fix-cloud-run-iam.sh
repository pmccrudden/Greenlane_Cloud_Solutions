#!/bin/bash

# This script fixes the IAM policy for the Cloud Run service
# to allow unauthenticated access

echo "Fixing IAM policy for greenlane-crm-app..."
gcloud beta run services add-iam-policy-binding \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  greenlane-crm-app

echo "Checking IAM policy..."
gcloud run services get-iam-policy greenlane-crm-app --region=us-central1

echo "Done!"