import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronDown, Sparkles, UserCog, CalendarClock, ArrowRightCircle, ClipboardCheck, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Note: We don't need to import MainLayout here as it's added in App.tsx
import { AccountAIData, TaskPlaybookItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function AIAnalytics() {
  const [, setLocation] = useLocation();
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Get accounts for the dropdown
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/accounts"],
  });

  // Get AI data for the selected account
  const { 
    data: aiData, 
    isLoading: aiDataLoading,
    refetch: refetchAiData
  } = useQuery<AccountAIData>({
    queryKey: [`/api/accounts/${selectedAccountId}/ai/all`],
    enabled: !!selectedAccountId,
  });

  // Function to handle refresh
  const handleRefresh = async () => {
    if (!selectedAccountId) return;
    
    setRefreshing(true);
    try {
      await refetchAiData();
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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Account Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Smart insights and recommendations powered by Anthropic Claude
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            className="border p-2 rounded-md"
            value={selectedAccountId || ""}
            onChange={(e) => setSelectedAccountId(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Select an account</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing || !selectedAccountId}
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
      </div>

      {!selectedAccountId && (
        <div className="flex flex-col items-center justify-center h-[60vh] border rounded-xl bg-slate-50">
          <Sparkles className="w-16 h-16 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Select an account to view AI insights</h3>
          <p className="text-muted-foreground max-w-md text-center">
            Get AI-powered account summaries, next steps recommendations, and task playbooks
          </p>
        </div>
      )}

      {selectedAccountId && (aiDataLoading || !aiData) && (
        <div className="flex flex-col items-center justify-center h-[60vh] border rounded-xl">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold">Generating AI insights...</h3>
          <p className="text-muted-foreground">This may take a moment</p>
        </div>
      )}

      {selectedAccountId && !aiDataLoading && aiData && (
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
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {aiData.insight ? (
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
                    onClick={() => setLocation(`/accounts/${selectedAccountId}`)}
                  >
                    View Account Details
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Account Summary</CardTitle>
                  <CardDescription>
                    AI-generated summary not available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No summary data is available for this account.
                    </p>
                    <Button 
                      onClick={handleRefresh} 
                      className="mt-4"
                      disabled={refreshing}
                    >
                      Generate Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="next-steps" className="space-y-4">
            {aiData.nextSteps ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex justify-between items-center">
                    <span>Recommended Next Steps</span>
                    <Badge variant="outline" className="font-normal">
                      Generated: {formatDate(aiData.nextSteps.lastGeneratedAt)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    AI-recommended actions for {aiData.nextSteps.accountName} based on current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {aiData.nextSteps.recommendations.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    Powered by Anthropic Claude
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
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
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Recommended Next Steps</CardTitle>
                  <CardDescription>
                    AI-recommended actions not available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No recommendations are available for this account.
                    </p>
                    <Button 
                      onClick={handleRefresh} 
                      className="mt-4"
                      disabled={refreshing}
                    >
                      Generate Recommendations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="playbook" className="space-y-4">
            {aiData.playbook && aiData.playbook.tasks && aiData.playbook.tasks.length > 0 ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex justify-between items-center">
                    <span>Task Playbook</span>
                    <Badge variant="outline" className="font-normal">
                      Generated: {formatDate(aiData.playbook.lastGeneratedAt)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Structured action plan for {aiData.playbook.accountName} with prioritized tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                                    <UserCog className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>{task.owner}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Outcome:</span> {task.outcome}
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
                                    <UserCog className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>{task.owner}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Outcome:</span> {task.outcome}
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
                                    <UserCog className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>{task.owner}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Outcome:</span> {task.outcome}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    Powered by Anthropic Claude
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
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
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Task Playbook</CardTitle>
                  <CardDescription>
                    Structured action plan not available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No task playbook is available for this account.
                    </p>
                    <Button 
                      onClick={handleRefresh} 
                      className="mt-4"
                      disabled={refreshing}
                    >
                      Generate Task Playbook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}