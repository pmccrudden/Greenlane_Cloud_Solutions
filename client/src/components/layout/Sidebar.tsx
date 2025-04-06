import { useState, useEffect } from "react";
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
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getTenantFromUrl } from "@/lib/tenant";

type SidebarNavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
};

const navItems: SidebarNavItem[] = [
  { title: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
  { title: "Accounts", path: "/accounts", icon: <Building2 className="w-5 h-5 mr-3" /> },
  { title: "Contacts", path: "/contacts", icon: <Users className="w-5 h-5 mr-3" /> },
  { title: "Deals", path: "/deals", icon: <DollarSign className="w-5 h-5 mr-3" /> },
  { title: "Projects", path: "/projects", icon: <ClipboardList className="w-5 h-5 mr-3" /> },
  { title: "Support Tickets", path: "/support-tickets", icon: <MessageSquare className="w-5 h-5 mr-3" /> },
  { title: "AI Analytics", path: "/ai-analytics", icon: <PieChart className="w-5 h-5 mr-3" /> },
  { title: "Digital Journey", path: "/digital-journey", icon: <Mail className="w-5 h-5 mr-3" /> },
];

interface SidebarProps {
  user?: {
    firstName?: string;
    lastName?: string;
    username: string;
    role?: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { toast } = useToast();
  const tenant = getTenantFromUrl();

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
            <svg className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.33 3.67a4 4 0 0 0-5.66 0L12 6.33 9.33 3.67a4 4 0 1 0-5.66 5.66L12 17.66l8.33-8.33a4 4 0 0 0 0-5.66z"/>
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
