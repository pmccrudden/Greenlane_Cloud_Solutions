import { ArrowLeftIcon, ArrowRightIcon, CheckCircle, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutOptions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [redirectTimeout, setRedirectTimeout] = useState<number | null>(null);
  
  useEffect(() => {
    // Check if there's a checkout URL in session storage
    const stripeData = sessionStorage.getItem('stripeCheckoutData');
    if (stripeData) {
      try {
        const data = JSON.parse(stripeData);
        setCheckoutUrl(data.url);
      } catch (error) {
        console.error('Error parsing stripe checkout data:', error);
      }
    }
    
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, []);
  
  const handleContinueToStripe = () => {
    if (!checkoutUrl) {
      toast({
        title: "Error",
        description: "No checkout URL available. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Open Stripe checkout in a new tab instead of redirecting in the same window
    // This fixes the iframe security restriction from Stripe
    window.open(checkoutUrl, '_blank');
    
    toast({
      title: "Checkout Opened",
      description: "We've opened Stripe checkout in a new tab. If you don't see it, please check your popup blocker.",
    });
  };
  
  const handleCancelAndGoBack = () => {
    // Clear the checkout data from session storage
    sessionStorage.removeItem('stripeCheckoutData');
    
    // Redirect back to free trial page
    setLocation('/free-trial');
  };
  
  // No skip payment option as per requirements
  
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
          <div className="max-w-3xl mx-auto">
            <Card className="border-primary/20 shadow-lg mb-6">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Complete Your Free Trial Setup</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Your account has been created! Please complete the payment setup:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-100 rounded-md p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-lg font-medium">Account Created Successfully</p>
                  <p className="text-gray-600 mt-2">
                    Your GreenLane CRM account has been created. The next step is to provide your payment details for when your free trial ends.
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="bg-white rounded-md border p-4 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={handleContinueToStripe}>
                    <div className="flex items-start">
                      <div className="mr-4">
                        <CreditCard className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Complete Payment Setup Now</h3>
                        <p className="text-gray-600 mt-1">
                          Click below to open Stripe checkout in a new tab. 
                          You won't be charged until your 14-day free trial ends.
                        </p>
                        <p className="text-gray-600 mt-1">
                          <strong>Note:</strong> Payment details are required to activate your free trial.
                          You won't be charged until your trial period ends.
                        </p>
                        <Button className="mt-3" onClick={(e) => {
                          e.stopPropagation();
                          handleContinueToStripe();
                        }}>
                          Open Stripe Checkout <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <Button variant="ghost" onClick={handleCancelAndGoBack}>
                  <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Free Trial Options
                </Button>
                <p className="text-sm text-gray-500 italic">14-day free trial with no obligation</p>
              </CardFooter>
            </Card>
            
            <div className="text-center text-sm text-gray-500">
              <p>
                Need help? Contact our support team at{" "}
                <a href="mailto:support@greenlanecloud.com" className="text-primary hover:underline">
                  support@greenlanecloud.com
                </a>
              </p>
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