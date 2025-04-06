import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import Contacts from "@/pages/Contacts";
import Deals from "@/pages/Deals";
import Projects from "@/pages/Projects";
import SupportTickets from "@/pages/SupportTickets";
import AIAnalytics from "@/pages/AIAnalytics";
import DigitalJourney from "@/pages/DigitalJourney";
import MainLayout from "@/components/layout/MainLayout";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { getTenantFromUrl } from "@/lib/tenant";

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/status");
        const data = await res.json();
        setIsAuthenticated(data.isAuthenticated);
      } catch (error) {
        console.error("Auth status check error:", error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect to="/signin" />;
  }

  // Render the protected content if authenticated
  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/checkout">
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      </Route>
      <Route path="/payment-success">
        <ProtectedRoute>
          <PaymentSuccess />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <Home />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/accounts">
        <ProtectedRoute>
          <MainLayout>
            <Accounts />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/contacts">
        <ProtectedRoute>
          <MainLayout>
            <Contacts />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/deals">
        <ProtectedRoute>
          <MainLayout>
            <Deals />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute>
          <MainLayout>
            <Projects />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/support-tickets">
        <ProtectedRoute>
          <MainLayout>
            <SupportTickets />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/ai-analytics">
        <ProtectedRoute>
          <MainLayout>
            <AIAnalytics />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/digital-journey">
        <ProtectedRoute>
          <MainLayout>
            <DigitalJourney />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
