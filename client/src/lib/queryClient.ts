import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getTenantFromUrl } from "./tenant";

// Helper function to safely handle JSON responses
async function safeHandleResponse(response: Response): Promise<any> {
  // Get the content type to check if it's JSON
  const contentType = response.headers.get('content-type');
  
  // If not JSON or empty response, handle appropriately
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.warn('Received non-JSON response:', text);
    
    if (response.ok) {
      // For successful non-JSON responses, return a simple success object
      return { success: true, message: 'Operation completed successfully' };
    }
    
    // For error responses, throw with the text
    throw new Error(`${response.status}: ${text}`);
  }
  
  // For JSON responses, parse and return
  return response.json();
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Get the current tenant ID from URL or session storage
function getCurrentTenantId(): string | null {
  const tenant = getTenantFromUrl();
  console.log('Current tenant detected:', tenant);
  return tenant;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  // Get tenant ID from URL or session
  const tenantId = getCurrentTenantId();
  if (tenantId) {
    headers["X-Tenant-ID"] = tenantId;
  }
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add Accept header to ensure we get JSON responses when possible
  headers["Accept"] = "application/json, text/plain, */*";
  
  console.log(`Making ${method} request to ${url} with tenant ID: ${tenantId || 'none'}`);
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get tenant ID from URL or session
    const tenantId = getCurrentTenantId();
    const headers: Record<string, string> = {
      "Accept": "application/json, text/plain, */*"
    };
    
    if (tenantId) {
      headers["X-Tenant-ID"] = tenantId;
    }
    
    console.log(`Making query to ${queryKey[0]} with tenant ID: ${tenantId || 'none'}`);
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    try {
      return await safeHandleResponse(res);
    } catch (error) {
      console.error('Error parsing response:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
