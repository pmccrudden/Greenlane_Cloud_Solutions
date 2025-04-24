/**
 * Simple DNS check - No dependencies required
 * This version uses DNS lookups to check if domains are properly configured
 */

import dns from 'dns';
import { promises as fs } from 'fs';
import https from 'https';

// Domain to check
const baseDomain = 'greenlanecloudsolutions.com';

// List of subdomains to check
const subdomains = [
  '', // Root domain
  'www',
  'app',
  'api',
  'greenlane' // Example tenant
];

// Function to get the Cloud Run URL from service_hostname.txt
async function getServiceHostname() {
  try {
    const hostname = await fs.readFile('./service_hostname.txt', 'utf8');
    return hostname.trim();
  } catch (err) {
    console.error('Could not read service_hostname.txt:', err.message);
    return null;
  }
}

// Function to check if a domain resolves and is accessible
function checkDomain(domain) {
  return new Promise((resolve) => {
    dns.lookup(domain, (err, address) => {
      if (err) {
        resolve({
          domain,
          status: 'DNS Error',
          message: err.code
        });
        return;
      }
      
      // Try to make HTTP request to the domain
      const url = `https://${domain}`;
      const req = https.get(url, { timeout: 5000 }, (res) => {
        resolve({
          domain,
          status: 'OK',
          ip: address,
          httpStatus: res.statusCode,
          message: `HTTP ${res.statusCode} - ${res.statusMessage}`
        });
      });
      
      req.on('error', (reqErr) => {
        resolve({
          domain,
          status: 'HTTP Error',
          ip: address,
          message: reqErr.message
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          domain,
          status: 'Timeout',
          ip: address,
          message: 'Request timed out after 5 seconds'
        });
      });
    });
  });
}

// Check HTTP response from the Cloud Run URL
function checkCloudRunUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(`https://${url}`, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: 'OK',
          httpStatus: res.statusCode,
          message: `HTTP ${res.statusCode} - ${res.statusMessage}`,
          dataPreview: data.slice(0, 100) + (data.length > 100 ? '...' : '')
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 'Error',
        message: err.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'Timeout',
        message: 'Request timed out after 5 seconds'
      });
    });
  });
}

// Main function
async function checkDNS() {
  console.log('=== DNS Configuration Check ===\n');

  // Get Cloud Run hostname
  const serviceHostname = await getServiceHostname();
  
  if (serviceHostname) {
    console.log(`Cloud Run Service: ${serviceHostname}`);
    console.log('Checking if Cloud Run service is accessible...');
    
    const cloudRunCheck = await checkCloudRunUrl(serviceHostname);
    console.log(`Status: ${cloudRunCheck.status}`);
    console.log(`Response: ${cloudRunCheck.message}`);
    
    if (cloudRunCheck.dataPreview) {
      console.log(`Content preview: ${cloudRunCheck.dataPreview}`);
    }
  } else {
    console.log('Cloud Run service hostname not found in service_hostname.txt');
  }
  
  console.log('\n=== Domain Configuration Check ===\n');
  
  // Check each subdomain
  for (const subdomain of subdomains) {
    const domain = subdomain ? `${subdomain}.${baseDomain}` : baseDomain;
    console.log(`Checking ${domain}...`);
    
    const result = await checkDomain(domain);
    
    console.log(`Status: ${result.status}`);
    if (result.ip) console.log(`IP Address: ${result.ip}`);
    console.log(`Result: ${result.message}`);
    
    if (result.httpStatus) {
      // Green for 2xx, yellow for 3xx, red for 4xx/5xx
      const statusColor = result.httpStatus >= 200 && result.httpStatus < 300 ? 
        '\x1b[32m' : (result.httpStatus >= 300 && result.httpStatus < 400 ? 
          '\x1b[33m' : '\x1b[31m');
          
      console.log(`HTTP Status: ${statusColor}${result.httpStatus}\x1b[0m`);
    }
    
    console.log(''); // Empty line for separation
  }
  
  console.log('=== Summary of Recommendations ===\n');
  console.log('1. DNS records should point to Cloudflare IPs (typically 104.21.x.x or 172.67.x.x)');
  console.log('2. HTTP status should be 200 OK for all domains');
  console.log('3. If you see "certificate" errors, check Cloudflare SSL/TLS settings');
  console.log('4. If status is "Timeout", the server might not be responding');
  console.log('\n=== Next Steps ===\n');
  console.log('If domains show DNS errors:');
  console.log('1. Check Cloudflare DNS records');
  console.log('2. Run: node setup-cloudflare-dns.js');
  console.log('3. Allow 5-15 minutes for DNS propagation');
}

// Run the check
checkDNS().catch(console.error);