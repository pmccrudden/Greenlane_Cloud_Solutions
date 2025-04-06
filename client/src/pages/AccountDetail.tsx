import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Account, Contact, Deal, Project, SupportTicket } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
  MoreHorizontal
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
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { AddDealDialog } from '@/components/deals/AddDealDialog';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import { AddSupportTicketDialog } from '@/components/support/AddSupportTicketDialog';

export default function AccountDetail() {
  const [, params] = useRoute<{ id: string }>('/accounts/:id');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
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
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
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
                        <TableCell>{contact.jobTitle || '—'}</TableCell>
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
                        <TableCell>${deal.amount?.toLocaleString() || '—'}</TableCell>
                        <TableCell>{deal.stage || '—'}</TableCell>
                        <TableCell>{deal.probability ? `${deal.probability}%` : '—'}</TableCell>
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
      </Tabs>
    </div>
  );
}