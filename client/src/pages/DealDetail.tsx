import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeftIcon, Building2Icon, CalendarIcon, TagIcon, BriefcaseIcon, Users2Icon, DollarSignIcon, BarChart4Icon, PercentIcon, UserIcon, CheckIcon, PencilIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Deal, Account, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export default function DealDetail() {
  const [_, setLocation] = useLocation();
  const { id } = useParams();
  const dealId = parseInt(id);
  const { toast } = useToast();
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<any>('');
  const [isEditing, setIsEditing] = useState({
    description: false,
    nextSteps: false
  });
  const [description, setDescription] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // The stages list
  const stages = [
    'prospecting',
    'qualification',
    'needs_analysis',
    'value_proposition',
    'proposal',
    'negotiation',
    'closing',
    'closed_won',
    'closed_lost'
  ];

  // Fetch deal details
  const { data: deal, isLoading: isLoadingDeal, error } = useQuery<Deal>({
    queryKey: ['/api/deals', dealId],
    onError: (error: any) => {
      toast({
        title: "Error loading deal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch account details
  const { data: account, isLoading: isLoadingAccount } = useQuery<Account>({
    queryKey: ['/api/accounts', deal?.accountId],
    enabled: !!deal?.accountId,
    onError: (error: any) => {
      toast({
        title: "Error loading account",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Fetch users (for deal owner)
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    onError: (error: any) => {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Fetch deal owner details
  const { data: dealOwner, isLoading: isLoadingDealOwner } = useQuery<User>({
    queryKey: ['/api/users', deal?.dealOwnerId],
    enabled: !!deal?.dealOwnerId,
    onError: (error: any) => {
      toast({
        title: "Error loading deal owner",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update deal mutation
  const updateDealMutation = useMutation({
    mutationFn: async (updatedData: Partial<Deal>) => {
      const res = await apiRequest('PATCH', `/api/deals/${dealId}`, updatedData);
      return await res.json();
    },
    onSuccess: (updatedDeal) => {
      queryClient.setQueryData(['/api/deals', dealId], (oldData: any) => {
        return { ...oldData, ...updatedDeal };
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      
      // If we're updating dealOwnerId, make sure to invalidate that query
      if ('dealOwnerId' in updatedDeal) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', updatedDeal.dealOwnerId] });
      }
      
      // If we're updating accountId, make sure to invalidate that query
      if ('accountId' in updatedDeal) {
        queryClient.invalidateQueries({ queryKey: ['/api/accounts', updatedDeal.accountId] });
      }
      
      setEditingField(null);
      setIsEditing({ ...isEditing, description: false, nextSteps: false });
      
      toast({
        title: "Deal updated",
        description: "The deal has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating deal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Set initial values for editable fields
  useEffect(() => {
    if (deal) {
      setDescription(deal.description || '');
      setNextSteps(deal.nextSteps || '');
    }
  }, [deal]);

  // Handle close button click
  const handleClose = () => {
    setLocation('/deals');
  };
  
  // Start editing a field
  const startEditing = (field: string, value: any) => {
    setEditingField(field);
    // If dealOwnerId is undefined/null/0, set it to string "0" for the Select component
    if (field === 'dealOwnerId' && (!value || value === 0)) {
      setFieldValue("0");
    } else {
      setFieldValue(value);
    }
  };
  
  // Save a field
  const saveField = () => {
    if (!editingField) return;
    
    const updates: Partial<Deal> = { [editingField]: fieldValue };
    updateDealMutation.mutate(updates);
  };
  
  // Save description or next steps
  const saveTextArea = (field: 'description' | 'nextSteps') => {
    const value = field === 'description' ? description : nextSteps;
    updateDealMutation.mutate({ [field]: value });
  };
  
  // Format value based on field type
  const formatValue = (value: any, field: string) => {
    if (field === 'closeDate' && value) {
      return format(new Date(value), 'yyyy-MM-dd');
    }
    return value;
  };

  if (isLoadingDeal) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-36 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-36" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-4xl font-bold text-gray-300">404</div>
        <h1 className="text-2xl font-semibold text-gray-700">Deal Not Found</h1>
        <p className="text-gray-500">The deal you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => setLocation('/deals')}>
          Back to Deals
        </Button>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return '-';
    }
  };

  // Get stage styling
  const getStageBadge = (stage: string) => {
    const stageMap: Record<string, { color: string, bg: string }> = {
      prospecting: { color: "text-slate-700", bg: "bg-slate-100" },
      qualification: { color: "text-slate-700", bg: "bg-slate-100" },
      needs_analysis: { color: "text-blue-700", bg: "bg-blue-100" },
      value_proposition: { color: "text-blue-700", bg: "bg-blue-100" },
      proposal: { color: "text-purple-700", bg: "bg-purple-100" },
      negotiation: { color: "text-blue-700", bg: "bg-blue-100" },
      closing: { color: "text-green-700", bg: "bg-green-100" },
      closed_won: { color: "text-green-700", bg: "bg-green-100" },
      closed_lost: { color: "text-red-700", bg: "bg-red-100" },
    };

    return stageMap[stage.toLowerCase().replace(/ /g, '_')] || { color: "text-slate-700", bg: "bg-slate-100" };
  };

  // Format stage name
  const formatStage = (stage: string) => {
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const stageStyling = getStageBadge(deal.stage || 'prospecting');
  
  // Get deal owner name
  const getDealOwnerName = () => {
    if (isLoadingDealOwner) return 'Loading...';
    if (!deal.dealOwnerId || deal.dealOwnerId === 0) return 'Unassigned';
    if (dealOwner) return `${dealOwner.firstName || ''} ${dealOwner.lastName || ''}`.trim() || dealOwner.username;
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{deal.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${stageStyling.bg} ${stageStyling.color}`}>
                {formatStage(deal.stage || 'Prospecting')}
              </Badge>
              <span className="text-sm text-slate-500">
                {formatCurrency(deal.value)} • {formatDate(deal.closeDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <Button variant="outline" onClick={() => setLocation(`/deals/${dealId}/edit`)}>
            Edit
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Update Stage</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Update Deal Stage</DialogTitle>
                <DialogDescription>
                  Select the new stage for this deal
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select
                  value={deal.stage}
                  onValueChange={(value) => {
                    updateDealMutation.mutate({ stage: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {formatStage(stage)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Deal details */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Deal Details</CardTitle>
              <CardDescription>
                Information about this deal and its progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2Icon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-500">Account</p>
                      <Link href={`/accounts/${deal.accountId}`}>
                        <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                          {account?.name || 'Loading...'}
                        </a>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSignIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Value</p>
                      {editingField === 'value' ? (
                        <div className="flex mt-1">
                          <Input 
                            type="number" 
                            value={fieldValue} 
                            onChange={(e) => setFieldValue(parseFloat(e.target.value))}
                            className="w-28 mr-2"
                          />
                          <Button size="sm" onClick={saveField} className="mr-1">
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-slate-900 font-medium">
                            {formatCurrency(deal.value)}
                          </p>
                          <Button variant="ghost" size="icon" onClick={() => startEditing('value', deal.value)}>
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Close Date</p>
                      {editingField === 'closeDate' ? (
                        <div className="flex mt-1">
                          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="justify-start text-left font-normal w-[240px]">
                                {fieldValue ? format(new Date(fieldValue), 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={fieldValue ? new Date(fieldValue) : undefined}
                                onSelect={(date) => {
                                  setFieldValue(date);
                                  if (date) {
                                    setCalendarOpen(false);
                                    setTimeout(() => {
                                      updateDealMutation.mutate({ closeDate: date });
                                    }, 100);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Button size="sm" variant="ghost" onClick={() => setEditingField(null)} className="ml-2">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-slate-900 font-medium">
                            {formatDate(deal.closeDate)}
                          </p>
                          <Button variant="ghost" size="icon" onClick={() => startEditing('closeDate', deal.closeDate)}>
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <TagIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Stage</p>
                      {editingField === 'stage' ? (
                        <div className="flex mt-1">
                          <Select
                            value={fieldValue}
                            onValueChange={(value) => {
                              setFieldValue(value);
                              setTimeout(() => {
                                updateDealMutation.mutate({ stage: value });
                              }, 100);
                            }}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select a stage" />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map((stage) => (
                                <SelectItem key={stage} value={stage}>
                                  {formatStage(stage)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={() => setEditingField(null)} className="ml-2">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-slate-900 font-medium">
                            {formatStage(deal.stage || 'Prospecting')}
                          </p>
                          <Button variant="ghost" size="icon" onClick={() => startEditing('stage', deal.stage)}>
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <UserIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Deal Owner</p>
                      {editingField === 'dealOwnerId' ? (
                        <div className="flex mt-1">
                          <Select
                            value={fieldValue?.toString() || ''}
                            onValueChange={(value) => {
                              setFieldValue(value);
                              // Convert value to integer or null (0) depending on the value
                              const dealOwnerId = value === "0" ? 0 : parseInt(value);
                              updateDealMutation.mutate({ dealOwnerId });
                            }}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select an owner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Unassigned</SelectItem>
                              {users?.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={() => setEditingField(null)} className="ml-2">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-slate-900 font-medium">
                            {getDealOwnerName()}
                          </p>
                          <Button variant="ghost" size="icon" onClick={() => startEditing('dealOwnerId', deal.dealOwnerId)}>
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <PercentIcon className="h-5 w-5 mt-0.5 text-slate-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Win Probability</p>
                      {editingField === 'winProbability' ? (
                        <div className="flex mt-1">
                          <Input 
                            type="number" 
                            value={fieldValue} 
                            onChange={(e) => setFieldValue(parseInt(e.target.value))}
                            min="0"
                            max="100"
                            className="w-28 mr-2"
                          />
                          <Button size="sm" onClick={saveField} className="mr-1">
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-slate-900 font-medium">
                            {deal.winProbability || 0}%
                          </p>
                          <Button variant="ghost" size="icon" onClick={() => startEditing('winProbability', deal.winProbability)}>
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-500">Description</h3>
                  {!isEditing.description && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditing({...isEditing, description: true})}
                    >
                      <PencilIcon className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  )}
                </div>
                {isEditing.description ? (
                  <div className="space-y-2">
                    <Textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => saveTextArea('description')}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setDescription(deal.description || '');
                          setIsEditing({...isEditing, description: false});
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p>{deal.description || 'No description provided.'}</p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-500">Next Steps</h3>
                  {!isEditing.nextSteps && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditing({...isEditing, nextSteps: true})}
                    >
                      <PencilIcon className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  )}
                </div>
                {isEditing.nextSteps ? (
                  <div className="space-y-2">
                    <Textarea 
                      value={nextSteps} 
                      onChange={(e) => setNextSteps(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => saveTextArea('nextSteps')}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setNextSteps(deal.nextSteps || '');
                          setIsEditing({...isEditing, nextSteps: false});
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p>{deal.nextSteps || 'No next steps defined.'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Related items */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Account</p>
                  <Link href={`/accounts/${deal.accountId}`}>
                    <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                      {account?.name || 'Loading...'}
                    </a>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <BriefcaseIcon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Projects</p>
                  <Link href={`/accounts/${deal.accountId}/projects`}>
                    <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                      View All Projects
                    </a>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Users2Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Contacts</p>
                  <Link href={`/accounts/${deal.accountId}/contacts`}>
                    <a className="text-slate-900 font-medium hover:text-primary-600 hover:underline">
                      View All Contacts
                    </a>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <BarChart4Icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Account Health</p>
                  <p className="text-slate-900 font-medium">
                    {account?.healthScore || '-'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}