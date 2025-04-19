import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, Activity, Play, Pause, Edit, Settings, Save, ArrowLeft, 
  FileJson, Database, MessageSquare, Zap, Workflow, MoreHorizontal 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  steps?: any; // This would normally be a strongly typed object
}

// Define a rule type for our workflow rules
interface Rule {
  id: string;
  name: string;
  description?: string | null;
  conditions: Condition[];
  actions: Action[];
  enabled: boolean;
}

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string | number | boolean;
}

interface Action {
  id: string;
  type: string;
  settings: any;
}

// Sample data for our UI
const sampleRules: Rule[] = [
  {
    id: "rule-1",
    name: "High Value Deal Alert",
    description: "Send notification when a deal over $50,000 is created",
    conditions: [
      {
        id: "cond-1",
        field: "deal.value",
        operator: ">",
        value: 50000
      }
    ],
    actions: [
      {
        id: "action-1",
        type: "notification",
        settings: {
          channel: "email",
          recipients: "team-leads",
          template: "high-value-deal"
        }
      }
    ],
    enabled: true
  },
  {
    id: "rule-2",
    name: "Inactive Account Follow-up",
    description: "Create task when account has been inactive for 90 days",
    conditions: [
      {
        id: "cond-2",
        field: "account.lastActivity",
        operator: "<",
        value: "90-days-ago"
      }
    ],
    actions: [
      {
        id: "action-2",
        type: "create_task",
        settings: {
          assignee: "account-owner",
          dueDate: "+7-days",
          priority: "medium",
          template: "follow-up-call"
        }
      }
    ],
    enabled: false
  }
];

const datasetOptions = [
  {
    label: "Accounts",
    value: "accounts",
    fields: [
      { name: "name", label: "Account Name", type: "string" },
      { name: "industry", label: "Industry", type: "string" },
      { name: "lastActivity", label: "Last Activity Date", type: "date" },
      { name: "healthScore", label: "Health Score", type: "number" },
    ]
  },
  {
    label: "Deals",
    value: "deals",
    fields: [
      { name: "name", label: "Deal Name", type: "string" },
      { name: "value", label: "Value", type: "number" },
      { name: "stage", label: "Stage", type: "string" },
      { name: "probability", label: "Win Probability", type: "number" },
    ]
  },
  {
    label: "Contacts",
    value: "contacts",
    fields: [
      { name: "firstName", label: "First Name", type: "string" },
      { name: "lastName", label: "Last Name", type: "string" },
      { name: "email", label: "Email", type: "string" },
      { name: "lastContact", label: "Last Contact Date", type: "date" },
    ]
  }
];

const actionTypes = [
  { label: "Send Email", value: "send_email" },
  { label: "Create Task", value: "create_task" },
  { label: "Update Record", value: "update_record" },
  { label: "Post to Slack", value: "post_to_slack" },
  { label: "Webhook", value: "webhook" },
];

