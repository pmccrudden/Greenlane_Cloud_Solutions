/**
 * Script to update a user to admin role in the Greenlane tenant
 * This script connects directly to the PostgreSQL database and updates user roles
 */

require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

// Configuration from environment variables
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
};

// User details to update
const tenantId = process.argv[2] || 'greenlane';
const userEmail = process.argv[3] || 'greenlane.enterprisesltd@gmail.com';

async function main() {
  console.log(`Setting admin privileges for user: ${userEmail} in tenant: ${tenantId}`);
  
  // Create database connection
  const pool = new Pool(dbConfig);
  
  try {
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // First, find the user
      const userResult = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [userEmail]
      );

      if (userResult.rows.length === 0) {
        throw new Error(`User with email ${userEmail} not found`);
      }
      
      const user = userResult.rows[0];
      console.log(`Found user: ${user.username} (ID: ${user.id})`);
      
      // Now update the user role to admin
      await client.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        ['admin', user.id]
      );
      
      console.log(`Updated user role to admin`);

      // Also check if there's a tenant_users table and update there if needed
      try {
        const tenantUserResult = await client.query(
          'SELECT * FROM tenant_users WHERE user_id = $1 AND tenant_id = $2',
          [user.id, tenantId]
        );
        
        if (tenantUserResult.rows.length > 0) {
          await client.query(
            'UPDATE tenant_users SET role = $1 WHERE user_id = $2 AND tenant_id = $3',
            ['admin', user.id, tenantId]
          );
          console.log(`Updated user role in tenant_users table`);
        } else {
          // No tenant user relationship, try to insert one
          try {
            await client.query(
              'INSERT INTO tenant_users (user_id, tenant_id, role) VALUES ($1, $2, $3)',
              [user.id, tenantId, 'admin']
            );
            console.log(`Created tenant_user relationship with admin role`);
          } catch (err) {
            console.log(`Could not create tenant_user: ${err.message}`);
          }
        }
      } catch (err) {
        console.log(`Note: tenant_users table might not exist: ${err.message}`);
      }

      // Also check for a user_roles table which some systems use
      try {
        const roleResult = await client.query(
          'SELECT * FROM user_roles WHERE user_id = $1',
          [user.id]
        );
        
        if (roleResult.rows.length > 0) {
          await client.query(
            'UPDATE user_roles SET role = $1 WHERE user_id = $2',
            ['admin', user.id]
          );
          console.log(`Updated role in user_roles table`);
        } else {
          try {
            await client.query(
              'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
              [user.id, 'admin']
            );
            console.log(`Created entry in user_roles table`);
          } catch (err) {
            console.log(`Could not create user_role: ${err.message}`);
          }
        }
      } catch (err) {
        console.log(`Note: user_roles table might not exist: ${err.message}`);
      }
      
      // Enable all modules for the tenant
      try {
        // Get tenant ID
        const tenantResult = await client.query(
          'SELECT * FROM tenants WHERE id = $1',
          [tenantId]
        );
        
        if (tenantResult.rows.length > 0) {
          const tenant = tenantResult.rows[0];
          
          // Update tenant to enable all modules
          let modules = tenant.modules || {};
          
          // Enable all known modules
          const allModules = [
            'accounts', 'contacts', 'deals', 'projects', 
            'support_tickets', 'reports', 'ai_analytics', 
            'community', 'workflows'
          ];
          
          allModules.forEach(module => {
            modules[module] = { enabled: true };
          });
          
          await client.query(
            'UPDATE tenants SET modules = $1 WHERE id = $2',
            [JSON.stringify(modules), tenantId]
          );
          
          console.log(`Enabled all modules for tenant: ${tenantId}`);
        }
      } catch (err) {
        console.log(`Error updating tenant modules: ${err.message}`);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Success! User is now an admin with access to all modules.');
      
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error updating user:', err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});