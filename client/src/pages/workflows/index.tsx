import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Workflow, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Define the type for a workflow
interface WorkflowType {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch workflows
  const { data: workflows, isLoading, error } = useQuery<WorkflowType[]>({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/workflows');
      return await response.json();
    }
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Workflows</h1>
            <p className="text-muted-foreground">Create and manage automated workflows and rules</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus size={18} />
            Create Workflow
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Workflows</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="pt-4">
            {isLoading ? (
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
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load workflows. Please try again later.
                </AlertDescription>
              </Alert>
            ) : workflows?.length === 0 ? (
              <div className="text-center py-12">
                <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No workflows found</h3>
                <p className="text-muted-foreground mb-6">Get started by creating your first workflow</p>
                <Button className="flex items-center gap-2">
                  <Plus size={18} />
                  Create Workflow
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflows?.map((workflow) => (
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
                    <CardFooter className="flex justify-end">
                      <Button variant="outline" size="sm">
                        Open
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="pt-4">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">This section is under development</p>
            </div>
          </TabsContent>
          
          <TabsContent value="draft" className="pt-4">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">This section is under development</p>
            </div>
          </TabsContent>
          
          <TabsContent value="archived" className="pt-4">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">This section is under development</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}