import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import SignUpForm from '@/components/auth/SignUpForm';
import { isTenantUrl, redirectToMainDomain } from '@/lib/tenant';

export default function SignUp() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // If we're on a tenant URL, we should redirect to the main domain
    if (isTenantUrl()) {
      toast({
        title: "Wrong domain",
        description: "Please use the main domain to sign up",
        variant: "destructive",
      });
      
      // Redirect to the main domain
      redirectToMainDomain();
    }
  }, [toast]);
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <svg className="h-12 w-12 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="16" x2="12" y2="8" />
            <line x1="8" y1="20" x2="16" y2="12" />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Start your free trial
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <a href="/signin" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
