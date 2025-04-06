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
  digitalJourneys, DigitalJourney, InsertDigitalJourney
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
}

export class DatabaseStorage implements IStorage {
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
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    return account;
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
  
  currentUserId: number;
  currentAccountId: number;
  currentContactId: number;
  currentDealId: number;
  currentProjectId: number;
  currentSupportTicketId: number;
  currentTicketActivityId: number;
  currentEmailTemplateId: number;
  currentDigitalJourneyId: number;

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
    
    this.currentUserId = 1;
    this.currentAccountId = 1;
    this.currentContactId = 1;
    this.currentDealId = 1;
    this.currentProjectId = 1;
    this.currentSupportTicketId = 1;
    this.currentTicketActivityId = 1;
    this.currentEmailTemplateId = 1;
    this.currentDigitalJourneyId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
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
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
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
      (tenant) => tenant.domainName === domain,
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
      healthScore: Math.floor(Math.random() * 100), // Simulate AI-calculated score
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
    const account = await this.getAccount(id, tenantId);
    if (!account) {
      throw new Error(`Account not found with id: ${id} for tenant: ${tenantId}`);
    }
    
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
    const deal: Deal = {
      ...insertDeal,
      id,
      winProbability: Math.floor(Math.random() * 100), // Simulate AI-calculated probability
      healthScore: Math.floor(Math.random() * 100), // Simulate AI-calculated score
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
    const deal = await this.getDeal(id, tenantId);
    if (!deal) {
      throw new Error(`Deal not found with id: ${id} for tenant: ${tenantId}`);
    }
    
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
    const project: Project = {
      ...insertProject,
      id,
      healthScore: Math.floor(Math.random() * 100), // Simulate AI-calculated score
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
    const project = await this.getProject(id, tenantId);
    if (!project) {
      throw new Error(`Project not found with id: ${id} for tenant: ${tenantId}`);
    }
    
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
}

export const storage = new DatabaseStorage();
