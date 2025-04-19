import { z } from "zod";
import { nanoid } from "nanoid";
import { integer, pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Dataset Source Types
export const dataSourceTypes = ["crm_object", "community_data", "external_api"] as const;
export type DataSourceType = typeof dataSourceTypes[number];

// Join Types
export const joinTypes = ["inner", "left", "right"] as const;
export type JoinType = typeof joinTypes[number];

// Action Types
export const actionTypes = [
  "load_to_object",
  "load_to_relationship",
  "load_to_company",
  "load_to_usage_data",
  "load_to_cta",
  "load_to_timeline",
  "load_to_people",
  "load_to_feature",
  "load_to_surveys",
  "load_to_assets",
  "load_to_success_plan",
  "load_to_sfdc_object",
  "load_to_mda_object",
  "send_email",
  "set_score",
  "set_score_advanced",
  "call_external_api",
  "create_zendesk_ticket",
  "load_to_journey_orchestrator",
  "load_to_program",
  "load_to_gainsight_task"
] as const;
export type ActionType = typeof actionTypes[number];

// Trigger Types
export const triggerTypes = ["schedule", "event"] as const;
export type TriggerType = typeof triggerTypes[number];

// Schedule Frequencies
export const scheduleFrequencies = ["hourly", "daily", "weekly", "monthly", "custom"] as const;
export type ScheduleFrequency = typeof scheduleFrequencies[number];

// Event Types
export const eventTypes = [
  "new_community_post", 
  "deal_status_change", 
  "health_score_change", 
  "task_completed",
  "support_ticket_opened",
  "support_ticket_closed"
] as const;
export type EventType = typeof eventTypes[number];

// CRM Object Types
export const crmObjectTypes = [
  "account", 
  "contact", 
  "deal", 
  "project", 
  "task", 
  "support_ticket", 
  "email_template",
  "digital_journey"
] as const;
export type CrmObjectType = typeof crmObjectTypes[number];

// Community Data Types
export const communityDataTypes = [
  "post",
  "user_engagement",
  "group_activity"
] as const;
export type CommunityDataType = typeof communityDataTypes[number];

// Condition Operators
export const conditionOperators = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "greater_than",
  "less_than",
  "greater_than_equals",
  "less_than_equals",
  "is_empty",
  "is_not_empty",
  "starts_with",
  "ends_with"
] as const;
export type ConditionOperator = typeof conditionOperators[number];

// Logical Operators
export const logicalOperators = ["and", "or"] as const;
export type LogicalOperator = typeof logicalOperators[number];

// Transformation Types
export const transformationTypes = [
  "sum",
  "avg",
  "count",
  "min",
  "max",
  "string_concat",
  "string_replace",
  "date_format",
  "days_since",
  "months_since",
  "years_since",
  "calculation"
] as const;
export type TransformationType = typeof transformationTypes[number];

// Execution Status Types
export const executionStatusTypes = ["success", "partial_success", "failed", "running"] as const;
export type ExecutionStatusType = typeof executionStatusTypes[number];

// Schema Definitions

