import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Account } from '@/lib/types';
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
import { Search, Plus, MoreHorizontal, Building2 } from 'lucide-react';

// Account form schema
const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  industry: z.string().optional().transform(val => val === "none" ? undefined : val),
  employeeCount: z.string().optional().transform(val => val && val !== "unknown" ? parseInt(val) : undefined),
  website: z.string().optional(),
  parentAccountId: z.string().optional().transform(val => val && val !== "none" ? parseInt(val) : undefined),
  status: z.string().default('active'),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export default function Accounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const { toast } = useToast();

  // Fetch accounts
  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    onError: (error) => {
      toast({
        title: "Error loading accounts",
        description: error instanceof Error ? error.message : "Failed to load accounts",
        variant: "destructive",
      });
    },
  });

  // Filter accounts based on search query
  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (account.industry && account.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Open edit dialog
  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setIsEditDialogOpen(true);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-slate-100 text-slate-800",
      "at risk": "bg-yellow-100 text-yellow-800",
      churned: "bg-red-100 text-red-800",
    };

    return statusMap[status.toLowerCase()] || "bg-slate-100 text-slate-800";
  };

  // Calculate color based on health score
  const getHealthColor = (score: number | undefined) => {
    if (!score) return "bg-gray-500";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get parent account name by ID
  const getParentAccountName = (parentId: number | undefined) => {
    if (!parentId) return '—';
    const parent = accounts.find(a => a.id === parentId);
    return parent ? parent.name : '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Account</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <AccountForm 
              onSubmitSuccess={() => setIsCreateDialogOpen(false)} 
              accounts={accounts}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Accounts</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search accounts..."
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
          ) : filteredAccounts.length === 0 ? (
            // Empty state
            <div className="text-center py-10">
              <Building2 className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No accounts found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first account'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Account
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Table with accounts
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Parent Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => {
                    // Generate initials for the avatar
                    const initials = account.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();
                    
                    // Get initial background color based on name
                    const colors = [
                      "bg-primary-100 text-primary-700",
                      "bg-secondary-100 text-secondary-700",
                      "bg-accent-100 text-accent-700"
                    ];
                    const colorIndex = account.name.charCodeAt(0) % colors.length;
                    const avatarClass = colors[colorIndex];

                    return (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center ${avatarClass} rounded-full`}>
                              <span className="font-medium">{initials}</span>
                            </div>
                            <div className="ml-4">
                              <div 
                                className="font-medium text-slate-900 cursor-pointer hover:text-primary-600 hover:underline"
                                onClick={() => window.location.href = `/accounts/${account.id}`}
                              >
                                {account.name}
                              </div>
                              <div className="text-sm text-slate-500">
                                {account.employeeCount ? `${account.employeeCount}+ employees` : 'Unknown size'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{account.industry || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-16 bg-slate-200 rounded-full h-2.5">
                              <div className={`${getHealthColor(account.healthScore)} h-2.5 rounded-full`} style={{ width: `${account.healthScore || 0}%` }}></div>
                            </div>
                            <span className="ml-2 text-sm">{account.healthScore || '—'}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getParentAccountName(account.parentAccountId)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(account.status || 'active')}`}>
                            {account.status?.charAt(0).toUpperCase() + account.status?.slice(1) || 'Active'}
                          </span>
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
                              <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `/accounts/${account.id}`;
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `/accounts/${account.id}/contacts`;
                                }}
                              >
                                View Contacts
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `/accounts/${account.id}/deals`;
                                }}
                              >
                                View Deals
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Account Dialog */}
      {selectedAccount && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <AccountForm 
              account={selectedAccount} 
              onSubmitSuccess={() => setIsEditDialogOpen(false)} 
              accounts={accounts.filter(a => a.id !== selectedAccount.id)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface AccountFormProps {
  account?: Account;
  onSubmitSuccess: () => void;
  accounts: Account[];
}

function AccountForm({ account, onSubmitSuccess, accounts }: AccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name || '',
      industry: account?.industry || '',
      employeeCount: account?.employeeCount ? account.employeeCount.toString() : '',
      website: account?.website || '',
      parentAccountId: account?.parentAccountId ? account.parentAccountId.toString() : '',
      status: account?.status || 'active',
    },
  });

  async function onSubmit(values: AccountFormValues) {
    setIsSubmitting(true);
    try {
      if (account) {
        // Update existing account
        await apiRequest('PUT', `/api/accounts/${account.id}`, values);
        toast({
          title: "Account updated",
          description: "The account has been updated successfully",
        });
      } else {
        // Create new account
        await apiRequest('POST', '/api/accounts', values);
        toast({
          title: "Account created",
          description: "The account has been created successfully",
        });
      }
      
      // Invalidate accounts query to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      onSubmitSuccess();
    } catch (error) {
      toast({
        title: account ? "Failed to update account" : "Failed to create account",
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
        <DialogTitle>{account ? 'Edit Account' : 'Create Account'}</DialogTitle>
        <DialogDescription>
          {account ? 'Update the account details below' : 'Enter the details for the new account'}
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Acme Corporation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Hospitality">Hospitality</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="employeeCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Count</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="10">1-10</SelectItem>
                        <SelectItem value="50">11-50</SelectItem>
                        <SelectItem value="200">51-200</SelectItem>
                        <SelectItem value="500">201-500</SelectItem>
                        <SelectItem value="1000">501-1,000</SelectItem>
                        <SelectItem value="5000">1,001-5,000</SelectItem>
                        <SelectItem value="10000">5,001-10,000</SelectItem>
                        <SelectItem value="50000">10,000+</SelectItem>
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
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., https://www.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="parentAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Account</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent account (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="at risk">At Risk</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
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
              {isSubmitting ? "Saving..." : (account ? "Update Account" : "Create Account")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
