// Cloudflare DNS integration for Greenlane CRM tenants
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';

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
 * Checks if a subdomain is available
 * @param {string} subdomain - The subdomain to check
 * @returns {Promise<boolean>} - Whether the subdomain is available
 */
async function isSubdomainAvailable(subdomain) {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    console.warn('Cannot check subdomain availability: Cloudflare credentials missing');
    return true; // Assume available if we can't check
  }

  try {
    const recordName = `${subdomain}.${BASE_DOMAIN}`;
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${recordName}`,
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
    return existingRecords.length === 0;
  } catch (error) {
    console.error('Error checking subdomain availability:', error);
    return true; // Assume available on error (safer than blocking)
  }
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
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${recordName}`,
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
    const record = existingRecords.length > 0 ? existingRecords[0] : null;

    if (record) {
      // Record already exists
      return {
        success: true,
        message: `Subdomain ${subdomain} is already configured.`
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
        message: `DNS record created for ${subdomain}.${BASE_DOMAIN}`
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

// Export for ES modules
export {
  isValidSubdomain,
  isSubdomainAvailable,
  createTenantSubdomain
};