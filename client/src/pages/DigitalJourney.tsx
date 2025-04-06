import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { DigitalJourney as DigitalJourneyType, EmailTemplate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Search, Plus, Mail, Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import EmailEditor from '@/components/digital-journey/EmailEditor';
import JourneyPlanner from '@/components/digital-journey/JourneyPlanner';

export default function DigitalJourney() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('journeys');
  const [isCreateJourneyOpen, setIsCreateJourneyOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<DigitalJourneyType | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  // Fetch journeys
  const { data: journeys = [], isLoading: isLoadingJourneys } = useQuery<DigitalJourneyType[]>({
    queryKey: ['/api/digital-journeys'],
    onError: (error) => {
      toast({
        title: "Error loading journeys",
        description: error instanceof Error ? error.message : "Failed to load digital journeys",
        variant: "destructive",
      });
    },
  });

  // Fetch email templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
    onError: (error) => {
      toast({
        title: "Error loading email templates",
        description: error instanceof Error ? error.message : "Failed to load email templates",
        variant: "destructive",
      });
    },
  });

  // Filter journeys based on search query
  const filteredJourneys = journeys.filter(journey => 
    journey.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (journey.description && journey.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      draft: "bg-yellow-100 text-yellow-800",
      scheduled: "bg-slate-100 text-slate-800",
      completed: "bg-blue-100 text-blue-800",
      paused: "bg-red-100 text-red-800"
    };

    return statusMap[status.toLowerCase()] || "bg-slate-100 text-slate-800";
  };

  // Format date
  const formatDate = (date: Date | string) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Handle editing a journey
  const handleEditJourney = (journey: DigitalJourneyType) => {
    setSelectedJourney(journey);
    setIsCreateJourneyOpen(true);
  };

  // Handle editing a template
  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsCreateTemplateOpen(true);
  };

  // Reset search when changing tabs
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Digital Journey</h1>
      </div>

      <Tabs 
        defaultValue="journeys" 
        value={selectedTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="journeys">Communication Journeys</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder={`Search ${selectedTab === 'journeys' ? 'journeys' : 'templates'}...`}
                className="w-64 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {selectedTab === 'journeys' ? (
              <Dialog open={isCreateJourneyOpen} onOpenChange={setIsCreateJourneyOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>New Journey</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <JourneyPlanner
                    journey={selectedJourney || undefined}
                    onSave={() => {
                      setIsCreateJourneyOpen(false);
                      setSelectedJourney(null);
                      queryClient.invalidateQueries({ queryKey: ['/api/digital-journeys'] });
                    }}
                    onCancel={() => {
                      setIsCreateJourneyOpen(false);
                      setSelectedJourney(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>New Template</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <EmailEditor
                    template={selectedTemplate || undefined}
                    onSave={() => {
                      setIsCreateTemplateOpen(false);
                      setSelectedTemplate(null);
                      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
                    }}
                    onCancel={() => {
                      setIsCreateTemplateOpen(false);
                      setSelectedTemplate(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <TabsContent value="journeys">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoadingJourneys ? (
              // Loading state
              [...Array(6)].map((_, idx) => (
                <Card key={idx} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-10 bg-slate-200 rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredJourneys.length === 0 ? (
              // Empty state
              <div className="col-span-full text-center py-10">
                <Mail className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No journeys found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first communication journey'}
                </p>
                {!searchQuery && (
                  <div className="mt-6">
                    <Button onClick={() => setIsCreateJourneyOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Journey
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Journey cards
              filteredJourneys.map(journey => (
                <Card key={journey.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{journey.name}</CardTitle>
                      <span className={`${getStatusBadgeColor(journey.status)} text-xs px-2 py-1 rounded-full`}>
                        {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
                      </span>
                    </div>
                    {journey.description && (
                      <p className="text-sm text-slate-500">{journey.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-slate-500">Created</p>
                          <p>{formatDate(journey.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Steps</p>
                          <p>{journey.steps.length}</p>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">Journey Flow</p>
                        <div className="space-y-2">
                          {journey.steps.slice(0, 3).map((step, idx) => (
                            <div key={idx} className="flex items-center text-sm">
                              {step.type === 'email' && <Mail className="h-4 w-4 text-blue-500 mr-2" />}
                              {step.type === 'task' && <Calendar className="h-4 w-4 text-green-500 mr-2" />}
                              {step.type === 'wait' && <Clock className="h-4 w-4 text-amber-500 mr-2" />}
                              {step.type === 'meeting' && <Calendar className="h-4 w-4 text-purple-500 mr-2" />}
                              <span className="truncate">{step.name}</span>
                              {idx < Math.min(journey.steps.length - 1, 2) && (
                                <ArrowRight className="h-3 w-3 mx-1 text-slate-400" />
                              )}
                            </div>
                          ))}
                          {journey.steps.length > 3 && (
                            <p className="text-xs text-slate-500 italic">
                              +{journey.steps.length - 3} more steps
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-3">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleEditJourney(journey)}
                        >
                          Edit Journey
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoadingTemplates ? (
              // Loading state
              [...Array(6)].map((_, idx) => (
                <Card key={idx} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-10 bg-slate-200 rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredTemplates.length === 0 ? (
              // Empty state
              <div className="col-span-full text-center py-10">
                <Mail className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No email templates found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first email template'}
                </p>
                {!searchQuery && (
                  <div className="mt-6">
                    <Button onClick={() => setIsCreateTemplateOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Template
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Template cards
              filteredTemplates.map(template => (
                <Card key={template.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-slate-500 line-clamp-1">
                      Subject: {template.subject}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="border p-3 rounded-md bg-slate-50 h-32 overflow-hidden">
                        <div
                          className="text-xs prose max-w-none overflow-hidden"
                          style={{ maxHeight: '100%' }}
                          dangerouslySetInnerHTML={{
                            __html: template.htmlContent.substring(0, 300) + 
                                   (template.htmlContent.length > 300 ? '...' : '')
                          }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-slate-500">Created</p>
                          <p>{formatDate(template.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Last Updated</p>
                          <p>{formatDate(template.updatedAt)}</p>
                        </div>
                      </div>
                      
                      <div className="pt-3">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleEditTemplate(template)}
                        >
                          Edit Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
