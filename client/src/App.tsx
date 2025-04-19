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
import ContactDetail from "@/pages/ContactDetail";
import Deals from "@/pages/Deals";
import DealDetail from "@/pages/DealDetail";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import SupportTickets from "@/pages/SupportTickets";
import SupportTicketDetail from "@/pages/SupportTicketDetail";
import Tasks from "@/pages/Tasks";
import TaskDetail from "@/pages/TaskDetail";
import AIAnalytics from "@/pages/AIAnalytics";
import DigitalJourney from "@/pages/DigitalJourney";
import Reports from "@/pages/Reports";
import Dashboards from "@/pages/Dashboards";
import AdminIntegrations from "@/pages/AdminIntegrations";
import AdminUserManagement from "@/pages/AdminUserManagement";
import DataManagement from "@/pages/admin/DataManagement";
import ModuleManagement from "@/pages/admin/ModuleManagement";
import Community from "@/pages/community/index";
import CommunitySettings from "@/pages/community/settings";
import CommunityPreview from "@/pages/community/preview";
import WorkflowsPage from "@/pages/workflows/index";
import WorkflowView from "@/pages/workflows/workflow-view";
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
  
  const ContactDetailWithLayout = () => (
    <MainLayout>
      <ContactDetail />
    </MainLayout>
  );
  
  const DealsWithLayout = () => (
    <MainLayout>
      <Deals />
    </MainLayout>
  );
  
  const DealDetailWithLayout = () => (
    <MainLayout>
      <DealDetail />
    </MainLayout>
  );
  
  const ProjectsWithLayout = () => (
    <MainLayout>
      <Projects />
    </MainLayout>
  );
  
  const ProjectDetailWithLayout = () => (
    <MainLayout>
      <ProjectDetail />
    </MainLayout>
  );
  
  const SupportTicketsWithLayout = () => (
    <MainLayout>
      <SupportTickets />
    </MainLayout>
  );
  
  const SupportTicketDetailWithLayout = () => (
    <MainLayout>
      <SupportTicketDetail />
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
  
  const TasksWithLayout = () => (
    <MainLayout>
      <Tasks />
    </MainLayout>
  );
  
  const TaskDetailWithLayout = () => (
    <MainLayout>
      <TaskDetail />
    </MainLayout>
  );
  
  const ReportsWithLayout = () => (
    <MainLayout>
      <Reports />
    </MainLayout>
  );
  
  const DashboardsWithLayout = () => (
    <MainLayout>
      <Dashboards />
    </MainLayout>
  );
  
  const AdminIntegrationsWithLayout = () => (
    <MainLayout>
      <AdminIntegrations />
    </MainLayout>
  );
  
  const AdminUserManagementWithLayout = () => (
    <MainLayout>
      <AdminUserManagement />
    </MainLayout>
  );
  
  const DataManagementWithLayout = () => (
    <MainLayout>
      <DataManagement />
    </MainLayout>
  );
  
  const ModuleManagementWithLayout = () => (
    <MainLayout>
      <ModuleManagement />
    </MainLayout>
  );
  
  const CommunityWithLayout = () => (
    <MainLayout>
      <Community />
    </MainLayout>
  );
  
  const CommunitySettingsWithLayout = () => (
    <MainLayout>
      <CommunitySettings />
    </MainLayout>
  );
  
  const WorkflowsWithLayout = () => (
    <WorkflowsPage />
  );
  
  const WorkflowViewWithLayout = () => (
    <WorkflowView />
  );
  
  const CommunityPreviewComponent = () => (
    <CommunityPreview />
  );
  
  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/" component={Home} />
      <ProtectedRoute path="/dashboard" component={DashboardWithLayout} />
      <ProtectedRoute path="/accounts/:id" component={AccountDetailWithLayout} />
      <ProtectedRoute path="/accounts" component={AccountsWithLayout} />
      <ProtectedRoute path="/contacts/:id" component={ContactDetailWithLayout} />
      <ProtectedRoute path="/contacts" component={ContactsWithLayout} />
      <ProtectedRoute path="/deals/:id" component={DealDetailWithLayout} />
      <ProtectedRoute path="/deals" component={DealsWithLayout} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetailWithLayout} />
      <ProtectedRoute path="/projects" component={ProjectsWithLayout} />
      <ProtectedRoute path="/support-tickets/:id" component={SupportTicketDetailWithLayout} />
      <ProtectedRoute path="/support-tickets" component={SupportTicketsWithLayout} />
      <ProtectedRoute path="/tasks/:id" component={TaskDetailWithLayout} />
      <ProtectedRoute path="/tasks" component={TasksWithLayout} />
      <ProtectedRoute path="/ai-analytics" component={AIAnalyticsWithLayout} />
      <ProtectedRoute path="/digital-journey" component={DigitalJourneyWithLayout} />
      <ProtectedRoute path="/workflows/:id" component={WorkflowViewWithLayout} />
      <ProtectedRoute path="/workflows" component={WorkflowsWithLayout} />
      <ProtectedRoute path="/reports" component={ReportsWithLayout} />
      <ProtectedRoute path="/dashboards" component={DashboardsWithLayout} />
      <ProtectedRoute path="/admin/integrations" component={AdminIntegrationsWithLayout} />
      <ProtectedRoute path="/admin/users" component={AdminUserManagementWithLayout} />
      <ProtectedRoute path="/admin/data" component={DataManagementWithLayout} />
      <ProtectedRoute path="/admin/modules" component={ModuleManagementWithLayout} />
      <ProtectedRoute path="/community/settings" component={CommunitySettingsWithLayout} />
      <ProtectedRoute path="/community/preview" component={CommunityPreviewComponent} />
      <ProtectedRoute path="/community" component={CommunityWithLayout} />
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
