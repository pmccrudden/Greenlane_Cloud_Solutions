// Setup script to create tenant and admin user
import { db } from "./server/db.js";
import { tenants, users } from "./shared/schema.js";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function createTenantAndAdmin() {
  try {
    console.log("Creating tenant...");
    
    // Create tenant
    const [tenant] = await db.insert(tenants).values({
      id: uuidv4(),
      companyName: "GreenLane Cloud Enterprises",
      domainName: "greenlane.greenlanecloudsolutions.com",
      adminEmail: "admin@greenlanecloudsolutions.com",
      planType: "enterprise",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log("Tenant created:", tenant);
    
    // Create admin user
    const password = "Admin123!"; // This is a temp password, should be changed after first login
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [user] = await db.insert(users).values({
      username: "admin",
      email: "admin@greenlanecloudsolutions.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      tenantId: tenant.id,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log("Admin user created:", {
      username: user.username,
      email: user.email,
      password: password // Only showing this for initial setup
    });
    
    console.log("Setup completed successfully!");
    
  } catch (error) {
    console.error("Error during setup:", error);
  } finally {
    process.exit(0);
  }
}

createTenantAndAdmin();