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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Mail,
  MessageSquare,
  Plus,
  Trash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

// Mock data for demo purposes - will be replaced with actual API calls
const mockIntegrations: Integration[] = [
  // Empty initially - will show how to add new integrations
];

export default function Integrations() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [integrationForm, setIntegrationForm] = useState({
    name: "",
    email: "",
    apiKey: "",
  });

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

    if (selectedProvider === "sendgrid" && !integrationForm.apiKey) {
      toast({
        title: "Error",
        description: "API key is required for SendGrid integration",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, this would call your API to store the integration
    const newIntegration: Integration = {
      id: Date.now().toString(),
      name: integrationForm.name,
      provider: selectedProvider,
      status: "active",
      lastSynced: new Date().toISOString(),
      details: {
        email: integrationForm.email,
        apiKey: "••••••••••••••••", // Never store or display the actual API key in the UI
      },
    };

    setIntegrations((prev) => [...prev, newIntegration]);
    setIsAddDialogOpen(false);
    setSelectedProvider(null);
    setIntegrationForm({
      name: "",
      email: "",
      apiKey: "",
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Integrations</h1>
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
                <Card
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedProvider("sendgrid")}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-blue-500" /> SendGrid
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <CardDescription>
                      Email marketing and transactional email service.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:border-primary transition-colors opacity-50"
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "This integration will be available soon.",
                    });
                  }}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2 text-purple-500" /> Slack
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <CardDescription>
                      Team messaging and notifications.
                    </CardDescription>
                  </CardContent>
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800/30 rounded-lg">
                    <Badge>Coming Soon</Badge>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Integration Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="My SendGrid Integration"
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

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <div className="rounded-full bg-slate-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">No integrations yet</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Enhance your CRM with powerful integrations. Connect your
                favorite tools and services to streamline your workflow.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                Add Your First Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All Integrations</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-xl">{integration.name}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          {integration.provider === "sendgrid" && (
                            <Mail className="w-4 h-4 mr-1 text-blue-500" />
                          )}
                          {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)}
                          {integration.details?.email && (
                            <span className="ml-2">({integration.details.email})</span>
                          )}
                        </CardDescription>
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
                  <CardFooter className="flex justify-between">
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
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {integrations
                .filter((i) => i.status === "active")
                .map((integration) => (
                  // Same card as above
                  <Card key={integration.id}>
                    {/* Card content same as above */}
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="text-xl">{integration.name}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            {integration.provider === "sendgrid" && (
                              <Mail className="w-4 h-4 mr-1 text-blue-500" />
                            )}
                            {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)}
                            {integration.details?.email && (
                              <span className="ml-2">({integration.details.email})</span>
                            )}
                          </CardDescription>
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
                    <CardFooter className="flex justify-between">
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
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4">
              {integrations
                .filter((i) => i.status === "inactive" || i.status === "error")
                .map((integration) => (
                  // Same card as above
                  <Card key={integration.id}>
                    {/* Card content same as above */}
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="text-xl">{integration.name}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            {integration.provider === "sendgrid" && (
                              <Mail className="w-4 h-4 mr-1 text-blue-500" />
                            )}
                            {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)}
                            {integration.details?.email && (
                              <span className="ml-2">({integration.details.email})</span>
                            )}
                          </CardDescription>
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
                    <CardFooter className="flex justify-between">
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
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Educational Alert */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Integration Best Practices</AlertTitle>
        <AlertDescription>
          <p className="mt-2">
            Keep your API keys secure and never share them with unauthorized parties.
            Regularly test your integrations to ensure they're working correctly.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}