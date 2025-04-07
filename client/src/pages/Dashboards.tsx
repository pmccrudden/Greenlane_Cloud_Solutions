import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, LayoutGrid, Grid3X3, Columns, Copy, Settings, Menu, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MainLayout from "@/components/layout/MainLayout";
import { DashboardDefinition } from "@shared/schema";
import { useTenantHeaders } from "@/lib/tenant";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const createDashboardSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  isShared: z.boolean().default(true),
});

function Dashboards() {
  const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);
  const { toast } = useToast();
  const tenantHeaders = useTenantHeaders();
  
  const { data: dashboards, isLoading, refetch } = useQuery<DashboardDefinition[]>({
    queryKey: ["/api/dashboards"],
    queryFn: async () => {
      const res = await fetch("/api/dashboards", { headers: tenantHeaders });
      if (!res.ok) throw new Error("Failed to fetch dashboards");
      return res.json();
    }
  });

  const form = useForm<z.infer<typeof createDashboardSchema>>({
    resolver: zodResolver(createDashboardSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
      isShared: true,
    },
  });

  const handleCreateDashboard = async (values: z.infer<typeof createDashboardSchema>) => {
    try {
      const res = await fetch("/api/dashboards", {
        method: "POST",
        headers: {
          ...tenantHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          layout: { columns: 12, rows: 12, widgets: [] },
        }),
      });

      if (!res.ok) throw new Error("Failed to create dashboard");
      
      toast({
        title: "Dashboard Created",
        description: "Your dashboard has been created successfully",
      });
      
      form.reset();
      setIsCreatingDashboard(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error Creating Dashboard",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboards</h1>
            <p className="text-slate-500">Create and manage custom dashboards</p>
          </div>
          <Dialog open={isCreatingDashboard} onOpenChange={setIsCreatingDashboard}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                New Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Dashboard</DialogTitle>
                <DialogDescription>
                  Create a custom dashboard to visualize your data.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateDashboard)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dashboard Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Executive Overview" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Key metrics for executive review" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-6">
                    <FormField
                      control={form.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Default Dashboard</FormLabel>
                            <FormDescription>
                              Set as your default dashboard view
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isShared"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Shared Dashboard</FormLabel>
                            <FormDescription>
                              Visible to all team members
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="mt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreatingDashboard(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Dashboard</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Dashboards</TabsTrigger>
              <TabsTrigger value="my">My Dashboards</TabsTrigger>
              <TabsTrigger value="shared">Shared Dashboards</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !dashboards || dashboards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <LayoutGrid className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-1">No dashboards found</h3>
                <p className="text-slate-500 max-w-md">
                  Create your first dashboard by clicking the "New Dashboard" button above
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboards.map((dashboard) => (
                  <Card key={dashboard.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center text-primary-600 mb-1">
                          <Grid3X3 className="h-4 w-4 mr-1" />
                          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">
                            {dashboard.layout?.widgets?.length || 0} Widgets
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Settings</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {dashboard.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-3 gap-1 h-32 bg-slate-50 rounded-md p-2">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="rounded bg-slate-100 border border-slate-200"></div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-1">
                      <p className="text-xs text-slate-500">
                        {new Date(dashboard.createdAt).toLocaleDateString()}
                      </p>
                      <Button variant="default" size="sm" className="h-8 px-3">
                        View Dashboard
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my" className="mt-0">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <LayoutGrid className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No personal dashboards yet</h3>
              <p className="text-slate-500 max-w-md">
                Create personal dashboards that are customized to your workflow
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="shared" className="mt-0">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <LayoutGrid className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No shared dashboards yet</h3>
              <p className="text-slate-500 max-w-md">
                Shared dashboards can be viewed by everyone in your organization
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

export default Dashboards;