// Data Source
export const dataSource = pgTable("workflow_data_sources", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  workflowId: text("workflow_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  type: text("type").notNull(),
  objectType: text("object_type"),
  apiEndpoint: text("api_endpoint"),
  conditions: jsonb("conditions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DataSource = typeof dataSource.$inferSelect;
export type InsertDataSource = typeof dataSource.$inferInsert;
export const insertDataSourceSchema = createInsertSchema(dataSource);

// Data Join
export const dataJoin = pgTable("workflow_data_joins", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  workflowId: text("workflow_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  leftSourceId: text("left_source_id").notNull(),
  rightSourceId: text("right_source_id").notNull(),
  joinType: text("join_type").notNull(),
  leftField: text("left_field").notNull(),
  rightField: text("right_field").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DataJoin = typeof dataJoin.$inferSelect;
export type InsertDataJoin = typeof dataJoin.$inferInsert;
export const insertDataJoinSchema = createInsertSchema(dataJoin);

// Data Transformation
export const dataTransformation = pgTable("workflow_data_transformations", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  workflowId: text("workflow_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  type: text("type").notNull(),
  sourceField: text("source_field").notNull(),
  targetField: text("target_field").notNull(),
  parameters: jsonb("parameters"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DataTransformation = typeof dataTransformation.$inferSelect;
export type InsertDataTransformation = typeof dataTransformation.$inferInsert;
export const insertDataTransformationSchema = createInsertSchema(dataTransformation);

// Rule Condition
export const ruleCondition = pgTable("workflow_rule_conditions", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  workflowId: text("workflow_id").notNull(),
  tenantId: text("tenant_id").notNull(), 
  field: text("field").notNull(),
  operator: text("operator").notNull(),
  value: text("value"),
  logicalOperator: text("logical_operator"),
  groupId: text("group_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type RuleCondition = typeof ruleCondition.$inferSelect;
export type InsertRuleCondition = typeof ruleCondition.$inferInsert;
export const insertRuleConditionSchema = createInsertSchema(ruleCondition);

// Action
export const action = pgTable("workflow_actions", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  workflowId: text("workflow_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  type: text("type").notNull(),
  config: jsonb("config").notNull(),
  conditions: jsonb("conditions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Action = typeof action.$inferSelect;
export type InsertAction = typeof action.$inferInsert;
export const insertActionSchema = createInsertSchema(action);

// Trigger
export const trigger = pgTable("workflow_triggers", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  workflowId: text("workflow_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  type: text("type").notNull(),
  scheduleFrequency: text("schedule_frequency"),
  scheduleTime: text("schedule_time"),
  scheduleDay: integer("schedule_day"),
  eventType: text("event_type"),
  eventFilter: jsonb("event_filter"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Trigger = typeof trigger.$inferSelect;
export type InsertTrigger = typeof trigger.$inferInsert;
export const insertTriggerSchema = createInsertSchema(trigger);

// Workflow
export const workflow = pgTable("workflows", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("inactive"),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdById: text("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Workflow = typeof workflow.$inferSelect;
export type InsertWorkflow = typeof workflow.$inferInsert;
export const insertWorkflowSchema = createInsertSchema(workflow);

// Execution Log
export const executionLog = pgTable("workflow_execution_logs", {
  id: text("id").primaryKey().notNull().$defaultFn(() => nanoid()),
  workflowId: text("workflow_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  status: text("status").notNull(),
  recordsProcessed: integer("records_processed"),
  recordsAffected: integer("records_affected"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  details: jsonb("details"),
});

export type ExecutionLog = typeof executionLog.$inferSelect;
export type InsertExecutionLog = typeof executionLog.$inferInsert;
export const insertExecutionLogSchema = createInsertSchema(executionLog);

// Zod validators for frontend forms
export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.string().default("inactive"),
});

export const dataSourceSchema = z.object({
  type: z.enum(dataSourceTypes),
  objectType: z.string().optional(),
  apiEndpoint: z.string().optional(),
  conditions: z.any().optional(),
});

export const dataJoinSchema = z.object({
  leftSourceId: z.string(),
  rightSourceId: z.string(),
  joinType: z.enum(joinTypes),
  leftField: z.string(),
  rightField: z.string(),
});

export const dataTransformationSchema = z.object({
  type: z.enum(transformationTypes),
  sourceField: z.string(),
  targetField: z.string(),
  parameters: z.any().optional(),
});

export const ruleConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(conditionOperators),
  value: z.string().optional(),
  logicalOperator: z.enum(logicalOperators).optional(),
  groupId: z.string().optional(),
});

export const actionSchema = z.object({
  type: z.enum(actionTypes),
  config: z.any(),
  conditions: z.any().optional(),
});

export const triggerSchema = z.object({
  type: z.enum(triggerTypes),
  scheduleFrequency: z.enum(scheduleFrequencies).optional(),
  scheduleTime: z.string().optional(),
  scheduleDay: z.number().optional(),
  eventType: z.enum(eventTypes).optional(),
  eventFilter: z.any().optional(),
});