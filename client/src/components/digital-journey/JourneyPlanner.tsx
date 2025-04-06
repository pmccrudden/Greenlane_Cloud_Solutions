import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DigitalJourney, EmailTemplate, JourneyStep } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Mail, Calendar, Clock, X, ArrowDown, Trash2, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Define form validation schema
const journeySchema = z.object({
  name: z.string().min(1, 'Journey name is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
});

type JourneyFormValues = z.infer<typeof journeySchema>;

interface JourneyPlannerProps {
  journey?: DigitalJourney;
  onSave?: (journey: DigitalJourney) => void;
  onCancel?: () => void;
}

export default function JourneyPlanner({ journey, onSave, onCancel }: JourneyPlannerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [steps, setSteps] = useState<JourneyStep[]>(journey?.steps || []);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch email templates for dropdown
  const { data: emailTemplates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
  });

  const form = useForm<JourneyFormValues>({
    resolver: zodResolver(journeySchema),
    defaultValues: {
      name: journey?.name || '',
      description: journey?.description || '',
      status: journey?.status || 'draft',
    },
  });

  const onSubmit = async (values: JourneyFormValues) => {
    if (steps.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one step to your journey",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine form values with steps
      const payload = {
        ...values,
        steps,
      };

      let response;
      if (journey) {
        // Update existing journey
        response = await apiRequest('PUT', `/api/digital-journeys/${journey.id}`, payload);
      } else {
        // Create new journey
        response = await apiRequest('POST', '/api/digital-journeys', payload);
      }
      
      const savedJourney = await response.json();
      
      toast({
        title: journey ? "Journey Updated" : "Journey Created",
        description: `Digital journey has been ${journey ? 'updated' : 'created'} successfully`,
      });
      
      // Invalidate journeys query to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/digital-journeys'] });
      
      if (onSave) {
        onSave(savedJourney);
      }
    } catch (error) {
      toast({
        title: journey ? "Failed to Update Journey" : "Failed to Create Journey",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle drag and drop reordering
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSteps(items);
  };

  // Add or edit a step
  const handleStepSubmit = (stepData: JourneyStep) => {
    if (editingStepIndex !== null) {
      // Edit existing step
      const updatedSteps = [...steps];
      updatedSteps[editingStepIndex] = stepData;
      setSteps(updatedSteps);
    } else {
      // Add new step
      setSteps([...steps, stepData]);
    }
    
    setShowStepDialog(false);
    setEditingStepIndex(null);
  };

  // Delete a step
  const deleteStep = (index: number) => {
    const updatedSteps = [...steps];
    updatedSteps.splice(index, 1);
    setSteps(updatedSteps);
  };

  // Edit a step
  const editStep = (index: number) => {
    setEditingStepIndex(index);
    setShowStepDialog(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{journey ? 'Edit Digital Journey' : 'Create Digital Journey'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Journey Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Customer Onboarding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purpose of this journey" 
                      className="min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Journey Steps</h3>
                <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
                  <DialogTrigger asChild>
                    <Button type="button" className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <JourneyStepForm 
                      onSubmit={handleStepSubmit} 
                      emailTemplates={emailTemplates}
                      initialValues={editingStepIndex !== null ? steps[editingStepIndex] : undefined}
                      onCancel={() => setShowStepDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              {steps.length === 0 ? (
                <div className="border-2 border-dashed rounded-md p-8 text-center">
                  <p className="text-slate-500">No steps added yet. Click "Add Step" to begin building your journey.</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="journey-steps">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {steps.map((step, index) => (
                          <Draggable key={index} draggableId={`step-${index}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="border rounded-md p-4 bg-white"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 mr-3">
                                      {step.type === 'email' && <Mail className="w-5 h-5 text-blue-500" />}
                                      {step.type === 'task' && <Calendar className="w-5 h-5 text-green-500" />}
                                      {step.type === 'wait' && <Clock className="w-5 h-5 text-amber-500" />}
                                      {step.type === 'meeting' && <Calendar className="w-5 h-5 text-purple-500" />}
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{step.name}</h4>
                                      {step.description && (
                                        <p className="text-sm text-slate-500">{step.description}</p>
                                      )}
                                      {step.type === 'email' && step.emailTemplateName && (
                                        <p className="text-sm text-blue-600">Template: {step.emailTemplateName}</p>
                                      )}
                                      {step.type === 'wait' && step.delay && (
                                        <p className="text-sm text-amber-600">Wait for {step.delay} days</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      className="text-slate-400 hover:text-slate-600"
                                      onClick={() => editStep(index)}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      className="text-red-400 hover:text-red-600"
                                      onClick={() => deleteStep(index)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
            
            <CardFooter className="flex justify-end space-x-4 px-0">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} type="button">
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (journey ? "Updating..." : "Creating...") : (journey ? "Update Journey" : "Create Journey")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Step form sub-component
const stepFormSchema = z.object({
  type: z.enum(['email', 'task', 'meeting', 'wait']),
  name: z.string().min(1, 'Step name is required'),
  description: z.string().optional(),
  delay: z.string().optional(),
  emailTemplateId: z.string().optional(),
  taskType: z.string().optional(),
  taskAssignee: z.string().optional(),
});

type StepFormValues = z.infer<typeof stepFormSchema>;

interface JourneyStepFormProps {
  onSubmit: (step: JourneyStep) => void;
  onCancel: () => void;
  emailTemplates: EmailTemplate[];
  initialValues?: JourneyStep;
}

function JourneyStepForm({ onSubmit, onCancel, emailTemplates, initialValues }: JourneyStepFormProps) {
  const form = useForm<StepFormValues>({
    resolver: zodResolver(stepFormSchema),
    defaultValues: {
      type: initialValues?.type || 'email',
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      delay: initialValues?.delay ? initialValues.delay.toString() : '',
      emailTemplateId: initialValues?.emailTemplateId ? initialValues.emailTemplateId.toString() : '',
      taskType: initialValues?.taskType || '',
      taskAssignee: initialValues?.taskAssignee || '',
    },
  });
  
  const stepType = form.watch('type');
  
  const handleSubmit = (values: StepFormValues) => {
    // Transform values
    const step: JourneyStep = {
      type: values.type,
      name: values.name,
      description: values.description,
    };
    
    // Add type-specific fields
    if (values.type === 'email' && values.emailTemplateId) {
      step.emailTemplateId = parseInt(values.emailTemplateId);
      const template = emailTemplates.find(t => t.id === parseInt(values.emailTemplateId));
      step.emailTemplateName = template?.name;
    }
    
    if (values.type === 'wait' && values.delay) {
      step.delay = parseInt(values.delay);
    }
    
    if (values.type === 'task') {
      step.taskType = values.taskType;
      step.taskAssignee = values.taskAssignee;
    }
    
    onSubmit(step);
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>{initialValues ? 'Edit Step' : 'Add Journey Step'}</DialogTitle>
        <DialogDescription>
          Configure this step in the customer journey
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Step Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="wait">Wait Period</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Step Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Welcome Email" {...field} />
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
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional description of this step" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {stepType === 'email' && (
            <FormField
              control={form.control}
              name="emailTemplateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Template</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select email template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {emailTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {stepType === 'wait' && (
            <FormField
              control={form.control}
              name="delay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wait Duration (Days)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="E.g., 3" {...field} />
                  </FormControl>
                  <FormDescription>
                    Number of days to wait after the previous step
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {stepType === 'task' && (
            <>
              <FormField
                control={form.control}
                name="taskType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Type</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Call Customer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="taskAssignee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Account Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {initialValues ? 'Update Step' : 'Add Step'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
