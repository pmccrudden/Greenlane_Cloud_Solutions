import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation, Link } from 'wouter';
import { ArrowLeft, Building, Mail, Phone, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Contact } from '@shared/schema';

export default function ContactDetail() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const contactId = parseInt(id);

  // Fetch contact data
  const { data: contact, isLoading: isContactLoading } = useQuery<Contact>({
    queryKey: [`/api/contacts/${contactId}`],
    enabled: !!contactId,
  });

  if (isContactLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation('/contacts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-56" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-full max-w-md mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-full max-w-xs" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-full max-w-xs" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-full max-w-xs" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-full max-w-xs" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/contacts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Contact Not Found</CardTitle>
            <CardDescription>The contact you're looking for doesn't exist or you don't have access to it.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/contacts')}>Go to Contacts List</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => setLocation('/contacts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{contact.firstName} {contact.lastName}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Basic details about {contact.firstName} {contact.lastName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                    {contact.email}
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Phone</h3>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={`tel:${contact.phone}`} className="hover:underline">
                    {contact.phone || 'N/A'}
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Account</h3>
                <p className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  {contact.accountId ? (
                    <Link to={`/accounts/${contact.accountId}`} className="text-primary hover:underline">
                      View Account
                    </Link>
                  ) : (
                    'No Associated Account'
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Job Title</h3>
                <p className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                  {contact.title || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="interactions">
          <TabsList className="mb-4">
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="support">Support Tickets</TabsTrigger>
          </TabsList>
          <TabsContent value="interactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Interactions</CardTitle>
                <CardDescription>Communications and activities with this contact</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No recent interactions found.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="deals">
            <Card>
              <CardHeader>
                <CardTitle>Related Deals</CardTitle>
                <CardDescription>Deals associated with this contact</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No deals associated with this contact.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Support tickets submitted by this contact</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No support tickets found for this contact.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}