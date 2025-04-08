import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Database,
  Table as TableIcon,
  Key,
  Link as LinkIcon,
  Info,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define types for TableSchema
type ColumnSchema = {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesTable?: string;
  referencesColumn?: string;
};

type TableSchema = {
  tableName: string;
  description: string;
  columns: ColumnSchema[];
  recordCount: number;
};

type DataRecord = {
  [key: string]: any;
};

export default function DataManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<TableSchema | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DataRecord | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const limit = 10;

  // Fetch tables
  const {
    data: tables,
    isLoading: isLoadingTables,
    error: tablesError,
  } = useQuery({
    queryKey: ["/api/admin/tables"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/tables");
      const data = await response.json();
      return data as TableSchema[];
    },
  });

  // Fetch records for the selected table
  const {
    data: records,
    isLoading: isLoadingRecords,
    error: recordsError,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: [
      "/api/admin/tables",
      selectedTable?.tableName,
      "records",
      page,
      sortColumn,
      sortOrder,
    ],
    queryFn: async () => {
      if (!selectedTable) return [];
      
      let queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });
      
      if (sortColumn) {
        queryParams.append("sort", sortColumn);
        queryParams.append("order", sortOrder);
      }
      
      const response = await apiRequest(
        "GET",
        `/api/admin/tables/${selectedTable.tableName}/records?${queryParams.toString()}`
      );
      const data = await response.json();
      return data as DataRecord[];
    },
    enabled: !!selectedTable,
  });

  // Create new record mutation
  const createRecordMutation = useMutation({
    mutationFn: async (newRecord: DataRecord) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/tables/${selectedTable!.tableName}/records`,
        newRecord
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/tables", selectedTable?.tableName, "records"],
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Record Created",
        description: "The record has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create record: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update record mutation
  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: any; data: DataRecord }) => {
      const primaryKeyColumn = selectedTable!.columns.find(
        (col) => col.isPrimaryKey
      )?.name;
      
      if (!primaryKeyColumn) {
        throw new Error("Table has no primary key");
      }
      
      const response = await apiRequest(
        "PUT",
        `/api/admin/tables/${selectedTable!.tableName}/records/${id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/tables", selectedTable?.tableName, "records"],
      });
      setIsEditDialogOpen(false);
      toast({
        title: "Record Updated",
        description: "The record has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update record: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (id: any) => {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/tables/${selectedTable!.tableName}/records/${id}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/tables", selectedTable?.tableName, "records"],
      });
      toast({
        title: "Record Deleted",
        description: "The record has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete record: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle sort change
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  // Handle edit record
  const handleEditRecord = (record: DataRecord) => {
    setCurrentRecord(record);
    setIsEditDialogOpen(true);
  };

  // Confirm delete record
  const confirmDeleteRecord = (record: DataRecord) => {
    const primaryKeyColumn = selectedTable!.columns.find(
      (col) => col.isPrimaryKey
    )?.name;
    
    if (!primaryKeyColumn) {
      toast({
        title: "Error",
        description: "Table has no primary key",
        variant: "destructive",
      });
      return;
    }
    
    deleteRecordMutation.mutate(record[primaryKeyColumn]);
  };

  // Dynamic form for adding/editing records
  const RecordForm = ({ record, onSubmit }: { record?: DataRecord; onSubmit: (data: any) => void }) => {
    // Create a dynamic form schema based on table columns
    const formSchema = z.object({
      ...Object.fromEntries(
        selectedTable!.columns.map((column) => {
          let schema: any = z.any();
          
          // Skip primary key for new records
          if (column.isPrimaryKey && !record) {
            return [column.name, schema.optional()];
          }
          
          // Skip tenant ID as it's handled automatically
          if (column.name === "tenantId") {
            return [column.name, schema.optional()];
          }
          
          // Basic type validations
          if (column.type.includes("int")) {
            schema = z.coerce.number();
          } else if (column.type === "boolean") {
            schema = z.boolean();
          } else if (column.type.includes("timestamp") || column.type.includes("date")) {
            schema = z.string();
          } else {
            schema = z.string();
          }
          
          // Add nullable option if column allows null
          if (column.nullable) {
            schema = schema.nullable();
          }
          
          return [column.name, schema];
        })
      ),
    });

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: record || {},
    });

    const handleFormSubmit = (data: any) => {
      onSubmit(data);
    };

    // Render form fields based on column types
    const renderFieldInput = (column: ColumnSchema) => {
      // Skip primary key field for new records
      if (column.isPrimaryKey && !record) {
        return null;
      }
      
      // Skip tenant ID
      if (column.name === "tenantId") {
        return null;
      }
      
      if (column.type.includes("int")) {
        return (
          <FormField
            key={column.name}
            control={form.control}
            name={column.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{column.name}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => {
                      if (e.target.value === "") {
                        field.onChange(column.nullable ? null : 0);
                      } else {
                        field.onChange(parseInt(e.target.value));
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  {column.type}{column.nullable ? " (nullable)" : ""}
                  {column.isForeignKey && ` - Foreign key to ${column.referencesTable}.${column.referencesColumn}`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else if (column.type === "boolean") {
        return (
          <FormField
            key={column.name}
            control={form.control}
            name={column.name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>{column.name}</FormLabel>
                  <FormDescription>
                    {column.type}{column.nullable ? " (nullable)" : ""}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else if (column.type.includes("text")) {
        return (
          <FormField
            key={column.name}
            control={form.control}
            name={column.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{column.name}</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value || (column.nullable ? null : ""))}
                  />
                </FormControl>
                <FormDescription>
                  {column.type}{column.nullable ? " (nullable)" : ""}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else if (column.type.includes("timestamp") || column.type.includes("date")) {
        return (
          <FormField
            key={column.name}
            control={form.control}
            name={column.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{column.name}</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                    onChange={(e) => {
                      field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  {column.type}{column.nullable ? " (nullable)" : ""}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else {
        return (
          <FormField
            key={column.name}
            control={form.control}
            name={column.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{column.name}</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value || (column.nullable ? null : ""))}
                  />
                </FormControl>
                <FormDescription>
                  {column.type}{column.nullable ? " (nullable)" : ""}
                  {column.isForeignKey && ` - Foreign key to ${column.referencesTable}.${column.referencesColumn}`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-4">
            {selectedTable?.columns.map((column) => renderFieldInput(column))}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createRecordMutation.isPending || updateRecordMutation.isPending}>
              {createRecordMutation.isPending || updateRecordMutation.isPending ? "Processing..." : record ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  if (isLoadingTables) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        <p className="mt-4">Loading database tables...</p>
      </div>
    );
  }

  if (tablesError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-destructive text-6xl">!</div>
        <h2 className="text-2xl font-bold mt-4">Error Loading Tables</h2>
        <p className="mt-2 text-muted-foreground max-w-md text-center">
          There was a problem loading the database tables. Please try again or contact support.
        </p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Data Management</h1>
          <p className="text-muted-foreground">
            Manage your database tables and records
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Table Selection Sidebar */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <span>Tables</span>
            </CardTitle>
            <CardDescription>Select a table to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tables?.map((table) => (
                <Button
                  key={table.tableName}
                  variant={selectedTable?.tableName === table.tableName ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTable(table)}
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  <span className="truncate">{table.tableName}</span>
                  <Badge className="ml-auto" variant="outline">
                    {table.recordCount}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table Content Area */}
        <div className="md:col-span-9">
          {selectedTable ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TableIcon className="h-5 w-5" />
                      <span>{selectedTable.tableName}</span>
                    </CardTitle>
                    <CardDescription>
                      {selectedTable.description}
                    </CardDescription>
                  </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Record
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add New Record</DialogTitle>
                        <DialogDescription>
                          Create a new record in the {selectedTable.tableName} table.
                        </DialogDescription>
                      </DialogHeader>
                      <RecordForm
                        onSubmit={(data) => createRecordMutation.mutate(data)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="records" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="records">Records</TabsTrigger>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="records">
                    {isLoadingRecords ? (
                      <div className="h-60 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : records && records.length > 0 ? (
                      <>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {selectedTable.columns.map((column) => (
                                  <TableHead
                                    key={column.name}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort(column.name)}
                                  >
                                    <div className="flex items-center gap-1">
                                      {column.name}
                                      {sortColumn === column.name && (
                                        <span>
                                          {sortOrder === "asc" ? " ↑" : " ↓"}
                                        </span>
                                      )}
                                      {column.isPrimaryKey && (
                                        <Key className="h-3 w-3 ml-1 text-muted-foreground" />
                                      )}
                                      {column.isForeignKey && (
                                        <LinkIcon className="h-3 w-3 ml-1 text-muted-foreground" />
                                      )}
                                    </div>
                                  </TableHead>
                                ))}
                                <TableHead className="w-24 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {records.map((record, index) => (
                                <TableRow key={index}>
                                  {selectedTable.columns.map((column) => (
                                    <TableCell key={column.name} className="font-mono text-sm">
                                      {formatCellValue(record[column.name], column.type)}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditRecord(record)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Are you sure you want to delete this record?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This action cannot be undone. This will permanently delete
                                              the record from the database.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              onClick={() => confirmDeleteRecord(record)}
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Page {page}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage(Math.max(1, page - 1))}
                              disabled={page === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage(page + 1)}
                              disabled={records.length < limit}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10 border rounded-md">
                        <Info className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No Records Found</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          This table doesn't have any records yet.
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => setIsAddDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Record
                        </Button>
                      </div>
                    )}

                    {/* Edit Record Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Record</DialogTitle>
                          <DialogDescription>
                            Update this record in the {selectedTable.tableName} table.
                          </DialogDescription>
                        </DialogHeader>
                        {currentRecord && (
                          <RecordForm
                            record={currentRecord}
                            onSubmit={(data) => {
                              const primaryKeyColumn = selectedTable.columns.find(
                                (col) => col.isPrimaryKey
                              )?.name;
                              
                              if (!primaryKeyColumn) {
                                toast({
                                  title: "Error",
                                  description: "Table has no primary key",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              updateRecordMutation.mutate({
                                id: currentRecord[primaryKeyColumn],
                                data,
                              });
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </TabsContent>
                  
                  <TabsContent value="schema">
                    <Card>
                      <CardContent className="pt-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Column</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Attributes</TableHead>
                              <TableHead>References</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedTable.columns.map((column) => (
                              <TableRow key={column.name}>
                                <TableCell className="font-medium">
                                  {column.name}
                                  {column.isPrimaryKey && (
                                    <Badge variant="outline" className="ml-2">
                                      Primary Key
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{column.type}</TableCell>
                                <TableCell>
                                  {column.nullable ? "Nullable" : "Not Null"}
                                </TableCell>
                                <TableCell>
                                  {column.isForeignKey && column.referencesTable && (
                                    <div className="flex items-center">
                                      <LinkIcon className="h-4 w-4 mr-2" />
                                      {column.referencesTable}.{column.referencesColumn}
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-10 text-center">
              <Database className="h-20 w-20 text-muted-foreground" />
              <h2 className="text-2xl font-bold mt-6">Select a Table</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                Choose a database table from the sidebar to view and manage its records.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCellValue(value: any, type: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }

  if (type.includes("timestamp") || type.includes("date")) {
    try {
      return new Date(value).toLocaleString();
    } catch (e) {
      return value.toString();
    }
  }

  if (type === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value.toString();
}