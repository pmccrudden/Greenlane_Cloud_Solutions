import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getTenantFromUrl, getCurrentTenant, setCurrentTenant, clearTenant } from '@/lib/tenant-auth-fix';

// Form validation schema
const formSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenant: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

export function SignInForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTenantField, setShowTenantField] = useState(false);
  
  // Debug
  console.log('SignInForm debug:', { showTenantField });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      tenant: ''
    }
  });

  // Check if we're on a tenant subdomain
  useEffect(() => {
    const tenant = getCurrentTenant() || getTenantFromUrl();
    
    // If we have a tenant, update the form
    if (tenant) {
      form.setValue('tenant', tenant);
      setShowTenantField(false);
    } else {
      // No tenant detected, show the field
      setShowTenantField(true);
    }
  }, [form]);

  async function onSubmit(data: FormData) {
    try {
      setIsSubmitting(true);
      
      // Get tenant from subdomain or form
      const tenantId = getTenantFromUrl() || data.tenant;
      
      if (tenantId) {
        console.log('Processing login with tenant:', tenantId);
        
        // In case user specified a tenant in the form but we're already on a tenant subdomain
        if (getTenantFromUrl() === tenantId) {
          console.log('Performing regular login on current tenant');
        } else {
          // Save tenant to session and redirect to tenant subdomain
          setCurrentTenant(tenantId);
          console.log('Signing in with tenant:', tenantId);
        }
        
        // Ensure tenant is included in the request
        data.tenant = tenantId;
      }
      
      console.log('Making POST request to /api/auth/login with tenant ID:', data.tenant);
        
      // Make the API request
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.log('Non-JSON response received:', responseText);
        throw new Error('Received HTML instead of JSON. The server might be returning an error page.');
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Invalid credentials');
      }
      
      // Login successful
      toast({
        title: 'Login successful',
        description: 'Redirecting to dashboard...',
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        setLocation('/');
      }, 500);
      
    } catch (error: any) {
      console.log('Login error:', error);
      
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid response from server. Please try again.',
        variant: 'destructive',
      });
      
      // Clear tenant on error to show the tenant field again
      clearTenant();
      
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {showTenantField && (
          <FormField
            control={form.control}
            name="tenant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant ID</FormLabel>
                <FormControl>
                  <Input placeholder="Company or tenant ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </Form>
  );
}