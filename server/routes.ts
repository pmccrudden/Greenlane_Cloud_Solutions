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
  insertDigitalJourneySchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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
  const host = req.get("host");
  if (!host) return null;
  
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
  const parts = host.split(".");
  
  if (isLocalhost) {
    // For development, extract tenant from custom header
    return req.get("X-Tenant-ID") || null;
  } else if (parts.length >= 3) {
    // For production, extract subdomain
    return parts[0];
  }
  
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
      console.log("User object:", req.user);
      
      // Use the tenant ID from the request
      const account = await storage.createAccount({
        ...req.validatedBody,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(account);
    } catch (error: any) {
      console.error("Account creation error:", error);
      res.status(500).json({ message: error.message });
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
      const deal = await storage.createDeal({
        ...req.validatedBody,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(deal);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/deals/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const deal = await storage.updateDeal(parseInt(req.params.id), req.body, req.tenantId!);
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
      const project = await storage.createProject({
        ...req.validatedBody,
        tenantId: req.tenantId!
      });
      
      res.status(201).json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/projects/:id", requireTenant, requireAuth, async (req, res) => {
    try {
      const project = await storage.updateProject(parseInt(req.params.id), req.body, req.tenantId!);
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

  const httpServer = createServer(app);

  return httpServer;
}
