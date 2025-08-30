import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper to get authentication headers
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    // First try localStorage (for admin/manual login)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return {
        'X-User-ID': user.id,
        'X-User-Role': user.role || 'customer',
      };
    }

    // Fallback to Supabase session
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      return {
        'X-User-ID': session.user.id,
        'X-User-Role': session.user.user_metadata?.role || 'customer',
      };
    }
  } catch (error) {
    console.warn('Failed to get authentication headers:', error);
  }
  
  return {};
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  const res = await fetch(url, {
    method,
    headers: { 
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
    },
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
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(queryKey.join("") as string, {
      method: "GET",
      headers: {
        ...authHeaders,
      },
      credentials: "include",
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
