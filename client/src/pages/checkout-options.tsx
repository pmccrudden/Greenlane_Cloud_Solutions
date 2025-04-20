import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CreditCard, CheckCircle, ArrowRight, Zap } from "lucide-react";

export default function CheckoutOptions() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleName, setModuleName] = useState<string>("");
  const [modulePrice, setModulePrice] = useState<{monthly: number, annual: number}>({
    monthly: 0,
    annual: 0
  });
  
  // Extract module ID from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const moduleId = searchParams.get('module');
    
    if (moduleId) {
      setSelectedModule(moduleId);
      
      // Set module name and price based on the ID
      if (moduleId === 'community') {
        setModuleName('Customer Community');
        setModulePrice({ monthly: 40, annual: 432 });
      } else if (moduleId === 'support-tickets') {
        setModuleName('Support Tickets');
        setModulePrice({ monthly: 25, annual: 250 });
      }
    }
  }, [location]);
  
  const handleSubscribe = async () => {
    if (!selectedModule) {
      toast({
        title: "No Module Selected",
        description: "Please select a module to subscribe",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the API to create a checkout session for the selected module
      const response = await apiRequest("POST", "/api/create-module-subscription", {
        moduleId: selectedModule,
        billingCycle
      });
      
      if (!response.ok) {
        throw new Error("Failed to create subscription checkout");
      }
      
      const data = await response.json();
      
      // Store checkout data in session storage for the checkout page
      sessionStorage.setItem('stripeCheckoutData', JSON.stringify({ 
        url: data.url, 
        moduleId: selectedModule 
      }));
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Checkout Opened",
        description: "We've opened the payment page in a new tab. If you don't see it, please check your popup blocker.",
      });
      
      // Keep the user on this page so they can return to the application if needed
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Checkout Failed",
        description: "There was a problem creating your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAndGoBack = () => {
    setLocation('/admin/modules');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Subscribe to {moduleName}</CardTitle>
            <CardDescription className="text-center">
              Add the {moduleName} module to your GreenLane CRM
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* Billing Cycle Selection */}
              <div className="space-y-3">
                <h3 className="font-medium text-slate-700">Choose Billing Cycle</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`border rounded-md p-4 cursor-pointer transition-all ${
                      billingCycle === 'monthly' 
                        ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200' 
                        : 'border-slate-200 hover:border-primary-200'
                    }`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-slate-900">Monthly</h4>
                        <p className="text-sm text-slate-500 mt-1">Billed monthly</p>
                      </div>
                      {billingCycle === 'monthly' && (
                        <CheckCircle className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-slate-900">${modulePrice.monthly}</span>
                      <span className="text-slate-500 ml-1">/month</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-md p-4 cursor-pointer transition-all ${
                      billingCycle === 'annual' 
                        ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200' 
                        : 'border-slate-200 hover:border-primary-200'
                    }`}
                    onClick={() => setBillingCycle('annual')}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-medium text-slate-900">Annual</h4>
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Save 15%</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Billed annually</p>
                      </div>
                      {billingCycle === 'annual' && (
                        <CheckCircle className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-slate-900">${modulePrice.annual / 12}</span>
                      <span className="text-slate-500 ml-1">/month</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="bg-slate-100 p-4 rounded-md">
                <h3 className="font-medium">Order Summary</h3>
                <div className="flex justify-between mt-3">
                  <span>{moduleName} Module - {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}</span>
                  <span>${billingCycle === 'monthly' ? modulePrice.monthly : modulePrice.annual}</span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${billingCycle === 'monthly' ? modulePrice.monthly : modulePrice.annual}</span>
                </div>
              </div>
              
              {/* Features */}
              <div>
                <h3 className="font-medium mb-2 text-slate-700">What's included</h3>
                <ul className="space-y-2">
                  {selectedModule === 'community' ? (
                    <>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Customer community portal with custom branding</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Discussion forums and user groups</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Knowledge sharing and resource library</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Community analytics and engagement insights</span>
                      </li>
                    </>
                  ) : selectedModule === 'support-tickets' ? (
                    <>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Full ticketing system with custom categories</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">SLA management and automated assignments</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Email notifications and ticket updates</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Integration with CRM data and contacts</span>
                      </li>
                    </>
                  ) : null}
                </ul>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-3">
            <Button 
              variant="default" 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Continue to Payment
                </>
              )}
            </Button>
            
            <Button variant="ghost" onClick={handleCancelAndGoBack} disabled={isLoading}>
              Cancel and return
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}