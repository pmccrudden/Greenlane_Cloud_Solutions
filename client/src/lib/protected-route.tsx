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
        // Use checkAuth function from auth.ts which properly includes tenant ID
        const { isAuthenticated: authStatus } = await checkAuth();
        
        if (authStatus) {
          setIsAuthenticated(true);
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