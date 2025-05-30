import { 
  users, User, InsertUser, 
  tenants, Tenant, InsertTenant,
  accounts, Account, InsertAccount,
  contacts, Contact, InsertContact,
  deals, Deal, InsertDeal,
  projects, Project, InsertProject,
  supportTickets, SupportTicket, InsertSupportTicket,
  ticketActivities, TicketActivity, InsertTicketActivity,
  emailTemplates, EmailTemplate, InsertEmailTemplate,
  digitalJourneys, DigitalJourney, InsertDigitalJourney,
  accountTasks, AccountTask, InsertAccountTask,
  reportDefinitions, ReportDefinition, InsertReportDefinition,
  dashboardDefinitions, DashboardDefinition, InsertDashboardDefinition,
  dashboardWidgets, DashboardWidget, InsertDashboardWidget,
  userDashboardPreferences, UserDashboardPreference, InsertUserDashboardPreference,
  savedReportFilters, SavedReportFilter, InsertSavedReportFilter,
  s3Buckets, S3Bucket, InsertS3Bucket,
  csvUploads, CsvUpload, InsertCsvUpload,
  modules, Module, InsertModule,
  communityPosts, CommunityPost, InsertCommunityPost,
  communityForums, CommunityForum, InsertCommunityForum, 
  communityGroups, CommunityGroup, InsertCommunityGroup
} from "@shared/schema";

