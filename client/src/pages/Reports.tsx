import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Loader2, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import MainLayout from "@/components/layout/MainLayout";
import { ReportDefinition } from "@shared/schema";
import { setTenantHeader } from "@/lib/tenant";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const createReportSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  type: z.string().min(1, "Please select a report type"),
  dataSource: z.string().min(1, "Please select a data source"),
  columns: z.string().min(1, "Please specify at least one column"),
  filters: z.string().optional(),
  isDefault: z.boolean().default(false),
  isShared: z.boolean().default(true),
});

function Reports() {
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const { toast } = useToast();
  const tenantHeaders = setTenantHeader();
  
  const { data: reports, isLoading, refetch } = useQuery<ReportDefinition[]>({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports", { headers: tenantHeaders });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    }
  });

  const form = useForm<z.infer<typeof createReportSchema>>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      dataSource: "",
      columns: "",
      filters: "",
      isDefault: false,
      isShared: true,
    },
  });

  const handleCreateReport = async (values: z.infer<typeof createReportSchema>) => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          ...tenantHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          config: {
            dataSource: values.dataSource,
            columns: values.columns.split(",").map(col => col.trim()),
            filters: values.filters ? values.filters.split(",").map(filter => filter.trim()) : [],
          }
        }),
      });

      if (!res.ok) throw new Error("Failed to create report");
      
      toast({
        title: "Report Created",
        description: "Your report has been created successfully",
      });
      
      form.reset();
      setIsCreatingReport(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error Creating Report",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "table":
        return <BarChart className="w-5 h-5 mr-2" />;
      case "bar":
        return <BarChart className="w-5 h-5 mr-2" />;
      case "line":
        return <BarChart className="w-5 h-5 mr-2" />;
      case "pie":
        return <BarChart className="w-5 h-5 mr-2" />;
      default:
        return <BarChart className="w-5 h-5 mr-2" />;
    }
  };
  
  // Helper to extract visualization type from report
  const getReportType = (report: ReportDefinition) => {
    return report.visualization || 'table';
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="text-slate-500">Create, view, and manage your custom reports</p>
          </div>
          <Dialog open={isCreatingReport} onOpenChange={setIsCreatingReport}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
                <DialogDescription>
                  Define a new custom report for your data.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateReport)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Monthly Sales Summary" {...field} />
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
                          <Textarea placeholder="A detailed view of monthly sales data" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Report Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a report type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="table">Table</SelectItem>
                              <SelectItem value="bar">Bar Chart</SelectItem>
                              <SelectItem value="line">Line Chart</SelectItem>
                              <SelectItem value="pie">Pie Chart</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dataSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Source</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a data source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="accounts">Accounts</SelectItem>
                              <SelectItem value="contacts">Contacts</SelectItem>
                              <SelectItem value="deals">Deals</SelectItem>
                              <SelectItem value="tasks">Tasks</SelectItem>
                              <SelectItem value="projects">Projects</SelectItem>
                              <SelectItem value="support_tickets">Support Tickets</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="columns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Columns</FormLabel>
                        <FormControl>
                          <Input placeholder="name, industry, location, revenue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="filters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filters (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="industry=technology, revenue>1000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="mt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreatingReport(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Report</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="my">My Reports</TabsTrigger>
              <TabsTrigger value="shared">Shared Reports</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
          
          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <BarChart className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-1">No reports found</h3>
                <p className="text-slate-500 max-w-md">
                  Create your first report by clicking the "New Report" button above
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center text-primary-600 mb-1">
                        {getReportTypeIcon(getReportType(report))}
                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">
                          {getReportType(report).charAt(0).toUpperCase() + getReportType(report).slice(1)}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {report.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between">
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        <div className="space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600">
                            Edit
                          </Button>
                          <Button variant="default" size="sm" className="h-8 px-2">
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my" className="mt-0">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BarChart className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No personal reports yet</h3>
              <p className="text-slate-500 max-w-md">
                Create reports that only you can see
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="shared" className="mt-0">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BarChart className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No shared reports yet</h3>
              <p className="text-slate-500 max-w-md">
                Shared reports can be viewed by others in your organization
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

export default Reports;