import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Calendar, 
  Check,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Plus
} from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar as DayPickerCalendar } from "@/components/ui/calendar";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { Account, AccountTask } from "@shared/schema";

// Task form schema
const taskFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  timeline: z.string().optional(),
  effort: z.string().optional(),
  outcome: z.string().optional(),
  owner: z.string().optional(),
  accountId: z.number(),
  dueDate: z.date().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface AccountTasksTabProps {
  accountId: number;
  accountName: string;
}

export default function AccountTasksTab({ accountId, accountName }: AccountTasksTabProps) {
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Toast notifications
  const { toast } = useToast();
  
  // Sorting state
  const [sortField, setSortField] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // State for field being edited
  const [editingField, setEditingField] = useState<{ taskId: number | null, field: string | null }>({
    taskId: null,
    field: null
  });
  
  // Temporary edit value
  const [tempEditValue, setTempEditValue] = useState<any>(null);

  // Fetch tasks for this account
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<AccountTask[]>({
    queryKey: ["/api/accounts", accountId, "tasks"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/accounts/${accountId}/tasks`);
      return await res.json();
    }
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
      accountId: accountId,
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
      form.reset({
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        timeline: "short-term",
        effort: "medium",
        accountId: accountId,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", accountId, "tasks"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", accountId, "tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
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
    // Keep a local reference to the current tempEditValue
    const valueToSave = tempEditValue;
    
    // Skip update if the value hasn't changed or is null
    if (task[field] === valueToSave || valueToSave === null) {
      handleCancelEdit();
      return;
    }
    
    // Save the change - make sure we're using our local reference
    updateTaskMutation.mutate({ 
      id: task.id, 
      data: { [field]: valueToSave } 
    });
    
    // Reset edit state immediately to allow clicking on another field
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
  
  // Sort the tasks
  const sortedTasks = [...tasks].sort((a, b) => {
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
        <h2 className="text-xl font-semibold">Tasks for {accountName}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Task for {accountName}</DialogTitle>
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
                          <DayPickerCalendar
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

      {isLoadingTasks ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Tasks</CardTitle>
            <CardDescription>
              There are no tasks for this account yet. Create a new task to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Account Tasks</CardTitle>
            <CardDescription>
              Manage tasks associated with this account
            </CardDescription>
          </CardHeader>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort("title")}
                  >
                    Title {getSortIndicator("title")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort("status")}
                  >
                    Status {getSortIndicator("status")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort("priority")}
                  >
                    Priority {getSortIndicator("priority")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort("dueDate")}
                  >
                    Due Date {getSortIndicator("dueDate")}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task: AccountTask) => (
                  <TableRow key={task.id} className="group">
                    <TableCell>
                      {editingField.taskId === task.id && editingField.field === 'title' ? (
                        <div className="flex gap-2">
                          <Input 
                            value={tempEditValue} 
                            onChange={(e) => setTempEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveField(task, 'title');
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            autoFocus
                            className="h-8"
                          />
                        </div>
                      ) : (
                        <div 
                          className="flex items-center cursor-pointer" 
                          onClick={() => handleStartEditing(task, 'title')}
                        >
                          <span>{task.title}</span>
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
                          className="flex items-center cursor-pointer" 
                          onClick={() => handleStartEditing(task, 'status')}
                        >
                          {getStatusBadge(task.status)}
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
                          className="flex items-center cursor-pointer" 
                          onClick={() => handleStartEditing(task, 'priority')}
                        >
                          {getPriorityBadge(task.priority)}
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
                              <DayPickerCalendar
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
                          className="flex items-center cursor-pointer" 
                          onClick={() => handleStartEditing(task, 'dueDate')}
                        >
                          <span>{task.dueDate ? format(new Date(task.dueDate), "PP") : "—"}</span>
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