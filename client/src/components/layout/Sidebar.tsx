import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  DollarSign, 
  ClipboardList,
  MessageSquare,
  PieChart,
  Mail,
  LogOut,
  Menu,
  X,
  CheckSquare,
  BarChart,
  LayoutDashboardIcon,
  Settings,
  ChevronRight,
  Plug,
  Database,
  Shield,
  ExternalLink,
  Globe,
  Workflow
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getTenantFromUrl } from "@/lib/tenant";
import { useQuery } from "@tanstack/react-query";

type SidebarNavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
};

type SidebarNavSubItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
};

type SidebarNavItemWithSub = {
  title: string;
  icon: React.ReactNode;
  subItems: SidebarNavSubItem[];
  isAdminOnly?: boolean;
};

const navItems: SidebarNavItem[] = [
  { title: "Home", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
  { title: "Accounts", path: "/accounts", icon: <Building2 className="w-5 h-5 mr-3" /> },
  { title: "Contacts", path: "/contacts", icon: <Users className="w-5 h-5 mr-3" /> },
  { title: "Deals", path: "/deals", icon: <DollarSign className="w-5 h-5 mr-3" /> },
  { title: "Projects", path: "/projects", icon: <ClipboardList className="w-5 h-5 mr-3" /> },
  { title: "Tasks", path: "/tasks", icon: <CheckSquare className="w-5 h-5 mr-3" /> },
  { title: "Support Tickets", path: "/support-tickets", icon: <MessageSquare className="w-5 h-5 mr-3" /> },
  { title: "AI Analytics", path: "/ai-analytics", icon: <PieChart className="w-5 h-5 mr-3" /> },
  { title: "Digital Journey", path: "/digital-journey", icon: <Mail className="w-5 h-5 mr-3" /> },
];

const navItemsWithSubs: SidebarNavItemWithSub[] = [
  {
    title: "Analytics",
    icon: <BarChart className="w-5 h-5 mr-3" />,
    subItems: [
      { title: "Reports", path: "/reports", icon: <BarChart className="w-5 h-5 mr-3" /> },
      { title: "Dashboards", path: "/dashboards", icon: <LayoutDashboardIcon className="w-5 h-5 mr-3" /> },
    ]
  },
  { 
    title: "Administration",
    icon: <Shield className="w-5 h-5 mr-3" />,
    isAdminOnly: false, // Changed to false to make it visible for testing
    subItems: [
      { title: "Integrations", path: "/admin/integrations", icon: <Plug className="w-5 h-5 mr-3" /> },
      { title: "User Management", path: "/admin/users", icon: <Users className="w-5 h-5 mr-3" /> },
      { title: "Data Management", path: "/admin/data", icon: <Database className="w-5 h-5 mr-3" /> },
      { title: "Module Management", path: "/admin/modules", icon: <Settings className="w-5 h-5 mr-3" /> },
      { title: "Workflows", path: "/workflows", icon: <Workflow className="w-5 h-5 mr-3" /> },
    ]
  }
];

interface SidebarProps {
  user?: {
    firstName?: string;
    lastName?: string;
    username: string;
    role?: string;
  };
}

type CommunityNavSubItem = {
  title: string;
  path?: string;
  icon: React.ReactNode;
  externalLink?: string;
};

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { toast } = useToast();
  const tenant = getTenantFromUrl();
  
  // Fetch community module status
  const { data: modules } = useQuery({
    queryKey: ['/api/modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/modules');
      return await response.json();
    },
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Find if community module is enabled and its settings
  const communityModule = modules?.find((module: any) => module.id === 'community');
  const isCommunityEnabled = communityModule?.enabled ?? false;
  const communitySettings = communityModule?.settings || {};

  useEffect(() => {
    // Close sidebar on location change for mobile
    setIsMobileOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      
      // Redirect to sign in page
      window.location.href = "/signin";
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="fixed z-50 top-4 left-4 lg:hidden p-2 rounded-md bg-slate-800 text-white"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white transform ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <svg className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="16" x2="12" y2="8" />
              <line x1="8" y1="20" x2="16" y2="12" />
            </svg>
            <span className="font-semibold text-lg tracking-wider">GreenLane</span>
          </div>
          <button 
            className="lg:hidden text-white"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-2 text-xs text-slate-400 font-medium">
          {tenant ? `${tenant}.greenlanecloudsolutions.com` : 'greenlanecloudsolutions.com'}
        </div>
        
        <div className="overflow-y-auto flex-1">
          <nav className="p-2 space-y-1">
            {/* Regular menu items */}
            {navItems.map((item) => {
              const isActive = location === item.path || 
                (item.path !== "/" && location.startsWith(item.path));
              
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`flex items-center p-2 rounded-md ${
                    isActive 
                      ? 'bg-primary-700 text-white' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.title}
                </Link>
              );
            })}
            
            {/* Community module menu (conditionally displayed) */}
            {isCommunityEnabled && (
              <div className="space-y-1">
                <button
                  onClick={() => setOpenSubmenu(openSubmenu === "Community" ? null : "Community")}
                  className={`w-full flex items-center justify-between p-2 rounded-md ${
                    location.startsWith("/community") 
                      ? 'bg-primary-700 text-white' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 mr-3" />
                    Community
                  </div>
                  <ChevronRight 
                    className={`w-5 h-5 transition-transform ${openSubmenu === "Community" ? 'rotate-90' : ''}`} 
                  />
                </button>
                
                {/* Community submenu items */}
                {openSubmenu === "Community" && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-slate-700 pl-2">
                    {/* Community Portal item */}
                    <Link
                      href="/community"
                      className={`flex items-center p-2 rounded-md ${
                        location === "/community" 
                          ? 'bg-primary-700 text-white' 
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Globe className="w-5 h-5 mr-3" />
                      Community Portal
                    </Link>
                    
                    {/* Community Settings item */}
                    <Link
                      href="/community/settings"
                      className={`flex items-center p-2 rounded-md ${
                        location === "/community/settings" 
                          ? 'bg-primary-700 text-white' 
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      Settings
                    </Link>
                    
                    {/* External link to community (if custom domain is set) */}
                    {communitySettings?.customDomain && (
                      <a
                        href={`https://${communitySettings.customDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        <ExternalLink className="w-5 h-5 mr-3" />
                        Visit Community
                        <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Items with submenus */}
            {navItemsWithSubs.map((item) => {
              // Skip admin-only sections for non-admin users
              if (item.isAdminOnly && user?.role !== 'admin') {
                return null;
              }
              
              const isOpen = openSubmenu === item.title;
              const isActive = item.subItems.some(subItem => 
                location === subItem.path || 
                (subItem.path !== "/" && location.startsWith(subItem.path))
              );
              
              return (
                <div key={item.title} className="space-y-1">
                  <button
                    onClick={() => setOpenSubmenu(isOpen ? null : item.title)}
                    className={`w-full flex items-center justify-between p-2 rounded-md ${
                      isActive 
                        ? 'bg-primary-700 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      {item.title}
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
                    />
                  </button>
                  
                  {/* Submenu items */}
                  {isOpen && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-slate-700 pl-2">
                      {item.subItems.map(subItem => {
                        const isSubActive = location === subItem.path || 
                          (subItem.path !== "/" && location.startsWith(subItem.path));
                        
                        return (
                          <Link
                            key={subItem.path}
                            href={subItem.path}
                            className={`flex items-center p-2 rounded-md ${
                              isSubActive 
                                ? 'bg-primary-700 text-white' 
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {subItem.icon}
                            {subItem.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-600 rounded-full text-white font-medium">
              {user?.firstName?.[0] || user?.username?.[0] || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username}
              </p>
              <p className="text-xs text-slate-400">
                {user?.role || 'User'}
              </p>
            </div>
            <div className="ml-auto">
              <button 
                className="text-slate-400 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
