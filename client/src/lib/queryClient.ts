import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    "X-Tenant-ID": "572c77d7-e838-44ca-8adb-7ddef5f199bb", // Valid tenant ID from our database
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  console.log(`Making ${method} request to ${url} with tenant ID: ${headers["X-Tenant-ID"]}`);
  
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
    // Use the same tenant ID as in apiRequest
    const tenantId = "572c77d7-e838-44ca-8adb-7ddef5f199bb";
    
    console.log(`Making query to ${queryKey[0]} with tenant ID: ${tenantId}`);
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "X-Tenant-ID": tenantId, // Valid tenant ID from our database
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
