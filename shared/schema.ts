import { pgTable, text, serial, integer, boolean, timestamp, json, uuid, doublePrecision, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("user").notNull(),
  tenantId: text("tenant_id").notNull(), // For multi-tenant isolation
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Tenants table
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(), // Subdomain name
  companyName: text("company_name").notNull(),
  planType: text("plan_type").default("standard").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  domainName: text("domain_name").notNull(),
  adminEmail: text("admin_email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTenantSchema = createInsertSchema(tenants)
  .omit({ createdAt: true, updatedAt: true });

// Accounts table
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry"),
  employeeCount: integer("employee_count"),
  website: text("website"),
  parentAccountId: integer("parent_account_id").references(() => accounts.id),
  healthScore: integer("health_score"),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAccountSchema = createInsertSchema(accounts)
  .omit({ id: true, createdAt: true, updatedAt: true, healthScore: true })
  .partial({ tenantId: true }); // Make tenantId optional for validation since it's added by the server

// Contacts table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  title: text("title"),
  accountId: integer("account_id").references(() => accounts.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contacts)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true }); // Make tenantId optional for validation since it's added by the server

// Deals table
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  accountId: integer("account_id").references(() => accounts.id),
  value: doublePrecision("value"),
  stage: text("stage").default("prospecting").notNull(),
  closeDate: timestamp("close_date"),
  winProbability: integer("win_probability"),
  healthScore: integer("health_score"),
  type: text("type"),
  description: text("description"),
  nextSteps: text("next_steps"),
  dealOwnerId: integer("deal_owner_id").references(() => users.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealSchema = createInsertSchema(deals)
  .omit({ id: true, createdAt: true, updatedAt: true, healthScore: true, winProbability: true })
  .partial({ tenantId: true }); // Make tenantId optional for validation since it's added by the server

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  accountId: integer("account_id").references(() => accounts.id),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").default("active").notNull(),
  healthScore: integer("health_score"),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, createdAt: true, updatedAt: true, healthScore: true })
  .partial({ tenantId: true }); // Make tenantId optional for validation since it's added by the server

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").default("open").notNull(),
  priority: text("priority").default("medium").notNull(),
  source: text("source").notNull(), // email, manual, slack, etc.
  accountId: integer("account_id").references(() => accounts.id),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true }); // Make tenantId optional for validation since it's added by the server

// Ticket activities table
export const ticketActivities = pgTable("ticket_activities", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // response, status_change, assignment, etc.
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTicketActivitySchema = createInsertSchema(ticketActivities)
  .omit({ id: true, createdAt: true });

// Email templates table
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true }); // Make tenantId optional for validation since it's added by the server

// Digital journeys table
export const digitalJourneys = pgTable("digital_journeys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("draft").notNull(),
  steps: json("steps").notNull(), // Array of steps in the journey
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDigitalJourneySchema = createInsertSchema(digitalJourneys)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true }); // Make tenantId optional for validation since it's added by the server

// Session store table for express-session
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id]
  }),
  assignedTickets: many(supportTickets),
  ticketActivities: many(ticketActivities),
  ownedDeals: many(deals, { relationName: 'dealOwner' })
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  accounts: many(accounts),
  contacts: many(contacts),
  deals: many(deals),
  projects: many(projects),
  supportTickets: many(supportTickets),
  emailTemplates: many(emailTemplates),
  digitalJourneys: many(digitalJourneys)
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [accounts.tenantId],
    references: [tenants.id]
  }),
  parentAccount: one(accounts, {
    fields: [accounts.parentAccountId],
    references: [accounts.id]
  }),
  childAccounts: many(accounts, {
    relationName: "parentAccount"
  }),
  contacts: many(contacts),
  deals: many(deals),
  projects: many(projects),
  supportTickets: many(supportTickets)
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [contacts.tenantId],
    references: [tenants.id]
  }),
  account: one(accounts, {
    fields: [contacts.accountId],
    references: [accounts.id]
  })
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  tenant: one(tenants, {
    fields: [deals.tenantId],
    references: [tenants.id]
  }),
  account: one(accounts, {
    fields: [deals.accountId],
    references: [accounts.id]
  }),
  dealOwner: one(users, {
    fields: [deals.dealOwnerId],
    references: [users.id]
  })
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  tenant: one(tenants, {
    fields: [projects.tenantId],
    references: [tenants.id]
  }),
  account: one(accounts, {
    fields: [projects.accountId],
    references: [accounts.id]
  })
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [supportTickets.tenantId],
    references: [tenants.id]
  }),
  account: one(accounts, {
    fields: [supportTickets.accountId],
    references: [accounts.id]
  }),
  assignedTo: one(users, {
    fields: [supportTickets.assignedToUserId],
    references: [users.id]
  }),
  activities: many(ticketActivities)
}));

export const ticketActivitiesRelations = relations(ticketActivities, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketActivities.ticketId],
    references: [supportTickets.id]
  }),
  user: one(users, {
    fields: [ticketActivities.userId],
    references: [users.id]
  })
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [emailTemplates.tenantId],
    references: [tenants.id]
  })
}));

export const digitalJourneysRelations = relations(digitalJourneys, ({ one }) => ({
  tenant: one(tenants, {
    fields: [digitalJourneys.tenantId],
    references: [tenants.id]
  })
}));

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export type InsertTicketActivity = z.infer<typeof insertTicketActivitySchema>;
export type TicketActivity = typeof ticketActivities.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertDigitalJourney = z.infer<typeof insertDigitalJourneySchema>;
export type DigitalJourney = typeof digitalJourneys.$inferSelect;

// Account Tasks table for storing AI-generated tasks
export const accountTasks = pgTable("account_tasks", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  title: text("title").notNull(),
  description: text("description"),
  timeline: text("timeline").notNull(), // immediate, short-term, long-term
  effort: text("effort").notNull(), // low, medium, high
  outcome: text("outcome"),
  owner: text("owner"),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium").notNull(), // low, medium, high
  status: text("status").default("pending").notNull(), // pending, in-progress, completed
  isCheckpoint: boolean("is_checkpoint").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
});

export const insertAccountTaskSchema = createInsertSchema(accountTasks)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const accountTasksRelations = relations(accountTasks, ({ one }) => ({
  account: one(accounts, {
    fields: [accountTasks.accountId],
    references: [accounts.id]
  }),
  tenant: one(tenants, {
    fields: [accountTasks.tenantId],
    references: [tenants.id]
  })
}));

export type InsertAccountTask = z.infer<typeof insertAccountTaskSchema>;
export type AccountTask = typeof accountTasks.$inferSelect;