export default function WorkflowView() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("rules");
  const [editMode, setEditMode] = useState(false);
  const [workflowData, setWorkflowData] = useState<WorkflowType | null>(null);
  const [newRuleDialog, setNewRuleDialog] = useState(false);
  const [rules, setRules] = useState<Rule[]>(sampleRules);
  
  // Fetch workflow data
  const { data: workflow, isLoading, error } = useQuery<WorkflowType>({
    queryKey: [`/api/workflows/${id}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/workflows/${id}`);
      return await response.json();
    }
  });

  useEffect(() => {
    if (workflow) {
      setWorkflowData(workflow);
    }
  }, [workflow]);

  const handleRuleToggle = (ruleId: string, enabled: boolean) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled } : rule
      )
    );
  };

  const handleBackToList = () => {
    navigate("/workflows");
  };

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-2 mb-8">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-9 w-1/3" />
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-[400px] w-full" />
            </div>
            <div>
              <Skeleton className="h-[200px] w-full mb-4" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <Button variant="ghost" className="mb-6" onClick={handleBackToList}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Workflows
          </Button>
          
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Error loading workflow. Please try again later.
            </AlertDescription>
          </Alert>
          
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* Header with workflow name and actions */}
        <div className="flex flex-col gap-1 mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{workflowData?.name || "Workflow Details"}</h1>
            <Badge variant={workflowData?.status === "active" ? "success" : workflowData?.status === "draft" ? "default" : "secondary"} className="ml-2">
              {workflowData?.status || "Status"}
            </Badge>
          </div>
          <p className="text-muted-foreground ml-10">
            {workflowData?.description || "No description provided"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content area */}
          <div className="col-span-1 lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center p-4 border-b">
                  <div className="w-full">
                    <TabsList className="mb-0">
                      <TabsTrigger value="rules">Rules</TabsTrigger>
                      <TabsTrigger value="datasets">Datasets</TabsTrigger>
                      <TabsTrigger value="code">Code View</TabsTrigger>
                      <TabsTrigger value="execution">Execution History</TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Play className="mr-2 h-4 w-4" />
                      Test
                    </Button>
                    <Button variant="outline" size="sm">
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
                
                <div className="p-4">
                  <TabsContent value="rules" className="mt-0">
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-lg font-medium">Rules</h3>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Rule
                      </Button>
                    </div>
                    
                    {rules.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Rules Yet</h3>
                        <p className="text-muted-foreground mb-6">
                          Rules define when and how your workflow runs
                        </p>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Create First Rule
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {rules.map(rule => (
                          <Card key={rule.id}>
                            <CardHeader className="py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-md">{rule.name}</CardTitle>
                                  <Badge variant={rule.enabled ? "outline" : "secondary"} className="ml-2">
                                    {rule.enabled ? "Enabled" : "Disabled"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch 
                                    checked={rule.enabled} 
                                    onCheckedChange={(checked) => handleRuleToggle(rule.id, checked)} 
                                  />
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Play className="mr-2 h-4 w-4" />
                                        Test
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive">
                                        <Trash className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              {rule.description && (
                                <CardDescription>{rule.description}</CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="pb-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2 text-sm">Conditions</h4>
                                  <div className="space-y-2">
                                    {rule.conditions.map(condition => (
                                      <div key={condition.id} className="text-sm bg-muted p-2 rounded-md">
                                        <span className="font-medium">{condition.field}</span>
                                        <span className="mx-1">{condition.operator}</span>
                                        <span>{condition.value.toString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2 text-sm">Actions</h4>
                                  <div className="space-y-2">
                                    {rule.actions.map(action => (
                                      <div key={action.id} className="text-sm bg-muted p-2 rounded-md">
                                        <span className="font-medium capitalize">{action.type.replace("_", " ")}</span>
                                        <span className="text-xs text-muted-foreground block">
                                          {Object.entries(action.settings).map(([key, value]) => (
                                            <span key={key} className="mr-2">
                                              {key}: {value as string}
                                            </span>
                                          ))}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="datasets" className="mt-0">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Datasets</h3>
                      <p className="text-muted-foreground">
                        Configure the data sources your workflow can access and manipulate
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {datasetOptions.map(dataset => (
                        <Card key={dataset.value} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-md flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                {dataset.label}
                              </CardTitle>
                              <Badge variant="outline" className="ml-auto">
                                {dataset.fields.length} fields
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="text-sm">
                            <div className="space-y-1">
                              {dataset.fields.slice(0, 3).map(field => (
                                <div key={field.name} className="flex justify-between">
                                  <span>{field.label}</span>
                                  <span className="text-muted-foreground">{field.type}</span>
                                </div>
                              ))}
                              {dataset.fields.length > 3 && (
                                <div className="text-muted-foreground text-center mt-2">
                                  + {dataset.fields.length - 3} more fields
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="bg-muted py-2">
                            <Button variant="ghost" size="sm" className="w-full">
                              <Edit className="h-4 w-4 mr-2" />
                              Configure
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                      
                      <Card className="border-dashed">
                        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                          <Button variant="outline" className="mb-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Custom Dataset
                          </Button>
                          <p className="text-sm text-muted-foreground text-center">
                            Connect to external data sources or create custom datasets
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="code" className="mt-0">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Code View</h3>
                      <p className="text-muted-foreground">
                        Advanced view of the workflow configuration
                      </p>
                    </div>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-md">JSON Configuration</CardTitle>
                          <Badge variant="outline">Read-only</Badge>
                        </div>
                        <CardDescription>
                          This is the underlying configuration for your workflow
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted p-4 rounded-md font-mono text-xs overflow-auto max-h-96">
                          <pre>{JSON.stringify({
                            id: workflowData?.id,
                            name: workflowData?.name,
                            description: workflowData?.description,
                            status: workflowData?.status,
                            rules: rules,
                            datasets: datasetOptions.map(d => d.value),
                            version: "1.0"
                          }, null, 2)}</pre>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="execution" className="mt-0">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Execution History</h3>
                      <p className="text-muted-foreground">
                        View past runs and their results
                      </p>
                    </div>
                    
                    <div className="text-center py-12">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Execution History</h3>
                      <p className="text-muted-foreground mb-6">
                        This workflow hasn't been run yet
                      </p>
                      <Button>
                        <Play className="mr-2 h-4 w-4" />
                        Run Now
                      </Button>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
          
          {/* Sidebar with workflow settings */}
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Workflow Settings</CardTitle>
                <CardDescription>
                  Configure how this workflow operates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workflow-status">Status</Label>
                  <Select
                    value={workflowData?.status || "draft"}
                    disabled={!editMode}
                  >
                    <SelectTrigger id="workflow-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflow-trigger">Trigger Type</Label>
                  <Select
                    value="event"
                    disabled={!editMode}
                  >
                    <SelectTrigger id="workflow-trigger">
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Event Based</SelectItem>
                      <SelectItem value="schedule">Scheduled</SelectItem>
                      <SelectItem value="api">API Triggered</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Permissions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="run-as-admin" className="cursor-pointer">Run as Admin</Label>
                      <Switch id="run-as-admin" disabled={!editMode} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="allow-manual" className="cursor-pointer">Allow Manual Execution</Label>
                      <Switch id="allow-manual" checked={true} disabled={!editMode} />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Integration</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="api-access" className="cursor-pointer">API Access</Label>
                      <Switch id="api-access" disabled={!editMode} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="webhook" className="cursor-pointer">Webhook Trigger</Label>
                      <Switch id="webhook" disabled={!editMode} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setEditMode(!editMode)}>
                  {editMode ? "Cancel" : "Edit"}
                </Button>
                {editMode && <Button>Save Changes</Button>}
              </CardFooter>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-md">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Created</span>
                      <span>{new Date(workflowData?.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Updated</span>
                      <span>{new Date(workflowData?.updatedAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Rules</span>
                      <span>{rules.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Enabled Rules</span>
                      <span>{rules.filter(r => r.enabled).length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Helper component for Plus icon
function Plus({ className, ...props }: React.ComponentProps<typeof Activity>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// Helper component for Trash icon
function Trash({ className, ...props }: React.ComponentProps<typeof Activity>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}