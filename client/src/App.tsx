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
import AccountDetail from "@/pages/AccountDetail";
import Contacts from "@/pages/Contacts";
import Deals from "@/pages/Deals";
import Projects from "@/pages/Projects";
import SupportTickets from "@/pages/SupportTickets";
import AIAnalytics from "@/pages/AIAnalytics";
import DigitalJourney from "@/pages/DigitalJourney";
import MainLayout from "@/components/layout/MainLayout";
import { ProtectedRoute } from "./lib/protected-route";
import { getTenantFromUrl } from "@/lib/tenant";

function Router() {
  const [location] = useLocation();
  
  // Creating a protected dashboard component with MainLayout
  const DashboardWithLayout = () => (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
  
  const AccountsWithLayout = () => (
    <MainLayout>
      <Accounts />
    </MainLayout>
  );
  
  const AccountDetailWithLayout = () => (
    <MainLayout>
      <AccountDetail />
    </MainLayout>
  );
  
  const ContactsWithLayout = () => (
    <MainLayout>
      <Contacts />
    </MainLayout>
  );
  
  const DealsWithLayout = () => (
    <MainLayout>
      <Deals />
    </MainLayout>
  );
  
  const ProjectsWithLayout = () => (
    <MainLayout>
      <Projects />
    </MainLayout>
  );
  
  const SupportTicketsWithLayout = () => (
    <MainLayout>
      <SupportTickets />
    </MainLayout>
  );
  
  const AIAnalyticsWithLayout = () => (
    <MainLayout>
      <AIAnalytics />
    </MainLayout>
  );
  
  const DigitalJourneyWithLayout = () => (
    <MainLayout>
      <DigitalJourney />
    </MainLayout>
  );
  
  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/" component={Home} />
      <ProtectedRoute path="/dashboard" component={DashboardWithLayout} />
      <ProtectedRoute path="/accounts/:id" component={AccountDetailWithLayout} />
      <ProtectedRoute path="/accounts" component={AccountsWithLayout} />
      <ProtectedRoute path="/contacts" component={ContactsWithLayout} />
      <ProtectedRoute path="/deals" component={DealsWithLayout} />
      <ProtectedRoute path="/projects" component={ProjectsWithLayout} />
      <ProtectedRoute path="/support-tickets" component={SupportTicketsWithLayout} />
      <ProtectedRoute path="/ai-analytics" component={AIAnalyticsWithLayout} />
      <ProtectedRoute path="/digital-journey" component={DigitalJourneyWithLayout} />
      <ProtectedRoute path="/checkout" component={Checkout} />
      <ProtectedRoute path="/payment-success" component={PaymentSuccess} />
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
