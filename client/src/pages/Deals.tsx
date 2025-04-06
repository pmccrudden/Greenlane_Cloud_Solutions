import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Deal, Account } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Search, Plus, MoreHorizontal, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

// Deal form schema
const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  accountId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  value: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  stage: z.string().default('prospecting'),
  closeDate: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

export default function Deals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const { toast } = useToast();

  // Fetch deals
  const { data: deals = [], isLoading: isLoadingDeals } = useQuery<Deal[]>({
    queryKey: ['/api/deals'],
    onError: (error) => {
      toast({
        title: "Error loading deals",
        description: error instanceof Error ? error.message : "Failed to load deals",
        variant: "destructive",
      });
    },
  });

  // Fetch accounts for dropdown
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    onError: (error) => {
      toast({
        title: "Error loading accounts",
        description: error instanceof Error ? error.message : "Failed to load accounts",
        variant: "destructive",
      });
    },
  });

  // Filter deals based on search query
  const filteredDeals = deals.filter(deal => 
    deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (accounts.find(a => a.id === deal.accountId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open edit dialog
  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsEditDialogOpen(true);
  };

  // Get account name by ID
  const getAccountName = (accountId: number | undefined) => {
    if (!accountId) return '—';
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : '—';
  };

  // Format stage to display value
  const formatStage = (stage: string) => {
    return stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get stage badge
  const getStageBadge = (stage: string) => {
    const stageMap: Record<string, string> = {
      prospecting: "bg-slate-100 text-slate-800",
      qualification: "bg-slate-100 text-slate-800",
      needs_analysis: "bg-blue-100 text-blue-800",
      value_proposition: "bg-blue-100 text-blue-800",
      proposal: "bg-purple-100 text-purple-800",
      negotiation: "bg-blue-100 text-blue-800",
      closing: "bg-green-100 text-green-800",
      closed_won: "bg-green-100 text-green-800",
      closed_lost: "bg-red-100 text-red-800",
    };

    return stageMap[stage.toLowerCase().replace(/ /g, '_')] || "bg-slate-100 text-slate-800";
  };

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '—';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return '—';
    }
  };

  const isLoading = isLoadingDeals || isLoadingAccounts;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Deals</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Deal</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DealForm 
              onSubmitSuccess={() => setIsCreateDialogOpen(false)} 
              accounts={accounts}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Deals</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search deals..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading state
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="h-12 bg-slate-100 rounded"></div>
              ))}
            </div>
          ) : filteredDeals.length === 0 ? (
            // Empty state
            <div className="text-center py-10">
              <DollarSign className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No deals found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first deal'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Deal
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Table with deals
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal Name</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Closing Date</TableHead>
                    <TableHead>Win Probability</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.name}</TableCell>
                      <TableCell>{getAccountName(deal.accountId)}</TableCell>
                      <TableCell>{formatCurrency(deal.value)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageBadge(deal.stage)}`}>
                          {formatStage(deal.stage)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(deal.closeDate)}</TableCell>
                      <TableCell>
                        {deal.winProbability ? `${deal.winProbability}%` : '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditDeal(deal)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                window.location.href = `/deals/${deal.id}`;
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            {deal.accountId && (
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `/accounts/${deal.accountId}`;
                                }}
                              >
                                View Account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Deal Dialog */}
      {selectedDeal && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DealForm 
              deal={selectedDeal} 
              onSubmitSuccess={() => setIsEditDialogOpen(false)} 
              accounts={accounts}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface DealFormProps {
  deal?: Deal;
  onSubmitSuccess: () => void;
  accounts: Account[];
}

function DealForm({ deal, onSubmitSuccess, accounts }: DealFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: deal?.name || '',
      accountId: deal?.accountId ? deal.accountId.toString() : '',
      value: deal?.value ? deal.value.toString() : '',
      stage: deal?.stage || 'prospecting',
      closeDate: deal?.closeDate ? new Date(deal.closeDate).toISOString().substring(0, 10) : '',
    },
  });

  async function onSubmit(values: DealFormValues) {
    setIsSubmitting(true);
    try {
      if (deal) {
        // Update existing deal
        await apiRequest('PUT', `/api/deals/${deal.id}`, values);
        toast({
          title: "Deal updated",
          description: "The deal has been updated successfully",
        });
      } else {
        // Create new deal
        await apiRequest('POST', '/api/deals', values);
        toast({
          title: "Deal created",
          description: "The deal has been created successfully",
        });
      }
      
      // Invalidate deals query to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      onSubmitSuccess();
    } catch (error) {
      toast({
        title: deal ? "Failed to update deal" : "Failed to create deal",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{deal ? 'Edit Deal' : 'Create Deal'}</DialogTitle>
        <DialogDescription>
          {deal ? 'Update the deal details below' : 'Enter the details for the new deal'}
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deal Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Enterprise License Renewal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value ($)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="E.g., 50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospecting">Prospecting</SelectItem>
                        <SelectItem value="qualification">Qualification</SelectItem>
                        <SelectItem value="needs_analysis">Needs Analysis</SelectItem>
                        <SelectItem value="value_proposition">Value Proposition</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="closing">Closing</SelectItem>
                        <SelectItem value="closed_won">Closed Won</SelectItem>
                        <SelectItem value="closed_lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="closeDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Close Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" type="button" onClick={onSubmitSuccess}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (deal ? "Update Deal" : "Create Deal")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
