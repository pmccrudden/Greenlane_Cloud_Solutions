// Script to set up DNS for a tenant subdomain
import fs from 'fs';

// Read environment variables from .env.production file directly
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
    }
  } catch (error) {
    console.error(`Error loading environment file ${file}:`, error);
  }
}

// Load environment variables
loadEnvFromFile('.env.production');

// Required environment variables
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
  SERVICE_HOSTNAME = 'greenlane-crm-esm-enhanced-mx3osic2uq-uc.a.run.app'; // Fallback
}

// Validate required environment variables
if (!CLOUDFLARE_API_TOKEN) {
  console.warn('Warning: CLOUDFLARE_API_TOKEN environment variable is not set.');
}

if (!CLOUDFLARE_ZONE_ID) {
  console.warn('Warning: CLOUDFLARE_ZONE_ID environment variable is not set.');
}

/**
 * Validates a subdomain name
 * @param {string} subdomain - The subdomain to validate
 * @returns {boolean} - Whether the subdomain is valid
 */
function isValidSubdomain(subdomain) {
  // Allow lowercase letters, numbers, and hyphens, 3-20 chars, no consecutive hyphens
  const subdomainPattern = /^[a-z0-9](?:[a-z0-9-]{1,18}[a-z0-9])?$/;
  return subdomainPattern.test(subdomain);
}

/**
 * Creates a CNAME record for a tenant subdomain
 * @param {string} subdomain - The subdomain to create
 * @returns {Promise<{success: boolean, message: string}>} - Result of the operation
 */
async function createTenantSubdomain(subdomain) {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    return {
      success: false,
      message: 'Cloudflare credentials missing. Cannot set up DNS.'
    };
  }

  if (!isValidSubdomain(subdomain)) {
    return {
      success: false,
      message: 'Invalid subdomain. Must be 3-20 characters, lowercase letters, numbers, and hyphens only.'
    };
  }

  try {
    const recordName = `${subdomain}.${BASE_DOMAIN}`;
    console.log(`Setting up CNAME record: ${recordName} → ${SERVICE_HOSTNAME}`);

    // Check if record exists
    const checkResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${recordName}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const checkData = await checkResponse.json();
    if (!checkData.success) {
      console.error('Cloudflare API error:', checkData.errors);
      throw new Error('Failed to check existing DNS records');
    }

    const existingRecords = checkData.result;
    const record = existingRecords.length > 0 ? existingRecords[0] : null;

    if (record) {
      // Record already exists, update it
      const updateResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${record.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'CNAME',
            name: subdomain,
            content: SERVICE_HOSTNAME,
            ttl: 1, // Auto TTL
            proxied: true // Enable Cloudflare proxy
          })
        }
      );

      const updateData = await updateResponse.json();
      if (!updateData.success) {
        console.error('Cloudflare API error:', updateData.errors);
        throw new Error(`Failed to update CNAME record for ${recordName}`);
      }

      return {
        success: true,
        message: `Updated DNS record for ${subdomain}.${BASE_DOMAIN}`
      };
    } else {
      // Create new record
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
            content: SERVICE_HOSTNAME,
            ttl: 1, // Auto TTL
            proxied: true // Enable Cloudflare proxy
          })
        }
      );

      const createData = await createResponse.json();
      if (!createData.success) {
        console.error('Cloudflare API error:', createData.errors);
        throw new Error(`Failed to create CNAME record for ${recordName}`);
      }

      return {
        success: true,
        message: `Created DNS record for ${subdomain}.${BASE_DOMAIN}`
      };
    }
  } catch (error) {
    console.error(`Error setting up CNAME record:`, error);
    return {
      success: false,
      message: `Failed to set up DNS: ${error.message}`
    };
  }
}

/**
 * Main function to set up DNS for a tenant
 */
async function setupTenantDNS() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node setup-tenant-dns.js <tenant-id>');
    console.error('Example: node setup-tenant-dns.js acme');
    process.exit(1);
  }
  
  const tenantId = args[0];
  
  try {
    console.log(`Setting up DNS for tenant subdomain: ${tenantId}`);
    const result = await createTenantSubdomain(tenantId);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`Tenant URL: https://${tenantId}.${BASE_DOMAIN}`);
      console.log('\nNote: DNS changes may take some time to propagate.');
    } else {
      console.error(`❌ ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error setting up tenant DNS:', error);
    process.exit(1);
  }
}

// Execute if this file is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  setupTenantDNS();
}

// Export for use in other modules
export { createTenantSubdomain, setupTenantDNS };