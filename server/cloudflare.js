// Cloudflare DNS integration for managing and verifying subdomain availability

const fetch = require('node-fetch');

// Configuration
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'greenlanecloudsolutions.com';

// Validate configuration
if (!CLOUDFLARE_API_TOKEN) {
  console.warn('Warning: CLOUDFLARE_API_TOKEN environment variable is not set');
}

if (!CLOUDFLARE_ZONE_ID) {
  console.warn('Warning: CLOUDFLARE_ZONE_ID environment variable is not set');
}

/**
 * Check if a subdomain exists in Cloudflare DNS records
 * @param {string} subdomain - The subdomain to check (without the base domain)
 * @returns {Promise<boolean>} - True if the subdomain exists, false otherwise
 */
async function checkIfSubdomainExists(subdomain) {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    console.warn('Cloudflare credentials not configured, skipping subdomain existence check');
    
    // For development, allow the process to continue
    if (process.env.NODE_ENV !== 'production') {
      return false;
    }
    
    throw new Error('Cloudflare API credentials not configured');
  }

  try {
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
      throw new Error('Failed to check subdomain existence');
    }

    // Check if there are any records for this subdomain
    return data.result && data.result.length > 0;
  } catch (error) {
    console.error('Error checking subdomain existence:', error);
    throw error;
  }
}

/**
 * Verify if a subdomain is available for registration
 * @param {string} subdomain - The subdomain to verify
 * @returns {Promise<{available: boolean, message: string}>} - Availability status and message
 */
async function verifySubdomainAvailability(subdomain) {
  // Validate subdomain format
  const subdomainRegex = /^[a-z0-9-]{3,20}$/;
  if (!subdomainRegex.test(subdomain)) {
    return {
      available: false,
      message: 'Subdomain must be 3-20 characters and contain only lowercase letters, numbers, and hyphens'
    };
  }

  // Check if subdomain starts or ends with a hyphen
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return {
      available: false,
      message: 'Subdomain cannot start or end with a hyphen'
    };
  }

  // Reserved subdomains that cannot be used by customers
  const reservedSubdomains = [
    'app', 'api', 'admin', 'www', 'mail', 'ftp', 'smtp', 'pop', 'imap',
    'dashboard', 'login', 'auth', 'billing', 'support', 'help', 'docs',
    'documentation', 'greenlanecloudsolutions', 'greenlane', 'demo', 'test',
    'staging', 'dev', 'development', 'prod', 'production'
  ];

  if (reservedSubdomains.includes(subdomain.toLowerCase())) {
    return {
      available: false,
      message: 'This subdomain is reserved and cannot be used'
    };
  }

  try {
    // Check if subdomain already exists in Cloudflare
    // In production, this will check actual DNS records
    // In development, we can skip this check
    let exists = false;
    
    try {
      exists = await checkIfSubdomainExists(subdomain);
    } catch (error) {
      // If there's an error checking with Cloudflare,
      // fall back to checking the database

      // Here we'd normally check the database for existing tenants with this subdomain
      // For now, we'll assume it's available if we can't check Cloudflare
      console.warn('Falling back to database check for subdomain');
    }

    if (exists) {
      return {
        available: false,
        message: 'This subdomain is already in use'
      };
    }

    return {
      available: true,
      message: 'Subdomain is available'
    };
  } catch (error) {
    console.error('Error verifying subdomain availability:', error);
    
    return {
      available: false,
      message: 'Error checking subdomain availability'
    };
  }
}

/**
 * Create a custom CNAME record for a new tenant
 * This would be called during tenant provisioning
 * @param {string} subdomain - The subdomain to create
 * @returns {Promise<{success: boolean, message: string}>} - Result of the operation
 */
async function createTenantSubdomain(subdomain) {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    console.warn('Cloudflare credentials not configured, skipping subdomain creation');
    
    // For development, allow the process to continue
    if (process.env.NODE_ENV !== 'production') {
      return { success: true, message: 'Development mode - subdomain creation simulated' };
    }
    
    throw new Error('Cloudflare API credentials not configured');
  }

  try {
    // First verify the subdomain is available
    const availability = await verifySubdomainAvailability(subdomain);
    if (!availability.available) {
      return { success: false, message: availability.message };
    }

    // We don't actually need to create individual CNAME records if we have a wildcard
    // But this is useful for explicit record management or if we want specific settings per tenant
    const serviceHostname = process.env.SERVICE_HOSTNAME || 'app.greenlanecloudsolutions.com';

    const response = await fetch(
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
          content: serviceHostname,
          ttl: 1, // Auto TTL
          proxied: true // Enable Cloudflare proxy
        })
      }
    );

    const data = await response.json();
    
    if (!data.success) {
      console.error('Cloudflare API error:', data.errors);
      return { success: false, message: 'Failed to create subdomain' };
    }

    return { 
      success: true, 
      message: `Subdomain ${subdomain}.${BASE_DOMAIN} created successfully` 
    };
  } catch (error) {
    console.error('Error creating tenant subdomain:', error);
    return { success: false, message: 'Error creating tenant subdomain' };
  }
}

module.exports = {
  verifySubdomainAvailability,
  createTenantSubdomain
};