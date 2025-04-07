import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from "@/lib/queryClient";
import { useToast } from '@/hooks/use-toast';
import { Account, Contact, Deal, Project, SupportTicket, AccountAIData, PredictiveAnalytics, TaskPlaybookItem } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Briefcase, 
  LifeBuoy,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Sparkles,
  ArrowRightCircle,
  ClipboardCheck,
  RefreshCw,
  Loader2,
  BarChart3,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { AddDealDialog } from '@/components/deals/AddDealDialog';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import { AddSupportTicketDialog } from '@/components/support/AddSupportTicketDialog';

export default function AccountDetail() {
  const [, params] = useRoute<{ id: string }>('/accounts/:id');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const accountId = params?.id ? parseInt(params.id) : null;
  
  // Fetch account details
  const { data: account, isLoading: accountLoading } = useQuery<Account>({
    queryKey: [`/api/accounts/${accountId}`],
    enabled: !!accountId,
  });
  
  // Fetch account contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: [`/api/accounts/${accountId}/contacts`],
    enabled: !!accountId,
  });
  
  // Fetch account deals
  const { data: deals = [], isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: [`/api/accounts/${accountId}/deals`],
    enabled: !!accountId,
  });
  
  // Fetch account projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: [`/api/accounts/${accountId}/projects`],
    enabled: !!accountId,
  });
  
  // Fetch account support tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: [`/api/accounts/${accountId}/support-tickets`],
    enabled: !!accountId,
  });
  
  // Fetch AI data for the account
  const {
    data: aiData,
    isLoading: aiDataLoading,
    refetch: refetchAiData
  } = useQuery<AccountAIData>({
    queryKey: [`/api/accounts/${accountId}/ai/all`],
    enabled: !!accountId,
  });
  
  // Fetch predictive analytics for the account
  const {
    data: predictiveData,
    isLoading: predictiveLoading,
    refetch: refetchPredictiveData
  } = useQuery<PredictiveAnalytics>({
    queryKey: [`/api/accounts/${accountId}/ai/predict`],
    enabled: !!accountId,
  });
  
  // When predictiveData is loaded, merge it into aiData
  if (predictiveData && aiData && !aiData.predictions) {
    // Using this approach instead of setState to avoid having to manage 
    // multiple state variables. The next render will use the updated query cache.
    const updatedAiData = { ...aiData, predictions: predictiveData };
    queryClient.setQueryData([`/api/accounts/${accountId}/ai/all`], updatedAiData);
  }
  
  // Function to handle refresh of AI data
  const handleRefreshAI = async () => {
    if (!accountId) return;
    
    setRefreshing(true);
    try {
      await Promise.all([refetchAiData(), refetchPredictiveData()]);
      toast({
        title: "AI Analysis Refreshed",
        description: "Latest account insights have been generated",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not generate new AI insights at this time",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Function to format date
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };
  
  // Helper to get effort color
  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to get timeline color
  const getTimelineColor = (timeline: string) => {
    switch (timeline) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'short-term': return 'bg-yellow-100 text-yellow-800';
      case 'long-term': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate status badge color
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-slate-100 text-slate-800",
      "at risk": "bg-yellow-100 text-yellow-800",
      churned: "bg-red-100 text-red-800",
    };

    return statusMap[status.toLowerCase()] || "bg-slate-100 text-slate-800";
  };

  if (!accountId) {
    return <div>Invalid account ID</div>;
  }

  if (accountLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Building2 className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Account Not Found</h2>
        <p className="text-slate-500">The account you're looking for doesn't exist or you don't have access.</p>
        <Button className="mt-4" onClick={() => window.location.href = '/accounts'}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  // Generate initials for the avatar
  const initials = account.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  
  // Get initial background color based on name
  const colors = [
    "bg-primary-100 text-primary-700",
    "bg-secondary-100 text-secondary-700",
    "bg-accent-100 text-accent-700"
  ];
  const colorIndex = account.name.charCodeAt(0) % colors.length;
  const avatarClass = colors[colorIndex];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className={`flex-shrink-0 h-16 w-16 flex items-center justify-center ${avatarClass} rounded-full mr-4`}>
            <span className="text-xl font-medium">{initials}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <div className="flex items-center mt-1 space-x-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(account.status || 'active')}`}>
                {account.status?.charAt(0).toUpperCase() + account.status?.slice(1) || 'Active'}
              </span>
              {account.industry && (
                <span className="text-sm text-slate-500">{account.industry}</span>
              )}
              {account.employeeCount && (
                <span className="text-sm text-slate-500">{account.employeeCount}+ employees</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.location.href = `/accounts/${account.id}/edit`}>
            Edit Account
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <div className="cursor-pointer">
                  <AddContactDialog accountId={accountId} trigger={<div className="w-full">Add Contact</div>} />
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <div className="cursor-pointer">
                  <AddDealDialog accountId={accountId} trigger={<div className="w-full">Add Deal</div>} />
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <div className="cursor-pointer">
                  <AddProjectDialog accountId={accountId} trigger={<div className="w-full">Add Project</div>} />
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <div className="cursor-pointer">
                  <AddSupportTicketDialog accountId={accountId} trigger={<div className="w-full">Add Support Ticket</div>} />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="ai-assist">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Assist
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {account.website && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-slate-500 mr-2" />
                      <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {account.website.replace(/(^\w+:|^)\/\//, '')}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-slate-500 mr-2" />
                    <span>No primary email</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-slate-500 mr-2" />
                    <span>No primary phone</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Account Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-24">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold">{account.healthScore || '—'}%</div>
                    <div className="text-sm text-slate-500 mt-1">Overall Health Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Relationship Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                    <Users className="h-5 w-5 text-slate-500 mb-1" />
                    <div className="text-xl font-bold">{contacts.length}</div>
                    <div className="text-xs text-slate-500">Contacts</div>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-slate-500 mb-1" />
                    <div className="text-xl font-bold">{deals.length}</div>
                    <div className="text-xs text-slate-500">Deals</div>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                    <Briefcase className="h-5 w-5 text-slate-500 mb-1" />
                    <div className="text-xl font-bold">{projects.length}</div>
                    <div className="text-xs text-slate-500">Projects</div>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                    <LifeBuoy className="h-5 w-5 text-slate-500 mb-1" />
                    <div className="text-xl font-bold">{tickets.length}</div>
                    <div className="text-xs text-slate-500">Tickets</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Contacts</CardTitle>
              <AddContactDialog accountId={accountId} />
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="h-12 bg-slate-100 rounded"></div>
                  ))}
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">No contacts found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Get started by creating your first contact for this account
                  </p>
                  <div className="mt-6">
                    <AddContactDialog accountId={accountId} />
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          <a 
                            href={`/contacts/${contact.id}`} 
                            className="text-primary hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/contacts/${contact.id}`;
                            }}
                          >
                            {contact.firstName} {contact.lastName}
                          </a>
                        </TableCell>
                        <TableCell>{contact.title || '—'}</TableCell>
                        <TableCell>{contact.email || '—'}</TableCell>
                        <TableCell>{contact.phone || '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="deals" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Deals</CardTitle>
              <AddDealDialog accountId={accountId} />
            </CardHeader>
            <CardContent>
              {dealsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="h-12 bg-slate-100 rounded"></div>
                  ))}
                </div>
              ) : deals.length === 0 ? (
                <div className="text-center py-10">
                  <TrendingUp className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">No deals found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Get started by creating your first deal for this account
                  </p>
                  <div className="mt-6">
                    <AddDealDialog accountId={accountId} />
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">
                          <a 
                            href={`/deals/${deal.id}`} 
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/deals/${deal.id}`;
                            }}
                          >
                            {deal.name}
                          </a>
                        </TableCell>
                        <TableCell>${deal.value?.toLocaleString() || '—'}</TableCell>
                        <TableCell>{deal.stage || '—'}</TableCell>
                        <TableCell>{deal.winProbability ? `${deal.winProbability}%` : '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Projects</CardTitle>
              <AddProjectDialog accountId={accountId} />
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="h-12 bg-slate-100 rounded"></div>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-10">
                  <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">No projects found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Get started by creating your first project for this account
                  </p>
                  <div className="mt-6">
                    <AddProjectDialog accountId={accountId} />
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          <a 
                            href={`/projects/${project.id}`} 
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/projects/${project.id}`;
                            }}
                          >
                            {project.name}
                          </a>
                        </TableCell>
                        <TableCell>{project.status || '—'}</TableCell>
                        <TableCell>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>{project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="support" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Support Tickets</CardTitle>
              <AddSupportTicketDialog accountId={accountId} />
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="h-12 bg-slate-100 rounded"></div>
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-10">
                  <LifeBuoy className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">No support tickets found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Get started by creating your first support ticket for this account
                  </p>
                  <div className="mt-6">
                    <AddSupportTicketDialog accountId={accountId} />
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          <a 
                            href={`/support-tickets/${ticket.id}`} 
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/support-tickets/${ticket.id}`;
                            }}
                          >
                            {ticket.subject}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ticket.status === 'closed' ? 'outline' : 'default'}>
                            {ticket.status === 'open' ? 'Open' : 'Closed'}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.priority || 'Medium'}</TableCell>
                        <TableCell>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai-assist" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">AI Account Management Assist</h2>
            <Button 
              onClick={handleRefreshAI}
              disabled={refreshing}
              variant="outline"
            >
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Analysis
                </>
              )}
            </Button>
          </div>
          
          {(aiDataLoading || predictiveLoading) && (
            <div className="flex flex-col items-center justify-center py-16 border rounded-xl">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-semibold">Generating AI insights...</h3>
              <p className="text-muted-foreground">This may take a moment</p>
            </div>
          )}
          
          {!aiDataLoading && !predictiveLoading && (!aiData || !aiData.insight) && (
            <div className="flex flex-col items-center justify-center py-16 border rounded-xl bg-slate-50">
              <Sparkles className="w-16 h-16 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">No AI insights available</h3>
              <p className="text-muted-foreground max-w-md text-center mb-6">
                Get AI-powered account summaries, next steps recommendations, and task playbooks
              </p>
              <Button onClick={handleRefreshAI} disabled={refreshing}>
                Generate AI Insights
              </Button>
            </div>
          )}
          
          {!aiDataLoading && !predictiveLoading && aiData && aiData.insight && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="summary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Account Summary
                </TabsTrigger>
                <TabsTrigger value="next-steps">
                  <ArrowRightCircle className="mr-2 h-4 w-4" />
                  Next Steps
                </TabsTrigger>
                <TabsTrigger value="playbook">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Task Playbook
                </TabsTrigger>
                <TabsTrigger value="predictions">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Predictive Analytics
                </TabsTrigger>
              </TabsList>

              {/* Account Summary Tab */}
              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-center">
                      <span>Account Summary</span>
                      <Badge variant="outline" className="font-normal">
                        Generated: {formatDate(aiData.insight.lastGeneratedAt)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      AI-generated summary of {aiData.insight.accountName}'s status, activities, and health
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      {aiData.insight.summary.split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      Powered by Anthropic Claude
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshAI}
                      disabled={refreshing}
                    >
                      {refreshing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Next Steps Tab */}
              <TabsContent value="next-steps" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-center">
                      <span>Recommended Next Steps</span>
                      {aiData.nextSteps && (
                        <Badge variant="outline" className="font-normal">
                          Generated: {formatDate(aiData.nextSteps.lastGeneratedAt)}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      AI-recommended actions for {account.name} based on current status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aiData.nextSteps ? (
                      <div className="prose max-w-none">
                        {aiData.nextSteps.recommendations.split('\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          No recommendations are available for this account.
                        </p>
                        <Button
                          onClick={handleRefreshAI}
                          className="mt-4"
                          disabled={refreshing}
                        >
                          Generate Recommendations
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  {aiData.nextSteps && (
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="text-sm text-muted-foreground">
                        Powered by Anthropic Claude
                      </div>
                      <Button variant="outline" size="sm" onClick={handleRefreshAI} disabled={refreshing}>
                        {refreshing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              {/* Task Playbook Tab */}
              <TabsContent value="playbook" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-center">
                      <span>Task Playbook</span>
                      {aiData.playbook && (
                        <Badge variant="outline" className="font-normal">
                          Generated: {formatDate(aiData.playbook.lastGeneratedAt)}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Structured action plan for {account.name} with prioritized tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aiData.playbook && aiData.playbook.tasks && aiData.playbook.tasks.length > 0 ? (
                      <>
                        <div className="mb-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-muted-foreground">
                              {aiData.playbook.tasks.filter(t => t.isCompleted).length} / {aiData.playbook.tasks.length} tasks completed
                            </span>
                          </div>
                          <Progress
                            value={(aiData.playbook.tasks.filter(t => t.isCompleted).length / aiData.playbook.tasks.length) * 100}
                            className="h-2"
                          />
                        </div>

                        <Accordion type="single" collapsible className="w-full">
                          {/* Immediate Tasks */}
                          <AccordionItem value="immediate">
                            <AccordionTrigger className="py-3">
                              <div className="flex items-center">
                                <span className="text-red-600 mr-2">●</span>
                                <span>Immediate Tasks</span>
                                <Badge className="ml-2" variant="secondary">
                                  {aiData.playbook.tasks.filter(t => t.timeline === 'immediate').length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pl-2">
                                {aiData.playbook.tasks
                                  .filter(task => task.timeline === 'immediate')
                                  .map((task: TaskPlaybookItem, index: number) => (
                                    <div key={index} className="border rounded-md p-4 bg-white">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-base">{task.title}</h4>
                                        <div className="flex space-x-2">
                                          <Badge className={getEffortColor(task.effort)}>
                                            {task.effort} effort
                                          </Badge>
                                          {task.isCheckpoint && (
                                            <Badge variant="destructive">Checkpoint</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                                      <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center">
                                          <UserCog className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                          <span>{task.owner}</span>
                                        </div>
                                        <div>
                                          <Badge variant={task.isCompleted ? "outline" : "default"}>
                                            {task.isCompleted ? 
                                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : 
                                              <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                                            }
                                            {task.isCompleted ? "Completed" : "Pending"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Short-term Tasks */}
                          <AccordionItem value="short-term">
                            <AccordionTrigger className="py-3">
                              <div className="flex items-center">
                                <span className="text-yellow-500 mr-2">●</span>
                                <span>Short-term Tasks</span>
                                <Badge className="ml-2" variant="secondary">
                                  {aiData.playbook.tasks.filter(t => t.timeline === 'short-term').length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pl-2">
                                {aiData.playbook.tasks
                                  .filter(task => task.timeline === 'short-term')
                                  .map((task: TaskPlaybookItem, index: number) => (
                                    <div key={index} className="border rounded-md p-4 bg-white">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-base">{task.title}</h4>
                                        <div className="flex space-x-2">
                                          <Badge className={getEffortColor(task.effort)}>
                                            {task.effort} effort
                                          </Badge>
                                          {task.isCheckpoint && (
                                            <Badge variant="destructive">Checkpoint</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                                      <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center">
                                          <UserCog className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                          <span>{task.owner}</span>
                                        </div>
                                        <div>
                                          <Badge variant={task.isCompleted ? "outline" : "default"}>
                                            {task.isCompleted ? 
                                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : 
                                              <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                                            }
                                            {task.isCompleted ? "Completed" : "Pending"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Long-term Tasks */}
                          <AccordionItem value="long-term">
                            <AccordionTrigger className="py-3">
                              <div className="flex items-center">
                                <span className="text-blue-500 mr-2">●</span>
                                <span>Long-term Tasks</span>
                                <Badge className="ml-2" variant="secondary">
                                  {aiData.playbook.tasks.filter(t => t.timeline === 'long-term').length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pl-2">
                                {aiData.playbook.tasks
                                  .filter(task => task.timeline === 'long-term')
                                  .map((task: TaskPlaybookItem, index: number) => (
                                    <div key={index} className="border rounded-md p-4 bg-white">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-base">{task.title}</h4>
                                        <div className="flex space-x-2">
                                          <Badge className={getEffortColor(task.effort)}>
                                            {task.effort} effort
                                          </Badge>
                                          {task.isCheckpoint && (
                                            <Badge variant="destructive">Checkpoint</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                                      <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center">
                                          <UserCog className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                          <span>{task.owner}</span>
                                        </div>
                                        <div>
                                          <Badge variant={task.isCompleted ? "outline" : "default"}>
                                            {task.isCompleted ? 
                                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : 
                                              <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                                            }
                                            {task.isCompleted ? "Completed" : "Pending"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          No task playbook is available for this account.
                        </p>
                        <Button
                          onClick={handleRefreshAI}
                          className="mt-4"
                          disabled={refreshing}
                        >
                          Generate Playbook
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  {aiData.playbook && aiData.playbook.tasks && aiData.playbook.tasks.length > 0 && (
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="text-sm text-muted-foreground">
                        Powered by Anthropic Claude
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={refreshing}
                      >
                        Convert All to Tasks
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              {/* Predictive Analytics Tab */}
              <TabsContent value="predictions" className="space-y-4">
                {aiData.predictions ? (
                  <div className="space-y-6">
                    {/* Deal Predictions Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex justify-between items-center">
                          <span>Deal Predictions</span>
                          <Badge variant="outline" className="font-normal">
                            Generated: {formatDate(aiData.predictions.lastGeneratedAt)}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          AI-powered win probability analysis for active deals
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {aiData.predictions.dealPredictions && aiData.predictions.dealPredictions.length > 0 ? (
                          <div className="space-y-4">
                            {aiData.predictions.dealPredictions.map((deal: DealPrediction, index: number) => (
                              <Card key={index}>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">{deal.dealName}</CardTitle>
                                </CardHeader>
                                <CardContent className="pb-3">
                                  <div className="space-y-4">
                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span className="text-sm">Current Win Probability</span>
                                        <span className="text-sm font-medium">{deal.currentWinProbability}%</span>
                                      </div>
                                      <Progress value={deal.currentWinProbability} className="h-2 bg-gray-100" />
                                    </div>
                                    
                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span className="text-sm">Predicted Win Probability</span>
                                        <span className="text-sm font-medium">{deal.predictedWinProbability}%</span>
                                      </div>
                                      <Progress 
                                        value={deal.predictedWinProbability} 
                                        className={`h-2 ${
                                          deal.predictedWinProbability > deal.currentWinProbability 
                                            ? "bg-green-100" 
                                            : "bg-red-100"
                                        }`} 
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium">Key Factors</h4>
                                      <ul className="text-sm space-y-1">
                                        {deal.factors.map((factor, idx) => (
                                          <li key={idx} className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            <span>{factor}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium">Suggested Actions</h4>
                                      <ul className="text-sm space-y-1">
                                        {deal.suggestedActions.map((action, idx) => (
                                          <li key={idx} className="flex items-start">
                                            <ArrowRightCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0 mt-0.5" />
                                            <span>{action}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground">No active deals to predict</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Revenue Forecast Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Revenue Forecast</CardTitle>
                        <CardDescription>
                          Projected revenue based on deal pipeline analysis
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-muted-foreground">Next 30 Days</p>
                                  <p className="text-2xl font-bold mt-1">
                                    ${aiData.predictions.revenueForecast.next30Days.amount.toLocaleString()}
                                  </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {aiData.predictions.revenueForecast.next30Days.confidence * 100}% confidence
                              </p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-muted-foreground">Next 60 Days</p>
                                  <p className="text-2xl font-bold mt-1">
                                    ${aiData.predictions.revenueForecast.next60Days.amount.toLocaleString()}
                                  </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {aiData.predictions.revenueForecast.next60Days.confidence * 100}% confidence
                              </p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-muted-foreground">Next 90 Days</p>
                                  <p className="text-2xl font-bold mt-1">
                                    ${aiData.predictions.revenueForecast.next90Days.amount.toLocaleString()}
                                  </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {aiData.predictions.revenueForecast.next90Days.confidence * 100}% confidence
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Growth Potential Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex justify-between items-center">
                          <span>Growth Potential</span>
                          <Badge>{aiData.predictions.growthPotential.score}/10</Badge>
                        </CardTitle>
                        <CardDescription>
                          Identified opportunities for account expansion
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {aiData.predictions.growthPotential.opportunities.map((opportunity: GrowthOpportunity, index: number) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium">{opportunity.title}</h3>
                                <Badge variant="outline">
                                  ${opportunity.potentialValue.toLocaleString()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{opportunity.description}</p>
                              <div className="flex justify-between text-sm">
                                <span>Probability: {opportunity.probability * 100}%</span>
                                <span>Timeframe: {opportunity.timeframe}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Risk Assessment Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Risk Assessment</CardTitle>
                        <CardDescription>
                          Identified risks with mitigation strategies
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between mb-2">
                              <h3 className="font-medium flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                                Account Risk
                              </h3>
                              <Badge variant={aiData.predictions.riskAssessment.accountRisk.score > 7 ? "destructive" : aiData.predictions.riskAssessment.accountRisk.score > 4 ? "default" : "outline"}>
                                Risk Score: {aiData.predictions.riskAssessment.accountRisk.score}/10
                              </Badge>
                            </div>
                            
                            <div className="space-y-3 pl-6">
                              <div>
                                <h4 className="text-sm font-medium mb-1">Risk Factors</h4>
                                <ul className="text-sm space-y-1">
                                  {aiData.predictions.riskAssessment.accountRisk.factors.map((factor, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-yellow-500 mr-2">•</span>
                                      <span>{factor}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-1">Mitigation Strategies</h4>
                                <ul className="text-sm space-y-1">
                                  {aiData.predictions.riskAssessment.accountRisk.mitigations.map((strategy, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                      <span>{strategy}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          {/* Project Risks */}
                          {aiData.predictions.riskAssessment.projectRisks.length > 0 && (
                            <div>
                              <h3 className="font-medium mb-3 flex items-center">
                                <Briefcase className="h-4 w-4 mr-2 text-primary" />
                                Project Risks
                              </h3>
                              
                              <div className="space-y-4">
                                {aiData.predictions.riskAssessment.projectRisks.map((project: ProjectRisk, index: number) => (
                                  <div key={index} className="border rounded-lg p-4">
                                    <div className="flex justify-between mb-2">
                                      <h4 className="font-medium">{project.projectName}</h4>
                                      <Badge variant={project.riskScore > 7 ? "destructive" : project.riskScore > 4 ? "default" : "outline"}>
                                        Risk: {project.riskScore}/10
                                      </Badge>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="text-sm font-medium mb-1">Risk Factors</h5>
                                        <ul className="text-sm space-y-1">
                                          {project.factors.map((factor, idx) => (
                                            <li key={idx} className="flex items-start">
                                              <span className="text-yellow-500 mr-2">•</span>
                                              <span>{factor}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      
                                      <div>
                                        <h5 className="text-sm font-medium mb-1">Mitigation Strategies</h5>
                                        <ul className="text-sm space-y-1">
                                          {project.mitigations.map((strategy, idx) => (
                                            <li key={idx} className="flex items-start">
                                              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                              <span>{strategy}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Relationship Health Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Relationship Health</CardTitle>
                        <CardDescription>
                          Analysis of current relationship strength with recommendations for improvement
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-5">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium mb-1">Current Health</h3>
                              <div className="flex items-center">
                                <Progress
                                  value={aiData.predictions.relationshipHealth.currentScore * 10}
                                  className="h-2 w-32 mr-3"
                                />
                                <span className="font-medium">{aiData.predictions.relationshipHealth.currentScore}/10</span>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="font-medium mb-1">Projected Health</h3>
                              <div className="flex items-center">
                                <Progress
                                  value={aiData.predictions.relationshipHealth.projectedScore * 10}
                                  className="h-2 w-32 mr-3"
                                />
                                <span className="font-medium">{aiData.predictions.relationshipHealth.projectedScore}/10</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-medium mb-2">Key Factors</h3>
                              <ul className="space-y-1 text-sm">
                                {aiData.predictions.relationshipHealth.factors.map((factor, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-primary mr-2">•</span>
                                    <span>{factor}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium mb-2">Recommendations</h3>
                              <ul className="space-y-1 text-sm">
                                {aiData.predictions.relationshipHealth.recommendations.map((rec, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <ArrowRightCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0 mt-0.5" />
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No predictive analytics available</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Generate AI predictions to get insights about deals, revenue, growth, and risks
                    </p>
                    <Button 
                      onClick={handleRefreshAI} 
                      className="mt-4"
                      disabled={refreshing}
                    >
                      Generate Predictions
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}