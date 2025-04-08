import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Integrations from "@/pages/admin/Integrations";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function AdminIntegrationsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        
        if (data.isAuthenticated && data.user) {
          if (data.user.role === "admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            navigate("/dashboard");
          }
        } else {
          navigate("/signin");
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
        navigate("/signin");
      }
    };
    
    checkAdminStatus();
  }, [navigate]);
  
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  if (isAdmin === false) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <MainLayout>
      <Integrations />
    </MainLayout>
  );
}