// Script to get Cloudflare Zone ID and other information for a domain
const fetch = require('node-fetch');
require('dotenv').config();

// Get the domain from command line arguments or use default
const args = process.argv.slice(2);
const domain = args[0] || 'greenlanecloudsolutions.com';

// Required environment variables
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!CLOUDFLARE_API_TOKEN) {
  console.error('Error: CLOUDFLARE_API_TOKEN environment variable is required');
  console.error('You can create an API token at https://dash.cloudflare.com/profile/api-tokens');
  console.error('Required permissions: Zone.Zone and Zone.DNS');
  process.exit(1);
}

async function getZoneInfo(domain) {
  try {
    console.log(`Fetching zone information for domain: ${domain}`);
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${domain}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Cloudflare API error:', data.errors);
      process.exit(1);
    }
    
    if (data.result.length === 0) {
      console.error(`No zone found for domain: ${domain}`);
      console.error('Make sure the domain is registered with Cloudflare and your API token has access to it.');
      process.exit(1);
    }
    
    const zone = data.result[0];
    
    console.log('\n===== Cloudflare Zone Information =====');
    console.log(`Domain: ${zone.name}`);
    console.log(`Zone ID: ${zone.id}`);
    console.log(`Status: ${zone.status}`);
    console.log(`Name Servers: ${zone.name_servers.join(', ')}`);
    console.log(`Original Name Servers: ${zone.original_name_servers.join(', ')}`);
    console.log(`Paused: ${zone.paused}`);
    
    console.log('\n===== Environment Variable Setup =====');
    console.log('Add the following to your .env file:');
    console.log(`CLOUDFLARE_ZONE_ID=${zone.id}`);
    console.log(`BASE_DOMAIN=${zone.name}`);
    
    // Get DNS records for the zone
    const dnsResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const dnsData = await dnsResponse.json();
    
    if (!dnsData.success) {
      console.error('Error fetching DNS records:', dnsData.errors);
    } else {
      console.log('\n===== DNS Records =====');
      console.log('Found', dnsData.result.length, 'DNS records');
      
      if (dnsData.result.length > 0) {
        const records = dnsData.result;
        
        // Find app, api, and wildcard records
        const appRecord = records.find(r => r.type === 'CNAME' && r.name === `app.${zone.name}`);
        const apiRecord = records.find(r => r.type === 'CNAME' && r.name === `api.${zone.name}`);
        const wildcardRecord = records.find(r => r.type === 'CNAME' && r.name === `*.${zone.name}`);
        
        console.log('\nExisting Subdomain Records:');
        
        if (appRecord) {
          console.log(`- app.${zone.name} -> ${appRecord.content} (proxied: ${appRecord.proxied})`);
        } else {
          console.log(`- app.${zone.name} is not set up`);
        }
        
        if (apiRecord) {
          console.log(`- api.${zone.name} -> ${apiRecord.content} (proxied: ${apiRecord.proxied})`);
        } else {
          console.log(`- api.${zone.name} is not set up`);
        }
        
        if (wildcardRecord) {
          console.log(`- *.${zone.name} -> ${wildcardRecord.content} (proxied: ${wildcardRecord.proxied})`);
          console.log(`  SERVICE_HOSTNAME=${wildcardRecord.content}`);
        } else {
          console.log(`- *.${zone.name} is not set up (required for multi-tenant)`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Execute
getZoneInfo(domain);