// Import workflow schemas
import {
  workflow, Workflow, InsertWorkflow,
  dataSource, DataSource, InsertDataSource,
  dataJoin, DataJoin, InsertDataJoin,
  dataTransformation, DataTransformation, InsertDataTransformation,
  ruleCondition, RuleCondition, InsertRuleCondition,
  action, Action, InsertAction,
  trigger, Trigger, InsertTrigger,
  executionLog, ExecutionLog, InsertExecutionLog
} from "@shared/workflow-schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Workflow methods
  getAllWorkflows(tenantId: string): Promise<Workflow[]>;
  getWorkflow(id: string, tenantId: string): Promise<Workflow | undefined>;
  createWorkflow(data: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, data: Partial<Workflow>, tenantId: string): Promise<Workflow>;
  deleteWorkflow(id: string, tenantId: string): Promise<Workflow>;
  
  // Workflow DataSource methods
  getDataSources(workflowId: string, tenantId: string): Promise<DataSource[]>;
  getDataSource(id: string, tenantId: string): Promise<DataSource | undefined>;
  createDataSource(data: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: string, data: Partial<DataSource>, tenantId: string): Promise<DataSource>;
  deleteDataSource(id: string, tenantId: string): Promise<DataSource>;
  
  // Workflow DataJoin methods
  getDataJoins(workflowId: string, tenantId: string): Promise<DataJoin[]>;
  getDataJoin(id: string, tenantId: string): Promise<DataJoin | undefined>;
  createDataJoin(data: InsertDataJoin): Promise<DataJoin>;
  updateDataJoin(id: string, data: Partial<DataJoin>, tenantId: string): Promise<DataJoin>;
  deleteDataJoin(id: string, tenantId: string): Promise<DataJoin>;
  
  // Workflow Transformation methods
  getDataTransformations(workflowId: string, tenantId: string): Promise<DataTransformation[]>;
  getDataTransformation(id: string, tenantId: string): Promise<DataTransformation | undefined>; 
  createDataTransformation(data: InsertDataTransformation): Promise<DataTransformation>;
  updateDataTransformation(id: string, data: Partial<DataTransformation>, tenantId: string): Promise<DataTransformation>;
  deleteDataTransformation(id: string, tenantId: string): Promise<DataTransformation>;
  
  // Workflow Rule Condition methods
  getRuleConditions(workflowId: string, tenantId: string): Promise<RuleCondition[]>;
  getRuleCondition(id: string, tenantId: string): Promise<RuleCondition | undefined>;
  createRuleCondition(data: InsertRuleCondition): Promise<RuleCondition>;
  updateRuleCondition(id: string, data: Partial<RuleCondition>, tenantId: string): Promise<RuleCondition>;
  deleteRuleCondition(id: string, tenantId: string): Promise<RuleCondition>;
  
  // Workflow Action methods
  getActions(workflowId: string, tenantId: string): Promise<Action[]>;
  getAction(id: string, tenantId: string): Promise<Action | undefined>;
  createAction(data: InsertAction): Promise<Action>;
  updateAction(id: string, data: Partial<Action>, tenantId: string): Promise<Action>;
  deleteAction(id: string, tenantId: string): Promise<Action>;
  
  // Workflow Trigger methods
  getTriggers(workflowId: string, tenantId: string): Promise<Trigger[]>;
  getTrigger(id: string, tenantId: string): Promise<Trigger | undefined>;
  createTrigger(data: InsertTrigger): Promise<Trigger>;
  updateTrigger(id: string, data: Partial<Trigger>, tenantId: string): Promise<Trigger>;
  deleteTrigger(id: string, tenantId: string): Promise<Trigger>;
  
  // Workflow Execution Log methods
  getExecutionLogs(workflowId: string, tenantId: string): Promise<ExecutionLog[]>;
  getExecutionLog(id: string, tenantId: string): Promise<ExecutionLog | undefined>;
  createExecutionLog(data: InsertExecutionLog): Promise<ExecutionLog>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;

  // Tenant methods
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantByDomain(domain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant>;

  // Account methods
  getAccounts(tenantId: string): Promise<Account[]>;
  getAccount(id: number, tenantId: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, data: Partial<Account>, tenantId: string): Promise<Account>;
  calculateAccountHealthScore(id: number, tenantId: string): Promise<number>;

  // Contact methods
  getContacts(tenantId: string): Promise<Contact[]>;
  getContactsByAccount(accountId: number, tenantId: string): Promise<Contact[]>;
  getContact(id: number, tenantId: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, data: Partial<Contact>, tenantId: string): Promise<Contact>;

  // Deal methods
  getDeals(tenantId: string): Promise<Deal[]>;
  getDealsByAccount(accountId: number, tenantId: string): Promise<Deal[]>;
  getDeal(id: number, tenantId: string): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, data: Partial<Deal>, tenantId: string): Promise<Deal>;
  calculateDealWinProbability(id: number, tenantId: string): Promise<number>;

  // Project methods
  getProjects(tenantId: string): Promise<Project[]>;
  getProjectsByAccount(accountId: number, tenantId: string): Promise<Project[]>;
  getProject(id: number, tenantId: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<Project>, tenantId: string): Promise<Project>;
  calculateProjectHealthScore(id: number, tenantId: string): Promise<number>;

  // Support Ticket methods
  getSupportTickets(tenantId: string): Promise<SupportTicket[]>;
  getSupportTicketsByAccount(accountId: number, tenantId: string): Promise<SupportTicket[]>;
  getSupportTicket(id: number, tenantId: string): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, data: Partial<SupportTicket>, tenantId: string): Promise<SupportTicket>;

  // Ticket Activity methods
  getTicketActivities(ticketId: number): Promise<TicketActivity[]>;
  createTicketActivity(activity: InsertTicketActivity): Promise<TicketActivity>;

  // Email Template methods
  getEmailTemplates(tenantId: string): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number, tenantId: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, data: Partial<EmailTemplate>, tenantId: string): Promise<EmailTemplate>;

  // Digital Journey methods
  getDigitalJourneys(tenantId: string): Promise<DigitalJourney[]>;
  getDigitalJourney(id: number, tenantId: string): Promise<DigitalJourney | undefined>;
  createDigitalJourney(journey: InsertDigitalJourney): Promise<DigitalJourney>;
  updateDigitalJourney(id: number, data: Partial<DigitalJourney>, tenantId: string): Promise<DigitalJourney>;
  
  // Account Tasks methods
  getAccountTasks(tenantId: string): Promise<AccountTask[]>;
  getAccountTasksByAccount(accountId: number, tenantId: string): Promise<AccountTask[]>;
  getAccountTask(id: number, tenantId: string): Promise<AccountTask | undefined>;
  createAccountTask(task: InsertAccountTask): Promise<AccountTask>;
  createAccountTasks(tasks: InsertAccountTask[]): Promise<AccountTask[]>;
  updateAccountTask(id: number, data: Partial<AccountTask>, tenantId: string): Promise<AccountTask>;
  
  // Report Definition methods
  getReportDefinitions(tenantId: string): Promise<ReportDefinition[]>;
  getReportDefinition(id: number, tenantId: string): Promise<ReportDefinition | undefined>;
  createReportDefinition(report: InsertReportDefinition): Promise<ReportDefinition>;
  updateReportDefinition(id: number, data: Partial<ReportDefinition>, tenantId: string): Promise<ReportDefinition>;
  
  // Dashboard Definition methods
  getDashboardDefinitions(tenantId: string): Promise<DashboardDefinition[]>;
  getDashboardDefinition(id: number, tenantId: string): Promise<DashboardDefinition | undefined>;
  createDashboardDefinition(dashboard: InsertDashboardDefinition): Promise<DashboardDefinition>;
  updateDashboardDefinition(id: number, data: Partial<DashboardDefinition>, tenantId: string): Promise<DashboardDefinition>;
  
  // Dashboard Widget methods
  getDashboardWidgets(dashboardId: number): Promise<DashboardWidget[]>;
  createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget>;
  updateDashboardWidget(id: number, data: Partial<DashboardWidget>, tenantId: string): Promise<DashboardWidget>;
  
  // User Dashboard Preferences methods
  getUserDashboardPreferences(userId: number, tenantId: string): Promise<UserDashboardPreference[]>;
  createUserDashboardPreference(preference: InsertUserDashboardPreference): Promise<UserDashboardPreference>;
  
  // Saved Report Filters methods
  getSavedReportFilters(userId: number, tenantId: string): Promise<SavedReportFilter[]>;
  createSavedReportFilter(filter: InsertSavedReportFilter): Promise<SavedReportFilter>;
  
  // S3 Bucket methods
  getS3Buckets(tenantId: string): Promise<S3Bucket[]>;
  getS3Bucket(id: number, tenantId: string): Promise<S3Bucket | undefined>;
  createS3Bucket(bucket: InsertS3Bucket): Promise<S3Bucket>;
  updateS3Bucket(id: number, data: Partial<S3Bucket>, tenantId: string): Promise<S3Bucket>;
  toggleS3BucketStatus(id: number, tenantId: string): Promise<S3Bucket>;
  
  // CSV Upload methods
  getCsvUploads(tenantId: string): Promise<CsvUpload[]>;
  getCsvUpload(id: number, tenantId: string): Promise<CsvUpload | undefined>;
  createCsvUpload(upload: InsertCsvUpload): Promise<CsvUpload>;
  updateCsvUploadStatus(id: number, status: string, data: Partial<CsvUpload>, tenantId: string): Promise<CsvUpload>;
  
  // Module methods
  getModules(tenantId: string): Promise<Module[]>;
  getModule(id: string, tenantId: string): Promise<Module | undefined>;
  updateModule(id: string, data: Partial<Module>, tenantId: string): Promise<Module>;
  
  // Community methods
  getCommunityPosts(tenantId: string, options: { forumId?: number, limit: number, offset: number }): Promise<CommunityPost[]>;
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      conObject: {
        connectionString: process.env.DATABASE_URL
      },
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserStripeInfo(userId: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error(`User not found with id: ${userId}`);
    }
    
    return user;
  }

  // Tenant methods
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.domainName, domain));
    return tenant;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(insertTenant).returning();
    return tenant;
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const [tenant] = await db
      .update(tenants)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, id))
      .returning();
    
    if (!tenant) {
      throw new Error(`Tenant not found with id: ${id}`);
    }
    
    return tenant;
  }

  // Account methods
  async getAccounts(tenantId: string): Promise<Account[]> {
    return db.select().from(accounts).where(eq(accounts.tenantId, tenantId));
  }

  async getAccount(id: number, tenantId: string): Promise<Account | undefined> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.tenantId, tenantId)));
    
    return account;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    try {
      console.log("Creating account with data:", JSON.stringify(insertAccount, null, 2));
      
      // Make sure tenant ID is a string and check if it exists
      if (!insertAccount.tenantId) {
        throw new Error("Tenant ID is required to create an account");
      }
      
      // Verify tenant exists before creating account
      const tenant = await this.getTenant(insertAccount.tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found with ID: ${insertAccount.tenantId}`);
      }
      
      const [account] = await db
        .insert(accounts)
        .values(insertAccount)
        .returning();
      
      console.log("Created account:", JSON.stringify(account, null, 2));
      return account;
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  }

  async updateAccount(id: number, data: Partial<Account>, tenantId: string): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(accounts.id, id), eq(accounts.tenantId, tenantId)))
      .returning();
    
    if (!account) {
      throw new Error(`Account not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return account;
  }

  async calculateAccountHealthScore(id: number, tenantId: string): Promise<number> {
    // Simulate an AI-based calculation
    const healthScore = Math.floor(Math.random() * 100);
    
    await this.updateAccount(id, { healthScore }, tenantId);
    return healthScore;
  }

  // Contact methods
  async getContacts(tenantId: string): Promise<Contact[]> {
    return db.select().from(contacts).where(eq(contacts.tenantId, tenantId));
  }

  async getContactsByAccount(accountId: number, tenantId: string): Promise<Contact[]> {
    return db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.accountId, accountId),
        eq(contacts.tenantId, tenantId)
      ));
  }

  async getContact(id: number, tenantId: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.id, id),
        eq(contacts.tenantId, tenantId)
      ));
    
    return contact;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(insertContact).returning();
    return contact;
  }

  async updateContact(id: number, data: Partial<Contact>, tenantId: string): Promise<Contact> {
    const [contact] = await db
      .update(contacts)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(contacts.id, id),
        eq(contacts.tenantId, tenantId)
      ))
      .returning();
    
    if (!contact) {
      throw new Error(`Contact not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return contact;
  }

  // Deal methods
  async getDeals(tenantId: string): Promise<Deal[]> {
    return db.select().from(deals).where(eq(deals.tenantId, tenantId));
  }

  async getDealsByAccount(accountId: number, tenantId: string): Promise<Deal[]> {
    return db
      .select()
      .from(deals)
      .where(and(
        eq(deals.accountId, accountId),
        eq(deals.tenantId, tenantId)
      ));
  }

  async getDeal(id: number, tenantId: string): Promise<Deal | undefined> {
    const [deal] = await db
      .select()
      .from(deals)
      .where(and(
        eq(deals.id, id),
        eq(deals.tenantId, tenantId)
      ));
    
    return deal;
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    // Add AI-calculated values
    const dealWithScores = {
      ...insertDeal,
      winProbability: Math.floor(Math.random() * 100),
      healthScore: Math.floor(Math.random() * 100)
    };
    
    const [deal] = await db.insert(deals).values(dealWithScores).returning();
    return deal;
  }

  async updateDeal(id: number, data: Partial<Deal>, tenantId: string): Promise<Deal> {
    const [deal] = await db
      .update(deals)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(deals.id, id),
        eq(deals.tenantId, tenantId)
      ))
      .returning();
    
    if (!deal) {
      throw new Error(`Deal not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return deal;
  }

  async calculateDealWinProbability(id: number, tenantId: string): Promise<number> {
    // Simulate an AI-based calculation
    const winProbability = Math.floor(Math.random() * 100);
    
    await this.updateDeal(id, { winProbability }, tenantId);
    return winProbability;
  }

  // Project methods
  async getProjects(tenantId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.tenantId, tenantId));
  }

  async getProjectsByAccount(accountId: number, tenantId: string): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(and(
        eq(projects.accountId, accountId),
        eq(projects.tenantId, tenantId)
      ));
  }

  async getProject(id: number, tenantId: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, id),
        eq(projects.tenantId, tenantId)
      ));
    
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    // Add AI-calculated health score
    const projectWithScore = {
      ...insertProject,
      healthScore: Math.floor(Math.random() * 100)
    };
    
    const [project] = await db.insert(projects).values(projectWithScore).returning();
    return project;
  }

  async updateProject(id: number, data: Partial<Project>, tenantId: string): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(projects.id, id),
        eq(projects.tenantId, tenantId)
      ))
      .returning();
    
    if (!project) {
      throw new Error(`Project not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return project;
  }

  async calculateProjectHealthScore(id: number, tenantId: string): Promise<number> {
    // Simulate an AI-based calculation
    const healthScore = Math.floor(Math.random() * 100);
    
    await this.updateProject(id, { healthScore }, tenantId);
    return healthScore;
  }

  // Support Ticket methods
  async getSupportTickets(tenantId: string): Promise<SupportTicket[]> {
    return db.select().from(supportTickets).where(eq(supportTickets.tenantId, tenantId));
  }

  async getSupportTicketsByAccount(accountId: number, tenantId: string): Promise<SupportTicket[]> {
    return db
      .select()
      .from(supportTickets)
      .where(and(
        eq(supportTickets.accountId, accountId),
        eq(supportTickets.tenantId, tenantId)
      ));
  }

  async getSupportTicket(id: number, tenantId: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(and(
        eq(supportTickets.id, id),
        eq(supportTickets.tenantId, tenantId)
      ));
    
    return ticket;
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db.insert(supportTickets).values(insertTicket).returning();
    return ticket;
  }

  async updateSupportTicket(id: number, data: Partial<SupportTicket>, tenantId: string): Promise<SupportTicket> {
    const [ticket] = await db
      .update(supportTickets)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(supportTickets.id, id),
        eq(supportTickets.tenantId, tenantId)
      ))
      .returning();
    
    if (!ticket) {
      throw new Error(`Support ticket not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return ticket;
  }

  // Ticket Activity methods
  async getTicketActivities(ticketId: number): Promise<TicketActivity[]> {
    return db
      .select()
      .from(ticketActivities)
      .where(eq(ticketActivities.ticketId, ticketId));
  }

  async createTicketActivity(insertActivity: InsertTicketActivity): Promise<TicketActivity> {
    const [activity] = await db.insert(ticketActivities).values(insertActivity).returning();
    return activity;
  }

  // Email Template methods
  async getEmailTemplates(tenantId: string): Promise<EmailTemplate[]> {
    return db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.tenantId, tenantId));
  }

  async getEmailTemplate(id: number, tenantId: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.tenantId, tenantId)
      ));
    
    return template;
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await db.insert(emailTemplates).values(insertTemplate).returning();
    return template;
  }

  async updateEmailTemplate(id: number, data: Partial<EmailTemplate>, tenantId: string): Promise<EmailTemplate> {
    const [template] = await db
      .update(emailTemplates)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.tenantId, tenantId)
      ))
      .returning();
    
    if (!template) {
      throw new Error(`Email template not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return template;
  }

  // Digital Journey methods
  async getDigitalJourneys(tenantId: string): Promise<DigitalJourney[]> {
    return db
      .select()
      .from(digitalJourneys)
      .where(eq(digitalJourneys.tenantId, tenantId));
  }

  async getDigitalJourney(id: number, tenantId: string): Promise<DigitalJourney | undefined> {
    const [journey] = await db
      .select()
      .from(digitalJourneys)
      .where(and(
        eq(digitalJourneys.id, id),
        eq(digitalJourneys.tenantId, tenantId)
      ));
    
    return journey;
  }

  async createDigitalJourney(insertJourney: InsertDigitalJourney): Promise<DigitalJourney> {
    const [journey] = await db.insert(digitalJourneys).values(insertJourney).returning();
    return journey;
  }

  async updateDigitalJourney(id: number, data: Partial<DigitalJourney>, tenantId: string): Promise<DigitalJourney> {
    const [journey] = await db
      .update(digitalJourneys)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(digitalJourneys.id, id),
        eq(digitalJourneys.tenantId, tenantId)
      ))
      .returning();
    
    if (!journey) {
      throw new Error(`Digital journey not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return journey;
  }
  
  // Account Tasks methods
  async getAccountTasks(tenantId: string): Promise<AccountTask[]> {
    return db.select().from(accountTasks).where(eq(accountTasks.tenantId, tenantId));
  }

  async getAccountTasksByAccount(accountId: number, tenantId: string): Promise<AccountTask[]> {
    return db
      .select()
      .from(accountTasks)
      .where(and(
        eq(accountTasks.accountId, accountId),
        eq(accountTasks.tenantId, tenantId)
      ));
  }

  async getAccountTask(id: number, tenantId: string): Promise<AccountTask | undefined> {
    const [task] = await db
      .select()
      .from(accountTasks)
      .where(and(
        eq(accountTasks.id, id),
        eq(accountTasks.tenantId, tenantId)
      ));
    
    return task;
  }

  async createAccountTask(insertTask: InsertAccountTask): Promise<AccountTask> {
    const [task] = await db.insert(accountTasks).values(insertTask).returning();
    return task;
  }

  async createAccountTasks(tasks: InsertAccountTask[]): Promise<AccountTask[]> {
    if (tasks.length === 0) {
      return [];
    }
    
    return db.insert(accountTasks).values(tasks).returning();
  }

  async updateAccountTask(id: number, data: Partial<AccountTask>, tenantId: string): Promise<AccountTask> {
    const [task] = await db
      .update(accountTasks)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(accountTasks.id, id),
        eq(accountTasks.tenantId, tenantId)
      ))
      .returning();
    
    if (!task) {
      throw new Error(`Account task not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return task;
  }

  // Report Definition methods
  async getReportDefinitions(tenantId: string): Promise<ReportDefinition[]> {
    return db
      .select()
      .from(reportDefinitions)
      .where(eq(reportDefinitions.tenantId, tenantId));
  }

  async getReportDefinition(id: number, tenantId: string): Promise<ReportDefinition | undefined> {
    const [report] = await db
      .select()
      .from(reportDefinitions)
      .where(and(eq(reportDefinitions.id, id), eq(reportDefinitions.tenantId, tenantId)));
    return report;
  }

  async createReportDefinition(report: InsertReportDefinition): Promise<ReportDefinition> {
    const [newReport] = await db
      .insert(reportDefinitions)
      .values(report)
      .returning();
    return newReport;
  }

  async updateReportDefinition(id: number, data: Partial<ReportDefinition>, tenantId: string): Promise<ReportDefinition> {
    const [updatedReport] = await db
      .update(reportDefinitions)
      .set(data)
      .where(and(eq(reportDefinitions.id, id), eq(reportDefinitions.tenantId, tenantId)))
      .returning();
    return updatedReport;
  }

  // Dashboard Definition methods
  async getDashboardDefinitions(tenantId: string): Promise<DashboardDefinition[]> {
    return db
      .select()
      .from(dashboardDefinitions)
      .where(eq(dashboardDefinitions.tenantId, tenantId));
  }

  async getDashboardDefinition(id: number, tenantId: string): Promise<DashboardDefinition | undefined> {
    const [dashboard] = await db
      .select()
      .from(dashboardDefinitions)
      .where(and(eq(dashboardDefinitions.id, id), eq(dashboardDefinitions.tenantId, tenantId)));
    return dashboard;
  }

  async createDashboardDefinition(dashboard: InsertDashboardDefinition): Promise<DashboardDefinition> {
    const [newDashboard] = await db
      .insert(dashboardDefinitions)
      .values(dashboard)
      .returning();
    return newDashboard;
  }

  async updateDashboardDefinition(id: number, data: Partial<DashboardDefinition>, tenantId: string): Promise<DashboardDefinition> {
    const [updatedDashboard] = await db
      .update(dashboardDefinitions)
      .set(data)
      .where(and(eq(dashboardDefinitions.id, id), eq(dashboardDefinitions.tenantId, tenantId)))
      .returning();
    return updatedDashboard;
  }

  // Dashboard Widget methods
  async getDashboardWidgets(dashboardId: number): Promise<DashboardWidget[]> {
    return db
      .select()
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.dashboardId, dashboardId));
  }

  async createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    const [newWidget] = await db
      .insert(dashboardWidgets)
      .values(widget)
      .returning();
    return newWidget;
  }

  async updateDashboardWidget(id: number, data: Partial<DashboardWidget>, tenantId: string): Promise<DashboardWidget> {
    const [updatedWidget] = await db
      .update(dashboardWidgets)
      .set(data)
      .where(eq(dashboardWidgets.id, id))
      .returning();
    return updatedWidget;
  }

  // User Dashboard Preference methods
  async getUserDashboardPreferences(userId: number, tenantId: string): Promise<UserDashboardPreference[]> {
    return db
      .select()
      .from(userDashboardPreferences)
      .where(and(eq(userDashboardPreferences.userId, userId), eq(userDashboardPreferences.tenantId, tenantId)));
  }

  async createUserDashboardPreference(preference: InsertUserDashboardPreference): Promise<UserDashboardPreference> {
    const [newPreference] = await db
      .insert(userDashboardPreferences)
      .values(preference)
      .returning();
    return newPreference;
  }

  // Saved Report Filter methods
  async getSavedReportFilters(userId: number, tenantId: string): Promise<SavedReportFilter[]> {
    return db
      .select()
      .from(savedReportFilters)
      .where(and(eq(savedReportFilters.userId, userId), eq(savedReportFilters.tenantId, tenantId)));
  }

  async createSavedReportFilter(filter: InsertSavedReportFilter): Promise<SavedReportFilter> {
    const [newFilter] = await db
      .insert(savedReportFilters)
      .values(filter)
      .returning();
    return newFilter;
  }

  // S3 Bucket methods
  async getS3Buckets(tenantId: string): Promise<S3Bucket[]> {
    return db
      .select()
      .from(s3Buckets)
      .where(eq(s3Buckets.tenantId, tenantId));
  }

  async getS3Bucket(id: number, tenantId: string): Promise<S3Bucket | undefined> {
    const [bucket] = await db
      .select()
      .from(s3Buckets)
      .where(and(
        eq(s3Buckets.id, id),
        eq(s3Buckets.tenantId, tenantId)
      ));
    return bucket;
  }

  async createS3Bucket(insertBucket: InsertS3Bucket): Promise<S3Bucket> {
    const [bucket] = await db
      .insert(s3Buckets)
      .values(insertBucket)
      .returning();
    return bucket;
  }

  async updateS3Bucket(id: number, data: Partial<S3Bucket>, tenantId: string): Promise<S3Bucket> {
    const [bucket] = await db
      .update(s3Buckets)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(s3Buckets.id, id),
        eq(s3Buckets.tenantId, tenantId)
      ))
      .returning();
    
    if (!bucket) {
      throw new Error(`S3 bucket not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return bucket;
  }

  async toggleS3BucketStatus(id: number, tenantId: string): Promise<S3Bucket> {
    // First get the current bucket to get its status
    const bucket = await this.getS3Bucket(id, tenantId);
    
    if (!bucket) {
      throw new Error(`S3 bucket not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    // Then update with the opposite status
    return this.updateS3Bucket(
      id, 
      { isActive: !bucket.isActive },
      tenantId
    );
  }
  
  // CSV Upload methods
  async getCsvUploads(tenantId: string): Promise<CsvUpload[]> {
    return db
      .select()
      .from(csvUploads)
      .where(eq(csvUploads.tenantId, tenantId));
  }

  async getCsvUpload(id: number, tenantId: string): Promise<CsvUpload | undefined> {
    const [upload] = await db
      .select()
      .from(csvUploads)
      .where(and(
        eq(csvUploads.id, id),
        eq(csvUploads.tenantId, tenantId)
      ));
    return upload;
  }

  async createCsvUpload(insertUpload: InsertCsvUpload): Promise<CsvUpload> {
    const [upload] = await db
      .insert(csvUploads)
      .values(insertUpload)
      .returning();
    return upload;
  }

  async updateCsvUploadStatus(id: number, status: string, data: Partial<CsvUpload>, tenantId: string): Promise<CsvUpload> {
    const [upload] = await db
      .update(csvUploads)
      .set({
        ...data,
        status,
        updatedAt: new Date()
      })
      .where(and(
        eq(csvUploads.id, id),
        eq(csvUploads.tenantId, tenantId)
      ))
      .returning();
    
    if (!upload) {
      throw new Error(`CSV upload not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return upload;
  }
  
  // Module methods
  async getModules(tenantId: string): Promise<Module[]> {
    return db.select().from(modules).where(eq(modules.tenantId, tenantId));
  }

  async getModule(id: string, tenantId: string): Promise<Module | undefined> {
    const [module] = await db
      .select()
      .from(modules)
      .where(and(
        eq(modules.id, id),
        eq(modules.tenantId, tenantId)
      ));
    
    return module;
  }

  async updateModule(id: string, data: Partial<Module>, tenantId: string): Promise<Module> {
    const [module] = await db
      .update(modules)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(modules.id, id),
        eq(modules.tenantId, tenantId)
      ))
      .returning();
    
    if (!module) {
      throw new Error(`Module not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return module;
  }
  
  // Community methods
  async getCommunityPosts(tenantId: string, options: { forumId?: number, limit: number, offset: number }): Promise<CommunityPost[]> {
    let query = db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.tenantId, tenantId))
      .limit(options.limit)
      .offset(options.offset);
    
    if (options.forumId) {
      query = query.where(eq(communityPosts.forumId, options.forumId));
    }
    
    return query;
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const [newPost] = await db
      .insert(communityPosts)
      .values(post)
      .returning();
    
    if (!newPost) {
      throw new Error("Failed to create community post");
    }
    
    return newPost;
  }
  
  // Workflow methods
  async getAllWorkflows(tenantId: string): Promise<Workflow[]> {
    return db.select().from(workflow).where(eq(workflow.tenantId, tenantId));
  }
  
  async getWorkflow(id: string, tenantId: string): Promise<Workflow | undefined> {
    const [foundWorkflow] = await db
      .select()
      .from(workflow)
      .where(and(
        eq(workflow.id, id),
        eq(workflow.tenantId, tenantId)
      ));
    
    return foundWorkflow;
  }
  
  async createWorkflow(data: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db.insert(workflow).values(data).returning();
    return newWorkflow;
  }
  
  async updateWorkflow(id: string, data: Partial<Workflow>, tenantId: string): Promise<Workflow> {
    const [updatedWorkflow] = await db
      .update(workflow)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(workflow.id, id),
        eq(workflow.tenantId, tenantId)
      ))
      .returning();
    
    if (!updatedWorkflow) {
      throw new Error(`Workflow not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return updatedWorkflow;
  }
  
  async deleteWorkflow(id: string, tenantId: string): Promise<Workflow> {
    const [deletedWorkflow] = await db
      .delete(workflow)
      .where(and(
        eq(workflow.id, id),
        eq(workflow.tenantId, tenantId)
      ))
      .returning();
    
    if (!deletedWorkflow) {
      throw new Error(`Workflow not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return deletedWorkflow;
  }
  
  // Workflow DataSource methods
  async getDataSources(workflowId: string, tenantId: string): Promise<DataSource[]> {
    return db
      .select()
      .from(dataSource)
      .where(and(
        eq(dataSource.workflowId, workflowId),
        eq(dataSource.tenantId, tenantId)
      ));
  }
  
  async getDataSource(id: string, tenantId: string): Promise<DataSource | undefined> {
    const [foundDataSource] = await db
      .select()
      .from(dataSource)
      .where(and(
        eq(dataSource.id, id),
        eq(dataSource.tenantId, tenantId)
      ));
    
    return foundDataSource;
  }
  
  async createDataSource(data: InsertDataSource): Promise<DataSource> {
    const [newDataSource] = await db.insert(dataSource).values(data).returning();
    return newDataSource;
  }
  
  async updateDataSource(id: string, data: Partial<DataSource>, tenantId: string): Promise<DataSource> {
    const [updatedDataSource] = await db
      .update(dataSource)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(dataSource.id, id),
        eq(dataSource.tenantId, tenantId)
      ))
      .returning();
    
    if (!updatedDataSource) {
      throw new Error(`Data source not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return updatedDataSource;
  }
  
  async deleteDataSource(id: string, tenantId: string): Promise<DataSource> {
    const [deletedDataSource] = await db
      .delete(dataSource)
      .where(and(
        eq(dataSource.id, id),
        eq(dataSource.tenantId, tenantId)
      ))
      .returning();
    
    if (!deletedDataSource) {
      throw new Error(`Data source not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return deletedDataSource;
  }
  
  // Workflow DataJoin methods
  async getDataJoins(workflowId: string, tenantId: string): Promise<DataJoin[]> {
    return db
      .select()
      .from(dataJoin)
      .where(and(
        eq(dataJoin.workflowId, workflowId),
        eq(dataJoin.tenantId, tenantId)
      ));
  }
  
  async getDataJoin(id: string, tenantId: string): Promise<DataJoin | undefined> {
    const [foundDataJoin] = await db
      .select()
      .from(dataJoin)
      .where(and(
        eq(dataJoin.id, id),
        eq(dataJoin.tenantId, tenantId)
      ));
    
    return foundDataJoin;
  }
  
  async createDataJoin(data: InsertDataJoin): Promise<DataJoin> {
    const [newDataJoin] = await db.insert(dataJoin).values(data).returning();
    return newDataJoin;
  }
  
  async updateDataJoin(id: string, data: Partial<DataJoin>, tenantId: string): Promise<DataJoin> {
    const [updatedDataJoin] = await db
      .update(dataJoin)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(dataJoin.id, id),
        eq(dataJoin.tenantId, tenantId)
      ))
      .returning();
    
    if (!updatedDataJoin) {
      throw new Error(`Data join not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return updatedDataJoin;
  }
  
  async deleteDataJoin(id: string, tenantId: string): Promise<DataJoin> {
    const [deletedDataJoin] = await db
      .delete(dataJoin)
      .where(and(
        eq(dataJoin.id, id),
        eq(dataJoin.tenantId, tenantId)
      ))
      .returning();
    
    if (!deletedDataJoin) {
      throw new Error(`Data join not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return deletedDataJoin;
  }
  
  // Workflow DataTransformation methods
  async getDataTransformations(workflowId: string, tenantId: string): Promise<DataTransformation[]> {
    return db
      .select()
      .from(dataTransformation)
      .where(and(
        eq(dataTransformation.workflowId, workflowId),
        eq(dataTransformation.tenantId, tenantId)
      ));
  }
  
  async getDataTransformation(id: string, tenantId: string): Promise<DataTransformation | undefined> {
    const [foundTransformation] = await db
      .select()
      .from(dataTransformation)
      .where(and(
        eq(dataTransformation.id, id),
        eq(dataTransformation.tenantId, tenantId)
      ));
    
    return foundTransformation;
  }
  
  async createDataTransformation(data: InsertDataTransformation): Promise<DataTransformation> {
    const [newTransformation] = await db.insert(dataTransformation).values(data).returning();
    return newTransformation;
  }
  
  async updateDataTransformation(id: string, data: Partial<DataTransformation>, tenantId: string): Promise<DataTransformation> {
    const [updatedTransformation] = await db
      .update(dataTransformation)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(dataTransformation.id, id),
        eq(dataTransformation.tenantId, tenantId)
      ))
      .returning();
    
    if (!updatedTransformation) {
      throw new Error(`Data transformation not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return updatedTransformation;
  }
  
  async deleteDataTransformation(id: string, tenantId: string): Promise<DataTransformation> {
    const [deletedTransformation] = await db
      .delete(dataTransformation)
      .where(and(
        eq(dataTransformation.id, id),
        eq(dataTransformation.tenantId, tenantId)
      ))
      .returning();
    
    if (!deletedTransformation) {
      throw new Error(`Data transformation not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return deletedTransformation;
  }
  
  // Workflow RuleCondition methods
  async getRuleConditions(workflowId: string, tenantId: string): Promise<RuleCondition[]> {
    return db
      .select()
      .from(ruleCondition)
      .where(and(
        eq(ruleCondition.workflowId, workflowId),
        eq(ruleCondition.tenantId, tenantId)
      ));
  }
  
  async getRuleCondition(id: string, tenantId: string): Promise<RuleCondition | undefined> {
    const [foundCondition] = await db
      .select()
      .from(ruleCondition)
      .where(and(
        eq(ruleCondition.id, id),
        eq(ruleCondition.tenantId, tenantId)
      ));
    
    return foundCondition;
  }
  
  async createRuleCondition(data: InsertRuleCondition): Promise<RuleCondition> {
    const [newCondition] = await db.insert(ruleCondition).values(data).returning();
    return newCondition;
  }
  
  async updateRuleCondition(id: string, data: Partial<RuleCondition>, tenantId: string): Promise<RuleCondition> {
    const [updatedCondition] = await db
      .update(ruleCondition)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(ruleCondition.id, id),
        eq(ruleCondition.tenantId, tenantId)
      ))
      .returning();
    
    if (!updatedCondition) {
      throw new Error(`Rule condition not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return updatedCondition;
  }
  
  async deleteRuleCondition(id: string, tenantId: string): Promise<RuleCondition> {
    const [deletedCondition] = await db
      .delete(ruleCondition)
      .where(and(
        eq(ruleCondition.id, id),
        eq(ruleCondition.tenantId, tenantId)
      ))
      .returning();
    
    if (!deletedCondition) {
      throw new Error(`Rule condition not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return deletedCondition;
  }
  
  // Workflow Action methods
  async getActions(workflowId: string, tenantId: string): Promise<Action[]> {
    return db
      .select()
      .from(action)
      .where(and(
        eq(action.workflowId, workflowId),
        eq(action.tenantId, tenantId)
      ));
  }
  
  async getAction(id: string, tenantId: string): Promise<Action | undefined> {
    const [foundAction] = await db
      .select()
      .from(action)
      .where(and(
        eq(action.id, id),
        eq(action.tenantId, tenantId)
      ));
    
    return foundAction;
  }
  
  async createAction(data: InsertAction): Promise<Action> {
    const [newAction] = await db.insert(action).values(data).returning();
    return newAction;
  }
  
  async updateAction(id: string, data: Partial<Action>, tenantId: string): Promise<Action> {
    const [updatedAction] = await db
      .update(action)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(action.id, id),
        eq(action.tenantId, tenantId)
      ))
      .returning();
    
    if (!updatedAction) {
      throw new Error(`Action not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return updatedAction;
  }
  
  async deleteAction(id: string, tenantId: string): Promise<Action> {
    const [deletedAction] = await db
      .delete(action)
      .where(and(
        eq(action.id, id),
        eq(action.tenantId, tenantId)
      ))
      .returning();
    
    if (!deletedAction) {
      throw new Error(`Action not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return deletedAction;
  }
  
  // Workflow Trigger methods
  async getTriggers(workflowId: string, tenantId: string): Promise<Trigger[]> {
    return db
      .select()
      .from(trigger)
      .where(and(
        eq(trigger.workflowId, workflowId),
        eq(trigger.tenantId, tenantId)
      ));
  }
  
  async getTrigger(id: string, tenantId: string): Promise<Trigger | undefined> {
    const [foundTrigger] = await db
      .select()
      .from(trigger)
      .where(and(
        eq(trigger.id, id),
        eq(trigger.tenantId, tenantId)
      ));
    
    return foundTrigger;
  }
  
  async createTrigger(data: InsertTrigger): Promise<Trigger> {
    const [newTrigger] = await db.insert(trigger).values(data).returning();
    return newTrigger;
  }
  
  async updateTrigger(id: string, data: Partial<Trigger>, tenantId: string): Promise<Trigger> {
    const [updatedTrigger] = await db
      .update(trigger)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(trigger.id, id),
        eq(trigger.tenantId, tenantId)
      ))
      .returning();
    
    if (!updatedTrigger) {
      throw new Error(`Trigger not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return updatedTrigger;
  }
  
  async deleteTrigger(id: string, tenantId: string): Promise<Trigger> {
    const [deletedTrigger] = await db
      .delete(trigger)
      .where(and(
        eq(trigger.id, id),
        eq(trigger.tenantId, tenantId)
      ))
      .returning();
    
    if (!deletedTrigger) {
      throw new Error(`Trigger not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    return deletedTrigger;
  }
  
  // Workflow Execution Log methods
  async getExecutionLogs(workflowId: string, tenantId: string): Promise<ExecutionLog[]> {
    return db
      .select()
      .from(executionLog)
      .where(and(
        eq(executionLog.workflowId, workflowId),
        eq(executionLog.tenantId, tenantId)
      ));
  }
  
  async getExecutionLog(id: string, tenantId: string): Promise<ExecutionLog | undefined> {
    const [foundLog] = await db
      .select()
      .from(executionLog)
      .where(and(
        eq(executionLog.id, id),
        eq(executionLog.tenantId, tenantId)
      ));
    
    return foundLog;
  }
  
  async createExecutionLog(data: InsertExecutionLog): Promise<ExecutionLog> {
    const [newLog] = await db.insert(executionLog).values(data).returning();
    return newLog;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tenants: Map<string, Tenant>;
  private accounts: Map<number, Account>;
  private contacts: Map<number, Contact>;
  private deals: Map<number, Deal>;
  private projects: Map<number, Project>;
  private supportTickets: Map<number, SupportTicket>;
  private ticketActivities: Map<number, TicketActivity>;
  private emailTemplates: Map<number, EmailTemplate>;
  private digitalJourneys: Map<number, DigitalJourney>;
  private accountTasks: Map<number, AccountTask>;
  private s3Buckets: Map<number, S3Bucket>;
  private csvUploads: Map<number, CsvUpload>;
  private modules: Map<string, Module>;
  private communityPosts: Map<number, CommunityPost>;
  
  // Workflow storage
  private workflows: Map<string, Workflow>;
  private dataSources: Map<string, DataSource>;
  private dataJoins: Map<string, DataJoin>;
  private dataTransformations: Map<string, DataTransformation>;
  private ruleConditions: Map<string, RuleCondition>;
  private actions: Map<string, Action>;
  private triggers: Map<string, Trigger>;
  private executionLogs: Map<string, ExecutionLog>;
  
  currentUserId: number;
  currentAccountId: number;
  currentContactId: number;
  currentDealId: number;
  currentProjectId: number;
  currentSupportTicketId: number;
  currentTicketActivityId: number;
  currentEmailTemplateId: number;
  currentDigitalJourneyId: number;
  currentAccountTaskId: number;
  currentS3BucketId: number;
  currentCsvUploadId: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.tenants = new Map();
    this.accounts = new Map();
    this.contacts = new Map();
    this.deals = new Map();
    this.projects = new Map();
    this.supportTickets = new Map();
    this.ticketActivities = new Map();
    this.emailTemplates = new Map();
    this.digitalJourneys = new Map();
    this.accountTasks = new Map();
    this.s3Buckets = new Map();
    this.csvUploads = new Map();
    this.modules = new Map();
    this.communityPosts = new Map();
    
    // Initialize workflow maps
    this.workflows = new Map();
    this.dataSources = new Map();
    this.dataJoins = new Map();
    this.dataTransformations = new Map();
    this.ruleConditions = new Map();
    this.actions = new Map();
    this.triggers = new Map();
    this.executionLogs = new Map();
    
    this.currentUserId = 1;
    this.currentAccountId = 1;
    this.currentContactId = 1;
    this.currentDealId = 1;
    this.currentProjectId = 1;
    this.currentSupportTicketId = 1;
    this.currentTicketActivityId = 1;
    this.currentEmailTemplateId = 1;
    this.currentDigitalJourneyId = 1;
    this.currentAccountTaskId = 1;
    this.currentS3BucketId = 1;
    this.currentCsvUploadId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserStripeInfo(userId: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User not found with id: ${userId}`);
    }
    
    const updatedUser: User = {
      ...user,
      ...data,
      updatedAt: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Tenant methods
  async getTenant(id: string): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(
      (tenant) => tenant.domainName === domain
    );
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const now = new Date();
    const tenant: Tenant = {
      ...insertTenant,
      createdAt: now,
      updatedAt: now
    };
    this.tenants.set(tenant.id, tenant);
    return tenant;
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.getTenant(id);
    if (!tenant) {
      throw new Error(`Tenant not found with id: ${id}`);
    }
    
    const updatedTenant: Tenant = {
      ...tenant,
      ...data,
      updatedAt: new Date()
    };
    
    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }

  // Account methods
  async getAccounts(tenantId: string): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.tenantId === tenantId
    );
  }

  async getAccount(id: number, tenantId: string): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (account && account.tenantId === tenantId) {
      return account;
    }
    return undefined;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const now = new Date();
    const account: Account = {
      ...insertAccount,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccount(id: number, data: Partial<Account>, tenantId: string): Promise<Account> {
    const account = await this.getAccount(id, tenantId);
    if (!account) {
      throw new Error(`Account not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedAccount: Account = {
      ...account,
      ...data,
      updatedAt: new Date()
    };
    
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async calculateAccountHealthScore(id: number, tenantId: string): Promise<number> {
    // Simulate an AI-based calculation
    const healthScore = Math.floor(Math.random() * 100);
    
    await this.updateAccount(id, { healthScore }, tenantId);
    return healthScore;
  }

  // Contact methods
  async getContacts(tenantId: string): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(
      (contact) => contact.tenantId === tenantId
    );
  }

  async getContactsByAccount(accountId: number, tenantId: string): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(
      (contact) => contact.accountId === accountId && contact.tenantId === tenantId
    );
  }

  async getContact(id: number, tenantId: string): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (contact && contact.tenantId === tenantId) {
      return contact;
    }
    return undefined;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const now = new Date();
    const contact: Contact = {
      ...insertContact,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: number, data: Partial<Contact>, tenantId: string): Promise<Contact> {
    const contact = await this.getContact(id, tenantId);
    if (!contact) {
      throw new Error(`Contact not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedContact: Contact = {
      ...contact,
      ...data,
      updatedAt: new Date()
    };
    
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  // Deal methods
  async getDeals(tenantId: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(
      (deal) => deal.tenantId === tenantId
    );
  }

  async getDealsByAccount(accountId: number, tenantId: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(
      (deal) => deal.accountId === accountId && deal.tenantId === tenantId
    );
  }

  async getDeal(id: number, tenantId: string): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (deal && deal.tenantId === tenantId) {
      return deal;
    }
    return undefined;
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = this.currentDealId++;
    const now = new Date();
    const winProbability = Math.floor(Math.random() * 100);
    const healthScore = Math.floor(Math.random() * 100);
    const deal: Deal = {
      ...insertDeal,
      id,
      winProbability,
      healthScore,
      createdAt: now,
      updatedAt: now
    };
    this.deals.set(id, deal);
    return deal;
  }

  async updateDeal(id: number, data: Partial<Deal>, tenantId: string): Promise<Deal> {
    const deal = await this.getDeal(id, tenantId);
    if (!deal) {
      throw new Error(`Deal not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedDeal: Deal = {
      ...deal,
      ...data,
      updatedAt: new Date()
    };
    
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async calculateDealWinProbability(id: number, tenantId: string): Promise<number> {
    // Simulate an AI-based calculation
    const winProbability = Math.floor(Math.random() * 100);
    
    await this.updateDeal(id, { winProbability }, tenantId);
    return winProbability;
  }

  // Project methods
  async getProjects(tenantId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.tenantId === tenantId
    );
  }

  async getProjectsByAccount(accountId: number, tenantId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.accountId === accountId && project.tenantId === tenantId
    );
  }

  async getProject(id: number, tenantId: string): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (project && project.tenantId === tenantId) {
      return project;
    }
    return undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const healthScore = Math.floor(Math.random() * 100);
    const project: Project = {
      ...insertProject,
      id,
      healthScore,
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, data: Partial<Project>, tenantId: string): Promise<Project> {
    const project = await this.getProject(id, tenantId);
    if (!project) {
      throw new Error(`Project not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedProject: Project = {
      ...project,
      ...data,
      updatedAt: new Date()
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async calculateProjectHealthScore(id: number, tenantId: string): Promise<number> {
    // Simulate an AI-based calculation
    const healthScore = Math.floor(Math.random() * 100);
    
    await this.updateProject(id, { healthScore }, tenantId);
    return healthScore;
  }

  // Support Ticket methods
  async getSupportTickets(tenantId: string): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values()).filter(
      (ticket) => ticket.tenantId === tenantId
    );
  }

  async getSupportTicketsByAccount(accountId: number, tenantId: string): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values()).filter(
      (ticket) => ticket.accountId === accountId && ticket.tenantId === tenantId
    );
  }

  async getSupportTicket(id: number, tenantId: string): Promise<SupportTicket | undefined> {
    const ticket = this.supportTickets.get(id);
    if (ticket && ticket.tenantId === tenantId) {
      return ticket;
    }
    return undefined;
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const id = this.currentSupportTicketId++;
    const now = new Date();
    const ticket: SupportTicket = {
      ...insertTicket,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.supportTickets.set(id, ticket);
    return ticket;
  }

  async updateSupportTicket(id: number, data: Partial<SupportTicket>, tenantId: string): Promise<SupportTicket> {
    const ticket = await this.getSupportTicket(id, tenantId);
    if (!ticket) {
      throw new Error(`Support ticket not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedTicket: SupportTicket = {
      ...ticket,
      ...data,
      updatedAt: new Date()
    };
    
    this.supportTickets.set(id, updatedTicket);
    return updatedTicket;
  }

  // Ticket Activity methods
  async getTicketActivities(ticketId: number): Promise<TicketActivity[]> {
    return Array.from(this.ticketActivities.values()).filter(
      (activity) => activity.ticketId === ticketId
    );
  }

  async createTicketActivity(insertActivity: InsertTicketActivity): Promise<TicketActivity> {
    const id = this.currentTicketActivityId++;
    const now = new Date();
    const activity: TicketActivity = {
      ...insertActivity,
      id,
      createdAt: now
    };
    this.ticketActivities.set(id, activity);
    return activity;
  }

  // Email Template methods
  async getEmailTemplates(tenantId: string): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values()).filter(
      (template) => template.tenantId === tenantId
    );
  }

  async getEmailTemplate(id: number, tenantId: string): Promise<EmailTemplate | undefined> {
    const template = this.emailTemplates.get(id);
    if (template && template.tenantId === tenantId) {
      return template;
    }
    return undefined;
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.currentEmailTemplateId++;
    const now = new Date();
    const template: EmailTemplate = {
      ...insertTemplate,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.emailTemplates.set(id, template);
    return template;
  }

  async updateEmailTemplate(id: number, data: Partial<EmailTemplate>, tenantId: string): Promise<EmailTemplate> {
    const template = await this.getEmailTemplate(id, tenantId);
    if (!template) {
      throw new Error(`Email template not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedTemplate: EmailTemplate = {
      ...template,
      ...data,
      updatedAt: new Date()
    };
    
    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  // Digital Journey methods
  async getDigitalJourneys(tenantId: string): Promise<DigitalJourney[]> {
    return Array.from(this.digitalJourneys.values()).filter(
      (journey) => journey.tenantId === tenantId
    );
  }

  async getDigitalJourney(id: number, tenantId: string): Promise<DigitalJourney | undefined> {
    const journey = this.digitalJourneys.get(id);
    if (journey && journey.tenantId === tenantId) {
      return journey;
    }
    return undefined;
  }

  async createDigitalJourney(insertJourney: InsertDigitalJourney): Promise<DigitalJourney> {
    const id = this.currentDigitalJourneyId++;
    const now = new Date();
    const journey: DigitalJourney = {
      ...insertJourney,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.digitalJourneys.set(id, journey);
    return journey;
  }

  async updateDigitalJourney(id: number, data: Partial<DigitalJourney>, tenantId: string): Promise<DigitalJourney> {
    const journey = await this.getDigitalJourney(id, tenantId);
    if (!journey) {
      throw new Error(`Digital journey not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedJourney: DigitalJourney = {
      ...journey,
      ...data,
      updatedAt: new Date()
    };
    
    this.digitalJourneys.set(id, updatedJourney);
    return updatedJourney;
  }

  // Account Tasks methods
  async getAccountTasks(tenantId: string): Promise<AccountTask[]> {
    return Array.from(this.accountTasks.values()).filter(
      (task) => task.tenantId === tenantId
    );
  }

  async getAccountTasksByAccount(accountId: number, tenantId: string): Promise<AccountTask[]> {
    return Array.from(this.accountTasks.values()).filter(
      (task) => task.accountId === accountId && task.tenantId === tenantId
    );
  }

  async getAccountTask(id: number, tenantId: string): Promise<AccountTask | undefined> {
    const task = this.accountTasks.get(id);
    if (task && task.tenantId === tenantId) {
      return task;
    }
    return undefined;
  }

  async createAccountTask(insertTask: InsertAccountTask): Promise<AccountTask> {
    const id = this.currentAccountTaskId++;
    const now = new Date();
    const task: AccountTask = {
      ...insertTask,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.accountTasks.set(id, task);
    return task;
  }

  async createAccountTasks(tasks: InsertAccountTask[]): Promise<AccountTask[]> {
    if (tasks.length === 0) {
      return [];
    }
    
    const createdTasks: AccountTask[] = [];
    for (const taskData of tasks) {
      const task = await this.createAccountTask(taskData);
      createdTasks.push(task);
    }
    
    return createdTasks;
  }

  async updateAccountTask(id: number, data: Partial<AccountTask>, tenantId: string): Promise<AccountTask> {
    const task = await this.getAccountTask(id, tenantId);
    if (!task) {
      throw new Error(`Account task not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedTask: AccountTask = {
      ...task,
      ...data,
      updatedAt: new Date()
    };
    
    this.accountTasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Report Definition methods
  private reportDefinitions: Map<number, ReportDefinition> = new Map();
  private currentReportDefinitionId: number = 1;
  
  async getReportDefinitions(tenantId: string): Promise<ReportDefinition[]> {
    return Array.from(this.reportDefinitions.values()).filter(
      (report) => report.tenantId === tenantId
    );
  }

  async getReportDefinition(id: number, tenantId: string): Promise<ReportDefinition | undefined> {
    const report = this.reportDefinitions.get(id);
    if (report && report.tenantId === tenantId) {
      return report;
    }
    return undefined;
  }

  async createReportDefinition(report: InsertReportDefinition): Promise<ReportDefinition> {
    const id = this.currentReportDefinitionId++;
    const now = new Date();
    const newReport: ReportDefinition = {
      ...report,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.reportDefinitions.set(id, newReport);
    return newReport;
  }

  async updateReportDefinition(id: number, data: Partial<ReportDefinition>, tenantId: string): Promise<ReportDefinition> {
    const report = await this.getReportDefinition(id, tenantId);
    if (!report) {
      throw new Error(`Report definition not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedReport: ReportDefinition = {
      ...report,
      ...data,
      updatedAt: new Date()
    };
    
    this.reportDefinitions.set(id, updatedReport);
    return updatedReport;
  }

  // Dashboard Definition methods
  private dashboardDefinitions: Map<number, DashboardDefinition> = new Map();
  private currentDashboardDefinitionId: number = 1;
  
  async getDashboardDefinitions(tenantId: string): Promise<DashboardDefinition[]> {
    return Array.from(this.dashboardDefinitions.values()).filter(
      (dashboard) => dashboard.tenantId === tenantId
    );
  }

  async getDashboardDefinition(id: number, tenantId: string): Promise<DashboardDefinition | undefined> {
    const dashboard = this.dashboardDefinitions.get(id);
    if (dashboard && dashboard.tenantId === tenantId) {
      return dashboard;
    }
    return undefined;
  }

  async createDashboardDefinition(dashboard: InsertDashboardDefinition): Promise<DashboardDefinition> {
    const id = this.currentDashboardDefinitionId++;
    const now = new Date();
    const newDashboard: DashboardDefinition = {
      ...dashboard,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.dashboardDefinitions.set(id, newDashboard);
    return newDashboard;
  }

  async updateDashboardDefinition(id: number, data: Partial<DashboardDefinition>, tenantId: string): Promise<DashboardDefinition> {
    const dashboard = await this.getDashboardDefinition(id, tenantId);
    if (!dashboard) {
      throw new Error(`Dashboard definition not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedDashboard: DashboardDefinition = {
      ...dashboard,
      ...data,
      updatedAt: new Date()
    };
    
    this.dashboardDefinitions.set(id, updatedDashboard);
    return updatedDashboard;
  }

  // Dashboard Widget methods
  private dashboardWidgets: Map<number, DashboardWidget> = new Map();
  private currentDashboardWidgetId: number = 1;
  
  async getDashboardWidgets(dashboardId: number): Promise<DashboardWidget[]> {
    return Array.from(this.dashboardWidgets.values()).filter(
      (widget) => widget.dashboardId === dashboardId
    );
  }

  async createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    const id = this.currentDashboardWidgetId++;
    const now = new Date();
    const newWidget: DashboardWidget = {
      ...widget,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.dashboardWidgets.set(id, newWidget);
    return newWidget;
  }

  async updateDashboardWidget(id: number, data: Partial<DashboardWidget>, tenantId: string): Promise<DashboardWidget> {
    const widget = this.dashboardWidgets.get(id);
    if (!widget) {
      throw new Error(`Dashboard widget not found with id: ${id}`);
    }
    
    const updatedWidget: DashboardWidget = {
      ...widget,
      ...data,
      updatedAt: new Date()
    };
    
    this.dashboardWidgets.set(id, updatedWidget);
    return updatedWidget;
  }

  // User Dashboard Preference methods
  private userDashboardPreferences: Map<number, UserDashboardPreference> = new Map();
  private currentUserDashboardPreferenceId: number = 1;
  
  async getUserDashboardPreferences(userId: number, tenantId: string): Promise<UserDashboardPreference[]> {
    return Array.from(this.userDashboardPreferences.values()).filter(
      (pref) => pref.userId === userId && pref.tenantId === tenantId
    );
  }

  async createUserDashboardPreference(preference: InsertUserDashboardPreference): Promise<UserDashboardPreference> {
    const id = this.currentUserDashboardPreferenceId++;
    const now = new Date();
    const newPreference: UserDashboardPreference = {
      ...preference,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.userDashboardPreferences.set(id, newPreference);
    return newPreference;
  }

  // Saved Report Filter methods
  private savedReportFilters: Map<number, SavedReportFilter> = new Map();
  private currentSavedReportFilterId: number = 1;
  
  async getSavedReportFilters(userId: number, tenantId: string): Promise<SavedReportFilter[]> {
    return Array.from(this.savedReportFilters.values()).filter(
      (filter) => filter.userId === userId && filter.tenantId === tenantId
    );
  }

  async createSavedReportFilter(filter: InsertSavedReportFilter): Promise<SavedReportFilter> {
    const id = this.currentSavedReportFilterId++;
    const now = new Date();
    const newFilter: SavedReportFilter = {
      ...filter,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.savedReportFilters.set(id, newFilter);
    return newFilter;
  }

  // S3 Bucket methods
  async getS3Buckets(tenantId: string): Promise<S3Bucket[]> {
    return Array.from(this.s3Buckets.values()).filter(
      (bucket) => bucket.tenantId === tenantId
    );
  }

  async getS3Bucket(id: number, tenantId: string): Promise<S3Bucket | undefined> {
    const bucket = this.s3Buckets.get(id);
    if (bucket && bucket.tenantId === tenantId) {
      return bucket;
    }
    return undefined;
  }

  async createS3Bucket(insertBucket: InsertS3Bucket): Promise<S3Bucket> {
    const id = this.currentS3BucketId++;
    const now = new Date();
    const bucket: S3Bucket = {
      ...insertBucket,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.s3Buckets.set(id, bucket);
    return bucket;
  }

  async updateS3Bucket(id: number, data: Partial<S3Bucket>, tenantId: string): Promise<S3Bucket> {
    const bucket = await this.getS3Bucket(id, tenantId);
    if (!bucket) {
      throw new Error(`S3 bucket not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedBucket: S3Bucket = {
      ...bucket,
      ...data,
      updatedAt: new Date()
    };
    
    this.s3Buckets.set(id, updatedBucket);
    return updatedBucket;
  }

  async toggleS3BucketStatus(id: number, tenantId: string): Promise<S3Bucket> {
    // First get the current bucket to get its status
    const bucket = await this.getS3Bucket(id, tenantId);
    
    if (!bucket) {
      throw new Error(`S3 bucket not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    // Then update with the opposite status
    return this.updateS3Bucket(
      id, 
      { isActive: !bucket.isActive },
      tenantId
    );
  }
  
  // CSV Upload methods
  async getCsvUploads(tenantId: string): Promise<CsvUpload[]> {
    return Array.from(this.csvUploads.values()).filter(
      (upload) => upload.tenantId === tenantId
    );
  }

  async getCsvUpload(id: number, tenantId: string): Promise<CsvUpload | undefined> {
    const upload = this.csvUploads.get(id);
    if (upload && upload.tenantId === tenantId) {
      return upload;
    }
    return undefined;
  }

  async createCsvUpload(insertUpload: InsertCsvUpload): Promise<CsvUpload> {
    const id = this.currentCsvUploadId++;
    const now = new Date();
    const upload: CsvUpload = {
      ...insertUpload,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.csvUploads.set(id, upload);
    return upload;
  }

  async updateCsvUploadStatus(id: number, status: string, data: Partial<CsvUpload>, tenantId: string): Promise<CsvUpload> {
    const upload = await this.getCsvUpload(id, tenantId);
    if (!upload) {
      throw new Error(`CSV upload not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedUpload: CsvUpload = {
      ...upload,
      ...data,
      status,
      updatedAt: new Date()
    };
    
    this.csvUploads.set(id, updatedUpload);
    return updatedUpload;
  }
  
  // Module methods
  async getModules(tenantId: string): Promise<Module[]> {
    return Array.from(this.modules.values()).filter(
      (module) => module.tenantId === tenantId
    );
  }

  async getModule(id: string, tenantId: string): Promise<Module | undefined> {
    const module = this.modules.get(id);
    if (module && module.tenantId === tenantId) {
      return module;
    }
    return undefined;
  }

  async updateModule(id: string, data: Partial<Module>, tenantId: string): Promise<Module> {
    const module = await this.getModule(id, tenantId);
    if (!module) {
      throw new Error(`Module not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedModule: Module = {
      ...module,
      ...data,
      updatedAt: new Date()
    };
    
    this.modules.set(id, updatedModule);
    return updatedModule;
  }
  
  // Community methods
  async getCommunityPosts(tenantId: string, options: { forumId?: number, limit: number, offset: number }): Promise<CommunityPost[]> {
    let posts = Array.from(this.communityPosts.values()).filter(
      (post) => post.tenantId === tenantId
    );
    
    if (options.forumId) {
      posts = posts.filter(post => post.forumId === options.forumId);
    }
    
    // Apply pagination
    const start = options.offset;
    const end = start + options.limit;
    return posts.slice(start, end);
  }

  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const id = 1; // Simple ID generation - should auto-increment in real implementation
    const now = new Date();
    const newPost: CommunityPost = {
      ...post,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.communityPosts.set(id, newPost);
    return newPost;
  }
  
  // Workflow methods
  async getAllWorkflows(tenantId: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(
      (workflow) => workflow.tenantId === tenantId
    );
  }
  
  async getWorkflow(id: string, tenantId: string): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (workflow && workflow.tenantId === tenantId) {
      return workflow;
    }
    return undefined;
  }
  
  async createWorkflow(data: InsertWorkflow): Promise<Workflow> {
    const now = new Date();
    const workflow: Workflow = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }
  
  async updateWorkflow(id: string, data: Partial<Workflow>, tenantId: string): Promise<Workflow> {
    const workflow = await this.getWorkflow(id, tenantId);
    if (!workflow) {
      throw new Error(`Workflow not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedWorkflow: Workflow = {
      ...workflow,
      ...data,
      updatedAt: new Date()
    };
    
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }
  
  async deleteWorkflow(id: string, tenantId: string): Promise<Workflow> {
    const workflow = await this.getWorkflow(id, tenantId);
    if (!workflow) {
      throw new Error(`Workflow not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    this.workflows.delete(id);
    return workflow;
  }
  
  // Workflow DataSource methods
  async getDataSources(workflowId: string, tenantId: string): Promise<DataSource[]> {
    return Array.from(this.dataSources.values()).filter(
      (source) => source.workflowId === workflowId && source.tenantId === tenantId
    );
  }
  
  async getDataSource(id: string, tenantId: string): Promise<DataSource | undefined> {
    const dataSource = this.dataSources.get(id);
    if (dataSource && dataSource.tenantId === tenantId) {
      return dataSource;
    }
    return undefined;
  }
  
  async createDataSource(data: InsertDataSource): Promise<DataSource> {
    const now = new Date();
    const dataSource: DataSource = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    this.dataSources.set(dataSource.id, dataSource);
    return dataSource;
  }
  
  async updateDataSource(id: string, data: Partial<DataSource>, tenantId: string): Promise<DataSource> {
    const dataSource = await this.getDataSource(id, tenantId);
    if (!dataSource) {
      throw new Error(`Data source not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedDataSource: DataSource = {
      ...dataSource,
      ...data,
      updatedAt: new Date()
    };
    
    this.dataSources.set(id, updatedDataSource);
    return updatedDataSource;
  }
  
  async deleteDataSource(id: string, tenantId: string): Promise<DataSource> {
    const dataSource = await this.getDataSource(id, tenantId);
    if (!dataSource) {
      throw new Error(`Data source not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    this.dataSources.delete(id);
    return dataSource;
  }
  
  // Workflow DataJoin methods
  async getDataJoins(workflowId: string, tenantId: string): Promise<DataJoin[]> {
    return Array.from(this.dataJoins.values()).filter(
      (join) => join.workflowId === workflowId && join.tenantId === tenantId
    );
  }
  
  async getDataJoin(id: string, tenantId: string): Promise<DataJoin | undefined> {
    const dataJoin = this.dataJoins.get(id);
    if (dataJoin && dataJoin.tenantId === tenantId) {
      return dataJoin;
    }
    return undefined;
  }
  
  async createDataJoin(data: InsertDataJoin): Promise<DataJoin> {
    const now = new Date();
    const dataJoin: DataJoin = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    this.dataJoins.set(dataJoin.id, dataJoin);
    return dataJoin;
  }
  
  async updateDataJoin(id: string, data: Partial<DataJoin>, tenantId: string): Promise<DataJoin> {
    const dataJoin = await this.getDataJoin(id, tenantId);
    if (!dataJoin) {
      throw new Error(`Data join not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedDataJoin: DataJoin = {
      ...dataJoin,
      ...data,
      updatedAt: new Date()
    };
    
    this.dataJoins.set(id, updatedDataJoin);
    return updatedDataJoin;
  }
  
  async deleteDataJoin(id: string, tenantId: string): Promise<DataJoin> {
    const dataJoin = await this.getDataJoin(id, tenantId);
    if (!dataJoin) {
      throw new Error(`Data join not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    this.dataJoins.delete(id);
    return dataJoin;
  }
  
  // Workflow Transformation methods
  async getDataTransformations(workflowId: string, tenantId: string): Promise<DataTransformation[]> {
    return Array.from(this.dataTransformations.values()).filter(
      (transformation) => transformation.workflowId === workflowId && transformation.tenantId === tenantId
    );
  }
  
  async getDataTransformation(id: string, tenantId: string): Promise<DataTransformation | undefined> {
    const dataTransformation = this.dataTransformations.get(id);
    if (dataTransformation && dataTransformation.tenantId === tenantId) {
      return dataTransformation;
    }
    return undefined;
  }
  
  async createDataTransformation(data: InsertDataTransformation): Promise<DataTransformation> {
    const now = new Date();
    const dataTransformation: DataTransformation = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    this.dataTransformations.set(dataTransformation.id, dataTransformation);
    return dataTransformation;
  }
  
  async updateDataTransformation(id: string, data: Partial<DataTransformation>, tenantId: string): Promise<DataTransformation> {
    const dataTransformation = await this.getDataTransformation(id, tenantId);
    if (!dataTransformation) {
      throw new Error(`Data transformation not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedDataTransformation: DataTransformation = {
      ...dataTransformation,
      ...data,
      updatedAt: new Date()
    };
    
    this.dataTransformations.set(id, updatedDataTransformation);
    return updatedDataTransformation;
  }
  
  async deleteDataTransformation(id: string, tenantId: string): Promise<DataTransformation> {
    const dataTransformation = await this.getDataTransformation(id, tenantId);
    if (!dataTransformation) {
      throw new Error(`Data transformation not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    this.dataTransformations.delete(id);
    return dataTransformation;
  }
  
  // Workflow Rule Condition methods
  async getRuleConditions(workflowId: string, tenantId: string): Promise<RuleCondition[]> {
    return Array.from(this.ruleConditions.values()).filter(
      (condition) => condition.workflowId === workflowId && condition.tenantId === tenantId
    );
  }
  
  async getRuleCondition(id: string, tenantId: string): Promise<RuleCondition | undefined> {
    const ruleCondition = this.ruleConditions.get(id);
    if (ruleCondition && ruleCondition.tenantId === tenantId) {
      return ruleCondition;
    }
    return undefined;
  }
  
  async createRuleCondition(data: InsertRuleCondition): Promise<RuleCondition> {
    const now = new Date();
    const ruleCondition: RuleCondition = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    this.ruleConditions.set(ruleCondition.id, ruleCondition);
    return ruleCondition;
  }
  
  async updateRuleCondition(id: string, data: Partial<RuleCondition>, tenantId: string): Promise<RuleCondition> {
    const ruleCondition = await this.getRuleCondition(id, tenantId);
    if (!ruleCondition) {
      throw new Error(`Rule condition not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedRuleCondition: RuleCondition = {
      ...ruleCondition,
      ...data,
      updatedAt: new Date()
    };
    
    this.ruleConditions.set(id, updatedRuleCondition);
    return updatedRuleCondition;
  }
  
  async deleteRuleCondition(id: string, tenantId: string): Promise<RuleCondition> {
    const ruleCondition = await this.getRuleCondition(id, tenantId);
    if (!ruleCondition) {
      throw new Error(`Rule condition not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    this.ruleConditions.delete(id);
    return ruleCondition;
  }
  
  // Workflow Action methods
  async getActions(workflowId: string, tenantId: string): Promise<Action[]> {
    return Array.from(this.actions.values()).filter(
      (action) => action.workflowId === workflowId && action.tenantId === tenantId
    );
  }
  
  async getAction(id: string, tenantId: string): Promise<Action | undefined> {
    const action = this.actions.get(id);
    if (action && action.tenantId === tenantId) {
      return action;
    }
    return undefined;
  }
  
  async createAction(data: InsertAction): Promise<Action> {
    const now = new Date();
    const action: Action = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    this.actions.set(action.id, action);
    return action;
  }
  
  async updateAction(id: string, data: Partial<Action>, tenantId: string): Promise<Action> {
    const action = await this.getAction(id, tenantId);
    if (!action) {
      throw new Error(`Action not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedAction: Action = {
      ...action,
      ...data,
      updatedAt: new Date()
    };
    
    this.actions.set(id, updatedAction);
    return updatedAction;
  }
  
  async deleteAction(id: string, tenantId: string): Promise<Action> {
    const action = await this.getAction(id, tenantId);
    if (!action) {
      throw new Error(`Action not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    this.actions.delete(id);
    return action;
  }
  
  // Workflow Trigger methods
  async getTriggers(workflowId: string, tenantId: string): Promise<Trigger[]> {
    return Array.from(this.triggers.values()).filter(
      (trigger) => trigger.workflowId === workflowId && trigger.tenantId === tenantId
    );
  }
  
  async getTrigger(id: string, tenantId: string): Promise<Trigger | undefined> {
    const trigger = this.triggers.get(id);
    if (trigger && trigger.tenantId === tenantId) {
      return trigger;
    }
    return undefined;
  }
  
  async createTrigger(data: InsertTrigger): Promise<Trigger> {
    const now = new Date();
    const trigger: Trigger = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    this.triggers.set(trigger.id, trigger);
    return trigger;
  }
  
  async updateTrigger(id: string, data: Partial<Trigger>, tenantId: string): Promise<Trigger> {
    const trigger = await this.getTrigger(id, tenantId);
    if (!trigger) {
      throw new Error(`Trigger not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    const updatedTrigger: Trigger = {
      ...trigger,
      ...data,
      updatedAt: new Date()
    };
    
    this.triggers.set(id, updatedTrigger);
    return updatedTrigger;
  }
  
  async deleteTrigger(id: string, tenantId: string): Promise<Trigger> {
    const trigger = await this.getTrigger(id, tenantId);
    if (!trigger) {
      throw new Error(`Trigger not found with id: ${id} for tenant: ${tenantId}`);
    }
    
    this.triggers.delete(id);
    return trigger;
  }
  
  // Workflow Execution Log methods
  async getExecutionLogs(workflowId: string, tenantId: string): Promise<ExecutionLog[]> {
    return Array.from(this.executionLogs.values()).filter(
      (log) => log.workflowId === workflowId && log.tenantId === tenantId
    );
  }
  
  async getExecutionLog(id: string, tenantId: string): Promise<ExecutionLog | undefined> {
    const executionLog = this.executionLogs.get(id);
    if (executionLog && executionLog.tenantId === tenantId) {
      return executionLog;
    }
    return undefined;
  }
  
  async createExecutionLog(data: InsertExecutionLog): Promise<ExecutionLog> {
    const now = new Date();
    const executionLog: ExecutionLog = {
      ...data,
      createdAt: now
    };
    this.executionLogs.set(executionLog.id, executionLog);
    return executionLog;
  }
}

// Currently using the DatabaseStorage
export const storage = new DatabaseStorage();