import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Check,
  ExternalLink,
  Plus,
  Trash,
} from "lucide-react";
import { 
  SiAsana, 
  SiAmazon,
  SiGooglecalendar, 
  SiHubspot, 
  SiIntercom, 
  SiJira, 
  SiMailchimp, 
  SiSendgrid, 
  SiSlack, 
  SiStripe, 
  SiTrello, 
  SiTwilio, 
  SiZapier, 
  SiZendesk, 
  SiZoom
} from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Integration = {
  id: string;
  name: string;
  provider: string;
  status: "active" | "inactive" | "error";
  lastSynced?: string;
  details?: {
    email?: string;
    apiKey?: string;
    webhookUrl?: string;
  };
};

export default function Integrations() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([
    // Sample active integration
    {
      id: "1",
      name: "Marketing Emails",
      provider: "sendgrid",
      status: "active",
      lastSynced: new Date().toISOString(),
      details: {
        email: "marketing@greenlanecloudsolutions.com",
      },
    },
    {
      id: "2",
      name: "Support Chat",
      provider: "slack",
      status: "active",
      lastSynced: new Date().toISOString(),
    }
  ]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [integrationForm, setIntegrationForm] = useState({
    name: "",
    email: "",
    apiKey: "",
    webhookUrl: "",
    bucketName: "",
    region: "",
    accessKeyId: "",
    secretAccessKey: "",
  });

  // Integration types with their icons and status
  const availableIntegrations = [
    {
      id: "aws_s3",
      name: "AWS S3",
      description: "Data storage and CSV import for customer data",
      icon: <SiAmazon className="w-8 h-8 text-[#FF9900]" />,
      status: "available"
    },
    { 
      id: "slack", 
      name: "Slack", 
      description: "Team communication and notifications",
      icon: <SiSlack className="w-8 h-8 text-[#4A154B]" />,
      status: "available" 
    },
    { 
      id: "sendgrid", 
      name: "SendGrid", 
      description: "Email service for transactional and marketing emails",
      icon: <SiSendgrid className="w-8 h-8 text-[#1A82E2]" />,
      status: "available" 
    },
    { 
      id: "twilio", 
      name: "Twilio", 
      description: "SMS, voice, and messaging services",
      icon: <SiTwilio className="w-8 h-8 text-[#F22F46]" />,
      status: "coming_soon" 
    },
    { 
      id: "stripe", 
      name: "Stripe", 
      description: "Payment processing platform",
      icon: <SiStripe className="w-8 h-8 text-[#635BFF]" />,
      status: "available" 
    },
    { 
      id: "hubspot", 
      name: "HubSpot", 
      description: "Marketing, sales, and service platform",
      icon: <SiHubspot className="w-8 h-8 text-[#FF7A59]" />,
      status: "coming_soon" 
    },
    { 
      id: "zendesk", 
      name: "Zendesk", 
      description: "Customer service and engagement platform",
      icon: <SiZendesk className="w-8 h-8 text-[#03363D]" />,
      status: "coming_soon" 
    },
    { 
      id: "zoom", 
      name: "Zoom", 
      description: "Video conferencing and online meetings",
      icon: <SiZoom className="w-8 h-8 text-[#2D8CFF]" />,
      status: "coming_soon" 
    },
    { 
      id: "google_calendar", 
      name: "Google Calendar", 
      description: "Calendar and scheduling service",
      icon: <SiGooglecalendar className="w-8 h-8 text-[#4285F4]" />,
      status: "coming_soon" 
    },
    { 
      id: "mailchimp", 
      name: "Mailchimp", 
      description: "Email marketing platform",
      icon: <SiMailchimp className="w-8 h-8 text-[#FFE01B]" />,
      status: "coming_soon" 
    },
    { 
      id: "jira", 
      name: "Jira", 
      description: "Issue and project tracking software",
      icon: <SiJira className="w-8 h-8 text-[#0052CC]" />,
      status: "coming_soon" 
    },
    { 
      id: "intercom", 
      name: "Intercom", 
      description: "Customer messaging platform",
      icon: <SiIntercom className="w-8 h-8 text-[#6AFDEF]" />,
      status: "coming_soon" 
    },
    { 
      id: "zapier", 
      name: "Zapier", 
      description: "Workflow automation platform",
      icon: <SiZapier className="w-8 h-8 text-[#FF4A00]" />,
      status: "coming_soon" 
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setIntegrationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddIntegration = () => {
    if (!selectedProvider) {
      toast({
        title: "Error",
        description: "Please select an integration provider",
        variant: "destructive",
      });
      return;
    }

    if (!integrationForm.name.trim()) {
      toast({
        title: "Error",
        description: "Integration name is required",
        variant: "destructive",
      });
      return;
    }

    // Handle provider-specific validation
    if (selectedProvider === "sendgrid" && !integrationForm.apiKey) {
      toast({
        title: "Error",
        description: "API key is required for SendGrid integration",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedProvider === "slack" && !integrationForm.webhookUrl) {
      toast({
        title: "Error",
        description: "Webhook URL is required for Slack integration",
        variant: "destructive",
      });
      return;
    }

    if (selectedProvider === "aws_s3") {
      if (!integrationForm.bucketName) {
        toast({
          title: "Error",
          description: "Bucket name is required for AWS S3 integration",
          variant: "destructive",
        });
        return;
      }
      
      if (!integrationForm.region) {
        toast({
          title: "Error",
          description: "Region is required for AWS S3 integration",
          variant: "destructive",
        });
        return;
      }
      
      if (!integrationForm.accessKeyId) {
        toast({
          title: "Error",
          description: "Access Key ID is required for AWS S3 integration",
          variant: "destructive",
        });
        return;
      }
      
      if (!integrationForm.secretAccessKey) {
        toast({
          title: "Error",
          description: "Secret Access Key is required for AWS S3 integration",
          variant: "destructive",
        });
        return;
      }
    }

    // In a real implementation, this would call your API to store the integration
    const newIntegration: Integration = {
      id: Date.now().toString(),
      name: integrationForm.name,
      provider: selectedProvider,
      status: "active",
      lastSynced: new Date().toISOString(),
      details: {
        email: integrationForm.email || undefined,
        apiKey: integrationForm.apiKey ? "••••••••••••••••" : undefined, // Never store or display the actual API key in the UI
        webhookUrl: integrationForm.webhookUrl || undefined,
      },
    };

    setIntegrations((prev) => [...prev, newIntegration]);
    setIsAddDialogOpen(false);
    setSelectedProvider(null);
    setIntegrationForm({
      name: "",
      email: "",
      apiKey: "",
      webhookUrl: "",
      bucketName: "",
      region: "",
      accessKeyId: "",
      secretAccessKey: "",
    });

    toast({
      title: "Success",
      description: "Integration added successfully",
    });
  };

  const handleRemoveIntegration = (id: string) => {
    // In a real implementation, this would call your API to delete the integration
    setIntegrations((prev) => prev.filter((i) => i.id !== id));

    toast({
      title: "Success",
      description: "Integration removed successfully",
    });
  };

  const getStatusBadge = (status: Integration["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <Check className="w-3 h-3 mr-1" /> Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">
            Inactive
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Error
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get the icon for a provider
  const getProviderIcon = (provider: string) => {
    const integration = availableIntegrations.find(i => i.id === provider);
    if (integration) {
      return integration.icon;
    }
    
    // Fallback icons
    switch (provider) {
      case "sendgrid":
        return <SiSendgrid className="w-6 h-6 text-[#1A82E2]" />;
      case "slack":
        return <SiSlack className="w-6 h-6 text-[#4A154B]" />;
      case "stripe":
        return <SiStripe className="w-6 h-6 text-[#635BFF]" />;
      default:
        return <ExternalLink className="w-6 h-6 text-slate-400" />;
    }
  };

  // Check if an integration exists
  const isIntegrationConnected = (providerId: string) => {
    return integrations.some(i => i.provider === providerId && i.status === "active");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-slate-500 mt-2">
            Connect your favorite tools and services to enhance your GreenLane CRM experience.
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>
                Connect GreenLane CRM with your favorite tools and services.
              </DialogDescription>
            </DialogHeader>

            {!selectedProvider ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {availableIntegrations
                  .filter(i => i.status === "available")
                  .map(integration => (
                    <Card
                      key={integration.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedProvider(integration.id)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center">
                          {integration.icon}
                          <span className="ml-2">{integration.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <CardDescription>
                          {integration.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="flex items-center mb-4">
                  {getProviderIcon(selectedProvider)}
                  <h3 className="text-lg font-medium ml-2">
                    {availableIntegrations.find(i => i.id === selectedProvider)?.name || selectedProvider}
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Integration Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={`My ${availableIntegrations.find(i => i.id === selectedProvider)?.name || selectedProvider} Integration`}
                    value={integrationForm.name}
                    onChange={handleInputChange}
                  />
                </div>

                {selectedProvider === "sendgrid" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">SendGrid Account Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={integrationForm.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">SendGrid API Key</Label>
                      <Input
                        id="apiKey"
                        name="apiKey"
                        type="password"
                        placeholder="SG.xxxxx"
                        value={integrationForm.apiKey}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-slate-500">
                        You can find your API key in your SendGrid dashboard under Settings &gt; API Keys.
                      </p>
                    </div>
                  </>
                )}

                {selectedProvider === "slack" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">Slack Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        name="webhookUrl"
                        placeholder="https://hooks.slack.com/services/..."
                        value={integrationForm.webhookUrl}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-slate-500">
                        Create a webhook URL in your Slack workspace under Apps &gt; Custom Integrations &gt; Incoming Webhooks.
                      </p>
                    </div>
                  </>
                )}

                {selectedProvider === "stripe" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">Stripe API Key</Label>
                      <Input
                        id="apiKey"
                        name="apiKey"
                        type="password"
                        placeholder="sk_test_..."
                        value={integrationForm.apiKey}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-slate-500">
                        Find your API keys in the Stripe Dashboard under Developers &gt; API keys.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <DialogFooter className="flex items-center justify-between">
              {selectedProvider && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedProvider(null)}
                >
                  Back
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setSelectedProvider(null);
                  }}
                >
                  Cancel
                </Button>
                {selectedProvider && (
                  <Button onClick={handleAddIntegration}>Add Integration</Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Integration Categories */}
      <div className="space-y-8">
        {/* All Available Integrations */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Available Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableIntegrations.map((integration) => {
              const isConnected = isIntegrationConnected(integration.id);
              const isAvailable = integration.status === "available";
              
              return (
                <div key={integration.id} className="relative">
                  <Card className={`h-full ${!isAvailable ? 'opacity-70' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col items-center justify-center w-full">
                          <div className="mb-2">
                            {integration.icon}
                          </div>
                          <CardTitle className="text-lg text-center">
                            {integration.name}
                          </CardTitle>
                        </div>
                        {isConnected && (
                          <div className="absolute top-2 right-2">
                            {getStatusBadge("active")}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm text-slate-600">{integration.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-center pt-0">
                      {isAvailable ? (
                        isConnected ? (
                          <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                            Manage
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => {
                            setIsAddDialogOpen(true);
                            setSelectedProvider(integration.id);
                          }}>
                            Connect
                          </Button>
                        )
                      ) : (
                        <Button disabled size="sm">
                          Coming Soon
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                  
                  {/* Coming Soon Overlay */}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/40 rounded-lg">
                      <Badge className="bg-slate-800 text-white hover:bg-slate-800">Coming Soon</Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Active Integrations */}
        {integrations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Your Connected Integrations</h2>
            <div className="grid grid-cols-1 gap-4">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="mr-4">
                          {getProviderIcon(integration.provider)}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{integration.name}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            {availableIntegrations.find(i => i.id === integration.provider)?.name || integration.provider}
                            {integration.details?.email && (
                              <span className="ml-2">({integration.details.email})</span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div>{getStatusBadge(integration.status)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm text-slate-500">
                      {integration.lastSynced && (
                        <div className="mb-2">
                          Last synced: {new Date(integration.lastSynced).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Test Connection
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveIntegration(integration.id)}
                    >
                      <Trash className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}