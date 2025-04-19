import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { 
  Workflow, Plus, AlertCircle, Table, Grid, FolderPlus, Edit, Trash2, FolderClosed,
  ChevronRight, Check, X, MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

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
}

// Define the type for a folder
interface FolderType {
  id: string;
  name: string;
  parentId?: string | null;
}

export default function WorkflowsPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [workflowFormData, setWorkflowFormData] = useState({
    name: "",
    description: "",
    status: "draft"
  });
  const [createWorkflowOpen, setCreateWorkflowOpen] = useState(false);
  const [folderFormData, setFolderFormData] = useState({
    name: "",
    parentId: null as string | null
  });
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Sample folders for now
  const folders: FolderType[] = [
    { id: "folder-1", name: "Sales Workflows" },
    { id: "folder-2", name: "Support Workflows" },
    { id: "folder-3", name: "Marketing Automation" }
  ];
  
  // Fetch workflows
  const { data: workflows, isLoading, error } = useQuery<WorkflowType[]>({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/workflows');
      return await response.json();
    }
  });

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (data: typeof workflowFormData) => {
      const response = await apiRequest('POST', '/api/workflows', {
        ...data,
        folderId: selectedFolder
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      setWorkflowFormData({ name: "", description: "", status: "draft" });
      setCreateWorkflowOpen(false);
      toast({
        title: "Success",
        description: "Workflow created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive"
      });
    }
  });

  const handleCreateWorkflow = () => {
    createWorkflowMutation.mutate(workflowFormData);
  };

  const handleCreateFolder = () => {
    // Would normally call API here
    toast({
      title: "Success",
      description: "Folder created successfully",
    });
    setCreateFolderOpen(false);
    setFolderFormData({ name: "", parentId: null });
  };

  // Filter workflows by selected folder
  const filteredWorkflows = workflows?.filter(workflow => 
    !selectedFolder || workflow.folderId === selectedFolder
  );

  // Handle folder selection
  const handleFolderClick = (folderId: string | null) => {
    setSelectedFolder(folderId);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Workflows</h1>
            <p className="text-muted-foreground">Create and manage automated workflows and rules</p>
          </div>
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCreateFolderOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="bg-muted rounded-md p-1 flex">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setViewMode("grid")}
              >
                <Grid size={16} />
              </Button>
              <Button 
                variant={viewMode === "table" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setViewMode("table")}
              >
                <Table size={16} />
              </Button>
            </div>
            <Dialog open={createWorkflowOpen} onOpenChange={setCreateWorkflowOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={18} />
                  Create Workflow
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workflow</DialogTitle>
                  <DialogDescription>
                    Configure the basic settings for your new workflow.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Workflow Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter workflow name" 
                      value={workflowFormData.name}
                      onChange={(e) => setWorkflowFormData({...workflowFormData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Enter workflow description" 
                      value={workflowFormData.description}
                      onChange={(e) => setWorkflowFormData({...workflowFormData, description: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={workflowFormData.status} 
                      onValueChange={(value) => setWorkflowFormData({...workflowFormData, status: value})}
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
                    <Label htmlFor="folder">Folder</Label>
                    <Select 
                      value={selectedFolder || "none"} 
                      onValueChange={(value) => setSelectedFolder(value === "none" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select folder (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No folder</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateWorkflowOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleCreateWorkflow} 
                    disabled={!workflowFormData.name || createWorkflowMutation.isPending}
                  >
                    {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                  <DialogDescription>
                    Create a folder to organize your workflows.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="folderName">Folder Name</Label>
                    <Input 
                      id="folderName" 
                      placeholder="Enter folder name" 
                      value={folderFormData.name}
                      onChange={(e) => setFolderFormData({...folderFormData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="parentFolder">Parent Folder (Optional)</Label>
                    <Select 
                      value={folderFormData.parentId || "none"} 
                      onValueChange={(value) => setFolderFormData({...folderFormData, parentId: value === "none" ? null : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No parent folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No parent folder</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleCreateFolder} 
                    disabled={!folderFormData.name}
                  >
                    Create Folder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Folder Sidebar */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-md">Folders</CardTitle>
              </CardHeader>
              <CardContent className="py-1">
                <div className="space-y-1">
                  <Button 
                    variant={selectedFolder === null ? "secondary" : "ghost"} 
                    className="w-full justify-start text-sm font-normal"
                    onClick={() => handleFolderClick(null)}
                  >
                    <Workflow className="h-4 w-4 mr-2" />
                    All Workflows
                  </Button>
                  {folders.map((folder) => (
                    <Button 
                      key={folder.id}
                      variant={selectedFolder === folder.id ? "secondary" : "ghost"} 
                      className="w-full justify-start text-sm font-normal"
                      onClick={() => handleFolderClick(folder.id)}
                    >
                      <FolderClosed className="h-4 w-4 mr-2" />
                      {folder.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="py-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm font-normal"
                  onClick={() => setCreateFolderOpen(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9 lg:col-span-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All Workflows</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="pt-4">
                {isLoading ? (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="w-full">
                          <CardHeader className="pb-2">
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-5/6" />
                          </CardContent>
                          <CardFooter>
                            <Skeleton className="h-8 w-20" />
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <UITable>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3].map((i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </UITable>
                    </Card>
                  )
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load workflows. Please try again later.
                    </AlertDescription>
                  </Alert>
                ) : filteredWorkflows?.length === 0 ? (
                  <div className="text-center py-12">
                    <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No workflows found</h3>
                    <p className="text-muted-foreground mb-6">
                      {selectedFolder ? "No workflows in this folder." : "Get started by creating your first workflow"}
                    </p>
                    <Button className="flex items-center gap-2" onClick={() => setCreateWorkflowOpen(true)}>
                      <Plus size={18} />
                      Create Workflow
                    </Button>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWorkflows?.map((workflow) => (
                      <Card key={workflow.id} className="w-full transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{workflow.name}</CardTitle>
                            <div className={`px-2 py-1 rounded text-xs ${
                              workflow.status === 'active' ? 'bg-green-100 text-green-800' :
                              workflow.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {workflow.status}
                            </div>
                          </div>
                          <CardDescription className="text-sm text-muted-foreground">
                            Last updated {new Date(workflow.updatedAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            {workflow.description || "No description provided"}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/workflows/${workflow.id}`)}
                          >
                            Open
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <UITable>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWorkflows?.map((workflow) => (
                          <TableRow key={workflow.id}>
                            <TableCell>
                              <div className="font-medium">{workflow.name}</div>
                              <div className="text-sm text-muted-foreground">{workflow.description || "No description"}</div>
                            </TableCell>
                            <TableCell>
                              <div className={`px-2 py-1 rounded text-xs inline-block ${
                                workflow.status === 'active' ? 'bg-green-100 text-green-800' :
                                workflow.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {workflow.status}
                              </div>
                            </TableCell>
                            <TableCell>{new Date(workflow.updatedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/workflows/${workflow.id}`)}
                                >
                                  Open
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </UITable>
                  </Card>
                )}
              </TabsContent>
              
              {/* Other tabs */}
              {["active", "draft", "archived"].map((tab) => (
                <TabsContent key={tab} value={tab} className="pt-4">
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                    <p className="text-muted-foreground">This section is under development</p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}