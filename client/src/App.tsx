import { Switch, Route, useLocation } from "wouter";
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

function Router() {
  const [location] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isTenantDomain = getTenantFromUrl() !== null;
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/status");
        const data = await res.json();
        setIsAuthenticated(data.isAuthenticated);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuthStatus();
  }, [location]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  // Public marketing site routes
  if (!isTenantDomain) {
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/signin" component={SignIn} />
        <Route path="/signup" component={SignUp} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Tenant-specific routes
  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/">
        {isAuthenticated ? (
          <MainLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/accounts" component={Accounts} />
              <Route path="/contacts" component={Contacts} />
              <Route path="/deals" component={Deals} />
              <Route path="/projects" component={Projects} />
              <Route path="/support-tickets" component={SupportTickets} />
              <Route path="/ai-analytics" component={AIAnalytics} />
              <Route path="/digital-journey" component={DigitalJourney} />
              <Route component={NotFound} />
            </Switch>
          </MainLayout>
        ) : (
          // Redirect to signin if not authenticated
          <SignIn />
        )}
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
