// Script to create a fully populated demo tenant with sample data
require('dotenv').config();
const crypto = require('crypto');
const { db } = require('./server/db');
const { tenants, users, modules, accounts, contacts, deals, projects, supportTickets } = require('./shared/schema');
const { createTenantSubdomain } = require('./server/cloudflare');

// Sample data for demo tenant
const sampleAccounts = [
  {
    name: 'Acme Technologies',
    industry: 'Technology',
    revenue: 5000000,
    employees: 120,
    website: 'https://acmetech.example.com',
    status: 'Active',
    rating: 'Hot',
    phone: '(555) 123-4567',
    email: 'info@acmetech.example.com',
    address: '123 Tech Park, Silicon Valley, CA',
    description: 'Leading provider of cloud solutions for enterprise clients.',
    healthScore: 85,
    lastActivity: new Date()
  },
  {
    name: 'GlobalHealth Partners',
    industry: 'Healthcare',
    revenue: 12000000,
    employees: 450,
    website: 'https://globalhealth.example.com',
    status: 'Active',
    rating: 'Warm',
    phone: '(555) 234-5678',
    email: 'contact@globalhealth.example.com',
    address: '789 Medical Plaza, Boston, MA',
    description: 'International healthcare provider specializing in telemedicine solutions.',
    healthScore: 78,
    lastActivity: new Date()
  },
  {
    name: 'Retail Innovations',
    industry: 'Retail',
    revenue: 3500000,
    employees: 75,
    website: 'https://retail-innovations.example.com',
    status: 'Active',
    rating: 'Hot',
    phone: '(555) 345-6789',
    email: 'hello@retail-innovations.example.com',
    address: '456 Market Street, Portland, OR',
    description: 'Innovative retail technology solutions for brick and mortar businesses.',
    healthScore: 92,
    lastActivity: new Date()
  },
  {
    name: 'Financial Solutions Inc',
    industry: 'Finance',
    revenue: 8000000,
    employees: 200,
    website: 'https://finsolutions.example.com',
    status: 'Active',
    rating: 'Warm',
    phone: '(555) 456-7890',
    email: 'info@finsolutions.example.com',
    address: '100 Wall Street, New York, NY',
    description: 'Financial services and solutions for mid-market businesses.',
    healthScore: 75,
    lastActivity: new Date()
  }
];

// Generate contacts for each account
function generateContacts(accountId, tenantId) {
  const titles = ['CEO', 'CTO', 'CFO', 'VP of Sales', 'Director of Marketing', 'Product Manager', 'IT Manager'];
  const contacts = [];
  
  // Generate 2-4 contacts per account
  const numContacts = Math.floor(Math.random() * 3) + 2;
  
  for (let i = 0; i < numContacts; i++) {
    const firstName = ['John', 'Jane', 'Michael', 'Emily', 'Robert', 'Sarah', 'David', 'Emma'][Math.floor(Math.random() * 8)];
    const lastName = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson'][Math.floor(Math.random() * 8)];
    
    contacts.push({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      accountId,
      status: 'Active',
      tenantId,
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
    });
  }
  
  return contacts;
}

// Generate deals for each account
function generateDeals(accountId, tenantId) {
  const dealNames = [
    'Annual Subscription Renewal',
    'Enterprise Implementation',
    'Cloud Migration Project',
    'System Upgrade',
    'New Product License',
    'Managed Services Contract',
    'Platform Integration'
  ];
  
  const stages = ['Qualification', 'Needs Analysis', 'Solution Presentation', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const deals = [];
  
  // Generate 1-3 deals per account
  const numDeals = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < numDeals; i++) {
    const dealName = dealNames[Math.floor(Math.random() * dealNames.length)];
    const stage = stages[Math.floor(Math.random() * (stages.length - 1))]; // Exclude Closed Lost for demo
    const amount = Math.floor((Math.random() * 50000) + 10000);
    const probability = stage === 'Qualification' ? 20 :
                        stage === 'Needs Analysis' ? 40 :
                        stage === 'Solution Presentation' ? 60 :
                        stage === 'Negotiation' ? 80 :
                        stage === 'Closed Won' ? 100 : 0;
    
    deals.push({
      name: `${dealName} - ${accountId}`,
      accountId,
      amount,
      stage,
      probability,
      expectedCloseDate: new Date(Date.now() + Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      tenantId,
      description: `${dealName} opportunity with potential value of $${amount.toLocaleString()}.`,
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000)
    });
  }
  
  return deals;
}

