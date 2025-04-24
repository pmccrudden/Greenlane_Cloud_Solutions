/**
 * Simple script to check DNS records for Cloudflare
 */

import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment from file
let CLOUDFLARE_API_TOKEN;
let CLOUDFLARE_ZONE_ID;

try {
  const env = fs.readFileSync('.env.deploy', 'utf8');
  env.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key === 'CLOUDFLARE_API_TOKEN') CLOUDFLARE_API_TOKEN = value.trim();
      if (key === 'CLOUDFLARE_ZONE_ID') CLOUDFLARE_ZONE_ID = value.trim();
    }
  });
} catch (err) {
  console.error('Error reading .env.deploy file:', err.message);
}

// Read from environment variables if not in file
CLOUDFLARE_API_TOKEN = CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
CLOUDFLARE_ZONE_ID = CLOUDFLARE_ZONE_ID || process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('Missing required Cloudflare credentials!');
  console.error('Please set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID in .env.deploy file or environment variables.');
  process.exit(1);
}

// Cloudflare API request
function cloudflareRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (!response.success) {
            return reject(new Error(`API Error: ${response.errors[0].message}`));
          }
          resolve(response.result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Get DNS Records
async function getDnsRecords() {
  try {
    const records = await cloudflareRequest(`zones/${CLOUDFLARE_ZONE_ID}/dns_records`);
    
    console.log('=== DNS Records for greenlanecloudsolutions.com ===');
    records.forEach(record => {
      console.log(`${record.type} ${record.name} -> ${record.content} (Proxied: ${record.proxied})`);
    });
    
    // Check for important records
    const appRecord = records.find(r => r.name === 'app.greenlanecloudsolutions.com');
    const apiRecord = records.find(r => r.name === 'api.greenlanecloudsolutions.com');
    const wildcardRecord = records.find(r => r.name === '*.greenlanecloudsolutions.com');
    
    console.log('\n=== DNS Status ===');
    console.log(`app subdomain: ${appRecord ? 'Configured' : 'Missing'}`);
    console.log(`api subdomain: ${apiRecord ? 'Configured' : 'Missing'}`);
    console.log(`wildcard subdomain: ${wildcardRecord ? 'Configured' : 'Missing'}`);
    
    // Get zone information
    const zone = await cloudflareRequest(`zones/${CLOUDFLARE_ZONE_ID}`);
    console.log('\n=== Zone Status ===');
    console.log(`Name: ${zone.name}`);
    console.log(`Status: ${zone.status}`);
    console.log(`Nameservers: ${zone.name_servers.join(', ')}`);
    
  } catch (error) {
    console.error('Error checking DNS records:', error.message);
  }
}

getDnsRecords();