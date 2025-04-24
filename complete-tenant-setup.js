/**
 * Complete tenant setup process - combines create-tenant.js and add-tenant-subdomain.js
 * Creates a new tenant with admin user, default modules, and DNS configuration
 */

import { createTenantAndAdmin } from './create-tenant.js';
import { promises as fs } from 'fs';
import { createInterface } from 'readline';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

/**
 * Load environment variables from a file
 * @param {string} file - Path to the environment file
 * @returns {Object} - Environment variables
 */
function loadEnvFromFile(file) {
  try {
    const config = dotenv.config({ path: file });
    if (config.error) {
      throw config.error;
    }
    console.log(`Loaded environment variables from ${file}`);
    return config.parsed;
  } catch (error) {
    console.warn(`Warning: Could not load ${file}: ${error.message}`);
    return {};
  }
}

// Load environment variables
loadEnvFromFile('.env.production');

// Create readline interface for user input
const readline = createInterface({
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
    readline.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Validates a subdomain name
 * @param {string} subdomain - The subdomain to validate
 * @returns {boolean} - Whether the subdomain is valid
 */
function isValidSubdomain(subdomain) {
  // Only allow lowercase letters, numbers, and hyphens, 3-20 characters
  const subdomainRegex = /^[a-z0-9-]{3,20}$/;
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
    serviceHostname = await fs.readFile('service_hostname.txt', 'utf8');
    serviceHostname = serviceHostname.trim();
  } catch (error) {
    return { success: false, message: `Could not read service hostname: ${error.message}` };
  }

  console.log(`Setting up DNS for tenant subdomain: ${subdomain}`);
  console.log(`Setting up CNAME record: ${subdomain}.greenlanecloudsolutions.com → ${serviceHostname}`);

  try {
    // Create CNAME record
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: JSON.stringify({
        type: 'CNAME',
        name: subdomain,
        content: serviceHostname,
        ttl: 1, // Automatic
        proxied: true
      })
    });

    const data = await response.json();

    if (data.success) {
      return { success: true, message: `Created DNS record for ${subdomain}.greenlanecloudsolutions.com` };
    } else {
      return { success: false, message: `Failed to create DNS record: ${JSON.stringify(data.errors)}` };
    }
  } catch (error) {
    return { success: false, message: `Error creating DNS record: ${error.message}` };
  }
}

/**
 * Main function to create a tenant and set up DNS
 */
async function completeTenantSetup() {
  try {
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
    const adminPassword = await prompt('Enter admin password: ');

    // Close readline interface
    readline.close();

    // Create tenant and admin user
    await createTenantAndAdmin(tenantId, companyName, adminEmail, adminPassword);

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

  } catch (error) {
    console.error('Error during tenant setup:', error.message);
    process.exit(1);
  }
}

// Execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeTenantSetup();
}