import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertSupportTicketSchema } from '@/lib/validationSchemas';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Extend the schema with additional validation
const formSchema = insertSupportTicketSchema
  .extend({
    accountId: z.coerce.number().optional(),
    // Rename title to subject in the form submission
    subject: z.string().min(1, 'Subject is required'),
    // Add source field (required in schema)
    source: z.string().default('manual'),
  })
  .refine(data => data.accountId !== undefined || data.accountName !== '', {
    message: 'Either Account ID or Account Name must be provided',
    path: ['accountId'],
  });

type SupportTicketFormValues = z.infer<typeof formSchema>;

interface SupportTicketFormProps {
  accountId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SupportTicketForm({ accountId, onSuccess, onCancel }: SupportTicketFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch accounts for dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: ['/api/accounts'],
    enabled: !accountId, // Only fetch accounts if no accountId is provided
  });

  // Create form with default values
  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subject: '',  // Add subject field for backend compatibility
      status: 'new',
      priority: 'medium',
      source: 'manual', // Required field from schema
      accountId: accountId,
      accountName: '',
      description: '',
    },
  });

  // Create support ticket mutation
  const createSupportTicketMutation = useMutation({
    mutationFn: async (data: SupportTicketFormValues) => {
      setIsSubmitting(true);
      const response = await apiRequest('POST', '/api/support-tickets', data);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: [`/api/accounts/${accountId}/support-tickets`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      
      toast({
        title: 'Support ticket created',
        description: 'Support ticket has been created successfully.',
      });
      
      // Reset form
      form.reset();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create support ticket',
        description: error.message || 'An error occurred while creating the support ticket.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  // Form submission handler
  function onSubmit(data: SupportTicketFormValues) {
    createSupportTicketMutation.mutate(data);
  }

  const ticketStatuses = [
    { value: 'new', label: 'New' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'waiting-on-customer', label: 'Waiting on Customer' },
    { value: 'waiting-on-third-party', label: 'Waiting on Third Party' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  const ticketPriorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title*</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Unable to access the dashboard" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    // Also set the subject field to match title for backend compatibility
                    form.setValue('subject', e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ticketStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ticketPriorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!accountId && (
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!accountId && (
          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Or New Account Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter new account name if not in the list" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please describe the issue in detail"
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </Form>
  );
}