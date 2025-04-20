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
import { Loader2, Users, CheckSquare, Minus, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Create the Stripe Promise
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Type definitions for products and pricing
interface PriceOption {
  id: string;
  amount: number;
  currency: string;
  interval: string;
  lookup_key: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  prices: {
    monthly: PriceOption;
    annual: PriceOption;
  };
}

interface ProductsResponse {
  products: {
    coreCrm: Product;
    community: Product;
    marketingHub: Product;
    supportCentre: Product;
  };
  region: string;
  currency: string;
  multiplier: number;
}

// Define form schema using Zod
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  subdomain: z.string()
    .min(3, { message: 'Subdomain must be at least 3 characters' })
    .max(20, { message: 'Subdomain must be less than 20 characters' })
    .regex(/^[a-z0-9-]+$/, { message: 'Subdomain can only contain lowercase letters, numbers, and hyphens' })
    .refine(val => !val.startsWith('-') && !val.endsWith('-'), {
      message: 'Subdomain cannot start or end with a hyphen',
    }),
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
  
  // User configuration state
  const [userCount, setUserCount] = useState<number>(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [region, setRegion] = useState<string>('usa');
  
  // Fetch products and pricing from API
  const { data: productsData, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: [`/api/marketing/products`, region],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/marketing/products?region=${region}`);
      return res.json() as Promise<ProductsResponse>;
    }
  });
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      subdomain: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // State for subdomain availability check
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  
  // Function to check subdomain availability
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) return;
    
    try {
      setIsCheckingSubdomain(true);
      const response = await apiRequest('GET', `/api/check-subdomain?subdomain=${subdomain}`);
      const data = await response.json();
      setSubdomainAvailable(data.available);
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainAvailable(false);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };
  
  // Watch the subdomain field to check availability
  const subdomain = form.watch('subdomain');
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (subdomain) {
        checkSubdomainAvailability(subdomain);
      }
    }, 500); // Debounce
    
    return () => clearTimeout(timeoutId);
  }, [subdomain]);
  
  // Toggle addon selection
  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prevAddons => 
      prevAddons.includes(addonId)
        ? prevAddons.filter(id => id !== addonId)
        : [...prevAddons, addonId]
    );
  };

  // Calculate total price based on selections
  const calculateTotalPrice = () => {
    if (!productsData) return 0;
    
    // Core CRM price per user
    const coreCrmPrice = productsData.products.coreCrm.prices[billingCycle].amount * userCount;
    
    // Add selected addons
    const addonPrice = selectedAddons.reduce((total, addonId) => {
      const productKey = addonId as keyof typeof productsData.products;
      if (!productsData.products[productKey]) return total;
      return total + productsData.products[productKey].prices[billingCycle].amount;
    }, 0);
    
    return coreCrmPrice + addonPrice;
  };
  
  // Format currency based on region
  const formatCurrency = (amount: number) => {
    if (!productsData) return `$${amount}`;
    
    const currency = productsData.currency;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const handleSubmit = async (data: FormValues) => {
    // No longer require add-ons
    
    try {
      setIsCreatingAccount(true);
      
      // Check if subdomain is available before proceeding
      if (data.subdomain && (!subdomainAvailable || isCheckingSubdomain)) {
        if (!subdomainAvailable) {
          toast({
            title: "Subdomain Unavailable",
            description: "Please choose a different subdomain.",
            variant: "destructive",
          });
        }
        setIsCreatingAccount(false);
        return;
      }
      
      // Create subscription with trial
      const response = await apiRequest('POST', '/api/marketing/create-free-trial', {
        email: data.email,
        name: data.name,
        companyName: data.companyName,
        subdomain: data.subdomain,
        password: data.password, // Will be hashed on the server
        users: userCount,
        addons: selectedAddons,
        billingCycle,
        region
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }
      
      const result = await response.json();
      
      // Store Stripe checkout URL and redirect to checkout options
      if (result.url) {
        setIsRedirecting(true);
        // Store the checkout URL in session storage
        sessionStorage.setItem('stripeCheckoutData', JSON.stringify({
          url: result.url,
          timestamp: new Date().getTime()
        }));
        
        // Add a toast message about opening in a new tab
        toast({
          title: "Account created successfully!",
          description: "You'll be redirected to provide payment details shortly.",
          variant: "default",
        });
        
        // Redirect to checkout options page
        setLocation('/checkout-options');
        return;
      }
      
      // If no URL was returned, go to success page
      toast({
        title: "Account created successfully!",
        description: "Your 14-day free trial has started. You'll receive an email with login instructions.",
        variant: "default",
      });
      
      // Redirect to success page
      setIsRedirecting(true);
      setTimeout(() => {
        setLocation('/trial-success');
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
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-white font-bold text-xl">GreenLane Cloud Solutions</div>
            <Button 
              variant="outline" 
              className="text-white border-white hover:bg-white/20"
              onClick={() => setLocation('/')}
            >
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
            
            {isLoadingProducts ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading pricing information...</span>
              </div>
            ) : productsError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-8">
                <h3 className="font-semibold">Error loading products</h3>
                <p>We encountered an issue loading our product information. Please try again later.</p>
              </div>
            ) : productsData ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Configure Your Subscription</CardTitle>
                  <CardDescription>
                    Select options for your 14-day free trial
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Billing Cycle Selection */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Billing Cycle</h3>
                    <div className="flex space-x-4">
                      <Button
                        variant={billingCycle === 'monthly' ? 'default' : 'outline'}
                        onClick={() => setBillingCycle('monthly')}
                        className="flex-1"
                      >
                        Monthly
                      </Button>
                      <Button
                        variant={billingCycle === 'annual' ? 'default' : 'outline'}
                        onClick={() => setBillingCycle('annual')}
                        className="flex-1"
                      >
                        Annual (Save 10%)
                      </Button>
                    </div>
                  </div>
                  
                  {/* User Count Selector */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Number of Users</h3>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setUserCount(Math.max(1, userCount - 1))}
                        disabled={userCount <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-20 mx-4 text-center flex items-center justify-center">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium">{userCount}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setUserCount(userCount + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <div className="ml-4 text-gray-500 text-sm">
                        Per user licensing
                      </div>
                    </div>
                  </div>
                  
                  {/* Region Selection */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Region</h3>
                    <Select 
                      value={region} 
                      onValueChange={(value) => setRegion(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usa">United States (USD)</SelectItem>
                        <SelectItem value="canada">Canada (CAD)</SelectItem>
                        <SelectItem value="uk">United Kingdom (GBP)</SelectItem>
                        <SelectItem value="europe">Europe (EUR)</SelectItem>
                        <SelectItem value="australia">Australia (AUD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  {/* Core CRM - Always included */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{productsData.products.coreCrm.name}</h3>
                      <p className="text-sm text-gray-500">{productsData.products.coreCrm.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(productsData.products.coreCrm.prices[billingCycle].amount)}
                        <span className="text-xs text-gray-500">
                          /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                        <span className="text-xs text-gray-500 block">per user</span>
                      </div>
                      <div className="text-sm mt-1 font-medium text-primary">
                        Included
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Add-ons Selection */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Add-ons (Optional)</h3>
                    
                    {/* Community Add-on */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b">
                      <div className="flex items-start">
                        <Checkbox 
                          id="community" 
                          checked={selectedAddons.includes('community')}
                          onCheckedChange={() => toggleAddon('community')}
                          className="mt-1"
                        />
                        <div className="ml-3">
                          <label htmlFor="community" className="font-medium cursor-pointer">
                            {productsData.products.community.name}
                          </label>
                          <p className="text-sm text-gray-500">{productsData.products.community.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(productsData.products.community.prices[billingCycle].amount)}
                          <span className="text-xs text-gray-500">
                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Marketing Hub Add-on */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b">
                      <div className="flex items-start">
                        <Checkbox 
                          id="marketingHub" 
                          checked={selectedAddons.includes('marketingHub')}
                          onCheckedChange={() => toggleAddon('marketingHub')}
                          className="mt-1"
                        />
                        <div className="ml-3">
                          <label htmlFor="marketingHub" className="font-medium cursor-pointer">
                            {productsData.products.marketingHub.name}
                          </label>
                          <p className="text-sm text-gray-500">{productsData.products.marketingHub.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(productsData.products.marketingHub.prices[billingCycle].amount)}
                          <span className="text-xs text-gray-500">
                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Support Centre Add-on */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <Checkbox 
                          id="supportCentre" 
                          checked={selectedAddons.includes('supportCentre')}
                          onCheckedChange={() => toggleAddon('supportCentre')}
                          className="mt-1"
                        />
                        <div className="ml-3">
                          <label htmlFor="supportCentre" className="font-medium cursor-pointer">
                            {productsData.products.supportCentre.name}
                          </label>
                          <p className="text-sm text-gray-500">{productsData.products.supportCentre.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(productsData.products.supportCentre.prices[billingCycle].amount)}
                          <span className="text-xs text-gray-500">
                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Pricing Summary */}
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                      <span>Core CRM ({userCount} users)</span>
                      <span>{formatCurrency(productsData.products.coreCrm.prices[billingCycle].amount * userCount)}</span>
                    </div>
                    
                    {productsData && selectedAddons.map(addonId => {
                      const productKey = addonId as keyof typeof productsData.products;
                      if (!productsData.products[productKey]) return null;
                      return (
                        <div className="flex justify-between mb-2" key={addonId}>
                          <span>{productsData.products[productKey].name}</span>
                          <span>{formatCurrency(productsData.products[productKey].prices[billingCycle].amount)}</span>
                        </div>
                      );
                    })}
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between font-bold">
                      <span>Total {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}</span>
                      <span>{formatCurrency(calculateTotalPrice())}</span>
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-500">
                      Your free trial includes all selected features. You won't be charged until the 14-day trial ends.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
            
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
                    
                    <FormField
                      control={form.control}
                      name="subdomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choose Your Subdomain</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <div className="flex items-center">
                                <Input 
                                  placeholder="mycompany" 
                                  {...field} 
                                  className="rounded-r-none"
                                  onBlur={(e) => {
                                    // Convert to lowercase
                                    const lowercase = e.target.value.toLowerCase();
                                    if (lowercase !== e.target.value) {
                                      field.onChange(lowercase);
                                    }
                                    field.onBlur();
                                  }}
                                />
                                <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-muted-foreground">
                                  .greenlanecloudsolutions.com
                                </div>
                              </div>
                            </FormControl>
                            {isCheckingSubdomain && (
                              <div className="absolute right-32 top-2.5">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                            {!isCheckingSubdomain && subdomainAvailable === true && field.value && (
                              <div className="absolute right-32 top-2.5 flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-xs">Available</span>
                              </div>
                            )}
                            {!isCheckingSubdomain && subdomainAvailable === false && field.value && (
                              <div className="absolute right-32 top-2.5 flex items-center text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="text-xs">Unavailable</span>
                              </div>
                            )}
                          </div>
                          <FormDescription>
                            Choose a subdomain for your GreenLane account. Only lowercase letters, numbers, and hyphens are allowed.
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