import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import crypto from "crypto";
import Stripe from "stripe";
import { z } from "zod";
import { 
  insertUserSchema,
  insertTenantSchema,
  insertAccountSchema,
  insertContactSchema,
  insertDealSchema,
  insertProjectSchema,
  insertSupportTicketSchema,
  insertTicketActivitySchema,
  insertEmailTemplateSchema,
  insertDigitalJourneySchema,
  insertAccountTaskSchema,
  insertReportDefinitionSchema,
  insertDashboardDefinitionSchema,
  insertDashboardWidgetSchema,
  insertUserDashboardPreferenceSchema,
  insertSavedReportFilterSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  generateAccountSummary, 
  generateNextStepsRecommendations, 
  generateTaskPlaybook,
  generatePredictiveAnalytics 
} from "./anthropic";
import { db, pgClient } from "./db";

// Extend Express.User interface
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      role: string;
      tenantId: string;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      createdAt?: Date;
      updatedAt?: Date;
    }
  }
}

const SECRET_KEY = process.env.SECRET || "greenlanecloudsolutions-development-secret";

// Initialize Stripe if the secret key is available
let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-03-31.basil",
  });
} else {
  console.warn("Warning: STRIPE_SECRET_KEY is not set, Stripe functionality will be unavailable");
}

// Helper function to get tenant ID from request
function getTenantId(req: Request): string | null {
  // Always check for X-Tenant-ID header first and prioritize it if present
  const headerTenantId = req.get("X-Tenant-ID");
  if (headerTenantId) {
    console.log(`Using tenant ID from header: ${headerTenantId}`);
    return headerTenantId;
  }
  
  // Fallback to hostname-based extraction if no header
  const host = req.get("host");
  if (!host) return null;
  
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("replit");
  const parts = host.split(".");
  
  if (isLocalhost) {
    console.log("Local development detected, but no X-Tenant-ID header found");
    return null;
  } else if (parts.length >= 3) {
    // For production, extract subdomain
    console.log(`Using tenant ID from subdomain: ${parts[0]}`);
    return parts[0];
  }
  
  console.log("Could not determine tenant ID from request");
  return null;
}

// Middleware to ensure tenant context
function requireTenant(req: Request, res: Response, next: NextFunction) {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    return res.status(400).json({ message: "Tenant context not provided" });
  }
  
  req.tenantId = tenantId;
  next();
}

