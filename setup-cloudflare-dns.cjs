// Script to set up Cloudflare DNS with wildcard subdomain for multi-tenant GreenLane CRM
// CommonJS version for better compatibility with no external dependencies
const https = require('https');

// Function to make HTTP requests
function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(responseData)
          });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Required environment variables
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'greenlanecloudsolutions.com';
const SERVICE_HOSTNAME = process.env.SERVICE_HOSTNAME || 'greenlane-crm-app-xxxxx-uc.a.run.app';

// Validate required environment variables
if (!CLOUDFLARE_API_TOKEN) {
  console.error('Error: CLOUDFLARE_API_TOKEN environment variable is required');
  process.exit(1);
}

if (!CLOUDFLARE_ZONE_ID) {
  console.error('Error: CLOUDFLARE_ZONE_ID environment variable is required');
  process.exit(1);
}

// Function to create or update a CNAME record
async function createOrUpdateCname(subdomain, target) {
  const recordName = subdomain === '@' ? BASE_DOMAIN : `${subdomain}.${BASE_DOMAIN}`;
  console.log(`Setting up CNAME record: ${recordName} → ${target}`);

  try {
    // Check if record exists
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${recordName}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await httpRequest(options);
    
    if (!response.body.success) {
      console.error('Cloudflare API error:', response.body.errors);
      throw new Error('Failed to check existing DNS records');
    }

    const existingRecords = response.body.result;
    const record = existingRecords.length > 0 ? existingRecords[0] : null;

    if (record) {
      // Update existing record
      console.log(`Updating existing CNAME record for ${recordName}`);
      
      const updateOptions = {
        hostname: 'api.cloudflare.com',
        path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${record.id}`,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      };
      
      const updateData = {
        type: 'CNAME',
        name: subdomain,
        content: target,
        ttl: 1, // Auto TTL
        proxied: true // Enable Cloudflare proxy
      };

      const updateResponse = await httpRequest(updateOptions, updateData);
      
      if (!updateResponse.body.success) {
        console.error('Cloudflare API error:', updateResponse.body.errors);
        throw new Error(`Failed to update CNAME record for ${recordName}`);
      }

      console.log(`CNAME record updated successfully for ${recordName}`);
    } else {
      // Create new record
      console.log(`Creating new CNAME record for ${recordName}`);
      
      const createOptions = {
        hostname: 'api.cloudflare.com',
        path: `/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      };
      
      const createData = {
        type: 'CNAME',
        name: subdomain,
        content: target,
        ttl: 1, // Auto TTL
        proxied: true // Enable Cloudflare proxy
      };

      const createResponse = await httpRequest(createOptions, createData);
      
      if (!createResponse.body.success) {
        console.error('Cloudflare API error:', createResponse.body.errors);
        throw new Error(`Failed to create CNAME record for ${recordName}`);
      }

      console.log(`CNAME record created successfully for ${recordName}`);
    }

    return true;
  } catch (error) {
    console.error(`Error setting up CNAME record for ${recordName}:`, error);
    return false;
  }
}

// Main function to set up DNS records
async function setupCloudflareMultiTenantDNS() {
  console.log(`Setting up Cloudflare DNS for multi-tenant application on ${BASE_DOMAIN}`);
  console.log(`Using target hostname: ${SERVICE_HOSTNAME}`);

  try {
    // Create or update primary subdomains
    await createOrUpdateCname('app', SERVICE_HOSTNAME);
    await createOrUpdateCname('api', SERVICE_HOSTNAME);
    
    // Create or update wildcard subdomain for tenant URLs
    await createOrUpdateCname('*', SERVICE_HOSTNAME);

    console.log('\nDNS setup completed successfully!');
    console.log(`Main application URL: https://app.${BASE_DOMAIN}`);
    console.log(`API URL: https://api.${BASE_DOMAIN}`);
    console.log(`Tenant URLs: https://<tenant-name>.${BASE_DOMAIN}`);
    console.log('\nNote: DNS changes may take some time to propagate globally.');
  } catch (error) {
    console.error('Failed to set up Cloudflare DNS:', error);
    process.exit(1);
  }
}

// Execute the setup
setupCloudflareMultiTenantDNS();