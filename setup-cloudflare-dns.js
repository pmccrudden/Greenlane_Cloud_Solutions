// Script to set up Cloudflare DNS for multi-tenant deployment
import { config } from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize dotenv
config();

// Get environment variables
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'greenlanecloudsolutions.com';

// Get the service hostname from file or environment
let SERVICE_HOSTNAME;
try {
  const hostnameFile = './service_hostname.txt';
  if (fs.existsSync(hostnameFile)) {
    SERVICE_HOSTNAME = fs.readFileSync(hostnameFile, 'utf8').trim();
  } else {
    SERVICE_HOSTNAME = process.env.SERVICE_HOSTNAME;
  }
} catch (error) {
  SERVICE_HOSTNAME = process.env.SERVICE_HOSTNAME;
}

if (!SERVICE_HOSTNAME) {
  console.error('Error: SERVICE_HOSTNAME not found in file or environment variable.');
  process.exit(1);
}

// Validate required environment variables
if (!CLOUDFLARE_API_TOKEN) {
  console.error('Error: CLOUDFLARE_API_TOKEN is required.');
  process.exit(1);
}

if (!CLOUDFLARE_ZONE_ID) {
  console.error('Error: CLOUDFLARE_ZONE_ID is required.');
  process.exit(1);
}

/**
 * Create or update a CNAME record
 * @param {string} subdomain - Subdomain part (without the domain)
 * @param {string} target - Target hostname
 * @returns {Promise<object>} - API response
 */
async function createOrUpdateCname(subdomain, target) {
  console.log(`Setting up CNAME record for ${subdomain}.${BASE_DOMAIN} → ${target}`);
  
  try {
    // Check if record exists
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${subdomain}.${BASE_DOMAIN}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    if (!data.success) {
      console.error('Cloudflare API error:', data.errors);
      throw new Error('Failed to check existing DNS records');
    }

    const existingRecords = data.result;
    
    if (existingRecords.length > 0) {
      // Update existing record
      const record = existingRecords[0];
      console.log(`CNAME record exists for ${subdomain}.${BASE_DOMAIN}, updating...`);
      
      const updateResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${record.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: target,
            ttl: 1, // Auto TTL
            proxied: true // Enable Cloudflare proxy
          })
        }
      );
      
      const updateData = await updateResponse.json();
      if (!updateData.success) {
        console.error('Cloudflare API error:', updateData.errors);
        throw new Error(`Failed to update CNAME record for ${subdomain}.${BASE_DOMAIN}`);
      }
      
      console.log(`✓ Updated CNAME record for ${subdomain}.${BASE_DOMAIN}`);
      return updateData;
    } else {
      // Create new record
      console.log(`Creating new CNAME record for ${subdomain}.${BASE_DOMAIN}...`);
      
      const createResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'CNAME',
            name: subdomain,
            content: target,
            ttl: 1, // Auto TTL
            proxied: true // Enable Cloudflare proxy
          })
        }
      );
      
      const createData = await createResponse.json();
      if (!createData.success) {
        console.error('Cloudflare API error:', createData.errors);
        throw new Error(`Failed to create CNAME record for ${subdomain}.${BASE_DOMAIN}`);
      }
      
      console.log(`✓ Created CNAME record for ${subdomain}.${BASE_DOMAIN}`);
      return createData;
    }
  } catch (error) {
    console.error(`Error setting up CNAME record for ${subdomain}.${BASE_DOMAIN}:`, error);
    throw error;
  }
}

/**
 * Create or update a wildcard record
 * @returns {Promise<object>} - API response
 */
async function createWildcardRecord() {
  return createOrUpdateCname('*', SERVICE_HOSTNAME);
}

/**
 * Setup all required DNS records for multi-tenant deployment
 */
async function setupCloudflareMultiTenantDNS() {
  try {
    console.log(`\n=== Setting up Cloudflare DNS for ${BASE_DOMAIN} ===\n`);
    console.log(`Service hostname: ${SERVICE_HOSTNAME}`);
    
    // Create main app record
    await createOrUpdateCname('app', SERVICE_HOSTNAME);
    
    // Create API record
    await createOrUpdateCname('api', SERVICE_HOSTNAME);
    
    // Create wildcard record for tenant subdomains
    await createWildcardRecord();
    
    console.log('\n✓ DNS setup completed successfully!');
    console.log('\nAccess your application at:');
    console.log(`- Main application: https://app.${BASE_DOMAIN}`);
    console.log(`- API endpoint: https://api.${BASE_DOMAIN}`);
    console.log(`- Tenant subdomains: https://<tenant-id>.${BASE_DOMAIN}`);
    console.log('\nNote: DNS changes may take up to 5-15 minutes to propagate.');
    
  } catch (error) {
    console.error('\n✗ DNS setup failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly (using ESM)
// In ESM, we can check if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  setupCloudflareMultiTenantDNS();
}

// Export for use in other modules
export {
  createOrUpdateCname,
  createWildcardRecord,
  setupCloudflareMultiTenantDNS
};