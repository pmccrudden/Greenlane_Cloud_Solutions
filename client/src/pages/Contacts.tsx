import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Contact, Account } from '@/lib/types';
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
import { Search, Plus, MoreHorizontal, Users } from 'lucide-react';
import { Link, useLocation } from 'wouter';

// Contact form schema
const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  title: z.string().optional(),
  accountId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  // Fetch contacts
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
    onError: (error) => {
      toast({
        title: "Error loading contacts",
        description: error instanceof Error ? error.message : "Failed to load contacts",
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

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => 
    contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.title && contact.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Open edit dialog
  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditDialogOpen(true);
  };

  // Get account name by ID
  const getAccountName = (accountId: number | undefined) => {
    if (!accountId) return '—';
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : '—';
  };

  const isLoading = isLoadingContacts || isLoadingAccounts;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Contact</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <ContactForm 
              onSubmitSuccess={() => setIsCreateDialogOpen(false)} 
              accounts={accounts}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Contacts</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search contacts..."
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
          ) : filteredContacts.length === 0 ? (
            // Empty state
            <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No contacts found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first contact'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Contact
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Table with contacts
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => {
                    // Generate initials for the avatar
                    const initials = `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();
                    
                    // Get initial background color based on name
                    const colors = [
                      "bg-primary-100 text-primary-700",
                      "bg-secondary-100 text-secondary-700",
                      "bg-accent-100 text-accent-700"
                    ];
                    const colorIndex = contact.firstName.charCodeAt(0) % colors.length;
                    const avatarClass = colors[colorIndex];

                    return (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center ${avatarClass} rounded-full`}>
                              <span className="font-medium">{initials}</span>
                            </div>
                            <div className="ml-4">
                              <Link to={`/contacts/${contact.id}`} className="font-medium text-slate-900 hover:text-primary cursor-pointer">
                                {contact.firstName} {contact.lastName}
                              </Link>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <a href={`mailto:${contact.email}`} className="text-primary-600 hover:underline">
                            {contact.email}
                          </a>
                        </TableCell>
                        <TableCell>
                          {contact.phone ? (
                            <a href={`tel:${contact.phone}`} className="text-primary-600 hover:underline">
                              {contact.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>{contact.title || '—'}</TableCell>
                        <TableCell>{getAccountName(contact.accountId)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/contacts/${contact.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {contact.accountId && (
                                <DropdownMenuItem asChild>
                                  <Link to={`/accounts/${contact.accountId}`}>
                                    View Account
                                  </Link>
                                </DropdownMenuItem>
                              )}
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

      {/* Edit Contact Dialog */}
      {selectedContact && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <ContactForm 
              contact={selectedContact} 
              onSubmitSuccess={() => setIsEditDialogOpen(false)} 
              accounts={accounts}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface ContactFormProps {
  contact?: Contact;
  onSubmitSuccess: () => void;
  accounts: Account[];
}

function ContactForm({ contact, onSubmitSuccess, accounts }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      title: contact?.title || '',
      accountId: contact?.accountId ? contact.accountId.toString() : '',
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setIsSubmitting(true);
    try {
      if (contact) {
        // Update existing contact
        await apiRequest('PUT', `/api/contacts/${contact.id}`, values);
        toast({
          title: "Contact updated",
          description: "The contact has been updated successfully",
        });
      } else {
        // Create new contact
        await apiRequest('POST', '/api/contacts', values);
        toast({
          title: "Contact created",
          description: "The contact has been created successfully",
        });
      }
      
      // Invalidate contacts query to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      onSubmitSuccess();
    } catch (error) {
      toast({
        title: contact ? "Failed to update contact" : "Failed to create contact",
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
        <DialogTitle>{contact ? 'Edit Contact' : 'Create Contact'}</DialogTitle>
        <DialogDescription>
          {contact ? 'Update the contact details below' : 'Enter the details for the new contact'}
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (123) 456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Marketing Director" {...field} />
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
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" type="button" onClick={onSubmitSuccess}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (contact ? "Update Contact" : "Create Contact")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
