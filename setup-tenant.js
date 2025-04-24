// Script to create a new tenant and admin user
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from './server/db.js';
import { tenants, users, modules } from './shared/schema.js';
import { createTenantSubdomain } from './server/cloudflare.js';

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

async function createTenantAndAdmin() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node setup-tenant.js <tenant-id> <company-name> <admin-email> [admin-password]');
    console.error('Example: node setup-tenant.js acme "Acme Corporation" admin@acme.com');
    process.exit(1);
  }
  
  const tenantId = args[0];
  const companyName = args[1];
  const adminEmail = args[2];
  const adminPassword = args[3] || crypto.randomBytes(8).toString('hex');
  
  try {
    console.log(`Setting up new tenant: ${companyName} (${tenantId})`);
    
    // Check if tenant already exists
    const existingTenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.id, tenantId)
    });
    
    if (existingTenant) {
      console.error(`Tenant with ID ${tenantId} already exists.`);
      process.exit(1);
    }
    
    // Set up DNS for the tenant
    try {
      console.log(`Setting up DNS for tenant subdomain: ${tenantId}`);
      const dnsResult = await createTenantSubdomain(tenantId);
      
      if (!dnsResult.success) {
        console.warn(`Warning: Failed to set up DNS: ${dnsResult.message}`);
        console.warn('Continuing with tenant setup...');
      } else {
        console.log(`DNS setup successful: ${dnsResult.message}`);
      }
    } catch (error) {
      console.warn('Warning: Error setting up DNS:', error.message);
      console.warn('Continuing with tenant setup...');
    }
    
    // Create the tenant
    const tenant = await db.insert(tenants).values({
      id: tenantId,
      companyName,
      planType: 'standard',
      isActive: true,
      domainName: `${tenantId}.greenlanecloudsolutions.com`,
      adminEmail,
      custom_subdomain: true
    }).returning();
    
    console.log(`Tenant created: ${tenant[0].companyName} (${tenant[0].id})`);
    
    // Create admin user
    const user = await db.insert(users).values({
      username: adminEmail,
      email: adminEmail,
      password: adminPassword, // In production, this should be hashed
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      tenantId
    }).returning();
    
    console.log(`Admin user created with email: ${user[0].email}`);
    
    // Initialize default modules
    const defaultModules = [
      {
        id: 'accounts',
        name: 'Accounts',
        tenantId,
        description: 'Manage customer accounts',
        enabled: true,
        version: '1.0.0',
        lastUpdated: new Date(),
        settings: {}
      },
      {
        id: 'contacts',
        name: 'Contacts',
        tenantId,
        description: 'Manage contacts',
        enabled: true,
        version: '1.0.0',
        lastUpdated: new Date(),
        settings: {}
      },
      {
        id: 'deals',
        name: 'Deals',
        tenantId,
        description: 'Manage deals and opportunities',
        enabled: true,
        version: '1.0.0',
        lastUpdated: new Date(),
        settings: {}
      },
      {
        id: 'projects',
        name: 'Projects',
        tenantId,
        description: 'Manage customer projects',
        enabled: true,
        version: '1.0.0',
        lastUpdated: new Date(),
        settings: {}
      },
      {
        id: 'support-tickets',
        name: 'Support Center',
        tenantId,
        description: 'Premium module: Support ticket management',
        enabled: false,
        version: '1.0.0',
        lastUpdated: new Date(),
        settings: {}
      },
      {
        id: 'community',
        name: 'Community',
        tenantId,
        description: 'Premium module: Customer community platform',
        enabled: false,
        version: '1.0.0',
        lastUpdated: new Date(),
        settings: {}
      },
      {
        id: 'workflows',
        name: 'Workflows',
        tenantId,
        description: 'Automation workflows and rules engine',
        enabled: true,
        version: '1.0.0',
        lastUpdated: new Date(),
        settings: {}
      },
      {
        id: 'tasks',
        name: 'Tasks',
        tenantId,
        description: 'Account task management',
        enabled: true,
        version: '1.0.0',
        lastUpdated: new Date(),
        settings: {}
      }
    ];
    
    for (const moduleData of defaultModules) {
      await db.insert(modules).values(moduleData);
    }
    
    console.log(`Default modules initialized for tenant: ${tenantId}`);
    
    // Success message
    console.log('\n===== Tenant Setup Complete =====');
    console.log(`Tenant URL: https://${tenantId}.greenlanecloudsolutions.com`);
    console.log('Admin Login Details:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('\nNote: DNS changes may take some time to propagate.');
    
  } catch (error) {
    console.error('Error setting up tenant:', error);
    process.exit(1);
  }
}

// Execute if run directly (using ESM)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  createTenantAndAdmin();
}

// Export for use in other modules
export { createTenantAndAdmin };