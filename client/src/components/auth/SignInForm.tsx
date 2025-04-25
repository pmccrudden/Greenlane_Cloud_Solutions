import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { isTenantUrl, getTenantFromUrl } from '@/lib/tenant';
import { redirectAfterAuth } from '@/lib/navigation';
import { initiateMultiTenantLogin, completeSsoLogin, hasPendingSsoSession } from '@/lib/tenant-auth';

// Define form validation schema
const signInSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  tenant: z.string().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSuccess?: () => void;
}

export default function SignInForm({ onSuccess }: SignInFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTenantField, setShowTenantField] = useState(true);
  const { toast } = useToast();
  
  // Get hostname and determine if it's a tenant
  const hostname = window.location.hostname;
  const isTenant = isTenantUrl();
  const tenant = getTenantFromUrl();
  const isAppSubdomain = hostname.startsWith('app.') || hostname.includes('app.');
  
  console.log("SignInForm debug:", {
    isTenant,
    hostname,
    search: window.location.search,
    tenant,
    isAppSubdomain,
    reservedCheck: ['www', 'app', 'api', 'admin', 'auth'].includes(hostname.split('.')[0])
  });
  
  // Clear tenant data if on app subdomain and check for headers
  useEffect(() => {
    // Check page headers for tenant field flag
    const checkHeadersForTenantField = async () => {
      try {
        // Make a request to the current page to check headers
        const response = await fetch(window.location.pathname);
        const showTenantHeader = response.headers.get('X-Show-Tenant-Field');
        
        if (showTenantHeader === 'true') {
          console.log("X-Show-Tenant-Field header detected, showing tenant field");
          sessionStorage.removeItem('current_tenant');
          setShowTenantField(true);
          return;
        }
      } catch (err) {
        console.error("Error checking headers:", err);
      }
      
      // Fall back to hostname-based check if header check fails
      if (isAppSubdomain) {
        console.log("App subdomain detected, clearing tenant data and showing tenant field");
        sessionStorage.removeItem('current_tenant');
        setShowTenantField(true);
      } else {
        // If not on app subdomain, show field if not a tenant
        setShowTenantField(!isTenant);
      }
    };
    
    // Run the header check
    checkHeadersForTenantField();
  }, [isAppSubdomain, isTenant]);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: '',
      password: '',
      tenant: '',
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Get tenant name from form or current URL
      const tenantName = values.tenant?.trim().toLowerCase() || getTenantFromUrl();
      console.log('Processing login with tenant:', tenantName);
      
      // If using tenant field, initiate multi-tenant SSO login
      if (!isTenant && values.tenant) {
        if (tenantName) {
          console.log('Initiating multi-tenant SSO login with tenant:', tenantName);
          
          // Use our new tenant auth function for SSO login
          await initiateMultiTenantLogin(
            values.username,
            values.password,
            tenantName
          );
          
          // initiateMultiTenantLogin handles the redirect, so we just show toast and return
          toast({
            title: "Redirecting to tenant",
            description: `Signing you in to ${tenantName} tenant`,
          });
          
          return;
        }
      }
      
      // If we're already on a tenant URL, use regular login
      if (isTenant || !values.tenant) {
        console.log('Performing regular login on current tenant');
        
        // Regular login and handle success
        const userData = await signIn(values.username, values.password);
        
        toast({
          title: "Sign in successful",
          description: "You've been successfully signed in",
        });
        
        console.log("Login successful, redirecting...", userData);
        
        // Add a small delay to ensure the toast is shown
        setTimeout(() => {
          if (onSuccess) {
            console.log("Using onSuccess callback");
            onSuccess();
          } else {
            console.log("No onSuccess callback, redirecting to dashboard");
            // Use the navigation utility for proper redirection
            redirectAfterAuth('/dashboard');
          }
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          {isTenant 
            ? "Sign in to access your tenant account" 
            : "Sign in to your GreenLane Cloud Solutions account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {showTenantField && (
              <FormField
                control={form.control}
                name="tenant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your tenant name (e.g., greenlane)" {...field} />
                    </FormControl>
                    <p className="text-sm text-gray-500 mt-1">
                      Enter your company tenant name to sign in to your specific portal
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username or email" {...field} />
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
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>
      </CardContent>
      {/* Footer removed as requested */}
    </Card>
  );
}
