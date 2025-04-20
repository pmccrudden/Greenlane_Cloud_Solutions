import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import SignInForm from '@/components/auth/SignInForm';
import { isTenantUrl, redirectToMainDomain } from '@/lib/tenant';

export default function SignIn() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const isTenant = isTenantUrl();
  
  useEffect(() => {
    // If on the main domain and there's a ?tenant= query param, we should redirect
    // to that tenant's signin page
    if (!isTenant) {
      const urlParams = new URLSearchParams(window.location.search);
      const tenant = urlParams.get('tenant');
      console.log("SignIn useEffect - tenant param:", tenant);
      
      if (tenant) {
        console.log("SignIn useEffect - redirecting to tenant:", tenant);
        
        // For local development or Replit preview environment
        if (window.location.hostname.includes('localhost') || 
            window.location.hostname.includes('127.0.0.1') ||
            window.location.hostname.includes('replit.dev') ||
            window.location.hostname.includes('repl.co')) {
          
          // Set tenant as part of query parameter
          console.log("Setting tenant in query param for:", tenant);
          
          // We need to store this in localStorage or sessionStorage because we're using the same origin
          // and a hard page reload, so the query param would be lost
          console.log("Storing tenant in sessionStorage");
          sessionStorage.setItem('current_tenant', tenant);
        } else {
          // Redirect to tenant subdomain
          window.location.href = `https://${tenant}.greenlanecloudsolutions.com/signin`;
        }
        return;
      }
    }
  }, [isTenant]);
  
  const handleSuccessfulSignIn = () => {
    console.log("handleSuccessfulSignIn called, redirecting to /dashboard");
    // Redirect to dashboard using a hard redirect
    window.location.href = '/dashboard';
  };
  
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
          Sign in to GreenLane
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isTenant ? (
            <>Access your tenant dashboard</>
          ) : (
            <>
              Or{' '}
              <a href="/marketing/free-trial" className="font-medium text-primary-600 hover:text-primary-500">
                start your 14-day free trial
              </a>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignInForm onSuccess={handleSuccessfulSignIn} />
          
          {/* Create new account section removed as requested */}
        </div>
      </div>
    </div>
  );
}
