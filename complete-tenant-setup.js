// Script to create a tenant and set up DNS
import { createTenantAndAdmin } from './create-tenant.js';
import { setupTenantDNS } from './setup-tenant-dns.js';

/**
 * Main function to create a tenant and set up DNS
 */
async function completeTenantSetup() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node complete-tenant-setup.js <tenant-id> <company-name> <admin-email> [admin-password]');
    console.error('Example: node complete-tenant-setup.js acme "Acme Corporation" admin@acme.com');
    process.exit(1);
  }
  
  try {
    // Create tenant and admin user
    console.log('====== Step 1: Creating Tenant ======');
    await createTenantAndAdmin();
    
    // Set up DNS
    console.log('\n====== Step 2: Setting up DNS ======');
    const tenantId = args[0];
    process.argv = [process.argv[0], process.argv[1], tenantId]; // Hack to pass args to setupTenantDNS
    await setupTenantDNS();
    
    console.log('\n✅ Tenant setup completed successfully!');
    
  } catch (error) {
    console.error('Error in tenant setup process:', error);
    process.exit(1);
  }
}

completeTenantSetup();