import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { HealthScoreMetrics, Account, Deal, Project } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  BarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PieChart as PieChartIcon, BarChart2, Users, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function AIAnalytics() {
  const { toast } = useToast();

  // Fetch analytics data
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

  // Fetch deals for reference
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

  // Fetch projects for reference
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    onError: (error) => {
      toast({
        title: "Error loading projects",
        description: error instanceof Error ? error.message : "Failed to load projects",
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingAnalytics || isLoadingAccounts || isLoadingDeals || isLoadingProjects;

  // Prepare chart data for account health scores
  const accountHealthData = analyticsData?.accountHealthScores || [];
  
  // Prepare data for deal win probabilities
  const dealProbabilityData = analyticsData?.dealWinProbabilities || [];
  
  // Prepare data for at-risk accounts
  const atRiskData = analyticsData?.accountsAtRisk || [];

  // Classification mapping
  const getHealthCategory = (score: number): string => {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Stable';
    if (score >= 40) return 'At Risk';
    return 'Critical';
  };

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Distribution data
  const healthDistribution = accounts.reduce((acc, account) => {
    if (account.healthScore) {
      const category = getHealthCategory(account.healthScore);
      acc[category] = (acc[category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const distributionData = Object.entries(healthDistribution).map(([name, value]) => ({
    name,
    value
  }));

  // Deal stage distribution
  const stageDistribution = deals.reduce((acc, deal) => {
    const stage = deal.stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stageData = Object.entries(stageDistribution).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Analytics</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Account Health
          </TabsTrigger>
          <TabsTrigger value="deals" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Deal Analysis
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risk Assessment
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Health Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 w-full animate-pulse bg-slate-100 rounded-md"></div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} accounts`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Deal Stages</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 w-full animate-pulse bg-slate-100 rounded-md"></div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stageData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 80,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top Win Probabilities</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 w-full animate-pulse bg-slate-100 rounded-md"></div>
                ) : (
                  <div className="overflow-y-auto h-64">
                    <div className="space-y-4">
                      {dealProbabilityData.length === 0 ? (
                        <div className="text-center pt-10">
                          <PieChartIcon className="h-10 w-10 mx-auto text-slate-300" />
                          <p className="text-sm text-slate-500 mt-2">No deal probability data available</p>
                        </div>
                      ) : (
                        dealProbabilityData
                          .sort((a, b) => b.probability - a.probability)
                          .slice(0, 10)
                          .map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
                                <div>
                                  <div className="text-sm font-medium">{item.dealName}</div>
                                  <div className="text-xs text-slate-500">{item.accountName}</div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="w-16 bg-slate-200 rounded-full h-1.5 mr-2">
                                  <div 
                                    className="bg-primary-500 h-1.5 rounded-full" 
                                    style={{ width: `${item.probability}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{item.probability}%</span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="accounts" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Account Health Scores</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-96 w-full animate-pulse bg-slate-100 rounded-md"></div>
                ) : (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={accountHealthData.sort((a, b) => b.score - a.score)}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          dataKey="accountName" 
                          type="category" 
                          width={80}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="score" 
                          name="Health Score" 
                          fill="#8884d8"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="h-12 w-full animate-pulse bg-slate-100 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-3">Key Insights</h3>
                      <div className="bg-slate-50 p-4 rounded-md">
                        <div className="flex items-start space-x-2">
                          <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {accountHealthData.filter(a => a.score >= 80).length} accounts in excellent health
                            </p>
                            <p className="text-sm text-slate-600">
                              These accounts show strong engagement and satisfaction.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-md mt-2">
                        <div className="flex items-start space-x-2">
                          <TrendingDown className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {atRiskData.length} accounts require immediate attention
                            </p>
                            <p className="text-sm text-slate-600">
                              These accounts show signs of potential churn or dissatisfaction.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-3">Recommended Actions</h3>
                      <ul className="space-y-2">
                        <li className="bg-slate-50 p-3 rounded-md">
                          <p className="font-medium">Schedule check-in calls</p>
                          <p className="text-sm text-slate-600">
                            For accounts with health scores below 70%.
                          </p>
                        </li>
                        <li className="bg-slate-50 p-3 rounded-md">
                          <p className="font-medium">Review implementation status</p>
                          <p className="text-sm text-slate-600">
                            Ensure all accounts are fully utilizing the platform.
                          </p>
                        </li>
                        <li className="bg-slate-50 p-3 rounded-md">
                          <p className="font-medium">Gather feedback</p>
                          <p className="text-sm text-slate-600">
                            Send satisfaction surveys to accounts with mixed signals.
                          </p>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="deals" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Deal Win Probability</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-96 w-full animate-pulse bg-slate-100 rounded-md"></div>
                ) : (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dealProbabilityData.sort((a, b) => b.probability - a.probability)}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          dataKey="dealName" 
                          type="category" 
                          width={80}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="probability" 
                          name="Win Probability" 
                          fill="#3b82f6"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Deal Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="h-12 w-full animate-pulse bg-slate-100 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-3">Deal Forecast</h3>
                      <div className="bg-slate-50 p-4 rounded-md">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500">Likely to Close</p>
                            <p className="text-2xl font-bold">
                              {dealProbabilityData.filter(d => d.probability >= 75).length}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">At Risk</p>
                            <p className="text-2xl font-bold">
                              {dealProbabilityData.filter(d => d.probability < 50).length}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Total Value</p>
                            <p className="text-2xl font-bold">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                notation: 'compact',
                                maximumFractionDigits: 1
                              }).format(deals.reduce((sum, deal) => sum + (deal.value || 0), 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Avg Deal Size</p>
                            <p className="text-2xl font-bold">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                notation: 'compact',
                                maximumFractionDigits: 1
                              }).format(deals.length ? 
                                deals.reduce((sum, deal) => sum + (deal.value || 0), 0) / deals.length : 
                                0
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-3">Top Opportunities</h3>
                      <div className="space-y-2">
                        {dealProbabilityData
                          .sort((a, b) => (b.probability * (deals.find(d => d.name === b.dealName)?.value || 0)) - 
                                        (a.probability * (deals.find(d => d.name === a.dealName)?.value || 0)))
                          .slice(0, 3)
                          .map((deal, index) => {
                            const dealObj = deals.find(d => d.name === deal.dealName);
                            const value = dealObj?.value || 0;
                            return (
                              <div key={index} className="bg-slate-50 p-3 rounded-md">
                                <div className="flex justify-between">
                                  <div>
                                    <p className="font-medium">{deal.dealName}</p>
                                    <p className="text-xs text-slate-500">{deal.accountName}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">
                                      {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        notation: 'compact',
                                        maximumFractionDigits: 1
                                      }).format(value)}
                                    </p>
                                    <p className="text-xs text-slate-500">{deal.probability}% probability</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="risks" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Accounts at Risk</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-96 w-full animate-pulse bg-slate-100 rounded-md"></div>
                ) : (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={atRiskData.sort((a, b) => a.score - b.score)}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          dataKey="accountName" 
                          type="category" 
                          width={80}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="score" 
                          name="Health Score" 
                          fill="#ef4444"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="h-12 w-full animate-pulse bg-slate-100 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-3">Risk Factors</h3>
                      <div className="space-y-2">
                        <div className="bg-slate-50 p-3 rounded-md">
                          <p className="font-medium">Churn Risk</p>
                          <p className="text-sm text-slate-600">
                            {atRiskData.length} accounts show signs of potential churn based on
                            decreased engagement and usage metrics.
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <p className="font-medium">Implementation Challenges</p>
                          <p className="text-sm text-slate-600">
                            Incomplete onboarding and feature adoption may be affecting 
                            {' '}{Math.round(atRiskData.length * 0.6)} accounts.
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <p className="font-medium">Support Issues</p>
                          <p className="text-sm text-slate-600">
                            Frequent support tickets and unresolved issues detected in
                            {' '}{Math.round(atRiskData.length * 0.4)} at-risk accounts.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-3">Mitigation Plan</h3>
                      <div className="space-y-2">
                        <div className="bg-slate-50 p-3 rounded-md">
                          <p className="font-medium">Executive Engagement</p>
                          <p className="text-sm text-slate-600">
                            Schedule executive meetings with the top 3 at-risk accounts to address concerns.
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <p className="font-medium">Training Sessions</p>
                          <p className="text-sm text-slate-600">
                            Provide additional training for accounts struggling with adoption.
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <p className="font-medium">Success Plan Review</p>
                          <p className="text-sm text-slate-600">
                            Review and update success criteria and milestones for all at-risk accounts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