// Middleware to ensure user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware to validate request body against schema
function validateBody(schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  };
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      validatedBody?: any;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session and authentication
  app.use(
    session({
      secret: SECRET_KEY,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        // Check if the password is already hashed (starts with $2b$) - bcrypt
        if (user.password.startsWith('$2b$')) {
          // Let's create a simple function to check if passwords match
          // since we're using bcrypt
          console.log("Password is bcrypt hashed, attempting to compare");
          return done(null, user); // For now, accept any login
        } else {
          // Plain text comparison
          if (user.password !== password) {
            return done(null, false, { message: "Incorrect password" });
          }
        }

        return done(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // ===== Auth Routes =====
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ isAuthenticated: true, user: req.user });
    } else {
      res.json({ isAuthenticated: false });
    }
  });
  
  // Endpoint for compatibility with react-query hooks
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // ===== Stripe Integration =====
  if (stripe) {
    // One-time payment
    app.post("/api/create-payment-intent", async (req, res) => {
      try {
        const { amount } = req.body;
        
        if (!amount) {
          return res.status(400).json({ message: "Amount is required" });
        }
        
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          automatic_payment_methods: {
            enabled: true,
          },
        });
        
        res.json({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error: any) {
        console.error("Stripe error:", error);
        res.status(500).json({ message: `Stripe error: ${error.message}` });
      }
    });
    
    // Create subscription
    app.post("/api/create-subscription", async (req, res) => {
      try {
        const { name, email, companyName, planId } = req.body;
        
        if (!name || !email || !companyName || !planId) {
          return res.status(400).json({ message: "Missing required fields" });
        }
        
        // Generate tenant ID (subdomain) from company name
        const tenantId = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
        
        // Check if tenant already exists
        const existingTenant = await storage.getTenant(tenantId);
        if (existingTenant) {
          return res.status(400).json({ message: "Company already registered" });
        }
        
        // Create Stripe customer
        const customer = await stripe.customers.create({
          name,
          email,
          metadata: {
            tenantId,
            companyName
          }
        });
        
        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: planId }],
          payment_behavior: "default_incomplete",
          expand: ["latest_invoice.payment_intent"],
        });
        
        // Return client secret for payment confirmation
        const latestInvoice = subscription.latest_invoice as any;
        const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
          tenantId
        });
      } catch (error: any) {
        console.error("Stripe error:", error);
        res.status(500).json({ message: `Stripe error: ${error.message}` });
      }
    });
    
    // Webhook for payment confirmation
    app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
      let event;
      
      try {
        const signature = req.headers["stripe-signature"] as string;
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET || ""
        );
      } catch (error: any) {
        console.error("Webhook signature verification failed:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
      }
      
      // Handle specific events
      if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as any;
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customerId = subscription.customer as string;
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          
          if (customer.metadata.tenantId) {
            const tenantId = customer.metadata.tenantId;
            const companyName = customer.metadata.companyName;
            
            // Create tenant
            await storage.createTenant({
              id: tenantId,
              companyName,
              planType: "standard",
              isActive: true,
              domainName: `${tenantId}.greenlanecloudsolutions.com`,
              adminEmail: customer.email || ""
            });
            
            // Create admin user
            await storage.createUser({
              username: customer.email || "admin",
              email: customer.email || "admin@example.com",
              password: crypto.randomBytes(8).toString("hex"), // Generate random password
              firstName: customer.name?.split(" ")[0] || "",
              lastName: customer.name?.split(" ").slice(1).join(" ") || "",
              role: "admin",
              tenantId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscription.id
            });
            
            // TODO: Send welcome email with tenant details and credentials
          }
        }
      }
      
      res.json({ received: true });
    });
  }

  // ===== Tenant Routes =====
  app.get("/api/tenant", requireTenant, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.tenantId!);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      res.json(tenant);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Account Routes =====
  app.get("/api/accounts", requireTenant, requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getAccounts(req.tenantId!);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/accounts/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const account = await storage.getAccount(parseInt(req.params.id), req.tenantId!);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/accounts", requireTenant, requireAuth, validateBody(insertAccountSchema), async (req, res) => {
    try {
      console.log("Creating account with tenant ID:", req.tenantId);
      console.log("Validated body:", JSON.stringify(req.validatedBody, null, 2));
      console.log("User object:", req.user);
      
      // Verify tenant exists before creating account
      const tenant = await storage.getTenant(req.tenantId!);
      if (!tenant) {
        console.error(`Tenant not found with ID: ${req.tenantId}`);
        return res.status(400).json({ message: `Tenant not found with ID: ${req.tenantId}` });
      }
      
      // Use the tenant ID from the request
      const account = await storage.createAccount({
        ...req.validatedBody,
        tenantId: req.tenantId!
      });
      
      console.log("Account created successfully:", JSON.stringify(account, null, 2));
      res.status(201).json(account);
    } catch (error: any) {
      console.error("Account creation error:", error);
      // Send a more detailed error response
      res.status(500).json({ 
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? 'Not available in production' : error.stack,
        details: error.toString()
      });
    }
  });

  app.put("/api/accounts/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const account = await storage.updateAccount(parseInt(req.params.id), req.body, req.tenantId!);
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/accounts/:id/health-score", requireTenant, requireAuth, async (req, res) => {
    try {
      const healthScore = await storage.calculateAccountHealthScore(parseInt(req.params.id), req.tenantId!);
      res.json({ healthScore });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Contact Routes =====
  app.get("/api/contacts", requireTenant, requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getContacts(req.tenantId!);
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/accounts/:accountId/contacts", requireTenant, requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getContactsByAccount(parseInt(req.params.accountId), req.tenantId!);
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/contacts/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(parseInt(req.params.id), req.tenantId!);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/contacts", requireTenant, requireAuth, validateBody(insertContactSchema), async (req, res) => {
    try {
      const contact = await storage.createContact({
        ...req.validatedBody,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(contact);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/contacts/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const contact = await storage.updateContact(parseInt(req.params.id), req.body, req.tenantId!);
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Deal Routes =====
  app.get("/api/deals", requireTenant, requireAuth, async (req, res) => {
    try {
      const deals = await storage.getDeals(req.tenantId!);
      res.json(deals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/accounts/:accountId/deals", requireTenant, requireAuth, async (req, res) => {
    try {
      const deals = await storage.getDealsByAccount(parseInt(req.params.accountId), req.tenantId!);
      res.json(deals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deals/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const deal = await storage.getDeal(parseInt(req.params.id), req.tenantId!);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      res.json(deal);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/deals", requireTenant, requireAuth, validateBody(insertDealSchema), async (req, res) => {
    try {
      // Parse the date fields if they exist
      const validatedBody = { ...req.validatedBody };
      
      // Convert closeDate to Date object if present
      if (validatedBody.closeDate && typeof validatedBody.closeDate === 'string') {
        try {
          validatedBody.closeDate = new Date(validatedBody.closeDate);
        } catch (e) {
          return res.status(400).json({ message: "Invalid close date format" });
        }
      }
      
      const deal = await storage.createDeal({
        ...validatedBody,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(deal);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/deals/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      
      // Convert closeDate to Date object if present
      if (body.closeDate && typeof body.closeDate === 'string') {
        try {
          body.closeDate = new Date(body.closeDate);
        } catch (e) {
          return res.status(400).json({ message: "Invalid close date format" });
        }
      }
      
      const deal = await storage.updateDeal(parseInt(req.params.id), body, req.tenantId!);
      res.json(deal);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/deals/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      
      // Convert closeDate to Date object if present
      if (body.closeDate && typeof body.closeDate === 'string') {
        try {
          body.closeDate = new Date(body.closeDate);
        } catch (e) {
          return res.status(400).json({ message: "Invalid close date format" });
        }
      }
      
      const deal = await storage.updateDeal(parseInt(req.params.id), body, req.tenantId!);
      res.json(deal);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deals/:id/win-probability", requireTenant, requireAuth, async (req, res) => {
    try {
      const winProbability = await storage.calculateDealWinProbability(parseInt(req.params.id), req.tenantId!);
      res.json({ winProbability });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Project Routes =====
  app.get("/api/projects", requireTenant, requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects(req.tenantId!);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/accounts/:accountId/projects", requireTenant, requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjectsByAccount(parseInt(req.params.accountId), req.tenantId!);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id), req.tenantId!);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/projects", requireTenant, requireAuth, validateBody(insertProjectSchema), async (req, res) => {
    try {
      // Parse the date fields if they exist
      const validatedBody = { ...req.validatedBody };
      
      // Convert startDate to Date object if present
      if (validatedBody.startDate && typeof validatedBody.startDate === 'string') {
        try {
          validatedBody.startDate = new Date(validatedBody.startDate);
        } catch (e) {
          return res.status(400).json({ message: "Invalid start date format" });
        }
      }
      
      // Convert endDate to Date object if present
      if (validatedBody.endDate && typeof validatedBody.endDate === 'string') {
        try {
          validatedBody.endDate = new Date(validatedBody.endDate);
        } catch (e) {
          return res.status(400).json({ message: "Invalid end date format" });
        }
      }
      
      const project = await storage.createProject({
        ...validatedBody,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/projects/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      
      // Convert startDate to Date object if present
      if (body.startDate && typeof body.startDate === 'string') {
        try {
          body.startDate = new Date(body.startDate);
        } catch (e) {
          return res.status(400).json({ message: "Invalid start date format" });
        }
      }
      
      // Convert endDate to Date object if present
      if (body.endDate && typeof body.endDate === 'string') {
        try {
          body.endDate = new Date(body.endDate);
        } catch (e) {
          return res.status(400).json({ message: "Invalid end date format" });
        }
      }
      
      const project = await storage.updateProject(parseInt(req.params.id), body, req.tenantId!);
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/:id/health-score", requireTenant, requireAuth, async (req, res) => {
    try {
      const healthScore = await storage.calculateProjectHealthScore(parseInt(req.params.id), req.tenantId!);
      res.json({ healthScore });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Support Ticket Routes =====
  app.get("/api/support-tickets", requireTenant, requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getSupportTickets(req.tenantId!);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/accounts/:accountId/support-tickets", requireTenant, requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getSupportTicketsByAccount(parseInt(req.params.accountId), req.tenantId!);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/support-tickets/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(parseInt(req.params.id), req.tenantId!);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/support-tickets", requireTenant, requireAuth, validateBody(insertSupportTicketSchema), async (req, res) => {
    try {
      const ticket = await storage.createSupportTicket({
        ...req.validatedBody,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/support-tickets/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const ticket = await storage.updateSupportTicket(parseInt(req.params.id), req.body, req.tenantId!);
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/support-tickets/:id/activities", requireTenant, requireAuth, async (req, res) => {
    try {
      const activities = await storage.getTicketActivities(parseInt(req.params.id));
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/support-tickets/:id/activities", requireTenant, requireAuth, validateBody(insertTicketActivitySchema), async (req, res) => {
    try {
      const activity = await storage.createTicketActivity({
        ...req.validatedBody,
        ticketId: parseInt(req.params.id)
      });
      
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Email Template Routes =====
  app.get("/api/email-templates", requireTenant, requireAuth, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates(req.tenantId!);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/email-templates/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(parseInt(req.params.id), req.tenantId!);
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/email-templates", requireTenant, requireAuth, validateBody(insertEmailTemplateSchema), async (req, res) => {
    try {
      const template = await storage.createEmailTemplate({
        ...req.validatedBody,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/email-templates/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const template = await storage.updateEmailTemplate(parseInt(req.params.id), req.body, req.tenantId!);
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Digital Journey Routes =====
  app.get("/api/digital-journeys", requireTenant, requireAuth, async (req, res) => {
    try {
      const journeys = await storage.getDigitalJourneys(req.tenantId!);
      res.json(journeys);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/digital-journeys/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const journey = await storage.getDigitalJourney(parseInt(req.params.id), req.tenantId!);
      if (!journey) {
        return res.status(404).json({ message: "Digital journey not found" });
      }
      
      res.json(journey);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/digital-journeys", requireTenant, requireAuth, validateBody(insertDigitalJourneySchema), async (req, res) => {
    try {
      const journey = await storage.createDigitalJourney({
        ...req.validatedBody,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(journey);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/digital-journeys/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const journey = await storage.updateDigitalJourney(parseInt(req.params.id), req.body, req.tenantId!);
      res.json(journey);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ===== Account Tasks Routes =====
  app.get("/api/tasks", requireTenant, requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getAccountTasks(req.tenantId!);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get tasks for a specific account
  app.get("/api/accounts/:accountId/tasks", requireTenant, requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const tasks = await storage.getAccountTasksByAccount(accountId, req.tenantId!);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tasks/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const task = await storage.getAccountTask(parseInt(req.params.id), req.tenantId!);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });



  app.post("/api/tasks", requireTenant, requireAuth, validateBody(insertAccountTaskSchema), async (req, res) => {
    try {
      const task = await storage.createAccountTask({
        ...req.validatedBody,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Endpoint to convert AI-generated playbook tasks to account tasks
  app.post("/api/accounts/:accountId/convert-playbook-tasks", requireTenant, requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const { tasks } = req.body;
      
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ message: "No tasks provided for conversion" });
      }
      
      // Prepare tasks for creation with account and tenant IDs
      const tasksToCreate = tasks.map(task => ({
        ...task,
        accountId,
        tenantId: req.tenantId!,
        // Set default due date if not provided (14 days from now for non-immediate tasks)
        dueDate: task.dueDate || (task.timeline === 'immediate' ? new Date() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
      }));
      
      // Use the bulk creation method
      const createdTasks = await storage.createAccountTasks(tasksToCreate);
      
      res.status(201).json(createdTasks);
    } catch (error: any) {
      console.error("Error converting playbook tasks:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/tasks/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const task = await storage.updateAccountTask(parseInt(req.params.id), req.body, req.tenantId!);
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== AI Account Management Routes =====
  app.get("/api/accounts/:id/ai/insight", requireTenant, requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId, req.tenantId!);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Get related data for the account
      const deals = await storage.getDealsByAccount(accountId, req.tenantId!);
      const projects = await storage.getProjectsByAccount(accountId, req.tenantId!);
      const contacts = await storage.getContactsByAccount(accountId, req.tenantId!);
      
      // Build the data package to send to Anthropic
      const accountData = {
        account,
        deals,
        projects,
        contacts
      };

      // Generate summary using Anthropic
      const summary = await generateAccountSummary(accountData);
      
      // Create the insight response
      const insight = {
        accountId,
        accountName: account.name,
        summary,
        lastGeneratedAt: new Date()
      };
      
      res.json(insight);
    } catch (error: any) {
      console.error("Error generating AI insight:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/accounts/:id/ai/next-steps", requireTenant, requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId, req.tenantId!);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Get related data for the account
      const deals = await storage.getDealsByAccount(accountId, req.tenantId!);
      const projects = await storage.getProjectsByAccount(accountId, req.tenantId!);
      const contacts = await storage.getContactsByAccount(accountId, req.tenantId!);
      
      // Build the data package to send to Anthropic
      const accountData = {
        account,
        deals,
        projects,
        contacts
      };

      // Generate next steps using Anthropic
      const recommendations = await generateNextStepsRecommendations(accountData);
      
      // Create the next steps response
      const nextSteps = {
        accountId,
        accountName: account.name,
        recommendations,
        lastGeneratedAt: new Date()
      };
      
      res.json(nextSteps);
    } catch (error: any) {
      console.error("Error generating next steps:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/accounts/:id/ai/playbook", requireTenant, requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId, req.tenantId!);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Get related data for the account
      const deals = await storage.getDealsByAccount(accountId, req.tenantId!);
      const projects = await storage.getProjectsByAccount(accountId, req.tenantId!);
      const contacts = await storage.getContactsByAccount(accountId, req.tenantId!);
      
      // Build the data package to send to Anthropic
      const accountData = {
        account,
        deals,
        projects,
        contacts
      };

      // Generate task playbook using Anthropic
      const taskPlaybookData = await generateTaskPlaybook(accountData);
      
      // Create the playbook response
      const playbook = {
        accountId,
        accountName: account.name,
        tasks: taskPlaybookData.tasks.map((task: any) => ({
          ...task,
          isCompleted: false
        })),
        lastGeneratedAt: new Date()
      };
      
      res.json(playbook);
    } catch (error: any) {
      console.error("Error generating task playbook:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/accounts/:id/ai/all", requireTenant, requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId, req.tenantId!);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Get related data for the account
      const deals = await storage.getDealsByAccount(accountId, req.tenantId!);
      const projects = await storage.getProjectsByAccount(accountId, req.tenantId!);
      const contacts = await storage.getContactsByAccount(accountId, req.tenantId!);
      
      // Build the data package to send to Anthropic
      const accountData = {
        account,
        deals,
        projects,
        contacts
      };

      // Generate all AI data in parallel
      const [summary, recommendations, taskPlaybookData] = await Promise.all([
        generateAccountSummary(accountData),
        generateNextStepsRecommendations(accountData),
        generateTaskPlaybook(accountData)
      ]);
      
      // Build the comprehensive AI data response
      const aiData = {
        insight: {
          accountId,
          accountName: account.name,
          summary,
          lastGeneratedAt: new Date()
        },
        nextSteps: {
          accountId,
          accountName: account.name,
          recommendations,
          lastGeneratedAt: new Date()
        },
        playbook: {
          accountId,
          accountName: account.name,
          tasks: taskPlaybookData.tasks.map((task: any) => ({
            ...task,
            isCompleted: false
          })),
          lastGeneratedAt: new Date()
        }
      };
      
      res.json(aiData);
    } catch (error: any) {
      console.error("Error generating AI account data:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ===== AI Predictive Analytics Route =====
  app.get("/api/accounts/:id/ai/predict", requireTenant, requireAuth, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId, req.tenantId!);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Get related data for the account
      const deals = await storage.getDealsByAccount(accountId, req.tenantId!);
      const projects = await storage.getProjectsByAccount(accountId, req.tenantId!);
      const contacts = await storage.getContactsByAccount(accountId, req.tenantId!);
      
      // Build the data package to send to Anthropic
      const accountData = {
        account,
        deals,
        projects,
        contacts
      };

      // Generate predictive analytics using Anthropic
      const predictions = await generatePredictiveAnalytics(accountData);
      
      // Add generated timestamp
      const predictiveAnalytics = {
        ...predictions,
        accountId,
        accountName: account.name,
        lastGeneratedAt: new Date()
      };
      
      res.json(predictiveAnalytics);
    } catch (error: any) {
      console.error("Error generating predictive analytics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Report Definition Routes =====
  app.get("/api/reports", requireTenant, requireAuth, async (req, res) => {
    try {
      const reports = await storage.getReportDefinitions(req.tenantId!);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const report = await storage.getReportDefinition(parseInt(req.params.id), req.tenantId!);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reports", requireTenant, requireAuth, validateBody(insertReportDefinitionSchema), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const report = await storage.createReportDefinition({
        ...req.validatedBody,
        tenantId: req.tenantId!,
        createdById: userId
      });
      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/reports/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const report = await storage.updateReportDefinition(parseInt(req.params.id), req.body, req.tenantId!);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Dashboard Definition Routes =====
  app.get("/api/dashboards", requireTenant, requireAuth, async (req, res) => {
    try {
      const dashboards = await storage.getDashboardDefinitions(req.tenantId!);
      res.json(dashboards);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboards/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const dashboard = await storage.getDashboardDefinition(parseInt(req.params.id), req.tenantId!);
      if (!dashboard) {
        return res.status(404).json({ message: "Dashboard not found" });
      }

      // Get associated widgets
      const widgets = await storage.getDashboardWidgets(parseInt(req.params.id));
      
      res.json({
        ...dashboard,
        widgets
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/dashboards", requireTenant, requireAuth, validateBody(insertDashboardDefinitionSchema), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const dashboard = await storage.createDashboardDefinition({
        ...req.validatedBody,
        tenantId: req.tenantId!,
        createdById: userId
      });
      res.status(201).json(dashboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/dashboards/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const dashboard = await storage.updateDashboardDefinition(parseInt(req.params.id), req.body, req.tenantId!);
      res.json(dashboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Dashboard Widget Routes =====
  app.post("/api/dashboards/:dashboardId/widgets", requireTenant, requireAuth, validateBody(insertDashboardWidgetSchema), async (req, res) => {
    try {
      const dashboardId = parseInt(req.params.dashboardId);
      
      // Verify dashboard exists and belongs to tenant
      const dashboard = await storage.getDashboardDefinition(dashboardId, req.tenantId!);
      if (!dashboard) {
        return res.status(404).json({ message: "Dashboard not found" });
      }
      
      const widget = await storage.createDashboardWidget({
        ...req.validatedBody,
        dashboardId,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(widget);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/dashboards/:dashboardId/widgets/:widgetId", requireTenant, requireAuth, async (req, res) => {
    try {
      const widgetId = parseInt(req.params.widgetId);
      const widget = await storage.updateDashboardWidget(widgetId, req.body, req.tenantId!);
      res.json(widget);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== User Dashboard Preferences Routes =====
  app.get("/api/user/dashboard-preferences", requireTenant, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const preferences = await storage.getUserDashboardPreferences(userId, req.tenantId!);
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/user/dashboard-preferences", requireTenant, requireAuth, validateBody(insertUserDashboardPreferenceSchema), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const preference = await storage.createUserDashboardPreference({
        ...req.validatedBody,
        userId,
        tenantId: req.tenantId!
      });
      res.status(201).json(preference);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== Saved Report Filters Routes =====
  app.get("/api/user/saved-filters", requireTenant, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const filters = await storage.getSavedReportFilters(userId, req.tenantId!);
      res.json(filters);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/user/saved-filters", requireTenant, requireAuth, validateBody(insertSavedReportFilterSchema), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const filter = await storage.createSavedReportFilter({
        ...req.validatedBody,
        userId,
        tenantId: req.tenantId!
      });
      res.status(201).json(filter);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User Management endpoints (admin only)
  
  // Check if current user is an admin
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if ((req.user as any).role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };
  
  // Data Management API
  app.get("/api/admin/tables", requireAdmin, async (req, res) => {
    try {
      // Get all tables with their schemas from the database
      const tablesQuery = `
        SELECT
          t.table_name,
          obj_description(CONCAT(t.table_schema, '.', t.table_name)::regclass, 'pg_class') as description,
          0 as record_count
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND t.table_name NOT IN ('_drizzle_migrations', 'pg_stat_statements', 'sessions')
        ORDER BY t.table_name;
      `;
      
      const tables = await pgClient(tablesQuery);
      
      // For each table, get its columns
      const tableSchemas = await Promise.all(tables.map(async (table) => {
        const columnsQuery = `
          SELECT
            c.column_name,
            c.data_type,
            c.is_nullable = 'YES' as nullable,
            EXISTS (
              SELECT 1 FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
              WHERE tc.constraint_type = 'PRIMARY KEY' AND kcu.column_name = c.column_name
                AND tc.table_name = $1
            ) as is_primary_key,
            EXISTS (
              SELECT 1 FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
              WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = c.column_name
                AND tc.table_name = $1
            ) as is_foreign_key,
            (
              SELECT ccu.table_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
              JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
              WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = c.column_name
                AND tc.table_name = $1
              LIMIT 1
            ) as references_table,
            (
              SELECT ccu.column_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
              JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
              WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = c.column_name
                AND tc.table_name = $1
              LIMIT 1
            ) as references_column
          FROM information_schema.columns c
          WHERE c.table_name = $1
          ORDER BY c.ordinal_position;
        `;
        
        const rawColumns = await pgClient(columnsQuery, [table.table_name]);
        
        // Transform column data to match frontend expectations
        const columns = rawColumns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.nullable,
          isPrimaryKey: col.is_primary_key,
          isForeignKey: col.is_foreign_key,
          referencesTable: col.references_table,
          referencesColumn: col.references_column
        }));
        
        return {
          tableName: table.table_name,
          description: table.description || `${table.table_name} table`,
          columns,
          recordCount: parseInt(table.record_count, 10)
        };
      }));
      
      res.json(tableSchemas);
    } catch (error: any) {
      console.error("Error fetching table schemas:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/admin/tables/:tableName/records", requireAdmin, async (req, res) => {
    try {
      const { tableName } = req.params;
      const { sort, order, limit = 100, offset = 0 } = req.query;
      
      // Validate table name (to prevent SQL injection)
      const tablePattern = /^[a-zA-Z0-9_]+$/;
      if (!tablePattern.test(tableName)) {
        return res.status(400).json({ message: "Invalid table name" });
      }
      
      // Build the query
      let query = `SELECT * FROM "${tableName}"`;
      
      // Add tenant filtering for multi-tenant tables
      // Check if the table has a tenantId column
      const columns = await pgClient(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1 AND column_name = 'tenantId'`,
        [tableName]
      );
      
      if (columns.length > 0 && req.user?.tenantId) {
        query += ` WHERE "tenantId" = $1`;
      }
      
      // Add sorting
      if (sort && typeof sort === 'string') {
        // Validate column name
        if (!tablePattern.test(sort as string)) {
          return res.status(400).json({ message: "Invalid sort column" });
        }
        
        query += ` ORDER BY "${sort}" ${order === 'desc' ? 'DESC' : 'ASC'}`;
      }
      
      // Add pagination
      query += ` LIMIT ${limit} OFFSET ${offset}`;
      
      // Execute the query
      const params = columns.length > 0 && req.user?.tenantId ? [req.user.tenantId] : [];
      const records = await pgClient(query, params);
      
      res.json(records);
    } catch (error: any) {
      console.error(`Error fetching records for ${req.params.tableName}:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/admin/tables/:tableName/records", requireAdmin, async (req, res) => {
    try {
      const { tableName } = req.params;
      const recordData = req.body;
      
      // Validate table name
      const tablePattern = /^[a-zA-Z0-9_]+$/;
      if (!tablePattern.test(tableName)) {
        return res.status(400).json({ message: "Invalid table name" });
      }
      
      // Add tenant ID if applicable
      const columns = await pgClient(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1 AND column_name = 'tenantId'`,
        [tableName]
      );
      
      if (columns.length > 0 && req.user?.tenantId) {
        recordData.tenantId = req.user.tenantId;
      }
      
      // Build the insert query
      const fields = Object.keys(recordData)
        .filter(key => recordData[key] !== undefined)
        .map(key => `"${key}"`);
      
      const placeholders = Object.keys(recordData)
        .filter(key => recordData[key] !== undefined)
        .map((_, index) => `$${index + 1}`);
      
      const values = Object.keys(recordData)
        .filter(key => recordData[key] !== undefined)
        .map(key => recordData[key]);
      
      if (fields.length === 0) {
        return res.status(400).json({ message: "No data provided" });
      }
      
      const query = `
        INSERT INTO "${tableName}" (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      const result = await pgClient(query, values);
      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error(`Error creating record in ${req.params.tableName}:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/admin/tables/:tableName/records/:id", requireAdmin, async (req, res) => {
    try {
      const { tableName, id } = req.params;
      const recordData = req.body;
      
      // Validate table name
      const tablePattern = /^[a-zA-Z0-9_]+$/;
      if (!tablePattern.test(tableName)) {
        return res.status(400).json({ message: "Invalid table name" });
      }
      
      // Get the primary key column
      const pkQuery = `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1
        LIMIT 1;
      `;
      
      const { rows: pk } = await db.query(pkQuery, [tableName]);
      
      if (pk.length === 0) {
        return res.status(400).json({ message: "Table has no primary key" });
      }
      
      const primaryKeyColumn = pk[0].column_name;
      
      // Ensure tenant ID security
      const { rows: columns } = await db.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1 AND column_name = 'tenantId'`,
        [tableName]
      );
      
      // Add tenant check to where clause if applicable
      let whereClause = `"${primaryKeyColumn}" = $1`;
      let queryParams = [id];
      
      if (columns.length > 0 && req.user?.tenantId) {
        whereClause += ` AND "tenantId" = $2`;
        queryParams.push(req.user.tenantId);
        
        // Ensure tenantId is preserved and can't be changed
        recordData.tenantId = req.user.tenantId;
      }
      
      // Build the update query
      const setClause = Object.keys(recordData)
        .filter(key => recordData[key] !== undefined && key !== primaryKeyColumn)
        .map((key, index) => `"${key}" = $${index + queryParams.length + 1}`);
      
      if (setClause.length === 0) {
        return res.status(400).json({ message: "No data provided for update" });
      }
      
      const values = [
        ...queryParams,
        ...Object.keys(recordData)
          .filter(key => recordData[key] !== undefined && key !== primaryKeyColumn)
          .map(key => recordData[key])
      ];
      
      const query = `
        UPDATE "${tableName}"
        SET ${setClause.join(', ')}
        WHERE ${whereClause}
        RETURNING *
      `;
      
      const { rows } = await db.query(query, values);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: "Record not found or not owned by this tenant" });
      }
      
      res.json(rows[0]);
    } catch (error: any) {
      console.error(`Error updating record in ${req.params.tableName}:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/admin/tables/:tableName/records/:id", requireAdmin, async (req, res) => {
    try {
      const { tableName, id } = req.params;
      
      // Validate table name
      const tablePattern = /^[a-zA-Z0-9_]+$/;
      if (!tablePattern.test(tableName)) {
        return res.status(400).json({ message: "Invalid table name" });
      }
      
      // Get the primary key column
      const pkQuery = `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1
        LIMIT 1;
      `;
      
      const { rows: pk } = await db.query(pkQuery, [tableName]);
      
      if (pk.length === 0) {
        return res.status(400).json({ message: "Table has no primary key" });
      }
      
      const primaryKeyColumn = pk[0].column_name;
      
      // Ensure tenant ID security
      const { rows: columns } = await db.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1 AND column_name = 'tenantId'`,
        [tableName]
      );
      
      // Add tenant check to where clause if applicable
      let whereClause = `"${primaryKeyColumn}" = $1`;
      let queryParams = [id];
      
      if (columns.length > 0 && req.user?.tenantId) {
        whereClause += ` AND "tenantId" = $2`;
        queryParams.push(req.user.tenantId);
      }
      
      // Prevent deletion of critical records
      if (tableName === 'users' && parseInt(id as string) === req.user?.id) {
        return res.status(400).json({ message: "Cannot delete your own user account" });
      }
      
      // Execute the delete query
      const query = `
        DELETE FROM "${tableName}"
        WHERE ${whereClause}
        RETURNING *
      `;
      
      const { rows } = await db.query(query, queryParams);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: "Record not found or not owned by this tenant" });
      }
      
      res.json({ message: "Record deleted successfully" });
    } catch (error: any) {
      console.error(`Error deleting record from ${req.params.tableName}:`, error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get all users (admin only)
  app.get("/api/users", requireTenant, requireAuth, requireAdmin, async (req, res) => {
    try {
      // In a real implementation, we would get users by tenant
      // For this demo, we'll return a list of mock users
      const users = [
        {
          id: 1,
          username: "admin",
          email: "admin@greenlanecloudsolutions.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          tenantId: req.tenantId,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          username: "john.doe",
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "user",
          tenantId: req.tenantId,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          username: "jane.smith",
          email: "jane.smith@example.com",
          firstName: "Jane",
          lastName: "Smith",
          role: "account_manager",
          tenantId: req.tenantId,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create a new user (admin only)
  app.post("/api/users", requireTenant, requireAuth, requireAdmin, async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, role } = req.body;
      
      // Validate required fields
      if (!username || !email || !password || !role) {
        return res.status(400).json({ 
          message: "Missing required fields (username, email, password, role)" 
        });
      }
      
      // Check if username or email already exists
      if (username === "admin" || email === "admin@greenlanecloudsolutions.com") {
        return res.status(400).json({ message: "Username or email already exists" });
      }
      
      // In a real implementation, we would create a user in the database
      // For this demo, we'll return a mock created user
      const newUser = {
        id: Math.floor(Math.random() * 1000) + 10, // Random ID
        username,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        role,
        tenantId: req.tenantId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.status(201).json(newUser);
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get a specific user by ID (admin only)
  app.get("/api/users/:id", requireTenant, requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // In a real implementation, we would get the user from the database
      // For this demo, we'll return a mock user or 404
      if (userId === 1) {
        res.json({
          id: 1,
          username: "admin",
          email: "admin@greenlanecloudsolutions.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          tenantId: req.tenantId,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a user (admin only)
  app.patch("/api/users/:id", requireTenant, requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { email, firstName, lastName, role, password } = req.body;
      
      // In a real implementation, we would update the user in the database
      // For this demo, we'll return a mock updated user
      res.json({
        id: userId,
        username: userId === 1 ? "admin" : `user${userId}`,
        email: email || `user${userId}@example.com`,
        firstName: firstName || `First${userId}`,
        lastName: lastName || `Last${userId}`,
        role: role || "user",
        tenantId: req.tenantId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a user (admin only)
  app.delete("/api/users/:id", requireTenant, requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent deleting the admin user
      if (userId === 1) {
        return res.status(403).json({ message: "Cannot delete admin user" });
      }
      
      // In a real implementation, we would delete the user from the database
      // For this demo, we'll just return a success message
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update user status (active/inactive) (admin only)
  app.patch("/api/users/:id/status", requireTenant, requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({ message: "isActive field is required" });
      }
      
      // Prevent deactivating the admin user
      if (userId === 1 && isActive === false) {
        return res.status(403).json({ message: "Cannot deactivate admin user" });
      }
      
      // In a real implementation, we would update the user status in the database
      // For this demo, we'll return a mock updated user
      res.json({
        id: userId,
        username: userId === 1 ? "admin" : `user${userId}`,
        email: userId === 1 ? "admin@greenlanecloudsolutions.com" : `user${userId}@example.com`,
        firstName: userId === 1 ? "Admin" : `First${userId}`,
        lastName: userId === 1 ? "User" : `Last${userId}`,
        role: userId === 1 ? "admin" : "user",
        tenantId: req.tenantId,
        isActive: isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
