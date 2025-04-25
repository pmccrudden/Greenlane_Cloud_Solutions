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
  
  // Clear tenant data if on app subdomain
  useEffect(() => {
    // For app subdomain, we always want to show the tenant field
    if (isAppSubdomain) {
      console.log("App subdomain detected, clearing tenant data and showing tenant field");
      sessionStorage.removeItem('current_tenant');
      setShowTenantField(true);
    } else {
      // If not on app subdomain, show field if not a tenant
      setShowTenantField(!isTenant);
    }
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
      // If not on tenant page and tenant name is provided, redirect to tenant URL
      if (!isTenant && values.tenant) {
        const tenantName = values.tenant.trim().toLowerCase();
        console.log('Tenant name entered:', tenantName);
        
        if (tenantName) {
          console.log('Redirecting to tenant URL...');
          
          // Save credentials to sessionStorage for seamless login
          if (values.username && values.password) {
            console.log('Storing credentials in sessionStorage for seamless login');
            sessionStorage.setItem('pending_username', values.username);
            sessionStorage.setItem('pending_password', values.password);
          }
          
          // For local development or Replit preview environment
          if (window.location.hostname.includes('localhost') || 
              window.location.hostname.includes('127.0.0.1') ||
              window.location.hostname.includes('replit.dev') ||
              window.location.hostname.includes('repl.co')) {
            
            // Store the tenant in sessionStorage
            console.log('Storing tenant in sessionStorage:', tenantName);
            sessionStorage.setItem('current_tenant', tenantName);
            
            // Refresh the page to trigger tenant detection from sessionStorage
            console.log('Refreshing page to use tenant from sessionStorage');
            window.location.reload();
          } else {
            // Redirect to tenant subdomain in production
            const redirectUrl = `https://${tenantName}.greenlanecloudsolutions.com/signin`;
            console.log('Production redirect to:', redirectUrl);
            window.location.href = redirectUrl;
          }
          return;
        }
      }
      
      // Regular login if already on tenant URL or no tenant specified
      await signIn(values.username, values.password);
      
      toast({
        title: "Sign in successful",
        description: "You've been successfully signed in",
      });
      
      console.log("Login successful, redirecting...");
      
      if (onSuccess) {
        console.log("Using onSuccess callback");
        onSuccess();
      } else {
        console.log("No onSuccess callback, redirecting to dashboard");
        // Force a hard redirect to make sure we reload the page
        window.location.href = '/dashboard';
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
