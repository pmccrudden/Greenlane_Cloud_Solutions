import { Bell, Search, Settings } from "lucide-react";
import { useState } from 'react';
import { useLocation } from "wouter";

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Generate page title from location
  const getPageTitle = () => {
    if (location === "/") return "Dashboard";
    
    // Convert route to title (e.g., "/support-tickets" to "Support Tickets")
    return location
      .substring(1) // Remove leading slash
      .split("-") // Split by dash
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
      .join(" ") || "Dashboard"; // Join with space, fallback to Dashboard
  };
  
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-medium text-slate-800">
            {title || getPageTitle()}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64 text-sm"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>
          <button className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
