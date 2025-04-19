import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Globe, ExternalLink, DownloadCloud, AlertCircle, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const communitySettingsSchema = z.object({
  customDomain: z.string().optional(),
  // Add other settings as needed
});

type CommunitySettingsFormValues = z.infer<typeof communitySettingsSchema>;

export default function CommunitySettings() {
  const { toast } = useToast();

  // Fetch community module
  const { data: modules, isLoading } = useQuery({
    queryKey: ['/api/modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/modules');
      return await response.json();
    },
  });

  // Find if community module is enabled and its settings
  const communityModule = modules?.find((module: any) => module.id === 'community');
  const isCommunityEnabled = communityModule?.enabled ?? false;
  const communitySettings = communityModule?.settings || {};

  const form = useForm<CommunitySettingsFormValues>({
    resolver: zodResolver(communitySettingsSchema),
    defaultValues: {
      customDomain: communitySettings?.customDomain || "",
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (communityModule?.settings) {
      form.reset({
        customDomain: communityModule.settings.customDomain || "",
      });
    }
  }, [communityModule, form]);

  // Mutation to update module settings
  const updateSettings = useMutation({
    mutationFn: async (data: CommunitySettingsFormValues) => {
      const response = await apiRequest('PATCH', `/api/modules/community`, {
        settings: data,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your community settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommunitySettingsFormValues) => {
    updateSettings.mutate(data);
  };

  // Toggle module enabled/disabled
  const toggleModule = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', `/api/modules/community`, {
        enabled: !isCommunityEnabled,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: isCommunityEnabled ? "Module disabled" : "Module enabled",
        description: `The community module has been ${isCommunityEnabled ? "disabled" : "enabled"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update module status. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Settings className="mr-2 h-8 w-8" /> Community Settings
          </h1>
          <p className="text-gray-500">Configure your community platform settings</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            variant={isCommunityEnabled ? "destructive" : "default"}
            onClick={() => toggleModule.mutate()}
            disabled={toggleModule.isPending}
          >
            {toggleModule.isPending ? (
              <DownloadCloud className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            {isCommunityEnabled ? "Disable Module" : "Enable Module"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Community Configuration</CardTitle>
              <CardDescription>Configure your community platform settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="customDomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Domain</FormLabel>
                        <FormControl>
                          <Input placeholder="community.yourdomain.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the domain where your community will be accessible
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={updateSettings.isPending || !isCommunityEnabled}
                  >
                    {updateSettings.isPending && (
                      <DownloadCloud className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Domain Setup Guide</CardTitle>
              <CardDescription>Follow these steps to set up your custom domain</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="step-1">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-primary">1</span>
                      </div>
                      Register your domain
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-9">
                    <p className="text-sm text-gray-500 mb-4">
                      If you don't already have a domain name, you'll need to register one through a domain registrar such as:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-500">
                      <li>Namecheap</li>
                      <li>GoDaddy</li>
                      <li>Google Domains</li>
                      <li>Cloudflare Registrar</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="step-2">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-primary">2</span>
                      </div>
                      Configure DNS settings
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-9">
                    <p className="text-sm text-gray-500 mb-4">
                      Add a CNAME record in your DNS settings to point your community subdomain to our service:
                    </p>
                    <div className="bg-gray-100 p-3 rounded-md font-mono text-sm mb-4">
                      <div><span className="text-gray-500">Type:</span> CNAME</div>
                      <div><span className="text-gray-500">Name:</span> community (or your subdomain of choice)</div>
                      <div><span className="text-gray-500">Value:</span> community.greenlanecloudsolutions.com</div>
                      <div><span className="text-gray-500">TTL:</span> 3600 (or Auto)</div>
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        DNS changes can take up to 24-48 hours to propagate globally, although they often take effect much sooner.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="step-3">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-primary">3</span>
                      </div>
                      Enter your domain in settings
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-9">
                    <p className="text-sm text-gray-500 mb-4">
                      Enter your full domain (including the subdomain) in the Custom Domain field above and save your settings.
                    </p>
                    <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                      <div>community.yourdomain.com</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="step-4">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-primary">4</span>
                      </div>
                      Verify domain connection
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-9">
                    <p className="text-sm text-gray-500 mb-4">
                      After DNS propagation is complete, verify that your domain is properly connected by visiting it in a browser.
                    </p>
                    <p className="text-sm text-gray-500">
                      If you experience any issues, please check your DNS settings again or contact support.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Module Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isCommunityEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isCommunityEnabled ? 'Active' : 'Inactive'}</span>
              </div>
              <Separator className="my-4" />
              <div>
                <div className="text-sm font-medium">Version</div>
                <div className="text-sm text-gray-500">{communityModule?.version || "1.0.0"}</div>
              </div>
              <Separator className="my-4" />
              <div>
                <div className="text-sm font-medium">Last Updated</div>
                <div className="text-sm text-gray-500">
                  {communityModule?.lastUpdated 
                    ? new Date(communityModule.lastUpdated).toLocaleDateString()
                    : "Never"}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isCommunityEnabled && communitySettings?.customDomain && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Community Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Custom Domain</div>
                    <a 
                      href={`https://${communitySettings.customDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center"
                    >
                      {communitySettings.customDomain}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href={`https://${communitySettings.customDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Community
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}