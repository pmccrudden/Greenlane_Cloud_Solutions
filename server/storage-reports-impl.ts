import { 
  reportDefinitions, ReportDefinition, InsertReportDefinition,
  dashboardDefinitions, DashboardDefinition, InsertDashboardDefinition,
  dashboardWidgets, DashboardWidget, InsertDashboardWidget,
  userDashboardPreferences, UserDashboardPreference, InsertUserDashboardPreference,
  savedReportFilters, SavedReportFilter, InsertSavedReportFilter
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// These methods need to be added to the DatabaseStorage class in server/storage.ts

// Report Definition methods
async function getReportDefinitions(tenantId: string): Promise<ReportDefinition[]> {
  return db
    .select()
    .from(reportDefinitions)
    .where(eq(reportDefinitions.tenantId, tenantId));
}

async function getReportDefinition(id: number, tenantId: string): Promise<ReportDefinition | undefined> {
  const [report] = await db
    .select()
    .from(reportDefinitions)
    .where(and(eq(reportDefinitions.id, id), eq(reportDefinitions.tenantId, tenantId)));
  return report;
}

async function createReportDefinition(report: InsertReportDefinition): Promise<ReportDefinition> {
  const [newReport] = await db
    .insert(reportDefinitions)
    .values(report)
    .returning();
  return newReport;
}

async function updateReportDefinition(id: number, data: Partial<ReportDefinition>, tenantId: string): Promise<ReportDefinition> {
  const [updatedReport] = await db
    .update(reportDefinitions)
    .set(data)
    .where(and(eq(reportDefinitions.id, id), eq(reportDefinitions.tenantId, tenantId)))
    .returning();
  return updatedReport;
}

// Dashboard Definition methods
async function getDashboardDefinitions(tenantId: string): Promise<DashboardDefinition[]> {
  return db
    .select()
    .from(dashboardDefinitions)
    .where(eq(dashboardDefinitions.tenantId, tenantId));
}

async function getDashboardDefinition(id: number, tenantId: string): Promise<DashboardDefinition | undefined> {
  const [dashboard] = await db
    .select()
    .from(dashboardDefinitions)
    .where(and(eq(dashboardDefinitions.id, id), eq(dashboardDefinitions.tenantId, tenantId)));
  return dashboard;
}

async function createDashboardDefinition(dashboard: InsertDashboardDefinition): Promise<DashboardDefinition> {
  const [newDashboard] = await db
    .insert(dashboardDefinitions)
    .values(dashboard)
    .returning();
  return newDashboard;
}

async function updateDashboardDefinition(id: number, data: Partial<DashboardDefinition>, tenantId: string): Promise<DashboardDefinition> {
  const [updatedDashboard] = await db
    .update(dashboardDefinitions)
    .set(data)
    .where(and(eq(dashboardDefinitions.id, id), eq(dashboardDefinitions.tenantId, tenantId)))
    .returning();
  return updatedDashboard;
}

// Dashboard Widget methods
async function getDashboardWidgets(dashboardId: number): Promise<DashboardWidget[]> {
  return db
    .select()
    .from(dashboardWidgets)
    .where(eq(dashboardWidgets.dashboardId, dashboardId));
}

async function createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
  const [newWidget] = await db
    .insert(dashboardWidgets)
    .values(widget)
    .returning();
  return newWidget;
}

async function updateDashboardWidget(id: number, data: Partial<DashboardWidget>, tenantId: string): Promise<DashboardWidget> {
  const [updatedWidget] = await db
    .update(dashboardWidgets)
    .set(data)
    .where(eq(dashboardWidgets.id, id))
    .returning();
  return updatedWidget;
}

// User Dashboard Preference methods
async function getUserDashboardPreferences(userId: number, tenantId: string): Promise<UserDashboardPreference[]> {
  return db
    .select()
    .from(userDashboardPreferences)
    .where(and(eq(userDashboardPreferences.userId, userId), eq(userDashboardPreferences.tenantId, tenantId)));
}

async function createUserDashboardPreference(preference: InsertUserDashboardPreference): Promise<UserDashboardPreference> {
  const [newPreference] = await db
    .insert(userDashboardPreferences)
    .values(preference)
    .returning();
  return newPreference;
}

// Saved Report Filter methods
async function getSavedReportFilters(userId: number, tenantId: string): Promise<SavedReportFilter[]> {
  return db
    .select()
    .from(savedReportFilters)
    .where(and(eq(savedReportFilters.userId, userId), eq(savedReportFilters.tenantId, tenantId)));
}

async function createSavedReportFilter(filter: InsertSavedReportFilter): Promise<SavedReportFilter> {
  const [newFilter] = await db
    .insert(savedReportFilters)
    .values(filter)
    .returning();
  return newFilter;
}