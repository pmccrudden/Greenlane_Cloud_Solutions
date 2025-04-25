/**
 * Script to promote a user to admin role via API
 * For use in Google Cloud Shell where direct DB access is limited
 */
const fetch = require('node-fetch');

async function promoteUserToAdmin() {
  // Configuration
  const tenantId = process.argv[2] || 'greenlane';
  const userEmail = process.argv[3] || 'greenlane.enterprisesltd@gmail.com';
  const apiBase = 'https://greenlane-crm-tenant-login-fix-869018523985.us-central1.run.app';
  
  console.log(`Promoting user ${userEmail} to admin in tenant ${tenantId} via API`);
  
  try {
    // First, get temporary admin access token
    const tokenResponse = await fetch(`${apiBase}/api/admin/temp-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: 'deployment-secret-key',
        purpose: 'user-promotion'
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get admin token: ${tokenResponse.status} ${await tokenResponse.text()}`);
    }
    
    const { token } = await tokenResponse.json();
    
    // Now use the token to promote the user
    const promoteResponse = await fetch(`${apiBase}/api/admin/promote-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: userEmail,
        tenantId: tenantId,
        role: 'admin',
        enableAllModules: true
      })
    });
    
    if (!promoteResponse.ok) {
      throw new Error(`Failed to promote user: ${promoteResponse.status} ${await promoteResponse.text()}`);
    }
    
    const result = await promoteResponse.json();
    console.log('Success!', result);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    console.log('\nAlternative: Create a new admin user through signup if promotion fails');
    console.log('1. Go to app.greenlanecloudsolutions.com and click "Sign Up"');
    console.log('2. Use a different email address');
    console.log('3. After creating the account, login to the PostgreSQL database and update the role to "admin"');
  }
}

promoteUserToAdmin();
