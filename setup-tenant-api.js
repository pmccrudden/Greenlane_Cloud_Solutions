/**
 * Setup a tenant by calling the API instead of directly connecting to the database
 * This is more suitable for use from Cloud Shell where direct database access is limited
 */

import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { createInterface } from 'readline';

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} - User input
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Load environment variables from a file
 * @param {string} file - Path to the environment file
 * @returns {Object} - Environment variables
 */
function loadEnvFromFile(file) {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      const result = {};
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            // Remove quotes if present
            const cleanValue = value.replace(/^["'](.*)["']$/, '$1');
            process.env[key.trim()] = cleanValue;
            result[key.trim()] = cleanValue;
          }
        }
      }
      console.log(`Loaded environment variables from ${file}`);
      return result;
    }
  } catch (error) {
    console.warn(`Warning: Could not load ${file}: ${error.message}`);
  }
  return {};
}

/**
 * Make an HTTP/HTTPS request
 * @param {string} url - The URL to request
 * @param {string} method - HTTP method
 * @param {object} data - Request data
 * @param {object} headers - Request headers
 * @returns {Promise<object>} - Response data
 */
function request(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: `${urlObj.pathname}${urlObj.search}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Request failed with status ${res.statusCode}: ${JSON.stringify(data)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      const requestData = JSON.stringify(data);
      req.write(requestData);
    }
    req.end();
  });
}

/**
 * Creates a CNAME record for a tenant subdomain
 * @param {string} subdomain - The subdomain to create
 * @returns {Promise<{success: boolean, message: string}>} - Result of the operation
 */
async function createTenantSubdomain(subdomain) {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ZONE_ID) {
    console.error('Missing required environment variables: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID');
    return { success: false, message: 'Missing Cloudflare credentials' };
  }

  // Get the service hostname from the file
  let serviceHostname;
  try {
    serviceHostname = fs.readFileSync('service_hostname.txt', 'utf8').trim();
  } catch (error) {
    return { success: false, message: `Could not read service hostname: ${error.message}` };
  }

  console.log(`Setting up DNS for tenant subdomain: ${subdomain}`);
  console.log(`Setting up CNAME record: ${subdomain}.greenlanecloudsolutions.com → ${serviceHostname}`);

  try {
    const response = await request(
      `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`,
      'POST',
      {
        type: 'CNAME',
        name: subdomain,
        content: serviceHostname,
        ttl: 1, // Automatic
        proxied: true
      },
      {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      }
    );

    if (response.success) {
      return { success: true, message: `Created DNS record for ${subdomain}.greenlanecloudsolutions.com` };
    } else {
      return { success: false, message: `Failed to create DNS record: ${JSON.stringify(response.errors)}` };
    }
  } catch (error) {
    return { success: false, message: `Error creating DNS record: ${error.message}` };
  }
}

/**
 * Validates a subdomain name
 * @param {string} subdomain - The subdomain to validate
 * @returns {boolean} - Whether the subdomain is valid
 */
function isValidSubdomain(subdomain) {
  // Only allow lowercase letters, numbers, and hyphens, 3-20 characters
  const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/;
  return subdomainRegex.test(subdomain);
}

/**
 * Main function to create a tenant via the API and set up DNS
 */
async function setupTenant() {
  try {
    // Load environment variables
    loadEnvFromFile('.env.production');
    
    // Get the service hostname from the file
    let serviceHostname;
    try {
      serviceHostname = fs.readFileSync('service_hostname.txt', 'utf8').trim();
    } catch (error) {
      console.error(`Error: Could not read service hostname: ${error.message}`);
      console.error('Make sure you have deployed the application and the service_hostname.txt file exists.');
      return;
    }

    console.log('======================================================');
    console.log('        Greenlane Cloud Solutions Tenant Setup        ');
    console.log('======================================================\n');

    // Get tenant information from user
    const tenantId = await prompt('Enter tenant ID (will be used as subdomain): ');
    
    if (!isValidSubdomain(tenantId)) {
      throw new Error('Invalid tenant ID. Must be 3-20 characters and contain only lowercase letters, numbers, and hyphens.');
    }
    
    const companyName = await prompt('Enter company name: ');
    const adminEmail = await prompt('Enter admin email: ');
    const adminPassword = await prompt('Enter admin password (min 8 characters): ');

    console.log(`\nCreating tenant: ${tenantId} (${companyName})`);
    console.log('Using the API endpoint to create the tenant...');

    // Create tenant using the API
    try {
      // Use the API to create a tenant
      const apiUrl = `https://api.greenlanecloudsolutions.com/api/tenants`;
      console.log(`Calling API: ${apiUrl}`);
      
      const tenantData = {
        id: tenantId,
        companyName: companyName,
        adminEmail: adminEmail,
        adminPassword: adminPassword
      };

      // Call the API to create the tenant
      await request(apiUrl, 'POST', tenantData);
      
      console.log(`✅ Tenant created successfully: ${tenantId}`);
      
      // Set up DNS for the tenant
      console.log('\nSetting up DNS for tenant...');
      const dnsResult = await createTenantSubdomain(tenantId);
      
      if (dnsResult.success) {
        console.log(`✅ ${dnsResult.message}`);
        console.log(`Tenant URL: https://${tenantId}.greenlanecloudsolutions.com`);
        console.log('\nNote: DNS changes may take some time to propagate.');
      } else {
        console.error(`❌ DNS setup failed: ${dnsResult.message}`);
        console.log('You can set up DNS later by running: node add-tenant-subdomain.js', tenantId);
      }

      console.log('\n======================================================');
      console.log('        Tenant Setup Process Complete                 ');
      console.log('======================================================');
      console.log('Admin Login Details:');
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
      console.log('\nAccess the tenant at:');
      console.log(`  https://${tenantId}.greenlanecloudsolutions.com`);
      
    } catch (error) {
      console.error('Error creating tenant via API:', error.message);
      console.log('\nAlternative approach:');
      console.log('You can create the tenant directly from the app admin interface:');
      console.log(`1. Go to https://app.greenlanecloudsolutions.com/admin/tenants`);
      console.log(`2. Log in with the superadmin credentials`);
      console.log(`3. Click "Create Tenant" and enter the details manually`);
      
      // Still try to set up DNS
      console.log('\nAttempting to set up DNS anyway...');
      const dnsResult = await createTenantSubdomain(tenantId);
      
      if (dnsResult.success) {
        console.log(`✅ ${dnsResult.message}`);
        console.log(`Once tenant is created, it will be available at: https://${tenantId}.greenlanecloudsolutions.com`);
      } else {
        console.error(`❌ DNS setup failed: ${dnsResult.message}`);
      }
    }

  } catch (error) {
    console.error('Error during tenant setup:', error.message);
  } finally {
    // Close readline interface
    rl.close();
  }
}

// Execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTenant();
}