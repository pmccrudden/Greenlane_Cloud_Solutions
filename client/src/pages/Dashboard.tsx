import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Account, Deal, SupportTicket, HealthScoreMetrics } from '@/lib/types';
import MetricCard from '@/components/dashboard/MetricCard';
import RecentAccountsTable from '@/components/dashboard/RecentAccountsTable';
import OpenDealsTable from '@/components/dashboard/OpenDealsTable';
import SupportTicketsCard from '@/components/dashboard/SupportTicketsCard';
import AIAnalyticsCard from '@/components/dashboard/AIAnalyticsCard';
import DigitalJourneyCard from '@/components/dashboard/DigitalJourneyCard';

export default function Dashboard() {
  const { toast } = useToast();

  // Fetch accounts
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

  // Fetch deals
  const { data: deals = [], isLoading: isLoadingDeals } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    onError: (error) => {
      toast({
        title: "Error loading deals",
        description: error instanceof Error ? error.message : "Failed to load deals",
        variant: "destructive",
      });
    },
  });

  // Fetch support tickets
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support-tickets'],
    onError: (error) => {
      toast({
        title: "Error loading support tickets",
        description: error instanceof Error ? error.message : "Failed to load support tickets",
        variant: "destructive",
      });
    },
  });

  // Fetch AI analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery<HealthScoreMetrics>({
    queryKey: ['/api/ai-analytics/health-scores'],
    onError: (error) => {
      toast({
        title: "Error loading analytics",
        description: error instanceof Error ? error.message : "Failed to load analytics data",
        variant: "destructive",
      });
    },
  });

  // Filter active accounts
  const activeAccounts = accounts.filter(a => a.status?.toLowerCase() === 'active');
  
  // Filter open deals (not closed won/lost)
  const openDeals = deals.filter(d => !d.stage?.toLowerCase().includes('closed'));
  
  // Filter active projects
  const activeProjects = accounts.filter(a => a.status?.toLowerCase() === 'active');
  
  // Digital journey mock data
  const journeys = [
    {
      id: 1,
      name: "Welcome Journey",
      steps: 5,
      emails: 3,
      tasks: 2,
      status: "active"
    },
    {
      id: 2,
      name: "Quarterly Check-in",
      steps: 3,
      emails: 2,
      tasks: 1,
      status: "draft"
    },
    {
      id: 3,
      name: "Renewal Campaign",
      steps: 8,
      emails: 5,
      tasks: 3,
      status: "scheduled"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Accounts"
          value={activeAccounts.length.toString()}
          change={8}
          changeLabel="vs last month"
          badge="+12%"
          badgeColor="green"
          loading={isLoadingAccounts}
        />
        <MetricCard
          title="Open Deals"
          value={openDeals.length.toString()}
          change={-3}
          changeLabel="vs last month"
          changeType="decrease"
          badge="-3%"
          badgeColor="yellow"
          loading={isLoadingDeals}
        />
        <MetricCard
          title="Active Projects"
          value={activeProjects.length.toString()}
          change={5}
          changeLabel="vs last month"
          badge="+5%"
          badgeColor="green"
          loading={isLoadingAccounts}
        />
        <MetricCard
          title="Support Tickets"
          value={tickets.length.toString()}
          change={15}
          changeLabel="vs last month"
          changeType="decrease"
          badge="+15%"
          badgeColor="red"
          loading={isLoadingTickets}
        />
      </div>

      {/* Main Content Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (spans 2) */}
        <div className="lg:col-span-2 space-y-6">
          <RecentAccountsTable 
            accounts={accounts.slice(0, 3)} 
            loading={isLoadingAccounts} 
          />
          <OpenDealsTable 
            deals={openDeals.slice(0, 3).map(deal => ({
              ...deal,
              accountName: accounts.find(a => a.id === deal.accountId)?.name || 'Unknown Account'
            }))} 
            loading={isLoadingDeals} 
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <SupportTicketsCard 
            tickets={tickets.slice(0, 3).map(ticket => ({
              ...ticket,
              accountName: accounts.find(a => a.id === ticket.accountId)?.name || 'Unknown Account',
              contactName: 'Contact Name' // Would be populated from contacts in a real app
            }))} 
            loading={isLoadingTickets} 
          />
          <AIAnalyticsCard 
            topHealthScores={analyticsData?.accountHealthScores || []}
            accountsAtRisk={analyticsData?.accountsAtRisk || []}
            dealWinProbabilities={analyticsData?.dealWinProbabilities || []}
            loading={isLoadingAnalytics} 
          />
          <DigitalJourneyCard 
            journeys={journeys}
          />
        </div>
      </div>
    </div>
  );
}
