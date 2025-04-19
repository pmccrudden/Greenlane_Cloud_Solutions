import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Globe, MessageSquare, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

// Sample data for preview
const sampleForums = [
  { id: 1, name: "General Discussion", description: "Talk about anything related to our products", postCount: 24, members: 156 },
  { id: 2, name: "Product Support", description: "Get help with product issues and questions", postCount: 47, members: 203 },
  { id: 3, name: "Feature Requests", description: "Suggest new features and improvements", postCount: 18, members: 89 },
];

const samplePosts = [
  { 
    id: 1, 
    title: "Getting started with GreenLane Cloud", 
    author: { name: "John Smith", avatar: "JS" }, 
    date: "2 days ago", 
    content: "I'm new to GreenLane Cloud and just started setting things up. The dashboard is really intuitive, but I'm wondering if there's a quick start guide somewhere?",
    likes: 12,
    replies: 5,
    pinned: true,
    tags: ["help", "getting started"]
  },
  { 
    id: 2, 
    title: "Best practices for account management", 
    author: { name: "Sarah Johnson", avatar: "SJ" }, 
    date: "1 week ago", 
    content: "I've been using GreenLane for about 6 months now and wanted to share some tips for organizing accounts efficiently. First, make sure to use the tagging system consistently...",
    likes: 34,
    replies: 21,
    pinned: false,
    tags: ["tips", "account management"]
  },
  { 
    id: 3, 
    title: "Integration with external CRM systems", 
    author: { name: "Michael Wong", avatar: "MW" }, 
    date: "3 days ago", 
    content: "Has anyone successfully integrated GreenLane with Salesforce? I'm trying to set up bi-directional syncing between the two platforms but running into some issues with field mapping.",
    likes: 8,
    replies: 12,
    pinned: false,
    tags: ["integration", "technical"]
  },
];

export default function CommunityPreview() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("forums");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch community module status
  const { data: modules } = useQuery({
    queryKey: ['/api/modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/modules');
      return await response.json();
    },
  });

  // Find community module and settings
  const communityModule = modules?.find((module: any) => module.id === 'community');
  const settings = communityModule?.settings || {};
  const primaryColor = settings?.branding?.primaryColor || "#10B981";

  // Dynamic styles based on community module settings
  const headerStyle = {
    backgroundColor: primaryColor,
    color: "#ffffff"
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Community Header */}
      <header style={headerStyle} className="py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Globe className="h-8 w-8 mr-2" />
            <h1 className="text-2xl font-bold">GreenLane Community</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="bg-white/20 hover:bg-white/30 border-white/30">
              Sign In
            </Button>
            <Link to="/community">
              <Button variant="outline" className="bg-white/20 hover:bg-white/30 border-white/30">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Community Content */}
      <main className="flex-grow container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Community Portal</h2>
          <div className="w-full max-w-sm">
            <Input 
              placeholder="Search community..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="forums">Forums</TabsTrigger>
                <TabsTrigger value="recent">Recent Posts</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
              </TabsList>
              
              <TabsContent value="forums" className="mt-6">
                <div className="space-y-4">
                  {sampleForums.map(forum => (
                    <Card key={forum.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{forum.name}</CardTitle>
                            <CardDescription>{forum.description}</CardDescription>
                          </div>
                          <Badge variant="outline" className="ml-2">{forum.postCount} posts</Badge>
                        </div>
                      </CardHeader>
                      <CardFooter className="pt-2 flex justify-between">
                        <div className="text-sm text-gray-500">
                          {forum.members} members
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => toast({ title: "Preview only", description: "This is just a preview of how the community would look." })}
                        >
                          View Forum
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="recent" className="mt-6">
                <div className="space-y-4">
                  {samplePosts.map(post => (
                    <Card key={post.id} className={post.pinned ? "border-primary/50 shadow-sm" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-4">
                            <Avatar>
                              <AvatarFallback>{post.author.avatar}</AvatarFallback>
                              <AvatarImage src={`https://avatar.vercel.sh/${post.id}?size=64`} />
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{post.title}</CardTitle>
                              <div className="flex items-center mt-1">
                                <span className="text-sm text-gray-500">By {post.author.name} • {post.date}</span>
                                {post.pinned && (
                                  <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">Pinned</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {post.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{post.content}</p>
                      </CardContent>
                      <CardFooter className="pt-2 border-t flex justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {post.replies} replies
                          </div>
                          <div>
                            {post.likes} likes
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => toast({ title: "Preview only", description: "This is just a preview of how the community would look." })}
                        >
                          View Post
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="popular" className="mt-6">
                <div className="space-y-4">
                  {[...samplePosts].sort((a, b) => b.likes - a.likes).map(post => (
                    <Card key={post.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-4">
                            <Avatar>
                              <AvatarFallback>{post.author.avatar}</AvatarFallback>
                              <AvatarImage src={`https://avatar.vercel.sh/${post.id}?size=64`} />
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{post.title}</CardTitle>
                              <div className="flex items-center mt-1">
                                <span className="text-sm text-gray-500">By {post.author.name} • {post.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {post.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{post.content}</p>
                      </CardContent>
                      <CardFooter className="pt-2 border-t flex justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {post.replies} replies
                          </div>
                          <div>
                            {post.likes} likes
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => toast({ title: "Preview only", description: "This is just a preview of how the community would look." })}
                        >
                          View Post
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Members</div>
                  <div className="text-2xl font-bold">324</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-gray-500">Posts</div>
                  <div className="text-2xl font-bold">89</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-gray-500">Activity</div>
                  <div className="text-2xl font-bold">High</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">help</Badge>
                  <Badge variant="secondary">integrations</Badge>
                  <Badge variant="secondary">tips</Badge>
                  <Badge variant="secondary">getting started</Badge>
                  <Badge variant="secondary">technical</Badge>
                  <Badge variant="secondary">feature requests</Badge>
                  <Badge variant="secondary">workflows</Badge>
                  <Badge variant="secondary">best practices</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {["Sarah Johnson", "Michael Wong", "Jennifer Miller"].map((name, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      <AvatarImage src={`https://avatar.vercel.sh/${name.replace(/\s+/g, "")}?size=64`} />
                    </Avatar>
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-gray-500">{30 - index * 7} posts</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-100 border-t py-6">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 GreenLane Cloud Solutions. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            This is a preview of how the community would look. Not all functionality is available.
          </p>
        </div>
      </footer>
    </div>
  );
}