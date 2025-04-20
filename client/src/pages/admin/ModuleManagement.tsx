import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Import icons
import { Shield, Globe, Users, Settings, Archive, Info, MessageSquare, CheckCircle, AlertCircle, ExternalLink, Plus, Trash2, CreditCard, PaintBucket, Check, ChevronRight, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SiMongodb, SiNodedotjs, SiReact, SiTailwindcss, SiExpress } from "react-icons/si";

// Define module type
type Module = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  status: "active" | "inactive" | "error";
  version: string;
  lastUpdated?: string;
  settings?: Record<string, any>;
  tenantId?: string; // Add tenantId to Module type
};

// Define the community setting types
type CommunityModuleSettings = {
  subdomain: string;
  customDomain?: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    showGreenLaneBranding: boolean;
  };
  features: {
    enableForums: boolean;
    enableGroups: boolean;
    enableDirectMessages: boolean;
    enableUserProfiles: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
  };
  integration: {
    syncUsers: boolean;
    syncCustomerData: boolean;
    createSupportTicketsFromPosts: boolean;
    notifyOnNegativeSentiment: boolean;
  };
};

// Define the support tickets module settings type
type SupportTicketsModuleSettings = {
  ticketCategories: string[];
  autoAssignment: boolean;
  slaSettings: {
    lowPriority: number; // hours
    mediumPriority: number; // hours
    highPriority: number; // hours
    criticalPriority: number; // hour
  };
  notifications: {
    emailOnNewTicket: boolean;
    emailOnTicketUpdate: boolean;
    emailOnTicketResolution: boolean;
  };
  integration: {
    syncWithCommunity: boolean;
    createContactsFromTickets: boolean;
  };
};

