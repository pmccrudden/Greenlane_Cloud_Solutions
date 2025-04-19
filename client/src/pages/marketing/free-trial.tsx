import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';

// Create the Stripe Promise
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Define form schema using Zod
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof formSchema>;

export default function FreeTrialSignup() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<null | { id: string; name: string; price: number }>(null);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Mock plans data - in production, you'd fetch this from /api/marketing/plans
  const plans = [
    {
      id: 'price_1XcvQZHG7oVTzT5Y8p4LZnWQ', // This would be a real Stripe price ID
      name: 'Basic',
      description: 'Up to 5 users',
      price: 50,
      features: ['Contact Management', 'Deal Tracking', '5 Users'],
    },
    {
      id: 'price_1XcvQzHG7oVTzT5Y8p4LZnWQ', // This would be a real Stripe price ID
      name: 'Team',
      description: 'Up to 20 users',
      price: 100,
      features: ['Contact Management', 'Deal Tracking', 'Project Management', '20 Users'],
      isPopular: true,
    },
    {
      id: 'price_1XcvR8HG7oVTzT5Y8p4LZnWQ', // This would be a real Stripe price ID
      name: 'Enterprise',
      description: 'Unlimited users',
      price: 200,
      features: ['All Features', 'Priority Support', 'Unlimited Users'],
    },
  ];
  
  const handleSubmit = async (data: FormValues) => {
    if (!selectedPlan) {
      toast({
        title: "Please select a plan",
        description: "You need to select a plan to continue with your free trial.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreatingAccount(true);
      
      // In a real implementation, you would create the customer and start the free trial
      // Wait for 2 seconds to simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      /**
       * In a real implementation, the flow would be:
       * 1. Call /api/marketing/create-customer to create a Stripe customer
       * 2. Call /api/marketing/create-free-trial with customer ID and plan ID to create a Stripe checkout session
       * 3. Redirect to the Stripe checkout session URL to collect payment details
       *
       * Or, alternatively, use /api/marketing/create-free-trial directly with email and plan ID
       * which creates everything in one step.
       */
      
      // For the demo, we'll just show a success toast
      toast({
        title: "Account created successfully!",
        description: "Your 14-day free trial has started. You'll receive an email with login instructions.",
        variant: "default",
      });
      
      // Simulate redirect to success page
      setIsRedirecting(true);
      setTimeout(() => {
        setLocation('/marketing/trial-success');
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsCreatingAccount(false);
    }
  };
  
  const handleSelectPlan = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-white font-bold text-xl">GreenLane Cloud Solutions</div>
            <Button variant="outline" className="text-white border-white hover:bg-white/20">
              Back to Home
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Start Your 14-Day Free Trial</h1>
              <p className="text-gray-600">Try GreenLane CRM with full features. No credit card required to start.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative ${
                    selectedPlan?.id === plan.id 
                      ? 'border-primary ring-2 ring-primary ring-opacity-50' 
                      : ''
                  } ${plan.isPopular ? 'shadow-lg' : ''}`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
                      Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <div className="h-4 w-4 mr-2 rounded-full bg-green-500"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleSelectPlan(plan)} 
                      variant={selectedPlan?.id === plan.id ? "default" : "outline"} 
                      className="w-full"
                    >
                      {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>Please fill in your information to start your free trial</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
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
                              <Input placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
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
                            This will be used to set up your company portal.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isCreatingAccount || isRedirecting}
                      >
                        {isCreatingAccount || isRedirecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isCreatingAccount ? 'Creating Account...' : 'Redirecting...'}
                          </>
                        ) : (
                          'Start Your Free Trial'
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-center text-sm text-gray-500 mt-4">
                      By creating an account, you agree to our 
                      <a href="#" className="text-primary hover:underline"> Terms of Service </a> 
                      and 
                      <a href="#" className="text-primary hover:underline"> Privacy Policy</a>.
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">What happens after the trial?</h3>
              <p className="text-gray-600 mb-4">
                After your 14-day free trial, your selected plan will automatically begin. 
                You can cancel anytime during the trial period to avoid being charged.
              </p>
              <div className="flex items-center text-gray-500 text-sm">
                <div className="h-5 w-5 text-primary mr-2">✓</div>
                <span>Cancel anytime during the trial</span>
              </div>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <div className="h-5 w-5 text-primary mr-2">✓</div>
                <span>No commitment, no contracts</span>
              </div>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <div className="h-5 w-5 text-primary mr-2">✓</div>
                <span>Full access to all features during trial</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p>&copy; {new Date().getFullYear()} GreenLane Cloud Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}