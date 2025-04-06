import { z } from 'zod';

// Contact Form Schemas
export const insertContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  jobTitle: z.string().optional().or(z.literal('')),
  accountId: z.number().optional(),
  accountName: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

// Deal Form Schemas
export const insertDealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  amount: z.coerce.number().min(0).optional(),
  stage: z.string().min(1, 'Stage is required'),
  accountId: z.number().optional(),
  accountName: z.string().optional().or(z.literal('')),
  closeDate: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

// Project Form Schemas
export const insertProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  status: z.string().min(1, 'Status is required'),
  accountId: z.number().optional(),
  accountName: z.string().optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

// Support Ticket Form Schemas
export const insertSupportTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  accountId: z.number().optional(),
  accountName: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});