export default function ModuleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // State for holding modules
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("general");
  const [dnsVerification, setDnsVerification] = useState<{ status: 'verifying' | 'success' | 'error' | null, message?: string }>({ status: null });
  
  // Community settings state
  const [communitySettings, setCommunitySettings] = useState<CommunityModuleSettings>({
    subdomain: "",
    customDomain: "",
    branding: {
      primaryColor: "#10B981",
      secondaryColor: "#3B82F6",
      showGreenLaneBranding: true,
    },
    features: {
      enableForums: true,
      enableGroups: true,
      enableDirectMessages: true,
      enableUserProfiles: true,
      enableNotifications: true,
      enableAnalytics: true,
    },
    integration: {
      syncUsers: true,
      syncCustomerData: true,
      createSupportTicketsFromPosts: false,
      notifyOnNegativeSentiment: false,
    }
  });
  
  // Support Tickets settings state
  const [supportTicketsSettings, setSupportTicketsSettings] = useState<SupportTicketsModuleSettings>({
    ticketCategories: ['Technical', 'Billing', 'Feature Request', 'General'],
    autoAssignment: true,
    slaSettings: {
      lowPriority: 72, // hours
      mediumPriority: 24, // hours
      highPriority: 4, // hours
      criticalPriority: 1 // hour
    },
    notifications: {
      emailOnNewTicket: true,
      emailOnTicketUpdate: true,
      emailOnTicketResolution: true
    },
    integration: {
      syncWithCommunity: false,
      createContactsFromTickets: true
    }
  });

  // Fetch modules from the API
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['/api/modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/modules');
      return await response.json();
    }
  });

  // Mutation for toggling modules
  const toggleModuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string, enabled: boolean }) => {
      const response = await apiRequest('PATCH', `/api/modules/${id}`, {
        enabled,
        status: enabled ? 'active' : 'inactive'
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update module: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutation for updating module settings
  const updateModuleSettingsMutation = useMutation({
    mutationFn: async ({ id, settings }: { id: string, settings: any }) => {
      const response = await apiRequest('PATCH', `/api/modules/${id}`, { settings });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modules'] });
      setIsSettingsOpen(false);
      toast({
        title: "Settings Saved",
        description: `Module settings have been saved successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Initialize community settings from modules when data changes
  useEffect(() => {
    const communityModule = modules.find((m: Module) => m.id === "community");
    if (communityModule?.settings) {
      // Define default settings
      const defaultSettings = {
        subdomain: "",
        customDomain: "",
        branding: {
          primaryColor: "#10B981",
          secondaryColor: "#3B82F6",
          showGreenLaneBranding: true,
        },
        features: {
          enableForums: true,
          enableGroups: true,
          enableDirectMessages: true,
          enableUserProfiles: true,
          enableNotifications: true,
          enableAnalytics: true,
        },
        integration: {
          syncUsers: true,
          syncCustomerData: true,
          createSupportTicketsFromPosts: false,
          notifyOnNegativeSentiment: false,
        }
      };
      
      // Safely access nested objects with fallbacks
      const settings = communityModule.settings as Partial<CommunityModuleSettings>;
      const branding = settings.branding || {};
      const features = settings.features || {};
      const integration = settings.integration || {};
      
      // Create merged settings object
      const mergedSettings = {
        ...defaultSettings,
        ...settings,
        branding: {
          ...defaultSettings.branding,
          ...branding
        },
        features: {
          ...defaultSettings.features,
          ...features
        },
        integration: {
          ...defaultSettings.integration,
          ...integration
        }
      };
      
      setCommunitySettings(mergedSettings);
    }
  }, [modules]);
  
  // Initialize support tickets settings from modules when data changes
  useEffect(() => {
    const supportTicketsModule = modules.find((m: Module) => m.id === "supportTickets");
    if (supportTicketsModule?.settings) {
      // Define default settings
      const defaultSettings = {
        ticketCategories: ['Technical', 'Billing', 'Feature Request', 'General'],
        autoAssignment: true,
        slaSettings: {
          lowPriority: 72, // hours
          mediumPriority: 24, // hours
          highPriority: 4, // hours
          criticalPriority: 1 // hour
        },
        notifications: {
          emailOnNewTicket: true,
          emailOnTicketUpdate: true,
          emailOnTicketResolution: true
        },
        integration: {
          syncWithCommunity: false,
          createContactsFromTickets: true
        }
      };
      
      // Safely access nested objects with fallbacks
      const settings = supportTicketsModule.settings as Partial<SupportTicketsModuleSettings>;
      const slaSettings = settings.slaSettings || {};
      const notifications = settings.notifications || {};
      const integration = settings.integration || {};
      
      // Create merged settings object
      const mergedSettings = {
        ...defaultSettings,
        ...settings,
        slaSettings: {
          ...defaultSettings.slaSettings,
          ...slaSettings
        },
        notifications: {
          ...defaultSettings.notifications,
          ...notifications
        },
        integration: {
          ...defaultSettings.integration,
          ...integration
        }
      };
      
      setSupportTicketsSettings(mergedSettings);
    }
  }, [modules]);

  // Handler for toggling module state
  const handleToggleModule = (id: string) => {
    const module = modules.find((m: Module) => m.id === id);
    if (module) {
      toggleModuleMutation.mutate({ 
        id, 
        enabled: !module.enabled 
      });
    }
  };

  const handleOpenSettings = (module: Module) => {
    setSelectedModule(module);
    
    // Initialize settings based on the module with proper defaults
    if (module.id === "community") {
      const defaultSettings = {
        subdomain: "",
        customDomain: "",
        branding: {
          primaryColor: "#10B981",
          secondaryColor: "#3B82F6",
          showGreenLaneBranding: true,
        },
        features: {
          enableForums: true,
          enableGroups: true,
          enableDirectMessages: true,
          enableUserProfiles: true,
          enableNotifications: true,
          enableAnalytics: true,
        },
        integration: {
          syncUsers: true,
          syncCustomerData: true,
          createSupportTicketsFromPosts: false,
          notifyOnNegativeSentiment: false,
        }
      };
      
      if (module.settings) {
        // Merge with defaults for proper initialization
        const settings = module.settings as Partial<CommunityModuleSettings>;
        setCommunitySettings({
          ...defaultSettings,
          ...settings,
          // Ensure nested objects are properly merged
          branding: {
            ...defaultSettings.branding,
            ...(settings.branding || {})
          },
          features: {
            ...defaultSettings.features,
            ...(settings.features || {})
          },
          integration: {
            ...defaultSettings.integration,
            ...(settings.integration || {})
          }
        });
      } else {
        // Use defaults if no settings
        setCommunitySettings(defaultSettings);
      }
    } else if (module.id === "supportTickets") {
      const defaultSettings = {
        ticketCategories: ['Technical', 'Billing', 'Feature Request', 'General'],
        autoAssignment: true,
        slaSettings: {
          lowPriority: 72, // hours
          mediumPriority: 24, // hours
          highPriority: 4, // hours
          criticalPriority: 1 // hour
        },
        notifications: {
          emailOnNewTicket: true,
          emailOnTicketUpdate: true,
          emailOnTicketResolution: true
        },
        integration: {
          syncWithCommunity: false,
          createContactsFromTickets: true
        }
      };
      
      if (module.settings) {
        // Merge with defaults for proper initialization
        const settings = module.settings as Partial<SupportTicketsModuleSettings>;
        setSupportTicketsSettings({
          ...defaultSettings,
          ...settings,
          // Ensure nested objects are properly merged
          slaSettings: {
            ...defaultSettings.slaSettings,
            ...(settings.slaSettings || {})
          },
          notifications: {
            ...defaultSettings.notifications,
            ...(settings.notifications || {})
          },
          integration: {
            ...defaultSettings.integration,
            ...(settings.integration || {})
          }
        });
      } else {
        // Use defaults if no settings
        setSupportTicketsSettings(defaultSettings);
      }
    }
    
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    if (!selectedModule) return;

    // Save settings to the backend using the mutation
    if (selectedModule.id === "community") {
      updateModuleSettingsMutation.mutate({
        id: selectedModule.id,
        settings: communitySettings
      });
    } else if (selectedModule.id === "supportTickets") {
      updateModuleSettingsMutation.mutate({
        id: selectedModule.id,
        settings: supportTicketsSettings
      });
    }
  };
  
  // Extract subdomain from tenant ID
  const extractSubdomainFromTenant = () => {
    // Get the tenant name from the selected module or use a generic default
    const tenant = selectedModule?.tenantId || "572c77d7-e838-44ca-8adb-7ddef5f199bb";
    // Create a readable subdomain from the first 8 characters of the tenant ID
    return `community-${tenant.substring(0, 8)}`;
  };

  // Function to check DNS settings
  const handleVerifyDNS = () => {
    if (!communitySettings.customDomain) {
      toast({
        title: "Domain Required",
        description: "Please enter a custom domain before verifying DNS settings.",
        variant: "destructive"
      });
      return;
    }
    
    setDnsVerification({ status: 'verifying' });
    
    // Simulate DNS verification with a delay
    setTimeout(() => {
      // In a real implementation, this would make an API call to verify DNS
      const success = Math.random() > 0.3; // Simulating success rate for demo purposes
      
      if (success) {
        setDnsVerification({ 
          status: 'success', 
          message: `DNS verification successful for ${communitySettings.customDomain}! SSL certificate will be provisioned automatically.` 
        });
      } else {
        setDnsVerification({ 
          status: 'error', 
          message: `Could not verify DNS records for ${communitySettings.customDomain}. Please check your DNS configuration.` 
        });
      }
    }, 2000);
  };

  const handleInputChange = (
    section: keyof CommunityModuleSettings,
    field: string,
    value: any
  ) => {
    if (section === "branding" || section === "features" || section === "integration") {
      setCommunitySettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setCommunitySettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  const handleSupportTicketsInputChange = (
    section: keyof SupportTicketsModuleSettings,
    field: string,
    value: any
  ) => {
    if (section === "slaSettings" || section === "notifications" || section === "integration") {
      setSupportTicketsSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else if (section === "ticketCategories") {
      // Handle array updates
      if (Array.isArray(value)) {
        setSupportTicketsSettings(prev => ({
          ...prev,
          ticketCategories: value
        }));
      }
    } else {
      setSupportTicketsSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const getStatusBadge = (status: Module["status"]) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>;
      case "inactive":
        return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800">Inactive</span>;
      case "error":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Error</span>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Module Management</h1>
          <p className="text-slate-500 mt-2">
            Enable or disable modules and configure their settings
          </p>
        </div>
      </div>

      {/* Module List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module: Module) => (
          <Card key={module.id} className="h-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{module.name}</CardTitle>
                <div>{getStatusBadge(module.status)}</div>
              </div>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span>{module.version}</span>
                </div>
                {module.lastUpdated && (
                  <div className="flex justify-between mt-1">
                    <span>Last Updated</span>
                    <span>{new Date(module.lastUpdated).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={module.enabled}
                  onCheckedChange={() => handleToggleModule(module.id)}
                  id={`switch-${module.id}`}
                />
                <Label htmlFor={`switch-${module.id}`}>
                  {module.enabled ? "Enabled" : "Disabled"}
                </Label>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleOpenSettings(module)}
                disabled={!module.enabled}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedModule?.name} Settings</DialogTitle>
            <DialogDescription>
              Configure settings for the {selectedModule?.name} module
            </DialogDescription>
          </DialogHeader>

          {selectedModule?.id === "community" && (
            <Tabs defaultValue="general" value={currentTab} onValueChange={setCurrentTab}>
              <div className="sticky top-0 z-10 bg-white pt-2 pb-4 border-b">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="integration">Integration</TabsTrigger>
                </TabsList>
              </div>
              
              {/* General Settings */}
              <TabsContent value="general" className="space-y-4 py-4">
                <div className="space-y-4">
                  <div className="bg-white border rounded-md p-4 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2">Domain Setup</h3>
                    <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                      <h4 className="font-medium text-blue-800 flex items-center gap-1.5">
                        <Info className="h-4 w-4" />
                        Setup Progress
                      </h4>
                      <div className="mt-2 w-full bg-blue-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full" 
                          style={{ 
                            width: dnsVerification.status === 'success' ? '100%' : 
                                  communitySettings.customDomain ? '50%' : '25%' 
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1 text-blue-700">
                        {dnsVerification.status === 'success' 
                          ? 'Complete! Your community is ready.' 
                          : communitySettings.customDomain 
                            ? 'Step 2: Verify your domain DNS settings' 
                            : 'Step 1: Configure your community domain'}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="useCustomDomain" className="text-sm font-medium">
                            Use a Custom Domain?
                          </Label>
                          <Switch 
                            id="useCustomDomain" 
                            checked={!!communitySettings.customDomain} 
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                handleInputChange("customDomain", "customDomain", "");
                                setDnsVerification({ status: null });
                              }
                            }}
                          />
                        </div>
                        
                        {!communitySettings.customDomain && (
                          <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mb-3">
                            <p className="text-sm text-gray-700">
                              Your community will be accessible at: <span className="font-medium">{communitySettings.subdomain || extractSubdomainFromTenant()}.greenlanecloudsolutions.com</span> (default)
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              This subdomain is ready to use with no additional setup required. Toggle the switch above to use your own custom domain.
                            </p>
                          </div>
                        )}
                        
                        {!!communitySettings.customDomain && (
                          <>
                            <Label htmlFor="customDomain">Custom Domain</Label>
                            <div className="flex mt-1">
                              <Input
                                id="customDomain"
                                value={communitySettings.customDomain || ""}
                                onChange={(e) => handleInputChange("customDomain", "customDomain", e.target.value)}
                                placeholder="community.yourcompany.com"
                                className="rounded-r-none"
                              />
                              <Button 
                                type="button" 
                                variant="secondary"
                                className="rounded-l-none flex gap-2 items-center"
                                onClick={handleVerifyDNS}
                                disabled={dnsVerification.status === 'verifying' || !communitySettings.customDomain}
                              >
                                {dnsVerification.status === 'verifying' ? (
                                  <>
                                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                    Verifying...
                                  </>
                                ) : "Verify DNS"}
                              </Button>
                            </div>
                            <div className="mt-2 text-xs text-slate-600 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              We'll automatically secure your domain with a free SSL certificate (HTTPS)
                            </div>
                            
                            <div className="mt-4 bg-amber-50 p-3 rounded-md border border-amber-100">
                              <h4 className="text-sm font-medium text-amber-800">DNS Setup Instructions</h4>
                              <ol className="mt-2 text-xs text-amber-700 list-decimal list-inside space-y-1">
                                <li>Log in to your domain registrar (e.g., GoDaddy, Namecheap)</li>
                                <li>Find the DNS management section</li>
                                <li>Add a CNAME record pointing your custom domain to <code className="bg-amber-100 px-1 py-0.5 rounded">greenlanecloudsolutions.com</code></li>
                                <li>Save changes and click "Verify DNS" above (may take 24-48 hours to propagate)</li>
                              </ol>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {dnsVerification.status && (
                        <div className={`p-3 rounded-md mt-3 ${
                          dnsVerification.status === 'success' 
                            ? 'bg-green-50 text-green-800 border border-green-200' 
                            : dnsVerification.status === 'error'
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          <div className="flex items-start">
                            {dnsVerification.status === 'success' ? (
                              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            ) : dnsVerification.status === 'error' ? (
                              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            ) : (
                              <Info className="h-5 w-5 mr-2 flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {dnsVerification.status === 'success' 
                                  ? 'DNS Verification Successful' 
                                  : dnsVerification.status === 'error'
                                    ? 'DNS Verification Failed'
                                    : 'Verifying DNS Settings'}
                              </p>
                              <p className="text-xs mt-1">{dnsVerification.message}</p>
                              
                              {dnsVerification.status === 'success' && (
                                <a 
                                  href={`https://${communitySettings.customDomain}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-xs font-medium mt-2 hover:underline"
                                >
                                  Visit your community portal
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-md">
                        <p className="text-sm text-blue-800 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-blue-500" />
                          Default Access
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          While setting up your custom domain, your community will be accessible at the default URL:
                        </p>
                        <div className="bg-white px-3 py-2 rounded text-sm mt-1 font-mono">
                          https://community-{selectedModule?.id}.greenlanecloudsolutions.com
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                    <h4 className="text-amber-800 font-medium flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Domain Setup Guide
                    </h4>
                    <div className="mt-3 space-y-4">
                      <div>
                        <h5 className="font-medium text-sm text-amber-800">Step 1: Register Your Domain</h5>
                        <p className="text-xs text-amber-700 mt-1">
                          If you don't already have a domain, register one through a domain registrar like
                          Namecheap, GoDaddy, or Google Domains.
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm text-amber-800">Step 2: Configure DNS Settings</h5>
                        <p className="text-xs text-amber-700 mt-1">
                          Log in to your domain registrar's dashboard and access the DNS settings for your domain.
                          You'll need to add the following records:
                        </p>
                        <div className="mt-2 bg-white p-3 rounded border border-amber-200 text-xs">
                          <div className="grid grid-cols-3 gap-2 font-medium text-amber-800 pb-1 border-b border-amber-100">
                            <div>Record Type</div>
                            <div>Host/Name</div>
                            <div>Value/Points To</div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2 text-amber-700">
                            <div>CNAME</div>
                            <div>community</div>
                            <div>community.greenlanecloudsolutions.com</div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2 text-amber-700">
                            <div>A</div>
                            <div>community</div>
                            <div>18.205.24.136</div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2 pb-1 text-amber-700">
                            <div>TXT</div>
                            <div>_greenlaneverify.community</div>
                            <div>verify=tenant-{selectedModule?.id}</div>
                          </div>
                        </div>
                        <p className="text-xs text-amber-700 mt-2">
                          Note: DNS changes can take up to 24-48 hours to propagate globally, though they often take effect much sooner.
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm text-amber-800">Step 3: SSL Certificate Setup</h5>
                        <p className="text-xs text-amber-700 mt-1">
                          SSL certificates are provisioned automatically once your DNS settings are verified. This typically takes 15-30 minutes after DNS propagation.
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm text-amber-800">Step 4: Domain Verification</h5>
                        <p className="text-xs text-amber-700 mt-1">
                          After saving your settings, our system will automatically verify your domain configuration. You can check the status in the "Domains" section.
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm text-amber-800">Step 5: Test Your Community</h5>
                        <p className="text-xs text-amber-700 mt-1">
                          Once verification is complete, visit your community domain to ensure everything is working properly. If you encounter any issues, please contact our support team.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Technical Information</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          The community module uses the following technologies:
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3">
                          <div className="flex items-center bg-white px-3 py-1 rounded-full text-xs">
                            <SiNodedotjs className="w-4 h-4 text-green-600 mr-1" />
                            Node.js
                          </div>
                          <div className="flex items-center bg-white px-3 py-1 rounded-full text-xs">
                            <SiExpress className="w-4 h-4 text-gray-800 mr-1" />
                            Express.js
                          </div>
                          <div className="flex items-center bg-white px-3 py-1 rounded-full text-xs">
                            <SiReact className="w-4 h-4 text-blue-500 mr-1" />
                            React.js
                          </div>
                          <div className="flex items-center bg-white px-3 py-1 rounded-full text-xs">
                            <SiMongodb className="w-4 h-4 text-green-500 mr-1" />
                            MongoDB
                          </div>
                          <div className="flex items-center bg-white px-3 py-1 rounded-full text-xs">
                            <SiTailwindcss className="w-4 h-4 text-blue-400 mr-1" />
                            Tailwind CSS
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Branding Settings */}
              <TabsContent value="branding" className="space-y-4 py-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={communitySettings.branding.primaryColor}
                        onChange={(e) => handleInputChange("branding", "primaryColor", e.target.value)}
                        className="w-20 p-1 h-10"
                      />
                      <Input
                        value={communitySettings.branding.primaryColor}
                        onChange={(e) => handleInputChange("branding", "primaryColor", e.target.value)}
                        className="ml-2"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Main color used for buttons, links, and accents
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex mt-1">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={communitySettings.branding.secondaryColor}
                        onChange={(e) => handleInputChange("branding", "secondaryColor", e.target.value)}
                        className="w-20 p-1 h-10"
                      />
                      <Input
                        value={communitySettings.branding.secondaryColor}
                        onChange={(e) => handleInputChange("branding", "secondaryColor", e.target.value)}
                        className="ml-2"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Secondary color used for highlights and secondary elements
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="showGreenLaneBranding"
                      checked={communitySettings.branding.showGreenLaneBranding}
                      onCheckedChange={(checked) => 
                        handleInputChange("branding", "showGreenLaneBranding", checked)
                      }
                    />
                    <Label htmlFor="showGreenLaneBranding">Show "Powered by GreenLane" branding</Label>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="logoUpload">Community Logo (Optional)</Label>
                    <Input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Recommended size: 200x50px. PNG or SVG with transparent background.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              {/* Features Settings */}
              <TabsContent value="features" className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-md mr-3">
                        <MessageSquare className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Discussion Forums</h4>
                        <p className="text-sm text-slate-500">
                          Allow users to create and participate in discussion threads
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={communitySettings.features.enableForums}
                      onCheckedChange={(checked) => 
                        handleInputChange("features", "enableForums", checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-md mr-3">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">User Groups</h4>
                        <p className="text-sm text-slate-500">
                          Create public and private groups with separate discussions
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={communitySettings.features.enableGroups}
                      onCheckedChange={(checked) => 
                        handleInputChange("features", "enableGroups", checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-md mr-3">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">User Profiles</h4>
                        <p className="text-sm text-slate-500">
                          Allow users to customize their profiles with avatars and bios
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={communitySettings.features.enableUserProfiles}
                      onCheckedChange={(checked) => 
                        handleInputChange("features", "enableUserProfiles", checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-md mr-3">
                        <Archive className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Direct Messages</h4>
                        <p className="text-sm text-slate-500">
                          Allow users to send private messages to each other
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={communitySettings.features.enableDirectMessages}
                      onCheckedChange={(checked) => 
                        handleInputChange("features", "enableDirectMessages", checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-md mr-3">
                        <Archive className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Notifications</h4>
                        <p className="text-sm text-slate-500">
                          Send email and in-app notifications for new posts and replies
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={communitySettings.features.enableNotifications}
                      onCheckedChange={(checked) => 
                        handleInputChange("features", "enableNotifications", checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-md mr-3">
                        <Archive className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Analytics</h4>
                        <p className="text-sm text-slate-500">
                          Track engagement metrics and user activity
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={communitySettings.features.enableAnalytics}
                      onCheckedChange={(checked) => 
                        handleInputChange("features", "enableAnalytics", checked)
                      }
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Integration Settings */}
              <TabsContent value="integration" className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-md mr-3">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Sync Users</h4>
                        <p className="text-sm text-slate-500">
                          Automatically sync users between the CRM and community
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={communitySettings.integration.syncUsers}
                      onCheckedChange={(checked) => 
                        handleInputChange("integration", "syncUsers", checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-md mr-3">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Sync Customer Data</h4>
                        <p className="text-sm text-slate-500">
                          Sync customer data from the CRM to enrich community profiles
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={communitySettings.integration.syncCustomerData}
                      onCheckedChange={(checked) => 
                        handleInputChange("integration", "syncCustomerData", checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-md mr-3">
                        <Shield className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Create Support Tickets from Posts</h4>
                        <p className="text-sm text-slate-500">
                          Automatically create support tickets from flagged posts
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={communitySettings.integration.createSupportTicketsFromPosts}
                      onCheckedChange={(checked) => 
                        handleInputChange("integration", "createSupportTicketsFromPosts", checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-2 rounded-md mr-3">
                        <Shield className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Negative Sentiment Alerts</h4>
                        <p className="text-sm text-slate-500">
                          Send alerts to CRM when negative sentiment is detected in posts
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={communitySettings.integration.notifyOnNegativeSentiment}
                      onCheckedChange={(checked) => 
                        handleInputChange("integration", "notifyOnNegativeSentiment", checked)
                      }
                    />
                  </div>
                  
                  <div className="mt-6">
                    <Label htmlFor="apiEndpoints">API Endpoints</Label>
                    <div className="mt-2 p-3 bg-slate-800 text-white rounded-md font-mono text-sm overflow-auto">
                      <div>GET /api/community/users</div>
                      <div>POST /api/community/interactions</div>
                      <div>GET /api/community/analytics</div>
                      <div>POST /api/community/webhooks</div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      These endpoints are used to communicate between the CRM and community module
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {selectedModule?.id === "supportTickets" && (
            <Tabs defaultValue="general" value={currentTab} onValueChange={setCurrentTab}>
              <div className="sticky top-0 z-10 bg-white pt-2 pb-4 border-b">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="sla">SLA Settings</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="integration">Integration</TabsTrigger>
                </TabsList>
              </div>
              
              {/* General Settings */}
              <TabsContent value="general" className="space-y-4 py-4">
                <div className="bg-white border rounded-md p-4 shadow-sm">
                  <h3 className="font-semibold text-lg mb-4">Ticket Categories</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Configure the categories available when creating support tickets.
                  </p>
                  
                  <div className="space-y-4">
                    {supportTicketsSettings.ticketCategories.map((category, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input 
                          value={category}
                          onChange={(e) => {
                            const newCategories = [...supportTicketsSettings.ticketCategories];
                            newCategories[index] = e.target.value;
                            handleSupportTicketsInputChange("ticketCategories", "", newCategories);
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newCategories = supportTicketsSettings.ticketCategories.filter((_, i) => i !== index);
                            handleSupportTicketsInputChange("ticketCategories", "", newCategories);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newCategories = [...supportTicketsSettings.ticketCategories, ""];
                        handleSupportTicketsInputChange("ticketCategories", "", newCategories);
                      }}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white border rounded-md p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Automatic Assignment</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Enable automatic assignment of tickets to available support staff
                      </p>
                    </div>
                    <Switch
                      checked={supportTicketsSettings.autoAssignment}
                      onCheckedChange={(checked) => {
                        handleSupportTicketsInputChange("autoAssignment", "autoAssignment", checked);
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* SLA Settings */}
              <TabsContent value="sla" className="space-y-4 py-4">
                <div className="bg-white border rounded-md p-4 shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">Service Level Agreement Settings</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Configure response time expectations based on ticket priority.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="lowPriority">Low Priority Response Time (hours)</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="lowPriority"
                          type="number"
                          min="1"
                          value={supportTicketsSettings.slaSettings.lowPriority}
                          onChange={(e) => {
                            handleSupportTicketsInputChange(
                              "slaSettings",
                              "lowPriority",
                              parseInt(e.target.value) || 0
                            );
                          }}
                        />
                        <span className="ml-2 text-sm text-slate-500">hours</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="mediumPriority">Medium Priority Response Time (hours)</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="mediumPriority"
                          type="number"
                          min="1"
                          value={supportTicketsSettings.slaSettings.mediumPriority}
                          onChange={(e) => {
                            handleSupportTicketsInputChange(
                              "slaSettings",
                              "mediumPriority",
                              parseInt(e.target.value) || 0
                            );
                          }}
                        />
                        <span className="ml-2 text-sm text-slate-500">hours</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="highPriority">High Priority Response Time (hours)</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="highPriority"
                          type="number"
                          min="1"
                          value={supportTicketsSettings.slaSettings.highPriority}
                          onChange={(e) => {
                            handleSupportTicketsInputChange(
                              "slaSettings",
                              "highPriority",
                              parseInt(e.target.value) || 0
                            );
                          }}
                        />
                        <span className="ml-2 text-sm text-slate-500">hours</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="criticalPriority">Critical Priority Response Time (hours)</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="criticalPriority"
                          type="number"
                          min="1"
                          value={supportTicketsSettings.slaSettings.criticalPriority}
                          onChange={(e) => {
                            handleSupportTicketsInputChange(
                              "slaSettings",
                              "criticalPriority",
                              parseInt(e.target.value) || 0
                            );
                          }}
                        />
                        <span className="ml-2 text-sm text-slate-500">hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Notifications Settings */}
              <TabsContent value="notifications" className="space-y-4 py-4">
                <div className="bg-white border rounded-md p-4 shadow-sm">
                  <h3 className="font-semibold text-lg mb-4">Email Notifications</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Configure when email notifications should be sent to support team members.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailOnNewTicket" className="text-base font-medium">
                          New Ticket Notification
                        </Label>
                        <p className="text-sm text-slate-500 mt-1">
                          Send email when a new support ticket is created
                        </p>
                      </div>
                      <Switch
                        id="emailOnNewTicket"
                        checked={supportTicketsSettings.notifications.emailOnNewTicket}
                        onCheckedChange={(checked) => {
                          handleSupportTicketsInputChange(
                            "notifications",
                            "emailOnNewTicket",
                            checked
                          );
                        }}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailOnTicketUpdate" className="text-base font-medium">
                          Ticket Update Notification
                        </Label>
                        <p className="text-sm text-slate-500 mt-1">
                          Send email when a support ticket is updated
                        </p>
                      </div>
                      <Switch
                        id="emailOnTicketUpdate"
                        checked={supportTicketsSettings.notifications.emailOnTicketUpdate}
                        onCheckedChange={(checked) => {
                          handleSupportTicketsInputChange(
                            "notifications",
                            "emailOnTicketUpdate",
                            checked
                          );
                        }}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailOnTicketResolution" className="text-base font-medium">
                          Ticket Resolution Notification
                        </Label>
                        <p className="text-sm text-slate-500 mt-1">
                          Send email when a support ticket is resolved
                        </p>
                      </div>
                      <Switch
                        id="emailOnTicketResolution"
                        checked={supportTicketsSettings.notifications.emailOnTicketResolution}
                        onCheckedChange={(checked) => {
                          handleSupportTicketsInputChange(
                            "notifications",
                            "emailOnTicketResolution",
                            checked
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Integration Settings */}
              <TabsContent value="integration" className="space-y-4 py-4">
                <div className="bg-white border rounded-md p-4 shadow-sm">
                  <h3 className="font-semibold text-lg mb-4">Integration Options</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Configure how the Support Tickets module integrates with other parts of the system.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="syncWithCommunity" className="text-base font-medium">
                          Sync with Community
                        </Label>
                        <p className="text-sm text-slate-500 mt-1">
                          Allow converting community posts to support tickets
                        </p>
                      </div>
                      <Switch
                        id="syncWithCommunity"
                        checked={supportTicketsSettings.integration.syncWithCommunity}
                        onCheckedChange={(checked) => {
                          handleSupportTicketsInputChange(
                            "integration",
                            "syncWithCommunity",
                            checked
                          );
                        }}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="createContactsFromTickets" className="text-base font-medium">
                          Create Contacts from Tickets
                        </Label>
                        <p className="text-sm text-slate-500 mt-1">
                          Automatically create contact records for new ticket submitters
                        </p>
                      </div>
                      <Switch
                        id="createContactsFromTickets"
                        checked={supportTicketsSettings.integration.createContactsFromTickets}
                        onCheckedChange={(checked) => {
                          handleSupportTicketsInputChange(
                            "integration",
                            "createContactsFromTickets",
                            checked
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}