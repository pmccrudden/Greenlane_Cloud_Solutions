// Script to initialize modules in the database
import pg from 'pg';

const { Client } = pg;

const TENANT_ID = '572c77d7-e838-44ca-8adb-7ddef5f199bb'; // Main tenant ID

const modules = [
  {
    id: 'community',
    name: 'Customer Community',
    description: 'Engage your customers with a dedicated community portal',
    enabled: false,
    version: '1.0.0',
    settings: {
      subdomain: '',
      customDomain: '',
      branding: {
        primaryColor: '#10B981',
        secondaryColor: '#3B82F6',
        showGreenLaneBranding: true,
      },
      features: {
        enableForums: true,
        enableGroups: true,
        enableDirectMessages: true,
        enableUserProfiles: true,
        enableNotifications: true,
        enableAnalytics: true,
      },
      integration: {
        syncUsers: true,
        syncCustomerData: true,
        createSupportTicketsFromPosts: false,
        notifyOnNegativeSentiment: false,
      }
    }
  },
  {
    id: 'support-tickets',
    name: 'Support Tickets',
    description: 'Streamline customer support with a dedicated ticketing system',
    enabled: false,
    version: '1.0.0',
    settings: {
      ticketCategories: ['Technical', 'Billing', 'Feature Request', 'General'],
      autoAssignment: true,
      slaSettings: {
        lowPriority: 72, // hours
        mediumPriority: 24, // hours
        highPriority: 4, // hours
        criticalPriority: 1 // hour
      },
      notifications: {
        emailOnNewTicket: true,
        emailOnTicketUpdate: true,
        emailOnTicketResolution: true
      },
      integration: {
        syncWithCommunity: false,
        createContactsFromTickets: true
      }
    }
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base',
    description: 'Create and share knowledge articles with your customers',
    enabled: false,
    version: '1.0.0',
    settings: {}
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    description: 'Connect external services through a unified API gateway',
    enabled: false,
    version: '1.0.0',
    settings: {}
  }
];

async function initModules() {
  console.log('Initializing modules...');
  
  // Connect to the database
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check if tenant exists
    const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [TENANT_ID]);
    if (tenantResult.rows.length === 0) {
      console.log(`Tenant with ID ${TENANT_ID} not found. Please create the tenant first.`);
      return;
    }
    
    // Check if modules table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'modules'
      )
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      console.log('Modules table does not exist. Make sure your database is properly set up.');
      return;
    }
    
    // Check if modules already exist for this tenant
    const existingModules = await client.query('SELECT id FROM modules WHERE tenant_id = $1', [TENANT_ID]);
    if (existingModules.rows.length > 0) {
      console.log('Modules already exist for this tenant. Updating existing modules...');
      
      for (const module of modules) {
        const moduleExists = existingModules.rows.some(row => row.id === module.id);
        
        if (moduleExists) {
          // Update existing module
          await client.query(
            `UPDATE modules 
             SET name = $1, description = $2, enabled = $3, version = $4, settings = $5, 
                 updated_at = NOW() 
             WHERE id = $6 AND tenant_id = $7`,
            [module.name, module.description, module.enabled, module.version, 
             JSON.stringify(module.settings), module.id, TENANT_ID]
          );
          console.log(`Updated module: ${module.id}`);
        } else {
          // Insert new module - note we're removing the status field as it doesn't exist in the table
          await client.query(
            `INSERT INTO modules (id, name, description, enabled, version, settings, tenant_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [module.id, module.name, module.description, module.enabled, module.version, 
             JSON.stringify(module.settings), TENANT_ID]
          );
          console.log(`Created module: ${module.id}`);
        }
      }
    } else {
      console.log('No modules found for this tenant. Creating modules...');
      
      for (const module of modules) {
        await client.query(
          `INSERT INTO modules (id, name, description, enabled, version, settings, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [module.id, module.name, module.description, module.enabled, module.version, 
           JSON.stringify(module.settings), TENANT_ID]
        );
        console.log(`Created module: ${module.id}`);
      }
    }
    
    console.log('Modules initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing modules:', error);
  } finally {
    await client.end();
  }
}

// Execute the function
initModules();