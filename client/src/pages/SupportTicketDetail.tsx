import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeftIcon, Building2Icon, AlertCircle, AlertTriangle, HelpCircle, CalendarIcon, Mail, MessageSquare, Clock, User2Icon, PaperclipIcon, SendIcon, BarChart4Icon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SupportTicket, Account, Contact, TicketActivity } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SupportTicketDetail() {
  const [_, setLocation] = useLocation();
  const { id } = useParams();
  const ticketId = parseInt(id);
  const { toast } = useToast();
  const [newActivity, setNewActivity] = useState('');

  // Fetch ticket details
  const { data: ticket, isLoading: isLoadingTicket, error } = useQuery<SupportTicket>({
    queryKey: ['/api/support-tickets', ticketId],
    onError: (error: any) => {
      toast({
        title: "Error loading ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch account details
  const { data: account, isLoading: isLoadingAccount } = useQuery<Account>({
    queryKey: ['/api/accounts', ticket?.accountId],
    enabled: !!ticket?.accountId,
    onError: (error: any) => {
      toast({
        title: "Error loading account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch ticket activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<TicketActivity[]>({
    queryKey: ['/api/support-tickets', ticketId, 'activities'],
    enabled: !!ticket,
    onError: (error: any) => {
      toast({
        title: "Error loading ticket activities",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create new activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (data: { content: string, ticketId: number }) => {
      const res = await apiRequest('POST', `/api/support-tickets/${data.ticketId}/activities`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets', ticketId, 'activities'] });
      setNewActivity('');
      toast({
        title: "Activity added",
        description: "Your response has been added to the ticket",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle close button click
  const handleClose = () => {
    setLocation('/support-tickets');
  };

  // Handle add activity
  const handleAddActivity = () => {
    if (!newActivity.trim()) return;
    
    createActivityMutation.mutate({ 
      content: newActivity, 
      ticketId 
    });
  };

  if (isLoadingTicket) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-36 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-4xl font-bold text-gray-300">404</div>
        <h1 className="text-2xl font-semibold text-gray-700">Support Ticket Not Found</h1>
        <p className="text-gray-500">The support ticket you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => setLocation('/support-tickets')}>
          Back to Support Tickets
        </Button>
      </div>
    );
  }

  // Format relative time
  const formatTime = (date: Date | string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  // Format absolute date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return '-';
    }
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

  // Get badge for status
  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'new':
        return "bg-blue-100 text-blue-800";
      case 'in progress':
        return "bg-amber-100 text-amber-800";
      case 'waiting on customer':
        return "bg-purple-100 text-purple-800";
      case 'waiting on third party':
        return "bg-indigo-100 text-indigo-800";
      case 'resolved':
        return "bg-green-100 text-green-800";
      case 'closed':
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Get icon and badge for source
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
          icon: <CalendarIcon className="w-4 h-4" />,
          badge: "bg-slate-100 text-slate-800"
        };
    }
  };

  const priorityIcon = getPriorityIcon(ticket.priority);
  const sourceInfo = getSourceInfo(ticket.source);
  const priorityBadge = getPriorityBadge(ticket.priority);
  const statusBadge = getStatusBadge(ticket.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusBadge}>
                {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
              </Badge>
              <Badge className={priorityBadge}>
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              </Badge>
              <Badge className={sourceInfo.badge}>
                <span className="mr-1">{sourceInfo.icon}</span>
                {ticket.source.charAt(0).toUpperCase() + ticket.source.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <Button variant="outline" onClick={() => setLocation(`/support-tickets/${ticketId}/edit`)}>
            Edit
          </Button>
          <Button>Update Status</Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Ticket details & communication */}
        <div className="md:col-span-2 space-y-6">
          {/* Ticket description */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
              <CardDescription>
                Issue reported on {formatDate(ticket.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p>{ticket.description}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Communication history */}
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 pr-4">
                <div className="space-y-6">
                  {/* Initial ticket */}
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        CU
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium">Customer</div>
                        <div className="text-xs text-slate-500">{formatTime(ticket.createdAt)}</div>
                      </div>
                      <div className="bg-slate-100 p-3 rounded-lg">
                        <p className="text-sm">{ticket.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Activities */}
                  {isLoadingActivities ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center text-sm text-slate-500 py-4">
                      No activities yet. Be the first to respond.
                    </div>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-slate-200 text-slate-700">
                            {activity.createdBy?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium">{activity.createdBy || 'User'}</div>
                            <div className="text-xs text-slate-500">{formatTime(activity.createdAt)}</div>
                          </div>
                          <div className="bg-slate-100 p-3 rounded-lg">
                            <p className="text-sm">{activity.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <div className="w-full space-y-2">
                <Textarea 
                  placeholder="Type your response..." 
                  rows={3}
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                />
                <div className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <PaperclipIcon className="h-4 w-4 mr-2" />
                    Attach
                  </Button>
                  <Button size="sm" onClick={handleAddActivity}>
                    <SendIcon className="h-4 w-4 mr-2" />
                    Send Response
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right column - Associated information */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Account</p>
                  <Link href={`/accounts/${ticket.accountId}`}>
                    <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                      {account?.name || 'Loading...'}
                    </a>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User2Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Contact</p>
                  <p className="text-slate-900 font-medium">
                    {ticket.contactId ? 'View Contact' : 'No contact assigned'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Priority</p>
                  <p className="text-slate-900 font-medium flex items-center gap-1">
                    {priorityIcon}
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Created</p>
                  <p className="text-slate-900 font-medium">
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Source</p>
                  <p className="text-slate-900 font-medium flex items-center gap-1">
                    {sourceInfo.icon}
                    {ticket.source.charAt(0).toUpperCase() + ticket.source.slice(1)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <BarChart4Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Account Health</p>
                  <p className="text-slate-900 font-medium">
                    {account?.healthScore || '-'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}