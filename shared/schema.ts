import { pgTable, text, serial, integer, boolean, timestamp, json, uuid, doublePrecision, primaryKey, jsonb } from "drizzle-orm/pg-core";
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

// Define relations moved to the end of the file

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

// Custom Report Definitions table
export const reportDefinitions = pgTable("report_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dataSource: text("data_source").notNull(), // accounts, contacts, deals, projects, support_tickets, tasks
  query: jsonb("query").notNull(), // JSON structure defining the query parameters, filters, etc.
  columns: jsonb("columns").notNull(), // Array of column definitions
  filters: jsonb("filters"), // User-defined filters
  sorting: jsonb("sorting"), // Sorting configuration
  visualization: text("visualization").default("table").notNull(), // table, bar, line, pie, etc.
  visualizationConfig: jsonb("visualization_config"), // Configuration for the visualization type
  isShared: boolean("is_shared").default(false).notNull(), // Whether this report is shared among tenant users
  createdById: integer("created_by_id").notNull().references(() => users.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertReportDefinitionSchema = createInsertSchema(reportDefinitions)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true, createdById: true }); // Make tenantId and createdById optional for validation since they're added by the server

export const reportDefinitionsRelations = relations(reportDefinitions, ({ one }) => ({
  createdBy: one(users, {
    fields: [reportDefinitions.createdById],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [reportDefinitions.tenantId],
    references: [tenants.id]
  })
}));

// Dashboard Definitions table
export const dashboardDefinitions = pgTable("dashboard_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  layout: jsonb("layout").notNull(), // JSON structure defining the layout grid
  isDefault: boolean("is_default").default(false).notNull(),
  isShared: boolean("is_shared").default(false).notNull(),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDashboardDefinitionSchema = createInsertSchema(dashboardDefinitions)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true, createdById: true }); // Make tenantId and createdById optional for validation since they're added by the server

export const dashboardDefinitionsRelations = relations(dashboardDefinitions, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [dashboardDefinitions.createdById],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [dashboardDefinitions.tenantId],
    references: [tenants.id]
  }),
  widgets: many(dashboardWidgets, { relationName: 'dashboard' })
}));

// Dashboard Widgets table
export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: serial("id").primaryKey(),
  dashboardId: integer("dashboard_id").notNull().references(() => dashboardDefinitions.id, { onDelete: 'cascade' }),
  reportId: integer("report_id").references(() => reportDefinitions.id),
  widgetType: text("widget_type").notNull(), // report, metric, custom
  title: text("title").notNull(),
  config: jsonb("config").notNull(), // Configuration specific to the widget type
  position: json("position").notNull(), // x, y, width, height in the dashboard grid
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true }); // Make tenantId optional for validation since it's added by the server

export const dashboardWidgetsRelations = relations(dashboardWidgets, ({ one }) => ({
  dashboard: one(dashboardDefinitions, {
    fields: [dashboardWidgets.dashboardId],
    references: [dashboardDefinitions.id]
  }),
  report: one(reportDefinitions, {
    fields: [dashboardWidgets.reportId],
    references: [reportDefinitions.id]
  }),
  tenant: one(tenants, {
    fields: [dashboardWidgets.tenantId],
    references: [tenants.id]
  })
}));

// User Dashboard Preferences table
export const userDashboardPreferences = pgTable("user_dashboard_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  dashboardId: integer("dashboard_id").notNull().references(() => dashboardDefinitions.id, { onDelete: 'cascade' }),
  isDefault: boolean("is_default").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),
  customLayout: jsonb("custom_layout"), // Optional custom layout that overrides the dashboard's default layout
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserDashboardPreferenceSchema = createInsertSchema(userDashboardPreferences)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true, userId: true }); // Make tenantId and userId optional for validation since they're added by the server

export const userDashboardPreferencesRelations = relations(userDashboardPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userDashboardPreferences.userId],
    references: [users.id]
  }),
  dashboard: one(dashboardDefinitions, {
    fields: [userDashboardPreferences.dashboardId],
    references: [dashboardDefinitions.id]
  }),
  tenant: one(tenants, {
    fields: [userDashboardPreferences.tenantId],
    references: [tenants.id]
  })
}));

// Saved Report Filters table
export const savedReportFilters = pgTable("saved_report_filters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  reportId: integer("report_id").notNull().references(() => reportDefinitions.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  filters: jsonb("filters").notNull(), // Saved filter configuration
  isDefault: boolean("is_default").default(false).notNull(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSavedReportFilterSchema = createInsertSchema(savedReportFilters)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true, userId: true }); // Make tenantId and userId optional for validation since they're added by the server

export const savedReportFiltersRelations = relations(savedReportFilters, ({ one }) => ({
  report: one(reportDefinitions, {
    fields: [savedReportFilters.reportId],
    references: [reportDefinitions.id]
  }),
  user: one(users, {
    fields: [savedReportFilters.userId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [savedReportFilters.tenantId],
    references: [tenants.id]
  })
}));

// Complete relation definitions will be added at the end

// Export types for new tables
export type InsertReportDefinition = z.infer<typeof insertReportDefinitionSchema>;
export type ReportDefinition = typeof reportDefinitions.$inferSelect;

export type InsertDashboardDefinition = z.infer<typeof insertDashboardDefinitionSchema>;
export type DashboardDefinition = typeof dashboardDefinitions.$inferSelect;

export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;

export type InsertUserDashboardPreference = z.infer<typeof insertUserDashboardPreferenceSchema>;
export type UserDashboardPreference = typeof userDashboardPreferences.$inferSelect;

export type InsertSavedReportFilter = z.infer<typeof insertSavedReportFilterSchema>;
export type SavedReportFilter = typeof savedReportFilters.$inferSelect;

// Define complete relations after all tables and relations exist
// Update usersRelations to include dashboard relations
export const usersRelations = relations(users, ({ many, one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id]
  }),
  assignedTickets: many(supportTickets),
  ticketActivities: many(ticketActivities),
  ownedDeals: many(deals, { relationName: 'dealOwner' }),
  createdReports: many(reportDefinitions, { relationName: 'createdBy' }),
  createdDashboards: many(dashboardDefinitions, { relationName: 'createdBy' }),
  dashboardPreferences: many(userDashboardPreferences),
  savedFilters: many(savedReportFilters),
  csvUploads: many(csvUploads)
}));

