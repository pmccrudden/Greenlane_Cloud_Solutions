import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Filter, 
  Search, 
  Check, 
  Clock, 
  Calendar, 
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Pencil,
  Save,
  X,
  ArrowUpDown
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AccountTask, Account } from "@shared/schema";

// Form schema for creating a new task
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  accountId: z.number().min(1, "Account is required"),
  dueDate: z.date().optional(),
  priority: z.string().min(1, "Priority is required"),
  status: z.string().min(1, "Status is required"),
  owner: z.string().optional(),
  timeline: z.string().min(1, "Timeline is required"),
  effort: z.string().min(1, "Effort is required"),
  outcome: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function Tasks() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // State for inline editing is handled by editingField and tempEditValue

  // Fetch tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<AccountTask[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch accounts for the account dropdown
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Form for creating new tasks
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      timeline: "short-term",
      effort: "medium",
    },
  });

  // Mutation for creating a new task
  const createTaskMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const response = await apiRequest("POST", "/api/tasks", values);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create task");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: TaskFormValues) => {
    createTaskMutation.mutate(values);
  };

  // Mutation for updating a task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<AccountTask> }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      if (!response.ok) {
        // Handle non-OK response without trying to parse JSON
        throw new Error(`Failed to update task: HTTP ${response.status}`);
      }
      
      try {
        return await response.json();
      } catch (e) {
        console.error("Error parsing response:", e);
        throw new Error("Failed to parse server response");
      }
    },
    onSuccess: () => {
      toast({
        title: "Task updated",
        description: "The task has been updated successfully.",
      });
      // Reset editing state
      setEditingField({ taskId: null, field: null });
      setTempEditValue(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // State for field being edited
  const [editingField, setEditingField] = useState<{ taskId: number | null, field: string | null }>({
    taskId: null,
    field: null
  });
  
  // Temporary edit value
  const [tempEditValue, setTempEditValue] = useState<any>(null);
  
  // Handle starting to edit a field
  const handleStartEditing = (task: AccountTask, field: keyof AccountTask) => {
    setEditingField({ taskId: task.id, field });
    setTempEditValue(task[field]);
  };
  
  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingField({ taskId: null, field: null });
    setTempEditValue(null);
  };
  
  // Handle saving a field
  const handleSaveField = (task: AccountTask, field: keyof AccountTask) => {
    // Skip update if the value hasn't changed
    if (task[field] === tempEditValue) {
      handleCancelEdit();
      return;
    }
    
    // Save the change
    updateTaskMutation.mutate({ 
      id: task.id, 
      data: { [field]: tempEditValue } 
    });
    
    // Reset edit state
    handleCancelEdit();
  };
  
  // Toggle sort direction or set new sort field
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Helper for sort direction indicator
  const getSortIndicator = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-4 w-4" />;
    return sortDirection === "asc" 
      ? <ChevronUp className="ml-1 h-4 w-4" /> 
      : <ChevronDown className="ml-1 h-4 w-4" />;
  };

  // Filter tasks based on search term and filters
  const filteredTasks = tasks.filter((task: AccountTask) => {
    const matchesSearch = 
      !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });
    
  // Sort the filtered tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue = a[sortField as keyof AccountTask];
    let bValue = b[sortField as keyof AccountTask];
    
    // Handle nulls and undefined values
    if (aValue === null || aValue === undefined) aValue = "";
    if (bValue === null || bValue === undefined) bValue = "";
    
    // Handle date comparison
    if (sortField === "dueDate") {
      // If either value is falsy, handle sorting of empty values
      if (!aValue) return sortDirection === "asc" ? 1 : -1;
      if (!bValue) return sortDirection === "asc" ? -1 : 1;
      
      // Convert to date objects safely
      const aDate = new Date(String(aValue));
      const bDate = new Date(String(bValue));
      
      return sortDirection === "asc" 
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }
    
    // Handle string comparison
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Handle number comparison
    return sortDirection === "asc" 
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue);
  });

  // Get account name by ID
  const getAccountName = (accountId: number) => {
    if (!accounts) return "Unknown";
    const account = accounts.find((a: Account) => a.id === accountId);
    return account ? account.name : "Unknown";
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600"><Check className="mr-1 h-3 w-3" />{status}</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="mr-1 h-3 w-3" />{status}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Calendar className="mr-1 h-3 w-3" />{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />{priority}</Badge>;
      case "medium":
        return <Badge variant="outline">{priority}</Badge>;
      case "low":
        return <Badge variant="secondary">{priority}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Task title" {...field} />
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
                        <Textarea placeholder="Task description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account</FormLabel>
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingAccounts ? (
                              <SelectItem value="loading" disabled>
                                Loading...
                              </SelectItem>
                            ) : (
                              accounts?.map((account: Account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="owner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner</FormLabel>
                        <FormControl>
                          <Input placeholder="Task owner" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeline</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="short-term">Short Term</SelectItem>
                            <SelectItem value="long-term">Long Term</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="effort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effort</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select effort" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="outcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Outcome</FormLabel>
                        <FormControl>
                          <Input placeholder="Expected outcome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={createTaskMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createTaskMutation.isPending}
                  >
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("in-progress")}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Priority
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPriorityFilter(null)}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter("high")}>
                High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter("medium")}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter("low")}>
                Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoadingTasks ? (
        <Card>
          <div className="p-4">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </Card>
      ) : sortedTasks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground">No tasks found. Create a new task to get started.</p>
        </Card>
      ) : (
        <Card className="border shadow-sm">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/5 cursor-pointer" onClick={() => handleSort("title")}>
                    <div className="flex items-center">
                      Task {getSortIndicator("title")}
                    </div>
                  </TableHead>
                  <TableHead className="w-1/6 cursor-pointer" onClick={() => handleSort("accountId")}>
                    <div className="flex items-center">
                      Account {getSortIndicator("accountId")}
                    </div>
                  </TableHead>
                  <TableHead className="w-1/6 cursor-pointer" onClick={() => handleSort("status")}>
                    <div className="flex items-center">
                      Status {getSortIndicator("status")}
                    </div>
                  </TableHead>
                  <TableHead className="w-1/6 cursor-pointer" onClick={() => handleSort("priority")}>
                    <div className="flex items-center">
                      Priority {getSortIndicator("priority")}
                    </div>
                  </TableHead>
                  <TableHead className="w-1/6 cursor-pointer" onClick={() => handleSort("dueDate")}>
                    <div className="flex items-center">
                      Due Date {getSortIndicator("dueDate")}
                    </div>
                  </TableHead>
                  <TableHead className="w-1/6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task: AccountTask) => (
                  <TableRow key={task.id} className="hover:bg-muted/50 group">
                    <TableCell>
                      {editingField.taskId === task.id && editingField.field === 'title' ? (
                        <div className="flex gap-2">
                          <Input 
                            value={tempEditValue}
                            onChange={(e) => setTempEditValue(e.target.value)}
                            autoFocus
                            className="w-full max-w-[200px]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveField(task, 'title');
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveField(task, 'title')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                            {task.title}
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEditing(task, 'title')}
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingField.taskId === task.id && editingField.field === 'accountId' ? (
                        <div className="flex gap-2">
                          <Select 
                            value={tempEditValue?.toString()} 
                            onValueChange={(value) => {
                              setTempEditValue(parseInt(value, 10));
                              handleSaveField(task, 'accountId');
                            }}
                          >
                            <SelectTrigger className="h-8 w-[180px]">
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts?.map((account: Account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <Link 
                            href={`/accounts/${task.accountId}`} 
                            className="text-primary hover:underline"
                          >
                            {getAccountName(task.accountId)}
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEditing(task, 'accountId')}
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingField.taskId === task.id && editingField.field === 'status' ? (
                        <div className="flex gap-2">
                          <Select 
                            value={tempEditValue} 
                            onValueChange={(value) => {
                              setTempEditValue(value);
                              handleSaveField(task, 'status');
                            }}
                          >
                            <SelectTrigger className="h-8 w-[120px]">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between cursor-pointer" 
                          onClick={() => handleStartEditing(task, 'status')}
                        >
                          {getStatusBadge(task.status)}
                          <Pencil className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingField.taskId === task.id && editingField.field === 'priority' ? (
                        <div className="flex gap-2">
                          <Select 
                            value={tempEditValue} 
                            onValueChange={(value) => {
                              setTempEditValue(value);
                              handleSaveField(task, 'priority');
                            }}
                          >
                            <SelectTrigger className="h-8 w-[120px]">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between cursor-pointer" 
                          onClick={() => handleStartEditing(task, 'priority')}
                        >
                          {getPriorityBadge(task.priority)}
                          <Pencil className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingField.taskId === task.id && editingField.field === 'dueDate' ? (
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="h-8 w-[130px] justify-start text-left font-normal"
                              >
                                {tempEditValue ? 
                                  format(new Date(tempEditValue), "PP") : 
                                  <span className="text-muted-foreground">Pick a date</span>
                                }
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={tempEditValue ? new Date(tempEditValue) : undefined}
                                onSelect={(date: Date | undefined) => {
                                  if (date) {
                                    setTempEditValue(date);
                                    handleSaveField(task, 'dueDate');
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between cursor-pointer" 
                          onClick={() => handleStartEditing(task, 'dueDate')}
                        >
                          <span>{task.dueDate ? format(new Date(task.dueDate), "PP") : "—"}</span>
                          <Pencil className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/tasks/${task.id}`}>
                          <Button size="sm" variant="ghost">
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}