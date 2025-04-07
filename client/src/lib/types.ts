// Types definitions matching schema.ts on the backend

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  tenantId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  companyName: string;
  planType: string;
  isActive: boolean;
  domainName: string;
  adminEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: number;
  name: string;
  industry?: string;
  employeeCount?: number;
  website?: string;
  parentAccountId?: number;
  parentAccountName?: string; // Not in DB schema, but useful for UI
  healthScore?: number;
  tenantId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  accountId?: number;
  accountName?: string; // Not in DB schema, but useful for UI
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: number;
  name: string;
  accountId?: number;
  accountName?: string; // Not in DB schema, but useful for UI
  value?: number;
  stage: string;
  closeDate?: Date;
  winProbability?: number;
  healthScore?: number;
  type?: string;
  description?: string;
  nextSteps?: string;
  dealOwnerId?: number;
  dealOwnerName?: string; // Not in DB schema, but useful for UI
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  accountId?: number;
  accountName?: string; // Not in DB schema, but useful for UI
  startDate?: Date;
  endDate?: Date;
  status: string;
  healthScore?: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  source: string;
  accountId?: number;
  accountName?: string; // Not in DB schema, but useful for UI
  contactName?: string; // Not in DB schema, but useful for UI
  assignedToUserId?: number;
  assignedToUserName?: string; // Not in DB schema, but useful for UI
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketActivity {
  id: number;
  ticketId: number;
  userId: number;
  userName?: string; // Not in DB schema, but useful for UI
  action: string;
  content?: string;
  createdAt: Date;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JourneyStep {
  type: 'email' | 'task' | 'meeting' | 'wait';
  name: string;
  description?: string;
  delay?: number; // Time in days after previous step
  emailTemplateId?: number;
  emailTemplateName?: string;
  taskType?: string;
  taskAssignee?: string;
}

export interface DigitalJourney {
  id: number;
  name: string;
  description?: string;
  status: string;
  steps: JourneyStep[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthScoreMetrics {
  accountHealthScores: {
    accountName: string;
    score: number;
  }[];
  dealHealthScores: {
    dealName: string;
    accountName: string;
    score: number;
  }[];
  projectHealthScores: {
    projectName: string;
    accountName: string;
    score: number;
  }[];
  accountsAtRisk: {
    accountName: string;
    score: number;
  }[];
  dealWinProbabilities: {
    dealName: string;
    accountName: string;
    probability: number;
  }[];
}

// AI Account Management Types
export interface AccountAIInsight {
  accountId: number;
  accountName: string;
  summary: string;
  lastGeneratedAt: Date;
}

export interface AccountNextSteps {
  accountId: number;
  accountName: string;
  recommendations: string;
  lastGeneratedAt: Date;
}

export interface TaskPlaybookItem {
  title: string;
  description: string;
  timeline: 'immediate' | 'short-term' | 'long-term';
  effort: 'low' | 'medium' | 'high';
  outcome: string;
  owner: string;
  isCheckpoint: boolean;
  isCompleted?: boolean;
}

export interface TaskPlaybook {
  accountId: number;
  accountName: string;
  tasks: TaskPlaybookItem[];
  lastGeneratedAt: Date;
}

// Predictive Analytics Types
export interface DealPrediction {
  dealId: number;
  dealName: string;
  currentWinProbability: number;
  predictedWinProbability: number;
  confidence: number;
  factors: string[];
  suggestedActions: string[];
}

export interface RevenueForecast {
  next30Days: { amount: number; confidence: number };
  next60Days: { amount: number; confidence: number };
  next90Days: { amount: number; confidence: number };
}

export interface GrowthOpportunity {
  title: string;
  description: string;
  potentialValue: number;
  probability: number;
  timeframe: string;
}

export interface GrowthPotential {
  score: number;
  opportunities: GrowthOpportunity[];
}

export interface AccountRisk {
  score: number;
  factors: string[];
  mitigations: string[];
}

export interface ProjectRisk {
  projectId: number;
  projectName: string;
  riskScore: number;
  factors: string[];
  mitigations: string[];
}

export interface RiskAssessment {
  accountRisk: AccountRisk;
  projectRisks: ProjectRisk[];
}

export interface RelationshipHealth {
  currentScore: number;
  projectedScore: number;
  factors: string[];
  recommendations: string[];
}

export interface PredictiveAnalytics {
  accountId: number;
  accountName: string;
  dealPredictions: DealPrediction[];
  revenueForecast: RevenueForecast;
  growthPotential: GrowthPotential;
  riskAssessment: RiskAssessment;
  relationshipHealth: RelationshipHealth;
  lastGeneratedAt: Date;
}

export interface AccountAIData {
  insight?: AccountAIInsight;
  nextSteps?: AccountNextSteps;
  playbook?: TaskPlaybook;
  predictions?: PredictiveAnalytics;
}
