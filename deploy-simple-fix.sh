#!/bin/bash

# Simplified deployment script using a simpler Dockerfile
# This version avoids multi-stage builds and directly includes all files

echo "=== Deploying Simple Fix Version to Cloud Run ==="

# Check if we're logged in to gcloud
gcloud auth list --filter=status:ACTIVE --format="value(account)" || {
  echo "Not logged in to gcloud. Please run 'gcloud auth login' first."
  exit 1
}

# Make sure we're in the correct GCP project
PROJECT_ID=$(gcloud config get-value project)
echo "Current GCP project: $PROJECT_ID"
if [ "$PROJECT_ID" != "greenlane-cloud-solutions" ]; then
  echo "Switching to greenlane-cloud-solutions project..."
  gcloud config set project greenlane-cloud-solutions
fi

# Clean any previous build
echo "Cleaning dist directory..."
rm -rf ./dist
mkdir -p ./dist/public

# Create a simple index.html for testing
echo "Creating test index.html..."
cat > ./dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Greenlane Cloud Solutions</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 40px; 
      background-color: #f8f9fa; 
      color: #333;
    }
    .container { 
      max-width: 800px; 
      margin: 0 auto; 
      background: white; 
      padding: 30px; 
      border-radius: 8px; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
    }
    h1 { 
      color: #21c983; 
      margin-top: 0; 
    }
    .logo {
      background: linear-gradient(135deg, #21c983, #138f5e);
      color: white;
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">GCS</div>
    <h1>Greenlane Cloud Solutions</h1>
    <p>Welcome to the Greenlane CRM platform. Your application is running successfully!</p>
    <p>This is the test page that confirms your deployment is working. The full application will appear here once integration is complete.</p>
    <p><strong>Subdomain:</strong> <span id="subdomain">Loading...</span></p>
    
    <script>
      document.getElementById('subdomain').textContent = window.location.hostname;
    </script>
  </div>
</body>
</html>
EOF

# Build the Docker image locally
echo "Building Docker image..."
docker build -t gcr.io/greenlane-cloud-solutions/greenlane-crm-simple-fix:latest -f Dockerfile.simple-fix .

# Push the image to GCR
echo "Pushing image to Google Container Registry..."
docker push gcr.io/greenlane-cloud-solutions/greenlane-crm-simple-fix:latest

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy greenlane-crm-simple-fix \
  --image=gcr.io/greenlane-cloud-solutions/greenlane-crm-simple-fix:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --max-instances=10 \
  --min-instances=1 \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=300s \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0" \
  --quiet

echo "Deployment completed."

# Check service status
echo "Checking service status..."
SERVICE_URL=$(gcloud run services describe greenlane-crm-simple-fix --region=us-central1 --format="value(status.url)" 2>/dev/null)

if [ -n "$SERVICE_URL" ]; then
  echo "Service is available at: $SERVICE_URL"
  echo ""
  echo "Testing the endpoints:"
  echo "Main endpoint:"
  curl -s -o /dev/null -w "Status code: %{http_code}\n" "$SERVICE_URL"
  
  echo "Debug endpoint:"
  echo "$SERVICE_URL/debug"
  
  # Save the service hostname to a file for DNS configuration
  SERVICE_HOSTNAME=$(echo "$SERVICE_URL" | sed 's,^https://,,g')
  echo "$SERVICE_HOSTNAME" > service_hostname.txt
  echo "Service hostname saved to service_hostname.txt: $SERVICE_HOSTNAME"
  
  # Open the logs
  echo ""
  echo "View logs:"
  echo "https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%20resource.labels.service_name%3D%22greenlane-crm-simple-fix%22?project=greenlane-cloud-solutions"
else
  echo "Service not yet available. Check Cloud Run logs for details."
  exit 1
fi