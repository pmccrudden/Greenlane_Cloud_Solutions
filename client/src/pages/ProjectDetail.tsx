import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeftIcon, Building2Icon, CalendarIcon, TagIcon, ClipboardListIcon, Users2Icon, BarChart4Icon, AlertCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Project, Account, Contact } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export default function ProjectDetail() {
  const [_, setLocation] = useLocation();
  const { id } = useParams();
  const projectId = parseInt(id);
  const { toast } = useToast();

  // Fetch project details
  const { data: project, isLoading: isLoadingProject, error } = useQuery<Project>({
    queryKey: ['/api/projects', projectId],
    onError: (error: any) => {
      toast({
        title: "Error loading project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch account details
  const { data: account, isLoading: isLoadingAccount } = useQuery<Account>({
    queryKey: ['/api/accounts', project?.accountId],
    enabled: !!project?.accountId,
    onError: (error: any) => {
      toast({
        title: "Error loading account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle close button click
  const handleClose = () => {
    setLocation('/projects');
  };

  if (isLoadingProject) {
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
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-36" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-36" />
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

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-4xl font-bold text-gray-300">404</div>
        <h1 className="text-2xl font-semibold text-gray-700">Project Not Found</h1>
        <p className="text-gray-500">The project you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => setLocation('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return '-';
    }
  };

  // Get status styling
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, bg: string }> = {
      'not started': { color: "text-slate-700", bg: "bg-slate-100" },
      planning: { color: "text-blue-700", bg: "bg-blue-100" },
      'in progress': { color: "text-amber-700", bg: "bg-amber-100" },
      'on hold': { color: "text-orange-700", bg: "bg-orange-100" },
      completed: { color: "text-green-700", bg: "bg-green-100" },
      cancelled: { color: "text-red-700", bg: "bg-red-100" },
    };

    return statusMap[status.toLowerCase()] || { color: "text-slate-700", bg: "bg-slate-100" };
  };

  // Format status name
  const formatStatus = (status: string) => {
    return status
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const statusStyling = getStatusBadge(project.status || 'not started');
  
  // Calculate health score color
  const getHealthColor = (score: number | undefined) => {
    if (!score) return "bg-gray-500";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${statusStyling.bg} ${statusStyling.color}`}>
                {formatStatus(project.status || 'Not Started')}
              </Badge>
              <span className="text-sm text-slate-500">
                {formatDate(project.startDate)} - {formatDate(project.endDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <Button variant="outline" onClick={() => setLocation(`/projects/${projectId}/edit`)}>
            Edit
          </Button>
          <Button>Update Status</Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Project details */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Information about this project and its progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2Icon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Account</p>
                      <Link href={`/accounts/${project.accountId}`}>
                        <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                          {account?.name || 'Loading...'}
                        </a>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Start Date</p>
                      <p className="text-slate-900 font-medium">
                        {formatDate(project.startDate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">End Date</p>
                      <p className="text-slate-900 font-medium">
                        {formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <TagIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Status</p>
                      <p className="text-slate-900 font-medium">
                        {formatStatus(project.status || 'Not Started')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <BarChart4Icon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Health Score</p>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={project.healthScore} 
                          className={`h-2 w-16 ${getHealthColor(project.healthScore)}`}
                        />
                        <p className="text-slate-900 font-medium">
                          {project.healthScore || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users2Icon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Type</p>
                      <p className="text-slate-900 font-medium">
                        {project.type || 'Implementation'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
                <div className="prose prose-sm max-w-none">
                  <p>{project.description || 'No description provided.'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Goal</h3>
                <div className="prose prose-sm max-w-none">
                  <p>{project.goal || 'No goal defined.'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Deliverables</h3>
                <div className="prose prose-sm max-w-none">
                  <p>{project.deliverables || 'No deliverables defined.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Related items */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Account</p>
                  <Link href={`/accounts/${project.accountId}`}>
                    <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                      {account?.name || 'Loading...'}
                    </a>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Users2Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Contacts</p>
                  <Link href={`/accounts/${project.accountId}/contacts`}>
                    <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                      View All Contacts
                    </a>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <AlertCircleIcon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Support Tickets</p>
                  <Link href={`/support-tickets?accountId=${project.accountId}`}>
                    <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                      View Related Tickets
                    </a>
                  </Link>
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