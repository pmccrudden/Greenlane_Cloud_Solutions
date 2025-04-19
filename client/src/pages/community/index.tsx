import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Globe, Users, MessageSquare, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

export default function CommunityPortal() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch community module status
  const { data: modules } = useQuery({
    queryKey: ['/api/modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/modules');
      return await response.json();
    },
  });

  // Fetch community posts
  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['/api/community/posts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/community/posts');
      return await response.json();
    },
    enabled: !!modules?.find((m: any) => m.id === 'community' && m.enabled),
  });

  // Find if community module is enabled and its settings
  const communityModule = modules?.find((module: any) => module.id === 'community');
  const isCommunityEnabled = communityModule?.enabled ?? false;
  const communitySettings = communityModule?.settings || {};

  if (!isCommunityEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <Globe className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Community Module is Disabled</h2>
        <p className="text-gray-500 text-center mb-4">
          The Community module is currently disabled. Please contact your administrator to enable this feature.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Globe className="mr-2 h-8 w-8" /> Community Portal
          </h1>
          <p className="text-gray-500">Connect with your customers in a community platform</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          {/* Local preview link - available in all environments */}
          <Link to="/community/preview">
            <Button variant="outline" className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              Preview Community
            </Button>
          </Link>
          
          {/* External site link - only if domain is configured */}
          {communitySettings?.customDomain && (
            <a 
              href={`https://${communitySettings.customDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Community Site
            </a>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Community Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isCommunityEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{isCommunityEnabled ? 'Active' : 'Inactive'}</span>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500">
                  {isCommunityEnabled 
                    ? 'Your community platform is active and accessible to users.' 
                    : 'Your community platform is currently disabled.'}
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{posts?.length || 0}</p>
                <p className="text-sm text-gray-500">Total posts</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/community/settings">Manage Community</a>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-primary" />
                  Domain
                </CardTitle>
              </CardHeader>
              <CardContent>
                {communitySettings?.customDomain ? (
                  <div className="break-all">
                    <a 
                      href={`https://${communitySettings.customDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {communitySettings.customDomain}
                    </a>
                  </div>
                ) : (
                  <div className="text-gray-500 italic">No custom domain set</div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/community/settings">Configure Domain</a>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Community</CardTitle>
              <CardDescription>Follow these steps to set up your community platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Configure your custom domain</h3>
                    <p className="text-sm text-gray-500">Set up a custom domain for your community platform through the Community Settings page.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Create initial posts and forums</h3>
                    <p className="text-sm text-gray-500">Start by creating some initial content to engage your users when they first visit your community.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Invite your customers</h3>
                    <p className="text-sm text-gray-500">Share your community link with your customers and start building your community.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="posts" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Community Posts</CardTitle>
                <CardDescription>Manage and create posts for your community</CardDescription>
              </div>
              <Button onClick={() => toast({ title: "Not implemented", description: "This feature is not yet implemented" })}>
                New Post
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPosts ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : posts?.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post: any) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{post.title}</h3>
                        <div className={`px-2 py-1 rounded text-xs ${
                          post.status === 'published' ? 'bg-green-100 text-green-800' :
                          post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{post.content}</p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-xs text-gray-500">
                          Posted by: {post.authorName || 'Unknown'} • {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => toast({ title: "Not implemented", description: "This feature is not yet implemented" })}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium">No posts yet</h3>
                  <p className="mt-2 text-sm text-gray-500">Create your first post to get started with your community.</p>
                  <Button className="mt-4" onClick={() => toast({ title: "Not implemented", description: "This feature is not yet implemented" })}>
                    Create First Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Preview</CardTitle>
              <CardDescription>Preview your community portal as your users would see it</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <Globe className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">Preview Your Community</h3>
                <p className="text-sm text-gray-500 text-center mt-2 mb-6">
                  View a local preview of your community portal with sample content.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/community/preview">
                    <Button className="flex items-center">
                      <Globe className="mr-2 h-4 w-4" />
                      Open Local Preview
                    </Button>
                  </Link>
                  
                  {communitySettings?.customDomain && (
                    <a 
                      href={`https://${communitySettings.customDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Live Site
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}