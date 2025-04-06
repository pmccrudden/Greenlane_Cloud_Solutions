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
  accountTasks, AccountTask, InsertAccountTask
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

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
}

export class DatabaseStorage implements IStorage {
  // User methods, Contact methods, Deal methods, etc. (unchanged)
  // ... [existing DatabaseStorage implementation] ...
  
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
  }

  // User methods, Contact methods, Deal methods, etc. (unchanged)
  // ... [existing MemStorage implementation] ...

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
}

// Currently using the DatabaseStorage
export const storage = new DatabaseStorage();