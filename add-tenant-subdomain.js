/**
 * Script to add a DNS subdomain for an existing tenant
 * This is a more focused script to just handle the DNS part
 */

import * as fs from 'fs';
import * as https from 'https';
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

  return new Promise((resolve) => {
    const requestData = JSON.stringify({
      type: 'CNAME',
      name: subdomain,
      content: serviceHostname,
      ttl: 1, // Automatic
      proxied: true
    });
    
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          if (data.success) {
            resolve({ success: true, message: `Created DNS record for ${subdomain}.greenlanecloudsolutions.com` });
          } else {
            resolve({ success: false, message: `Failed to create DNS record: ${JSON.stringify(data.errors)}` });
          }
        } catch (e) {
          resolve({ success: false, message: `Failed to parse response: ${e.message}` });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, message: `Error creating DNS record: ${error.message}` });
    });
    
    req.write(requestData);
    req.end();
  });
}

/**
 * Main function to add a subdomain for a tenant
 */
async function addTenantSubdomain() {
  try {
    // Load environment variables
    loadEnvFromFile('.env.production');
    
    console.log('======================================================');
    console.log('        Greenlane Cloud Solutions DNS Setup           ');
    console.log('======================================================\n');

    // Get tenant ID from command line or prompt
    let tenantId = process.argv[2];
    if (!tenantId) {
      tenantId = await prompt('Enter tenant ID (subdomain to create): ');
    }
    
    if (!isValidSubdomain(tenantId)) {
      throw new Error('Invalid tenant ID. Must be 3-20 characters and contain only lowercase letters, numbers, and hyphens.');
    }
    
    // Set up DNS for the tenant
    console.log('\nSetting up DNS for tenant...');
    const dnsResult = await createTenantSubdomain(tenantId);
    
    if (dnsResult.success) {
      console.log(`✅ ${dnsResult.message}`);
      console.log(`Tenant URL: https://${tenantId}.greenlanecloudsolutions.com`);
      console.log('\nNote: DNS changes may take some time to propagate (usually 5-15 minutes).');
    } else {
      console.error(`❌ DNS setup failed: ${dnsResult.message}`);
    }

    console.log('\n======================================================');
    console.log('        DNS Setup Process Complete                    ');
    console.log('======================================================');

  } catch (error) {
    console.error('Error during DNS setup:', error.message);
  } finally {
    // Close readline interface
    rl.close();
  }
}

// Execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addTenantSubdomain();
}