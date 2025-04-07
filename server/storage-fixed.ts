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
  savedReportFilters, SavedReportFilter, InsertSavedReportFilter
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
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
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: (db as any).config.pool,
      tableName: "sessions",
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
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
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
    const [tenant] = await db
      .insert(tenants)
      .values(insertTenant)
      .returning();
    return tenant;
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const [tenant] = await db
      .update(tenants)
      .set(data)
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  // Account methods
  async getAccounts(tenantId: string): Promise<Account[]> {
    return db
      .select()
      .from(accounts)
      .where(eq(accounts.tenantId, tenantId));
  }

  async getAccount(id: number, tenantId: string): Promise<Account | undefined> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.tenantId, tenantId)));
    return account;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values(insertAccount)
      .returning();
    return account;
  }

  async updateAccount(id: number, data: Partial<Account>, tenantId: string): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set(data)
      .where(and(eq(accounts.id, id), eq(accounts.tenantId, tenantId)))
      .returning();
    return account;
  }

  async calculateAccountHealthScore(id: number, tenantId: string): Promise<number> {
    // Simplified score calculation - should be replaced with actual business logic
    return 85;
  }

  // Contact methods
  async getContacts(tenantId: string): Promise<Contact[]> {
    return db
      .select()
      .from(contacts)
      .where(eq(contacts.tenantId, tenantId));
  }

  async getContactsByAccount(accountId: number, tenantId: string): Promise<Contact[]> {
    return db
      .select()
      .from(contacts)
      .where(and(eq(contacts.accountId, accountId), eq(contacts.tenantId, tenantId)));
  }

  async getContact(id: number, tenantId: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
    return contact;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async updateContact(id: number, data: Partial<Contact>, tenantId: string): Promise<Contact> {
    const [contact] = await db
      .update(contacts)
      .set(data)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
      .returning();
    return contact;
  }

  // Deal methods
  async getDeals(tenantId: string): Promise<Deal[]> {
    return db
      .select()
      .from(deals)
      .where(eq(deals.tenantId, tenantId));
  }

  async getDealsByAccount(accountId: number, tenantId: string): Promise<Deal[]> {
    return db
      .select()
      .from(deals)
      .where(and(eq(deals.accountId, accountId), eq(deals.tenantId, tenantId)));
  }

  async getDeal(id: number, tenantId: string): Promise<Deal | undefined> {
    const [deal] = await db
      .select()
      .from(deals)
      .where(and(eq(deals.id, id), eq(deals.tenantId, tenantId)));
    return deal;
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const [deal] = await db
      .insert(deals)
      .values({
        ...insertDeal,
        winProbability: 50, // Default value
        healthScore: 75, // Default value
      })
      .returning();
    return deal;
  }

  async updateDeal(id: number, data: Partial<Deal>, tenantId: string): Promise<Deal> {
    const [deal] = await db
      .update(deals)
      .set(data)
      .where(and(eq(deals.id, id), eq(deals.tenantId, tenantId)))
      .returning();
    return deal;
  }

  async calculateDealWinProbability(id: number, tenantId: string): Promise<number> {
    // Should be replaced with ML-based prediction
    return 65;
  }

  // Projects methods
  async getProjects(tenantId: string): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(eq(projects.tenantId, tenantId));
  }

  async getProjectsByAccount(accountId: number, tenantId: string): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(and(eq(projects.accountId, accountId), eq(projects.tenantId, tenantId)));
  }

  async getProject(id: number, tenantId: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({
        ...insertProject,
        healthScore: 80, // Default value
      })
      .returning();
    return project;
  }

  async updateProject(id: number, data: Partial<Project>, tenantId: string): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set(data)
      .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)))
      .returning();
    return project;
  }

  async calculateProjectHealthScore(id: number, tenantId: string): Promise<number> {
    // Simplified score calculation
    return 75;
  }

  // Support Ticket methods
  async getSupportTickets(tenantId: string): Promise<SupportTicket[]> {
    return db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.tenantId, tenantId));
  }

  async getSupportTicketsByAccount(accountId: number, tenantId: string): Promise<SupportTicket[]> {
    return db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.accountId, accountId), eq(supportTickets.tenantId, tenantId)));
  }

  async getSupportTicket(id: number, tenantId: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, id), eq(supportTickets.tenantId, tenantId)));
    return ticket;
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db
      .insert(supportTickets)
      .values(insertTicket)
      .returning();
    return ticket;
  }

  async updateSupportTicket(id: number, data: Partial<SupportTicket>, tenantId: string): Promise<SupportTicket> {
    const [ticket] = await db
      .update(supportTickets)
      .set(data)
      .where(and(eq(supportTickets.id, id), eq(supportTickets.tenantId, tenantId)))
      .returning();
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
    const [activity] = await db
      .insert(ticketActivities)
      .values(insertActivity)
      .returning();
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
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.tenantId, tenantId)));
    return template;
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await db
      .insert(emailTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateEmailTemplate(id: number, data: Partial<EmailTemplate>, tenantId: string): Promise<EmailTemplate> {
    const [template] = await db
      .update(emailTemplates)
      .set(data)
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.tenantId, tenantId)))
      .returning();
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
      .where(and(eq(digitalJourneys.id, id), eq(digitalJourneys.tenantId, tenantId)));
    return journey;
  }

  async createDigitalJourney(insertJourney: InsertDigitalJourney): Promise<DigitalJourney> {
    const [journey] = await db
      .insert(digitalJourneys)
      .values(insertJourney)
      .returning();
    return journey;
  }

  async updateDigitalJourney(id: number, data: Partial<DigitalJourney>, tenantId: string): Promise<DigitalJourney> {
    const [journey] = await db
      .update(digitalJourneys)
      .set(data)
      .where(and(eq(digitalJourneys.id, id), eq(digitalJourneys.tenantId, tenantId)))
      .returning();
    return journey;
  }

  // Account Tasks methods
  async getAccountTasks(tenantId: string): Promise<AccountTask[]> {
    return db
      .select()
      .from(accountTasks)
      .where(eq(accountTasks.tenantId, tenantId));
  }

  async getAccountTasksByAccount(accountId: number, tenantId: string): Promise<AccountTask[]> {
    return db
      .select()
      .from(accountTasks)
      .where(and(eq(accountTasks.accountId, accountId), eq(accountTasks.tenantId, tenantId)));
  }

  async getAccountTask(id: number, tenantId: string): Promise<AccountTask | undefined> {
    const [task] = await db
      .select()
      .from(accountTasks)
      .where(and(eq(accountTasks.id, id), eq(accountTasks.tenantId, tenantId)));
    return task;
  }

  async createAccountTask(insertTask: InsertAccountTask): Promise<AccountTask> {
    const [task] = await db
      .insert(accountTasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async createAccountTasks(tasks: InsertAccountTask[]): Promise<AccountTask[]> {
    return db
      .insert(accountTasks)
      .values(tasks)
      .returning();
  }

  async updateAccountTask(id: number, data: Partial<AccountTask>, tenantId: string): Promise<AccountTask> {
    const [updatedTask] = await db
      .update(accountTasks)
      .set(data)
      .where(and(eq(accountTasks.id, id), eq(accountTasks.tenantId, tenantId)))
      .returning();
    return updatedTask;
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
}

// Replace this with the DatabaseStorage if you have a real database
export const storage = new DatabaseStorage();