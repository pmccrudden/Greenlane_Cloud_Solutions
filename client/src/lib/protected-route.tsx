import { useEffect, useState } from 'react';
import { Route, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { checkAuth } from './auth';
import { getTenantFromUrl } from './tenant';
import { navigateToLogin } from './navigation';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // First check for auth status in sessionStorage as a quick check
        const sessionAuthStatus = sessionStorage.getItem('auth_status');
        if (sessionAuthStatus === 'authenticated') {
          console.log('Found authenticated status in session storage');
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // If not in session, check with the server
        console.log('Verifying authentication with server...');
        
        // Get tenant ID for request headers
        const tenantId = getTenantFromUrl();
        
        // Prepare headers with tenant ID if available
        const headers: Record<string, string> = {
          'Accept': 'application/json'
        };
        
        if (tenantId) {
          console.log('Adding tenant ID to auth check:', tenantId);
          headers['X-Tenant-ID'] = tenantId;
        }
        
        const response = await fetch('/api/auth/status', {
          credentials: 'include',
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Auth check response:', data);
          
          if (data.isAuthenticated) {
            console.log('User is authenticated');
            setIsAuthenticated(true);
            // Save auth status to session for faster checks
            sessionStorage.setItem('auth_status', 'authenticated');
          } else {
            console.log('User is not authenticated, redirecting to login');
            navigateToLogin();
          }
        } else {
          console.error('Auth check failed with status:', response.status);
          navigateToLogin();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigateToLogin();
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyAuth();
  }, [setLocation]);

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      ) : isAuthenticated ? (
        <Component />
      ) : null}
    </Route>
  );
}