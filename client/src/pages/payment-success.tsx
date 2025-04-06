import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'processing' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Parse the query parameters
    const params = new URLSearchParams(window.location.search);
    const paymentIntent = params.get('payment_intent');
    const paymentIntentClientSecret = params.get('payment_intent_client_secret');
    const redirectStatus = params.get('redirect_status');

    if (redirectStatus === 'succeeded') {
      setPaymentStatus('success');
      setMessage('Your payment was successful! Your subscription is now active.');
      
      toast({
        title: "Payment Successful",
        description: "Your subscription has been activated.",
      });
    } else if (redirectStatus === 'processing') {
      setPaymentStatus('processing');
      setMessage('Your payment is processing. We\'ll update you when the payment is complete.');
      
      toast({
        title: "Payment Processing",
        description: "Your payment is being processed.",
      });
    } else {
      setPaymentStatus('error');
      setMessage('Payment was not successful. Please try again or contact support.');
      
      toast({
        title: "Payment Failed",
        description: "There was an issue with your payment.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            {paymentStatus === 'success' ? (
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            ) : paymentStatus === 'processing' ? (
              <div className="mx-auto h-12 w-12 mb-4">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            )}
            
            <CardTitle className="text-2xl">
              {paymentStatus === 'success' 
                ? 'Payment Successful!' 
                : paymentStatus === 'processing' 
                  ? 'Payment Processing' 
                  : 'Payment Failed'}
            </CardTitle>
            <CardDescription>
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentStatus === 'success' && (
              <div className="bg-green-50 p-4 rounded-md text-center">
                <p className="text-green-800">
                  Your account has been set up successfully. You can now access all features of GreenLane Cloud Solutions.
                </p>
              </div>
            )}
            
            {paymentStatus === 'processing' && (
              <div className="bg-yellow-50 p-4 rounded-md text-center">
                <p className="text-yellow-800">
                  Please wait while we confirm your payment. This may take a few moments.
                </p>
              </div>
            )}
            
            {paymentStatus === 'error' && (
              <div className="bg-red-50 p-4 rounded-md text-center">
                <p className="text-red-800">
                  There was an issue with your payment. Please try again or contact our support team for assistance.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            {paymentStatus === 'success' ? (
              <Button onClick={() => navigate('/')}>
                Go to Dashboard
              </Button>
            ) : paymentStatus === 'error' ? (
              <>
                <Button onClick={() => navigate('/checkout')} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => navigate('/')}>
                  Go to Home
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/')} variant="outline">
                Go to Home
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}