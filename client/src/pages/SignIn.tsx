import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import SignInForm from '@/components/auth/SignInForm';
import { isTenantUrl, redirectToMainDomain, getTenantFromUrl } from '@/lib/tenant';

// Import the necessary function for sign-in
import { signIn } from '@/lib/auth';
import { redirectAfterAuth } from '@/lib/navigation';
import { hasPendingSsoSession, completeSsoLogin } from '@/lib/tenant-auth';

export default function SignIn() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Only clear tenant if there's no pending SSO
  const hasPendingCredentials = sessionStorage.getItem('pending_username') && 
                                sessionStorage.getItem('pending_password');
  
  // Clear tenant session on the main domain signin page to ensure proper tenant field display,
  // but only if there's no pending SSO attempt
  const isMainDomainSignin = window.location.pathname === '/signin' && 
                            !window.location.search.includes('tenant=') &&
                            !hasPendingCredentials;
  
  if (isMainDomainSignin) {
    // We're on the main signin page with no pending login, ensure no tenant is stored in session
    console.log("Clearing tenant from session to show tenant field");
    sessionStorage.removeItem('current_tenant');
  }
  
  const isTenant = isTenantUrl();
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  
  useEffect(() => {
    // Check for pending login credentials or SSO session
    const attemptAutomaticLogin = async () => {
      // First check for SSO session - this is the new improved method
      if (hasPendingSsoSession()) {
        console.log("Found pending SSO session, attempting automatic login");
        setIsAutoLoggingIn(true);
        
        try {
          // This will check tenant, attempt login, and redirect on success
          const completed = await completeSsoLogin();
          
          if (!completed) {
            console.log("SSO login could not be completed");
            setIsAutoLoggingIn(false);
          }
          // If completed successfully, redirect happens automatically
          return;
        } catch (error) {
          console.log("SSO login failed:", error);
          setIsAutoLoggingIn(false);
          
          toast({
            title: "Automatic Sign-in Failed",
            description: "Please enter your credentials manually",
            variant: "destructive",
          });
        }
      }
      
      // Fall back to legacy method - for backward compatibility
      const pendingUsername = sessionStorage.getItem('pending_username');
      const pendingPassword = sessionStorage.getItem('pending_password');
      const pendingTenant = sessionStorage.getItem('current_tenant');
      const autoLogin = sessionStorage.getItem('auto_login');
      
      console.log("Legacy auto-login check - isTenant:", isTenant, 
                  "hasPendingCredentials:", !!(pendingUsername && pendingPassword),
                  "pendingTenant:", pendingTenant,
                  "autoLogin:", autoLogin);
      
      if (pendingUsername && pendingPassword) {
        // We have pending credentials
        
        if (isTenant || autoLogin === 'true') {
          // We're in tenant context, attempt login
          console.log("Found pending credentials in tenant context, attempting automatic login");
          setIsAutoLoggingIn(true);
          
          try {
            await signIn(pendingUsername, pendingPassword);
            
            // Clear the pending credentials and auto_login flag
            sessionStorage.removeItem('pending_username');
            sessionStorage.removeItem('pending_password');
            sessionStorage.removeItem('auto_login');
            
            // Redirect to dashboard
            console.log("Automatic login successful, redirecting to dashboard");
            redirectAfterAuth('/dashboard');
          } catch (error) {
            console.log("Automatic login failed:", error);
            // Clear pending credentials on failure too
            sessionStorage.removeItem('pending_username');
            sessionStorage.removeItem('pending_password');
            sessionStorage.removeItem('auto_login');
            setIsAutoLoggingIn(false);
            
            toast({
              title: "Sign in Failed",
              description: "Please enter your credentials manually",
              variant: "destructive",
            });
          }
        } else if (pendingTenant) {
          // We have credentials but aren't in tenant context yet 
          // and we know which tenant to go to
          console.log("Have pending credentials but not in tenant context, redirecting to tenant");
          
          // For local development or Replit preview environment
          if (window.location.hostname.includes('localhost') || 
              window.location.hostname.includes('127.0.0.1') ||
              window.location.hostname.includes('replit.dev') ||
              window.location.hostname.includes('repl.co')) {
                
            console.log("Setting tenant in sessionStorage:", pendingTenant);
            sessionStorage.setItem('auto_login', 'true');
            // Force refresh to trigger tenant context detection
            window.location.reload();
          } else {
            // Redirect to tenant subdomain in production
            sessionStorage.setItem('auto_login', 'true');
            const redirectUrl = `https://${pendingTenant}.greenlanecloudsolutions.com/signin`;
            console.log('Production redirect to:', redirectUrl);
            window.location.href = redirectUrl;
          }
        } else {
          console.log("Have pending credentials but no tenant - unusual state");
          // This is an unusual state - clear credentials to avoid confusion
          sessionStorage.removeItem('pending_username');
          sessionStorage.removeItem('pending_password');
          sessionStorage.removeItem('auto_login');
        }
      }
    };
    
    // Handle tenant redirection
    const handleTenantRedirection = () => {
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
          return true; // redirection happened
        }
      }
      return false; // no redirection
    };
    
    // Run both operations in sequence
    const initialize = async () => {
      const redirected = handleTenantRedirection();
      if (!redirected) {
        await attemptAutomaticLogin();
      }
    };
    
    initialize();
  }, [isTenant, toast]);
  
  const handleSuccessfulSignIn = () => {
    console.log("handleSuccessfulSignIn called, redirecting to /dashboard");
    // Use our navigation utility for proper redirection
    redirectAfterAuth('/dashboard');
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
              <a href="/free-trial" className="font-medium text-primary-600 hover:text-primary-500">
                start your 14-day free trial
              </a>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isAutoLoggingIn ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-600">Signing in automatically...</p>
            </div>
          ) : (
            <SignInForm onSuccess={handleSuccessfulSignIn} />
          )}
        </div>
      </div>
    </div>
  );
}
