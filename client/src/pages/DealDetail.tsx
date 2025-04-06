import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeftIcon, Building2Icon, CalendarIcon, TagIcon, BriefcaseIcon, Users2Icon, DollarSignIcon, BarChart4Icon, PercentIcon } from 'lucide-react';
import { format } from 'date-fns';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Deal, Account, Contact } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DealDetail() {
  const [_, setLocation] = useLocation();
  const { id } = useParams();
  const dealId = parseInt(id);
  const { toast } = useToast();

  // Fetch deal details
  const { data: deal, isLoading: isLoadingDeal, error } = useQuery<Deal>({
    queryKey: ['/api/deals', dealId],
    onError: (error: any) => {
      toast({
        title: "Error loading deal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch account details
  const { data: account, isLoading: isLoadingAccount } = useQuery<Account>({
    queryKey: ['/api/accounts', deal?.accountId],
    enabled: !!deal?.accountId,
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
    setLocation('/deals');
  };

  if (isLoadingDeal) {
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

  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-4xl font-bold text-gray-300">404</div>
        <h1 className="text-2xl font-semibold text-gray-700">Deal Not Found</h1>
        <p className="text-gray-500">The deal you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => setLocation('/deals')}>
          Back to Deals
        </Button>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return '-';
    }
  };

  // Get stage styling
  const getStageBadge = (stage: string) => {
    const stageMap: Record<string, { color: string, bg: string }> = {
      prospecting: { color: "text-slate-700", bg: "bg-slate-100" },
      qualification: { color: "text-slate-700", bg: "bg-slate-100" },
      needs_analysis: { color: "text-blue-700", bg: "bg-blue-100" },
      value_proposition: { color: "text-blue-700", bg: "bg-blue-100" },
      proposal: { color: "text-purple-700", bg: "bg-purple-100" },
      negotiation: { color: "text-blue-700", bg: "bg-blue-100" },
      closing: { color: "text-green-700", bg: "bg-green-100" },
      closed_won: { color: "text-green-700", bg: "bg-green-100" },
      closed_lost: { color: "text-red-700", bg: "bg-red-100" },
    };

    return stageMap[stage.toLowerCase().replace(/ /g, '_')] || { color: "text-slate-700", bg: "bg-slate-100" };
  };

  // Format stage name
  const formatStage = (stage: string) => {
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const stageStyling = getStageBadge(deal.stage || 'prospecting');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{deal.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${stageStyling.bg} ${stageStyling.color}`}>
                {formatStage(deal.stage || 'Prospecting')}
              </Badge>
              <span className="text-sm text-slate-500">
                {formatCurrency(deal.value)} • {formatDate(deal.closeDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <Button variant="outline" onClick={() => setLocation(`/deals/${dealId}/edit`)}>
            Edit
          </Button>
          <Button>Update Stage</Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Deal details */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Deal Details</CardTitle>
              <CardDescription>
                Information about this deal and its progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2Icon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Account</p>
                      <Link href={`/accounts/${deal.accountId}`}>
                        <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                          {account?.name || 'Loading...'}
                        </a>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSignIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Value</p>
                      <p className="text-slate-900 font-medium">
                        {formatCurrency(deal.value)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Close Date</p>
                      <p className="text-slate-900 font-medium">
                        {formatDate(deal.closeDate)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <TagIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Stage</p>
                      <p className="text-slate-900 font-medium">
                        {formatStage(deal.stage || 'Prospecting')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <PercentIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Win Probability</p>
                      <p className="text-slate-900 font-medium">
                        {deal.winProbability || 0}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users2Icon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Type</p>
                      <p className="text-slate-900 font-medium">
                        {deal.type || 'New Business'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
                <div className="prose prose-sm max-w-none">
                  <p>{deal.description || 'No description provided.'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Next Steps</h3>
                <div className="prose prose-sm max-w-none">
                  <p>{deal.nextSteps || 'No next steps defined.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Related items */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Account</p>
                  <Link href={`/accounts/${deal.accountId}`}>
                    <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                      {account?.name || 'Loading...'}
                    </a>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <BriefcaseIcon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Projects</p>
                  <Link href={`/accounts/${deal.accountId}/projects`}>
                    <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                      View All Projects
                    </a>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Users2Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Contacts</p>
                  <Link href={`/accounts/${deal.accountId}/contacts`}>
                    <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                      View All Contacts
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