import { useEffect, useState } from 'react';
import { useStripe, useElements, Elements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

// Make sure to call loadStripe outside of a component's render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Check for missing Stripe API key
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.error('Missing required environment variable: VITE_STRIPE_PUBLIC_KEY');
}

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }
    
    setIsLoading(true);
    
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/payment-success`,
      },
    });
    
    if (result.error) {
      // Show error to your customer
      toast({
        title: "Payment failed",
        description: result.error.message,
        variant: "destructive",
      });
    } 
    
    setIsLoading(false);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            Processing...
          </div>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState<string>("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Create a PaymentIntent as soon as the page loads
    const fetchPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount: 99.99 // Example amount, in real scenario this would come from cart/product data
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
        console.error("Error creating payment intent:", error);
      }
    };
    
    fetchPaymentIntent();
  }, [toast]);
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Complete Your Purchase</CardTitle>
            <CardDescription className="text-center">
              Secure payment processing by Stripe
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-100 p-4 rounded-md">
                <h3 className="font-medium">Order Summary</h3>
                <div className="flex justify-between mt-2">
                  <span>GreenLane CRM - Standard Plan</span>
                  <span>$99.99</span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>$99.99</span>
                </div>
              </div>
              
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm />
                </Elements>
              ) : (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Cancel and return to homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}