/**
 * One-time script to create the Greenlane tenant with admin user using API calls
 * This is more suitable for use from Cloud Shell where direct database access is limited
 */

// Load environment
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env file
function loadEnvFromFile(file) {
  const envPath = path.join(__dirname, file);
  let env = {};
  
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment variables from ${file}`);
    const envFile = fs.readFileSync(envPath, 'utf8');
    
    envFile.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          env[key.trim()] = value.replace(/^['"]|['"]$/g, ''); // Remove quotes
          process.env[key.trim()] = value.replace(/^['"]|['"]$/g, '');
        }
      }
    });
  } else {
    console.log(`Warning: ${file} not found`);
  }
  
  return env;
}

// Load proper environment
loadEnvFromFile('.env.production');

// Make HTTP request
async function request(url, method = 'GET', data = null, headers = {}) {
  const fullUrl = url.startsWith('http') ? url : `https://app.greenlanecloudsolutions.com${url}`;
  
  console.log(`${method} ${fullUrl}`);
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(fullUrl, options);
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error (${response.status}): ${JSON.stringify(responseData)}`);
    }
    
    return responseData;
  } catch (error) {
    console.error('Request error:', error.message);
    throw error;
  }
}

// Create tenant and admin user
async function createTenantAndAdmin() {
  try {
    const tenantId = 'greenlane';
    const companyName = 'Greenlane Enterprises';
    const adminEmail = 'greenlane.enterprisesltd@gmail.com';
    const adminPassword = 'SnowBomb42!?';
    
    console.log(`Creating tenant "${tenantId}" for ${companyName}...`);
    
    // Tenant data
    const tenantData = {
      id: tenantId,
      companyName: companyName,
      adminEmail: adminEmail,
      adminPassword: adminPassword,
      modules: ['core', 'accounts', 'contacts', 'deals', 'projects', 'tickets']
    };
    
    // Call tenant creation API
    const tenant = await request('/api/admin/tenants', 'POST', tenantData);
    console.log('Tenant created successfully:', tenant);
    
    console.log('Setting up DNS for tenant subdomain...');
    
    // Set up DNS
    const dnsData = {
      subdomain: tenantId,
      serviceUrl: process.env.SERVICE_HOSTNAME || ''
    };
    
    const dnsResult = await request('/api/admin/dns', 'POST', dnsData);
    console.log('DNS setup result:', dnsResult);
    
    console.log('\n✅ Tenant creation complete!');
    console.log(`You can now access your tenant at: https://${tenantId}.greenlanecloudsolutions.com`);
    console.log(`Login with: ${adminEmail} / ${adminPassword}`);
  } catch (error) {
    console.error('Error creating tenant:', error.message);
  }
}

// Run the setup
createTenantAndAdmin();
