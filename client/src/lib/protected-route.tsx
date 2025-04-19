import { useEffect, useState } from 'react';
import { Route, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { checkAuth } from './auth';

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
        // Use apiRequest with proper headers including tenant ID
        const response = await fetch('/api/auth/status', {
          credentials: 'include', 
          headers: {
            'X-Tenant-ID': '572c77d7-e838-44ca-8adb-7ddef5f199bb'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.isAuthenticated) {
            setIsAuthenticated(true);
          } else {
            setLocation('/signin');
          }
        } else {
          setLocation('/signin');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setLocation('/signin');
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