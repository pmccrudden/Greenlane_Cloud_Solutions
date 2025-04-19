import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, Save, Play, Pause, Settings, Code, Trash2, 
  RefreshCw, Database, Zap, BarChart4, GitBranch, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

// Define the type for a workflow
interface WorkflowType {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  folderId?: string | null;
  dataSource?: {
    type: string;
    objectType: string;
  };
  trigger?: {
    type: string;
    scheduleFrequency?: string;
  };
  actions?: Array<{
    type: string;
    config: Record<string, any>;
  }>;
}

export default function WorkflowView() {
  const [params] = useParams();
  const [, navigate] = useLocation();
  const workflowId = params?.id as string;
  const [activeTab, setActiveTab] = useState("design");
  const [workflowData, setWorkflowData] = useState<Partial<WorkflowType>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch workflow
  const { data: workflow, isLoading, error } = useQuery<WorkflowType>({
    queryKey: ['/api/workflows', workflowId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/workflows/${workflowId}`);
      const data = await response.json();
      setWorkflowData(data);
      return data;
    },
    enabled: !!workflowId
  });

  // Update workflow mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async (data: Partial<WorkflowType>) => {
      const response = await apiRequest('PATCH', `/api/workflows/${workflowId}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Workflow updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive"
      });
    }
  });

  // Toggle workflow status
  const toggleWorkflowStatus = () => {
    const newStatus = workflow?.status === 'active' ? 'draft' : 'active';
    updateWorkflowMutation.mutate({ status: newStatus });
  };

  // Handle save
  const handleSave = () => {
    updateWorkflowMutation.mutate(workflowData);
  };

  // Handle field change
  const handleChange = (field: string, value: any) => {
    setWorkflowData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Handle back navigation
  const handleBack = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Do you want to save before leaving?")) {
        handleSave();
      }
    }
    navigate("/workflows");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error || !workflow) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load workflow. The workflow may have been deleted or you don't have permission to view it.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/workflows")}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Back to Workflows
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Administration</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/workflows">Workflows</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>{workflow.name}</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">{workflow.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant={workflow.status === 'active' ? 'success' : 'secondary'}>
                  {workflow.status}
                </Badge>
                <span className="text-sm">
                  Last updated {new Date(workflow.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleBack}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button 
                variant={workflow.status === 'active' ? 'destructive' : 'default'} 
                onClick={toggleWorkflowStatus}
              >
                {workflow.status === 'active' ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {workflow.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
              <Button 
                variant="default" 
                onClick={handleSave} 
                disabled={!hasChanges || updateWorkflowMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="design">
              <Settings className="h-4 w-4 mr-2" />
              Design
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database className="h-4 w-4 mr-2" />
              Data Source
            </TabsTrigger>
            <TabsTrigger value="conditions">
              <GitBranch className="h-4 w-4 mr-2" />
              Conditions
            </TabsTrigger>
            <TabsTrigger value="actions">
              <Zap className="h-4 w-4 mr-2" />
              Actions
            </TabsTrigger>
            <TabsTrigger value="execution">
              <BarChart4 className="h-4 w-4 mr-2" />
              Execution History
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="h-4 w-4 mr-2" />
              JSON Editor
            </TabsTrigger>
          </TabsList>
          
          {/* Design Tab */}
          <TabsContent value="design" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Configuration</CardTitle>
                <CardDescription>
                  Configure the basic settings for your workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Workflow Name</Label>
                  <Input 
                    id="name" 
                    value={workflowData.name || ''} 
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={workflowData.description || ''} 
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={workflowData.status || ''} 
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="trigger-type">Trigger Type</Label>
                  <Select 
                    value={workflowData.trigger?.type || ''} 
                    onValueChange={(value) => handleChange('trigger', { 
                      ...workflowData.trigger,
                      type: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schedule">Schedule</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {workflowData.trigger?.type === 'schedule' && (
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-frequency">Schedule Frequency</Label>
                    <Select 
                      value={workflowData.trigger?.scheduleFrequency || ''} 
                      onValueChange={(value) => handleChange('trigger', { 
                        ...workflowData.trigger,
                        scheduleFrequency: value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Data Source Tab */}
          <TabsContent value="data" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Source Configuration</CardTitle>
                <CardDescription>
                  Configure the data sources for this workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="data-source-type">Data Source Type</Label>
                  <Select 
                    value={workflowData.dataSource?.type || ''} 
                    onValueChange={(value) => handleChange('dataSource', { 
                      ...workflowData.dataSource,
                      type: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data source type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crm_object">CRM Object</SelectItem>
                      <SelectItem value="external_api">External API</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {workflowData.dataSource?.type === 'crm_object' && (
                  <div className="grid gap-2">
                    <Label htmlFor="object-type">Object Type</Label>
                    <Select 
                      value={workflowData.dataSource?.objectType || ''} 
                      onValueChange={(value) => handleChange('dataSource', { 
                        ...workflowData.dataSource,
                        objectType: value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select object type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="deal">Deal</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="support_ticket">Support Ticket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Alert>
                  <RefreshCw className="h-4 w-4" />
                  <AlertTitle>Advanced Configuration</AlertTitle>
                  <AlertDescription>
                    Advanced data transformation and joining capabilities will be available in a future update.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other tabs would follow the same pattern */}
          {["conditions", "actions", "execution", "code"].map((tab) => (
            <TabsContent key={tab} value={tab} className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Coming Soon</CardTitle>
                  <CardDescription>This feature is under development</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <RefreshCw className="h-4 w-4" />
                    <AlertTitle>Under Development</AlertTitle>
                    <AlertDescription>
                      This section is currently being developed and will be available soon.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}