// Generate projects for each account
function generateProjects(accountId, tenantId) {
  const projectNames = [
    'Cloud Migration',
    'System Implementation',
    'Platform Integration',
    'Digital Transformation',
    'Application Development',
    'Security Upgrade',
    'Data Analytics Implementation'
  ];
  
  const statuses = ['Planning', 'In Progress', 'Testing', 'Completed', 'On Hold'];
  const projects = [];
  
  // Generate 0-2 projects per account
  const numProjects = Math.floor(Math.random() * 3);
  
  for (let i = 0; i < numProjects; i++) {
    const projectName = projectNames[Math.floor(Math.random() * projectNames.length)];
    const status = statuses[Math.floor(Math.random() * (statuses.length - 1))]; // Exclude On Hold for most demos
    
    projects.push({
      name: `${projectName} - ${accountId}`,
      accountId,
      status,
      startDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000),
      budget: Math.floor((Math.random() * 100000) + 25000),
      healthScore: Math.floor(Math.random() * 30) + 70, // 70-100 for demo
      tenantId,
      description: `${projectName} project to enhance client operations and infrastructure.`,
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
    });
  }
  
  return projects;
}

// Generate support tickets for each account
function generateSupportTickets(accountId, tenantId) {
  const ticketSubjects = [
    'Login Issue',
    'Data Import Problem',
    'Report Generation Error',
    'Integration Failure',
    'Performance Slowdown',
    'Feature Request',
    'Billing Inquiry'
  ];
  
  const statuses = ['Open', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const tickets = [];
  
  // Generate 0-3 tickets per account
  const numTickets = Math.floor(Math.random() * 4);
  
  for (let i = 0; i < numTickets; i++) {
    const subject = ticketSubjects[Math.floor(Math.random() * ticketSubjects.length)];
    const status = statuses[Math.floor(Math.random() * (statuses.length - 1))]; // Mostly active tickets
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    tickets.push({
      subject: `${subject} - ${accountId}`,
      description: `Customer reported an issue with ${subject.toLowerCase()}. Needs investigation.`,
      status,
      priority,
      accountId,
      tenantId,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
  }
  
  return tickets;
}

async function createDemoTenant() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node setup-demo-tenant.js <tenant-id> <company-name> <admin-email> [admin-password]');
    console.error('Example: node setup-demo-tenant.js acmedemo "Acme Demo Account" admin@acmedemo.com');
    process.exit(1);
  }
  
  const tenantId = args[0];
  const companyName = args[1];
  const adminEmail = args[2];
  const adminPassword = args[3] || crypto.randomBytes(8).toString('hex');
  
  try {
    console.log(`Setting up demo tenant: ${companyName} (${tenantId})`);
    
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
      planType: 'demo',
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
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'admin',
      tenantId
    }).returning();
    
    console.log(`Admin user created with email: ${user[0].email}`);
    
    // Initialize all modules (including premium ones for demo)
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
        enabled: true, // Enabled for demo
        version: '1.0.0',
        lastUpdated: new Date(),
        settings: {}
      },
      {
        id: 'community',
        name: 'Community',
        tenantId,
        description: 'Premium module: Customer community platform',
        enabled: true, // Enabled for demo
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
    
    console.log(`Modules initialized for tenant: ${tenantId}`);
    
    // Create sample accounts
    console.log('Creating sample accounts...');
    for (const accountData of sampleAccounts) {
      const account = await db.insert(accounts).values({
        ...accountData,
        tenantId
      }).returning();
      
      const accountId = account[0].id;
      
      // Generate and insert contacts for this account
      const accountContacts = generateContacts(accountId, tenantId);
      for (const contactData of accountContacts) {
        await db.insert(contacts).values(contactData);
      }
      
      // Generate and insert deals for this account
      const accountDeals = generateDeals(accountId, tenantId);
      for (const dealData of accountDeals) {
        await db.insert(deals).values(dealData);
      }
      
      // Generate and insert projects for this account
      const accountProjects = generateProjects(accountId, tenantId);
      for (const projectData of accountProjects) {
        await db.insert(projects).values(projectData);
      }
      
      // Generate and insert support tickets for this account
      const accountTickets = generateSupportTickets(accountId, tenantId);
      for (const ticketData of accountTickets) {
        await db.insert(supportTickets).values(ticketData);
      }
    }
    
    console.log('Sample data generation complete!');
    
    // Success message
    console.log('\n===== Demo Tenant Setup Complete =====');
    console.log(`Tenant URL: https://${tenantId}.greenlanecloudsolutions.com`);
    console.log('Admin Login Details:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('\nThis demo tenant includes:');
    console.log('- Sample accounts, contacts, deals, and projects');
    console.log('- Support tickets and community access (premium features)');
    console.log('- Full admin access to all modules');
    console.log('\nNote: DNS changes may take some time to propagate.');
    
  } catch (error) {
    console.error('Error setting up demo tenant:', error);
    process.exit(1);
  }
}

createDemoTenant();