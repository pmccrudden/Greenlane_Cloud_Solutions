/**
 * One-time script to create the Greenlane tenant with admin user (CommonJS version)
 */
const createTenant = require('./create-tenant.js');
const setupDns = require('./add-tenant-subdomain.js');

async function createGreenlaneTenant() {
  try {
    console.log('Creating Greenlane tenant...');
    
    // Create tenant with admin
    const tenantId = 'greenlane';
    const companyName = 'Greenlane Enterprises';
    const adminEmail = 'greenlane.enterprisesltd@gmail.com';
    const adminPassword = 'SnowBomb42!?';
    
    const tenant = await createTenant.createTenantAndAdmin(
      tenantId, 
      companyName, 
      adminEmail, 
      adminPassword
    );
    
    console.log('Tenant created successfully:', tenant);
    
    // Set up DNS
    console.log('Setting up DNS for tenant subdomain...');
    const dnsResult = await setupDns.createTenantSubdomain(tenantId);
    
    console.log('DNS setup result:', dnsResult);
    
    console.log('\n✅ Tenant creation complete!');
    console.log(`You can now access your tenant at: https://${tenantId}.greenlanecloudsolutions.com`);
    console.log(`Login with: ${adminEmail} / ${adminPassword}`);
  } catch (error) {
    console.error('Error creating tenant:', error);
  }
}

createGreenlaneTenant();
