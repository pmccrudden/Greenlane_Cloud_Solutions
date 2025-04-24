// Multi-tenant deployment script (ESM version)
import fs from 'fs';
import { execSync } from 'child_process';

// Read environment variables
function loadEnvFromFile(file) {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            // Remove quotes if present
            const cleanValue = value.replace(/^["'](.*)["']$/, '$1');
            process.env[key.trim()] = cleanValue;
          }
        }
      }
      console.log(`Loaded environment variables from ${file}`);
    } else {
      console.warn(`Environment file ${file} not found.`);
    }
  } catch (error) {
    console.error(`Error loading environment file ${file}:`, error);
  }
}

// Load from both deployment and production env files
loadEnvFromFile('.env.deploy');
loadEnvFromFile('.env.production');

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
const REGION = process.env.CLOUD_RUN_REGION || 'us-central1';
const SERVICE_NAME = 'greenlane-crm-multi-tenant';

function executeCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Command failed:', error.message);
    return false;
  }
}

/**
 * Deploy the multi-tenant application to Cloud Run 
 */
function deployMultiTenant() {
  console.log('===== Multi-Tenant Deployment (ESM) =====');
  
  if (!PROJECT_ID) {
    console.error('ERROR: GOOGLE_CLOUD_PROJECT environment variable not set');
    process.exit(1);
  }
  
  // Deploy to Cloud Run
  console.log(`\nDeploying to Cloud Run (project: ${PROJECT_ID})...`);
  
  const buildpackDeployCommand = `gcloud run deploy ${SERVICE_NAME} \\
    --source . \\
    --region ${REGION} \\
    --project ${PROJECT_ID} \\
    --allow-unauthenticated \\
    --memory=1Gi \\
    --min-instances=1 \\
    --max-instances=10 \\
    --set-env-vars="DATABASE_URL=${process.env.DATABASE_URL}" \\
    --set-env-vars="NODE_ENV=production" \\
    --set-env-vars="CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN}" \\
    --set-env-vars="CLOUDFLARE_ZONE_ID=${process.env.CLOUDFLARE_ZONE_ID}" \\
    --set-env-vars="STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}" \\
    --set-env-vars="ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}"`;
  
  if (!executeCommand(buildpackDeployCommand)) {
    console.error('Failed to deploy to Cloud Run.');
    process.exit(1);
  }
  
  // Get the service URL
  console.log('\nGetting service URL...');
  try {
    const serviceUrl = execSync(`gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format='value(status.url)'`).toString().trim();
    const hostname = serviceUrl.replace('https://', '');
    
    // Save the hostname to a file
    fs.writeFileSync('service_hostname.txt', hostname);
    console.log(`Service URL: ${serviceUrl}`);
    console.log(`Hostname saved to service_hostname.txt`);
    
  } catch (error) {
    console.error('Failed to get service URL:', error.message);
    process.exit(1);
  }
  
  console.log('\n===== Setting up DNS =====');
  
  // Set up DNS using the setup-cloudflare-dns.js script
  if (!executeCommand('node setup-cloudflare-dns.js')) {
    console.error('Failed to set up DNS with Cloudflare.');
    process.exit(1);
  }
  
  console.log('\n===== Multi-Tenant Deployment Complete =====');
  console.log('Next steps:');
  console.log('1. Create tenants using create-tenant.js');
  console.log('2. Access tenants via https://<tenant-id>.greenlanecloudsolutions.com');
  console.log('3. Main application: https://app.greenlanecloudsolutions.com');
}

// Run the deployment
deployMultiTenant();