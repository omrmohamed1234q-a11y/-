import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response, url?: string) {
  if (!res.ok) {
    // Handle 401 specifically for admin routes
    if (res.status === 401 && url) {
      handle401Error(url);
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper to get authentication headers
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    // First try admin authentication (for admin routes)
    const adminAuth = localStorage.getItem('adminAuth');
    const adminToken = localStorage.getItem('adminToken');
    
    if (adminAuth && adminToken) {
      try {
        const adminData = JSON.parse(adminAuth);
        const token = adminData.token || adminToken;
        const userId = adminData.user?.id || adminData.admin?.id || adminData.id;
        
        // Use only x-admin-token for admin authentication (avoid conflicts with Supabase JWTs)
        return {
          'x-admin-token': token,
          'x-user-id': userId,
          'x-user-role': 'admin',
          'X-User-ID': userId,
          'X-User-Role': 'admin',
        };
      } catch (error) {
        console.error('Error parsing admin auth:', error);
      }
    }

    // Next try localStorage (for regular user login)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return {
        'X-User-ID': user.id,
        'X-User-Role': user.role || 'customer',
      };
    }

    // Fallback to Supabase session for regular users
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'X-User-ID': session.user.id,
        'X-User-Role': session.user.user_metadata?.role || 'customer',
      };
    }
  } catch (error) {
    console.warn('Failed to get authentication headers:', error);
  }
  
  return {};
}

// Handle 401 errors and force re-login for admin routes
function handle401Error(url: string): void {
  if (url.includes('/api/admin/')) {
    console.warn('🔐 Admin authentication expired, clearing stored credentials');
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    // Redirect to secure admin login
    if (window.location.pathname !== '/auth/secure-admin-login') {
      window.location.href = '/auth/secure-admin-login';
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  // Create timeout controller for long uploads (60 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  
  try {
    const res = await fetch(url, {
      method,
      headers: { 
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...authHeaders,
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    await throwIfResNotOk(res, url);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(queryKey.join("/") as string, {
      method: "GET",
      headers: {
        ...authHeaders,
      },
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      handle401Error(queryKey.join("/") as string);
      return null;
    }

    await throwIfResNotOk(res, queryKey.join("/") as string);
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
