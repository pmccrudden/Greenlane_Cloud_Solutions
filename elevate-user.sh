#!/bin/bash
# Script to elevate a user to admin in the Greenlane tenant
# This script executes the set-admin-user.js script with the right parameters

# Default values
TENANT_ID=${1:-"greenlane"}
USER_EMAIL=${2:-"greenlane.enterprisesltd@gmail.com"}

# Check if running on Google Cloud Shell
if [ -d "$HOME/cloud-shell" ] || [ -n "$CLOUD_SHELL" ]; then
  echo "Running in Google Cloud Shell..."
  
  # For Cloud Shell, use an API-based approach instead of direct database access
  # Create a temporary script for API-based user promotion
  cat > elevate-user-api.js << EOF
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
  
  console.log(\`Promoting user \${userEmail} to admin in tenant \${tenantId} via API\`);
  
  try {
    // First, get temporary admin access token
    const tokenResponse = await fetch(\`\${apiBase}/api/admin/temp-access\`, {
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
      throw new Error(\`Failed to get admin token: \${tokenResponse.status} \${await tokenResponse.text()}\`);
    }
    
    const { token } = await tokenResponse.json();
    
    // Now use the token to promote the user
    const promoteResponse = await fetch(\`\${apiBase}/api/admin/promote-user\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({
        email: userEmail,
        tenantId: tenantId,
        role: 'admin',
        enableAllModules: true
      })
    });
    
    if (!promoteResponse.ok) {
      throw new Error(\`Failed to promote user: \${promoteResponse.status} \${await promoteResponse.text()}\`);
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
EOF

  # Install node-fetch if needed
  if ! npm list -g | grep -q node-fetch; then
    echo "Installing node-fetch..."
    npm install -g node-fetch
  fi
  
  # Run the API script
  node elevate-user-api.js "$TENANT_ID" "$USER_EMAIL"
  
else
  # Local environment with direct database access
  echo "Running in local environment with direct database access..."
  
  # Check if node is installed
  if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js and try again."
    exit 1
  fi
  
  # Check if .env.production exists
  if [ ! -f .env.production ]; then
    echo "Warning: .env.production file not found"
    echo "Creating temporary .env.production file with DATABASE_URL placeholder"
    echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/greenlane" > .env.production
    echo "Please edit .env.production with your actual database credentials"
  fi
  
  # Install required npm packages
  echo "Installing required packages..."
  npm install --no-save pg dotenv
  
  # Run the Node.js script
  echo "Running set-admin-user.js..."
  node set-admin-user.js "$TENANT_ID" "$USER_EMAIL"
fi

echo ""
echo "If direct database update or API promotion fails, you can use these SQL commands directly:"
echo ""
echo "UPDATE users SET role = 'admin' WHERE email = '$USER_EMAIL';"
echo "UPDATE tenant_users SET role = 'admin' WHERE tenant_id = '$TENANT_ID' AND user_id = (SELECT id FROM users WHERE email = '$USER_EMAIL');"
echo ""
echo "Run these in your PostgreSQL database with the appropriate credentials."