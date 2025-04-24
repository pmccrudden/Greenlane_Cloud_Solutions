/**
 * Simplified tenant setup script for ESM compatibility
 * For use in Google Cloud Shell environment
 */

import * as fs from 'fs';
import * as https from 'https';
import { exec } from 'child_process';
import * as readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Execute a SQL query against the database
 */
function execSQL(query, params = []) {
  return new Promise((resolve, reject) => {
    const paramString = params.map(p => JSON.stringify(p)).join(', ');
    const command = `psql "${process.env.DATABASE_URL}" -c "${query.replace(/"/g, '\\"')}" ${paramString.length > 0 ? `-v params='${paramString}'` : ''}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing SQL: ${stderr}`);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

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
    serviceHostname = fs.readFileSync('service_hostname.txt', 'utf8').trim();
  } catch (error) {
    return { success: false, message: `Could not read service hostname: ${error.message}` };
  }

  console.log(`Setting up DNS for tenant subdomain: ${subdomain}`);
  console.log(`Setting up CNAME record: ${subdomain}.greenlanecloudsolutions.com → ${serviceHostname}`);

  const requestData = JSON.stringify({
    type: 'CNAME',
    name: subdomain,
    content: serviceHostname,
    ttl: 1, // Automatic
    proxied: true
  });

  return new Promise((resolve) => {
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
 * Create a tenant directly in the database
 */
async function createTenant(tenantId, companyName, adminEmail, adminPassword) {
  try {
    console.log(`Creating tenant: ${tenantId} (${companyName})`);
    
    // Create tenant record
    await execSQL(`
      INSERT INTO tenants (
        id, 
        company_name, 
        plan_type, 
        is_active, 
        domain_name, 
        admin_email, 
        custom_subdomain
      ) 
      VALUES (
        '${tenantId}', 
        '${companyName}', 
        'standard', 
        true, 
        '${tenantId}.greenlanecloudsolutions.com', 
        '${adminEmail}', 
        true
      )
    `);
    
    console.log(`Tenant created: ${companyName} (${tenantId})`);
    
    // Create admin user
    await execSQL(`
      INSERT INTO users (
        username, 
        email, 
        password, 
        first_name, 
        last_name, 
        role, 
        tenant_id
      ) 
      VALUES (
        '${adminEmail}', 
        '${adminEmail}', 
        '${adminPassword}',
        'Admin', 
        'User', 
        'admin', 
        '${tenantId}'
      )
    `);
    
    console.log(`Admin user created with email: ${adminEmail}`);
    
    // Initialize default modules
    const defaultModules = [
      { id: 'accounts', name: 'Accounts', description: 'Manage customer accounts', enabled: true },
      { id: 'contacts', name: 'Contacts', description: 'Manage contacts', enabled: true },
      { id: 'deals', name: 'Deals', description: 'Manage deals and opportunities', enabled: true },
      { id: 'projects', name: 'Projects', description: 'Manage customer projects', enabled: true },
      { id: 'support-tickets', name: 'Support Center', description: 'Premium module: Support ticket management', enabled: false },
      { id: 'community', name: 'Community', description: 'Premium module: Customer community platform', enabled: false },
      { id: 'workflows', name: 'Workflows', description: 'Automation workflows and rules engine', enabled: true },
      { id: 'tasks', name: 'Tasks', description: 'Account task management', enabled: true }
    ];
    
    for (const module of defaultModules) {
      await execSQL(`
        INSERT INTO modules (
          id, 
          name, 
          tenant_id, 
          description, 
          enabled, 
          version, 
          settings
        ) 
        VALUES (
          '${module.id}', 
          '${module.name}', 
          '${tenantId}', 
          '${module.description}', 
          ${module.enabled}, 
          '1.0.0', 
          '{}'
        )
      `);
    }
    
    console.log(`Default modules initialized for tenant: ${tenantId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error creating tenant:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to create a tenant and set up DNS
 */
async function setupTenant() {
  try {
    // Load environment variables
    loadEnvFromFile('.env.production');
    
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

    // Create tenant
    const tenantResult = await createTenant(tenantId, companyName, adminEmail, adminPassword);
    
    if (!tenantResult.success) {
      throw new Error(`Failed to create tenant: ${tenantResult.error}`);
    }

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
    console.log('Admin Login Details:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('\nAccess the tenant at:');
    console.log(`  https://${tenantId}.greenlanecloudsolutions.com`);

  } catch (error) {
    console.error('Error during tenant setup:', error.message);
  } finally {
    // Close readline interface
    rl.close();
  }
}

// Execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTenant();
}