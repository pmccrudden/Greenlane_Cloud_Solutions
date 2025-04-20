import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { registerWithStripe, confirmStripePayment } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { debounce } from 'lodash';

// Define subdomain validation pattern
const subdomainPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// Define form validation schema
const signUpSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  companyName: z.string().min(1, 'Company name is required'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be less than 63 characters')
    .regex(subdomainPattern, 'Only lowercase letters, numbers, and hyphens are allowed. Cannot start or end with a hyphen.')
    .refine(value => value.trim() !== '', { message: 'Subdomain is required' }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface PlanOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

// Mock plans - would be fetched from an API in a real application
const PLANS: PlanOption[] = [
  {
    id: import.meta.env.VITE_STRIPE_PRICE_ID || 'price_1NdFZ6JhR1nFUQP1F4NKPj7Y',
    name: 'Standard',
    price: 99,
    description: 'Perfect for small businesses'
  },
  {
    id: import.meta.env.VITE_STRIPE_PRICE_ID_PRO || 'price_1NdFZ6JhR1nFUQP1F4NKPj7Y',
    name: 'Professional',
    price: 199,
    description: 'For growing companies'
  },
  {
    id: import.meta.env.VITE_STRIPE_PRICE_ID_ENTERPRISE || 'price_1NdFZ6JhR1nFUQP1F4NKPj7Y',
    name: 'Enterprise',
    price: 399,
    description: 'For large organizations'
  }
];

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

function PaymentForm({ clientSecret, tenantId }: { clientSecret: string, tenantId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?tenant=${tenantId}`,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setPaymentError(result.error.message || 'An error occurred while processing your payment.');
      toast({
        title: "Payment Failed",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      // Payment succeeded
      toast({
        title: "Account Created Successfully!",
        description: `Your account has been created. You'll receive an email with login details shortly.`,
      });
      
      // Redirect to tenant URL
      window.location.href = `https://${tenantId}.greenlanecloudsolutions.com`;
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Information</h3>
        <div className="p-4 border rounded-md">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#32325d',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        {paymentError && (
          <div className="text-red-500 text-sm">{paymentError}</div>
        )}
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Complete Payment"
        )}
      </Button>
    </form>
  );
}

export default function SignUpForm() {
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>(PLANS[0]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState<'details' | 'payment'>('details');
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      subdomain: ''
    },
  });
  
  // Check if subdomain is available
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3 || !subdomainPattern.test(subdomain)) {
      setSubdomainAvailable(null);
      return;
    }
    
    setIsCheckingSubdomain(true);
    try {
      const response = await apiRequest('GET', `/api/check-subdomain?subdomain=${subdomain}`);
      const data = await response.json();
      setSubdomainAvailable(data.available);
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainAvailable(null);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };
  
  // Debounce subdomain check to avoid excessive API calls
  const debouncedCheckSubdomain = debounce(checkSubdomainAvailability, 500);
  
  // Watch for changes to the subdomain field
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'subdomain' && value.subdomain) {
        debouncedCheckSubdomain(value.subdomain as string);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      const result = await registerWithStripe({
        name: values.name,
        email: values.email,
        companyName: values.companyName,
        planId: selectedPlan.id
      });
      
      setClientSecret(result.clientSecret);
      setTenantId(result.tenantId);
      setSignupStep('payment');
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    }
  };

  if (!stripePromise) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Stripe is not configured. Please contact the administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">
          {signupStep === 'details' ? 'Create Your Account' : 'Payment Details'}
        </CardTitle>
        <CardDescription>
          {signupStep === 'details' 
            ? 'Get started with GreenLane Cloud Solutions' 
            : 'Complete your subscription payment'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {signupStep === 'details' ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be used to create your tenant URL: [company].greenlanecloudsolutions.com
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3">
                <FormLabel>Select a Plan</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPlan.id === plan.id 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-slate-200 hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-lg font-bold">${plan.price}/mo</div>
                      <div className="text-sm text-slate-500">{plan.description}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">
                Continue to Payment
              </Button>
            </form>
          </Form>
        ) : (
          // Payment form with Stripe Elements
          clientSecret && tenantId ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm clientSecret={clientSecret} tenantId={tenantId} />
            </Elements>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <a href="/signin" className="text-primary-600 hover:text-primary-800 font-medium">
            Sign in
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
