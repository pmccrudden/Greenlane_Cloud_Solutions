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
// Import icons
import { Shield, Globe, Users, Settings, Archive, Info, MessageSquare } from "lucide-react";
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

export default function ModuleManagement() {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([
    {
      id: "community",
      name: "Customer Community",
      description: "Create branded customer communities and forums with full CRM integration",
      enabled: false,
      status: "inactive",
      version: "1.0.0",
      lastUpdated: "2025-04-15T00:00:00Z",
      settings: {
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
      }
    },
    {
      id: "knowledge-base",
      name: "Knowledge Base",
      description: "Create and manage a self-service knowledge base for your customers",
      enabled: false,
      status: "inactive",
      version: "1.0.0"
    },
    {
      id: "api-gateway",
      name: "API Gateway",
      description: "Expose your CRM data via secure APIs for custom integrations",
      enabled: false,
      status: "inactive",
      version: "0.9.0"
    }
  ]);
  
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("general");
  
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

  // Initialize community settings from modules
  useEffect(() => {
    const communityModule = modules.find(m => m.id === "community");
    if (communityModule && communityModule.settings) {
      setCommunitySettings(communityModule.settings as CommunityModuleSettings);
    }
  }, [modules]);

  const handleToggleModule = (id: string) => {
    setModules(prev => 
      prev.map(module => 
        module.id === id 
          ? { 
              ...module, 
              enabled: !module.enabled,
              status: !module.enabled ? "active" : "inactive"
            } 
          : module
      )
    );

    const module = modules.find(m => m.id === id);
    if (module) {
      toast({
        title: `${module.name} ${!module.enabled ? "Enabled" : "Disabled"}`,
        description: `The module has been ${!module.enabled ? "enabled" : "disabled"} successfully.`,
      });
    }
  };

  const handleOpenSettings = (module: Module) => {
    setSelectedModule(module);
    
    // Initialize settings based on the module
    if (module.id === "community" && module.settings) {
      setCommunitySettings(module.settings as CommunityModuleSettings);
    }
    
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    if (!selectedModule) return;

    // Update module settings based on the module type
    if (selectedModule.id === "community") {
      setModules(prev => 
        prev.map(module => 
          module.id === selectedModule.id 
            ? { 
                ...module, 
                settings: communitySettings
              } 
            : module
        )
      );
    }

    setIsSettingsOpen(false);
    toast({
      title: "Settings Saved",
      description: `Settings for ${selectedModule.name} have been saved successfully.`,
    });
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
        {modules.map((module) => (
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

      {/* Settings Dialog for Community Module */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedModule?.name} Settings</DialogTitle>
            <DialogDescription>
              Configure settings for the {selectedModule?.name} module
            </DialogDescription>
          </DialogHeader>

          {selectedModule?.id === "community" && (
            <Tabs defaultValue="general" value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="integration">Integration</TabsTrigger>
              </TabsList>
              
              {/* General Settings */}
              <TabsContent value="general" className="space-y-4 py-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subdomain">Community Subdomain</Label>
                    <div className="flex items-center mt-1">
                      <Input
                        id="subdomain"
                        value={communitySettings.subdomain}
                        onChange={(e) => handleInputChange("subdomain", "subdomain", e.target.value)}
                        placeholder="your-community"
                        className="rounded-r-none"
                      />
                      <span className="bg-slate-100 px-3 py-2 border border-l-0 rounded-r-md text-slate-500">
                        .greenlanecloudsolutions.com
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      This will be the URL where your community is accessible
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                    <Input
                      id="customDomain"
                      value={communitySettings.customDomain || ""}
                      onChange={(e) => handleInputChange("customDomain", "customDomain", e.target.value)}
                      placeholder="community.yourcompany.com"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      If you want to use your own domain, enter it here. You'll need to set up DNS records.
                    </p>
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

          {/* Settings for other modules would go here, conditionally rendered based on selectedModule.id */}

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