// Script to create a new tenant directly using SQL
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Pool } from 'pg';

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

// Database connection
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
 * Creates a new tenant with admin user and default modules
 * @param {string} [providedTenantId] - The tenant ID (subdomain)
 * @param {string} [providedCompanyName] - The company name
 * @param {string} [providedAdminEmail] - The admin email
 * @param {string} [providedAdminPassword] - The admin password
 * @returns {Promise<object>} - The created tenant
 */
async function createTenantAndAdmin(providedTenantId, providedCompanyName, providedAdminEmail, providedAdminPassword) {
  let tenantId, companyName, adminEmail, adminPassword;
  
  // If function is called with parameters, use those
  if (providedTenantId && providedCompanyName && providedAdminEmail) {
    tenantId = providedTenantId;
    companyName = providedCompanyName;
    adminEmail = providedAdminEmail;
    adminPassword = providedAdminPassword || crypto.randomBytes(8).toString('hex');
  } else {
    // Otherwise get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      console.error('Usage: node create-tenant.js <tenant-id> <company-name> <admin-email> [admin-password]');
      console.error('Example: node create-tenant.js acme "Acme Corporation" admin@acme.com');
      process.exit(1);
    }
    
    tenantId = args[0];
    companyName = args[1];
    adminEmail = args[2];
    adminPassword = args[3] || crypto.randomBytes(8).toString('hex');
  }
  
  if (!isValidSubdomain(tenantId)) {
    console.error(`Invalid tenant ID: '${tenantId}'. Must be 3-20 characters, lowercase letters, numbers, and hyphens only.`);
    process.exit(1);
  }

  try {
    // Create a client from the pool
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Check if tenant already exists
      const tenantCheckResult = await client.query(
        'SELECT id FROM tenants WHERE id = $1',
        [tenantId]
      );
      
      if (tenantCheckResult.rows.length > 0) {
        console.error(`Tenant with ID ${tenantId} already exists.`);
        process.exit(1);
      }
      
      // Create the tenant
      const insertTenantResult = await client.query(
        `INSERT INTO tenants (
          id, 
          company_name, 
          plan_type, 
          is_active, 
          domain_name, 
          admin_email, 
          custom_subdomain
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          tenantId,
          companyName,
          'standard',
          true,
          `${tenantId}.greenlanecloudsolutions.com`,
          adminEmail,
          true
        ]
      );
      
      const tenant = insertTenantResult.rows[0];
      console.log(`Tenant created: ${tenant.company_name} (${tenant.id})`);
      
      // Create admin user
      const insertUserResult = await client.query(
        `INSERT INTO users (
          username, 
          email, 
          password, 
          first_name, 
          last_name, 
          role, 
          tenant_id
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          adminEmail,
          adminEmail,
          adminPassword, // In production, this should be hashed
          'Admin',
          'User',
          'admin',
          tenantId
        ]
      );
      
      const user = insertUserResult.rows[0];
      console.log(`Admin user created with email: ${user.email}`);
      
      // Initialize default modules
      const defaultModules = [
        {
          id: 'accounts',
          name: 'Accounts',
          description: 'Manage customer accounts',
          enabled: true
        },
        {
          id: 'contacts',
          name: 'Contacts',
          description: 'Manage contacts',
          enabled: true
        },
        {
          id: 'deals',
          name: 'Deals',
          description: 'Manage deals and opportunities',
          enabled: true
        },
        {
          id: 'projects',
          name: 'Projects',
          description: 'Manage customer projects',
          enabled: true
        },
        {
          id: 'support-tickets',
          name: 'Support Center',
          description: 'Premium module: Support ticket management',
          enabled: false
        },
        {
          id: 'community',
          name: 'Community',
          description: 'Premium module: Customer community platform',
          enabled: false
        },
        {
          id: 'workflows',
          name: 'Workflows',
          description: 'Automation workflows and rules engine',
          enabled: true
        },
        {
          id: 'tasks',
          name: 'Tasks',
          description: 'Account task management',
          enabled: true
        }
      ];
      
      for (const module of defaultModules) {
        await client.query(
          `INSERT INTO modules (
            id, 
            name, 
            tenant_id, 
            description, 
            enabled, 
            version, 
            settings
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            module.id,
            module.name,
            tenantId,
            module.description,
            module.enabled,
            '1.0.0',
            '{}'
          ]
        );
      }
      
      console.log(`Default modules initialized for tenant: ${tenantId}`);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Success message
      console.log('\n===== Tenant Setup Complete =====');
      console.log(`Tenant URL: https://${tenantId}.greenlanecloudsolutions.com`);
      console.log('Admin Login Details:');
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
      console.log('\nNote: DNS changes may take some time to propagate.');
      
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error setting up tenant:', error);
    process.exit(1);
  }
}

// Execute if this file is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  createTenantAndAdmin();
}

// Export for use in other modules
export { createTenantAndAdmin };