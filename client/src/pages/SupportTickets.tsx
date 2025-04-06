import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { SupportTicket, Account, TicketActivity } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Search, Plus, MoreHorizontal, MessageSquare, Mail, AlertCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TicketForm from '@/components/support/TicketForm';
import { Textarea } from '@/components/ui/textarea';

export default function SupportTickets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const { toast } = useToast();

  // Fetch tickets
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support-tickets'],
    onError: (error) => {
      toast({
        title: "Error loading support tickets",
        description: error instanceof Error ? error.message : "Failed to load tickets",
        variant: "destructive",
      });
    },
  });

  // Fetch accounts for reference
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    onError: (error) => {
      toast({
        title: "Error loading accounts",
        description: error instanceof Error ? error.message : "Failed to load accounts",
        variant: "destructive",
      });
    },
  });

  // Filter tickets based on search query
  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (accounts.find(a => a.id === ticket.accountId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // View ticket details
  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  // Get icon based on priority
  const getPriorityIcon = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
      default:
        return <HelpCircle className="w-5 h-5 text-green-600" />;
    }
  };

  // Get background color based on priority
  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high':
        return "bg-red-100";
      case 'medium':
        return "bg-yellow-100";
      case 'low':
      default:
        return "bg-green-100";
    }
  };

  // Get badge for priority
  const getPriorityBadge = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high':
        return "bg-red-100 text-red-800";
      case 'medium':
        return "bg-yellow-100 text-yellow-800";
      case 'low':
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      open: "bg-blue-100 text-blue-800",
      "in progress": "bg-purple-100 text-purple-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-slate-100 text-slate-800",
    };

    return statusMap[status.toLowerCase()] || "bg-slate-100 text-slate-800";
  };

  // Get source icon and badge
  const getSourceInfo = (source: string) => {
    switch(source.toLowerCase()) {
      case 'email':
        return {
          icon: <Mail className="w-4 h-4" />,
          badge: "bg-blue-100 text-blue-800"
        };
      case 'slack':
        return {
          icon: <MessageSquare className="w-4 h-4" />,
          badge: "bg-purple-100 text-purple-800"
        };
      case 'manual':
      default:
        return {
          icon: <MessageSquare className="w-4 h-4" />,
          badge: "bg-slate-100 text-slate-800"
        };
    }
  };

  // Get account name by ID
  const getAccountName = (accountId: number | undefined) => {
    if (!accountId) return '—';
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : '—';
  };

  // Format relative time
  const formatTime = (date: Date | string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  const isLoading = isLoadingTickets || isLoadingAccounts;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>New Ticket</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <TicketForm 
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
              }} 
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Support Tickets</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search tickets..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading state
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="h-12 bg-slate-100 rounded"></div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            // Empty state
            <div className="text-center py-10">
              <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No tickets found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first support ticket'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Ticket
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Table with tickets
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => {
                    const priorityIcon = getPriorityIcon(ticket.priority);
                    const priorityColor = getPriorityColor(ticket.priority);
                    const sourceInfo = getSourceInfo(ticket.source);
                    
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 h-8 w-8 flex items-center justify-center ${priorityColor} rounded-full mr-2`}>
                              {priorityIcon}
                            </div>
                            <div>
                              <div className="font-medium">{ticket.subject}</div>
                              <div className="text-sm text-slate-500 truncate max-w-xs">
                                {ticket.description.substring(0, 60)}
                                {ticket.description.length > 60 ? '...' : ''}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {ticket.accountId ? (
                            <a 
                              href={`/accounts/${ticket.accountId}`} 
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/accounts/${ticket.accountId}`;
                              }}
                            >
                              {getAccountName(ticket.accountId)}
                            </a>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(ticket.priority)}`}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ticket.status)}`}>
                            {ticket.status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center w-fit ${sourceInfo.badge}`}>
                            <span className="mr-1">{sourceInfo.icon}</span>
                            {ticket.source.charAt(0).toUpperCase() + ticket.source.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatTime(ticket.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                                View Details
                              </DropdownMenuItem>
                              {ticket.accountId && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    window.location.href = `/accounts/${ticket.accountId}`;
                                  }}
                                >
                                  View Account
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Ticket Dialog */}
      {selectedTicket && (
        <Dialog 
          open={!!selectedTicket} 
          onOpenChange={(open) => !open && setSelectedTicket(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Ticket: {selectedTicket.subject}</DialogTitle>
            </DialogHeader>
            <TicketDetail 
              ticket={selectedTicket} 
              accountName={getAccountName(selectedTicket.accountId)} 
              onUpdate={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface TicketDetailProps {
  ticket: SupportTicket;
  accountName: string;
  onUpdate: () => void;
}

function TicketDetail({ ticket, accountName, onUpdate }: TicketDetailProps) {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch ticket activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<TicketActivity[]>({
    queryKey: [`/api/support-tickets/${ticket.id}/activities`],
    onError: (error) => {
      toast({
        title: "Error loading ticket activities",
        description: error instanceof Error ? error.message : "Failed to load activities",
        variant: "destructive",
      });
    },
  });

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high':
        return "bg-red-100 text-red-800";
      case 'medium':
        return "bg-yellow-100 text-yellow-800";
      case 'low':
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      open: "bg-blue-100 text-blue-800",
      "in progress": "bg-purple-100 text-purple-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-slate-100 text-slate-800",
    };

    return statusMap[status.toLowerCase()] || "bg-slate-100 text-slate-800";
  };

  // Get source badge
  const getSourceBadge = (source: string) => {
    switch(source.toLowerCase()) {
      case 'email':
        return "bg-blue-100 text-blue-800";
      case 'slack':
        return "bg-purple-100 text-purple-800";
      case 'manual':
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Submit response
  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      toast({
        title: "Response required",
        description: "Please enter a response before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('POST', `/api/support-tickets/${ticket.id}/activities`, {
        ticketId: ticket.id,
        userId: 1, // Use the current user ID in a real app
        action: 'response',
        content: response,
      });
      
      // Also update the ticket status
      await apiRequest('PUT', `/api/support-tickets/${ticket.id}`, {
        status: ticket.status === 'open' ? 'in progress' : ticket.status,
      });
      
      toast({
        title: "Response added",
        description: "Your response has been added to the ticket",
      });
      
      // Clear the response field
      setResponse('');
      
      // Refresh the ticket data
      queryClient.invalidateQueries({ queryKey: [`/api/support-tickets/${ticket.id}/activities`] });
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      
      onUpdate();
    } catch (error) {
      toast({
        title: "Failed to add response",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update ticket status
  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiRequest('PUT', `/api/support-tickets/${ticket.id}`, {
        status: newStatus,
      });
      
      // Add activity
      await apiRequest('POST', `/api/support-tickets/${ticket.id}/activities`, {
        ticketId: ticket.id,
        userId: 1, // Use the current user ID in a real app
        action: 'status_change',
        content: `Status changed to ${newStatus}`,
      });
      
      toast({
        title: "Status updated",
        description: `Ticket status updated to ${newStatus}`,
      });
      
      // Refresh the ticket data
      queryClient.invalidateQueries({ queryKey: [`/api/support-tickets/${ticket.id}/activities`] });
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      
      onUpdate();
    } catch (error) {
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Format date
  const formatDate = (date: Date | string) => {
    try {
      return new Date(date).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="activities">
          Activities ({activities.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="details">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-slate-500">Account</h3>
              <p>
                {ticket.accountId ? (
                  <a 
                    href={`/accounts/${ticket.accountId}`} 
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/accounts/${ticket.accountId}`;
                    }}
                  >
                    {accountName}
                  </a>
                ) : (
                  accountName || '—'
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Created</h3>
              <p>{formatDate(ticket.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Priority</h3>
              <div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(ticket.priority)}`}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Status</h3>
              <div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ticket.status)}`}>
                  {ticket.status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Source</h3>
              <div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceBadge(ticket.source)}`}>
                  {ticket.source.charAt(0).toUpperCase() + ticket.source.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Last Updated</h3>
              <p>{formatDate(ticket.updatedAt)}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
            <div className="p-4 bg-slate-50 rounded-md whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Add Response</h3>
            <Textarea 
              value={response} 
              onChange={(e) => setResponse(e.target.value)} 
              placeholder="Type your response here..." 
              className="min-h-32"
            />
            <div className="flex justify-between mt-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Change Status</h4>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('open')}
                    disabled={ticket.status === 'open'}
                  >
                    Open
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('in progress')}
                    disabled={ticket.status === 'in progress'}
                  >
                    In Progress
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('resolved')}
                    disabled={ticket.status === 'resolved'}
                  >
                    Resolved
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusChange('closed')}
                    disabled={ticket.status === 'closed'}
                  >
                    Closed
                  </Button>
                </div>
              </div>
              <Button onClick={handleSubmitResponse} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Response'}
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="activities">
        <div className="space-y-4">
          {isLoadingActivities ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-24 bg-slate-100 rounded"></div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No activities yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Add a response to start the conversation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">
                        {activity.userName || 'User'} - {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatDate(activity.createdAt)}
                      </div>
                    </div>
                    {activity.content && (
                      <div className="p-4 bg-slate-50 rounded-md whitespace-pre-wrap">
                        {activity.content}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
