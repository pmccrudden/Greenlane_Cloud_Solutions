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
      
      if (tenant) {
        window.location.href = `https://${tenant}.greenlanecloudsolutions.com/signin`;
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
              <a href="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                start your free trial
              </a>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignInForm onSuccess={handleSuccessfulSignIn} />
          
          {!isTenant && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <a
                  href="/signup"
                  className="flex w-full items-center justify-center rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <span>Create a new account</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