// Update tenantRelations to include dashboard relations
// S3 Bucket configuration table
export const s3Buckets = pgTable("s3_buckets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bucketName: text("bucket_name").notNull(),
  region: text("region").notNull(),
  accessKeyId: text("access_key_id").notNull(),
  secretAccessKey: text("secret_access_key").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertS3BucketSchema = createInsertSchema(s3Buckets)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true });

export const s3BucketsRelations = relations(s3Buckets, ({ one }) => ({
  tenant: one(tenants, {
    fields: [s3Buckets.tenantId],
    references: [tenants.id]
  })
}));

export type InsertS3Bucket = z.infer<typeof insertS3BucketSchema>;
export type S3Bucket = typeof s3Buckets.$inferSelect;

// CSV File Upload records table
export const csvUploads = pgTable("csv_uploads", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  s3BucketId: integer("s3_bucket_id").references(() => s3Buckets.id).notNull(),
  s3Key: text("s3_key").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").default("pending").notNull(), // pending, processing, completed, failed
  targetEntity: text("target_entity").notNull(), // accounts, contacts, etc.
  processedRecords: integer("processed_records").default(0),
  totalRecords: integer("total_records").default(0),
  errorMessage: text("error_message"),
  mappingConfig: jsonb("mapping_config"), // How file columns map to entity fields
  userId: integer("user_id").references(() => users.id).notNull(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCsvUploadSchema = createInsertSchema(csvUploads)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ tenantId: true, userId: true });

export const csvUploadsRelations = relations(csvUploads, ({ one }) => ({
  tenant: one(tenants, {
    fields: [csvUploads.tenantId],
    references: [tenants.id]
  }),
  s3Bucket: one(s3Buckets, {
    fields: [csvUploads.s3BucketId],
    references: [s3Buckets.id]
  }),
  user: one(users, {
    fields: [csvUploads.userId],
    references: [users.id]
  })
}));

export type InsertCsvUpload = z.infer<typeof insertCsvUploadSchema>;
export type CsvUpload = typeof csvUploads.$inferSelect;

// Modules table
export const modules = pgTable("modules", {
  id: text("id").primaryKey(), // community, knowledge-base, api-gateway, etc.
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(false).notNull(),
  version: text("version").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  settings: jsonb("settings"), // JSON structure for module settings
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertModuleSchema = createInsertSchema(modules)
  .omit({ createdAt: true, updatedAt: true });

export const modulesRelations = relations(modules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [modules.tenantId],
    references: [tenants.id]
  })
}));

// Community Posts table
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  forumId: integer("forum_id"),
  parentPostId: integer("parent_post_id"),
  status: text("status").default("published").notNull(), // published, draft, archived, hidden
  pinned: boolean("pinned").default(false).notNull(),
  sentiment: text("sentiment"), // positive, negative, neutral (from AI analysis)
  tags: text("tags").array(), // Array of tags/topics
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts)
  .omit({ id: true, createdAt: true, updatedAt: true, sentiment: true });

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [communityPosts.authorId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [communityPosts.tenantId],
    references: [tenants.id]
  }),
  parentPost: one(communityPosts, {
    fields: [communityPosts.parentPostId],
    references: [communityPosts.id]
  }),
  replies: many(communityPosts, { relationName: "parentPost" })
}));

// Community Forums table
export const communityForums = pgTable("community_forums", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull(),
  order: integer("order").default(0),
  groupId: integer("group_id"),
  isPrivate: boolean("is_private").default(false).notNull(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommunityForumSchema = createInsertSchema(communityForums)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const communityForumsRelations = relations(communityForums, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [communityForums.tenantId],
    references: [tenants.id]
  }),
  posts: many(communityPosts)
}));

// Community Groups table
export const communityGroups = pgTable("community_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommunityGroupSchema = createInsertSchema(communityGroups)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const communityGroupsRelations = relations(communityGroups, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [communityGroups.tenantId],
    references: [tenants.id]
  }),
  forums: many(communityForums)
}));

// Export types for community modules
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;

export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;

export type InsertCommunityForum = z.infer<typeof insertCommunityForumSchema>;
export type CommunityForum = typeof communityForums.$inferSelect;

export type InsertCommunityGroup = z.infer<typeof insertCommunityGroupSchema>;
export type CommunityGroup = typeof communityGroups.$inferSelect;

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  accounts: many(accounts),
  contacts: many(contacts),
  deals: many(deals),
  projects: many(projects),
  supportTickets: many(supportTickets),
  emailTemplates: many(emailTemplates),
  digitalJourneys: many(digitalJourneys),
  reportDefinitions: many(reportDefinitions),
  dashboardDefinitions: many(dashboardDefinitions),
  dashboardWidgets: many(dashboardWidgets),
  userDashboardPreferences: many(userDashboardPreferences),
  savedReportFilters: many(savedReportFilters),
  s3Buckets: many(s3Buckets),
  csvUploads: many(csvUploads),
  modules: many(modules),
  communityPosts: many(communityPosts),
  communityForums: many(communityForums),
  communityGroups: many(communityGroups)
}));
