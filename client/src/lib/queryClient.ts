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

// Helper to get authentication headers with context-aware priority
export async function getAuthHeaders(options: { url?: string; forceAdmin?: boolean } = {}): Promise<Record<string, string>> {
  try {
    const isAdminRoute = options.forceAdmin || (options.url && options.url.includes('/api/admin/'));
    
    // For admin routes, prioritize admin authentication first
    if (isAdminRoute) {
      const adminAuth = localStorage.getItem('adminAuth');
      const adminToken = localStorage.getItem('adminToken');
      
      if (adminAuth && adminToken) {
        try {
          const adminData = JSON.parse(adminAuth);
          const token = adminData.token || adminToken;
          const userId = adminData.user?.id || adminData.admin?.id || adminData.id;
          
          // Check if admin session is still valid (basic client-side validation)
          if (adminData.loginTime) {
            const loginTime = new Date(adminData.loginTime);
            const now = new Date();
            const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
            
            // Client-side check: if more than 24 hours, clear and skip
            if (hoursSinceLogin > 24) {
              console.warn('🔐 Admin session expired (24h limit), clearing credentials');
              localStorage.removeItem('adminAuth');
              localStorage.removeItem('adminToken');
              return {};
            }
          }
          
          console.log(`🔐 Using admin authentication for admin route: ${userId}`);
          return {
            'x-admin-token': token,
            'X-User-ID': userId,
            'X-User-Role': 'admin',
          };
        } catch (error) {
          console.error('Error parsing admin auth:', error);
          // Clear corrupted admin data
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminToken');
        }
      }
      
      // If admin route but no valid admin token, don't fall back to Supabase
      if (options.forceAdmin) {
        console.log('❌ No valid admin authentication found for admin route');
        return {};
      }
    }

    // For non-admin routes or fallback, use Supabase session
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      console.log(`🔑 Using Supabase authentication for user: ${session.user.email} (${session.user.id})`);
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'X-User-ID': session.user.id,
        'X-User-Role': session.user.user_metadata?.role || 'customer',
      };
    }

    // FALLBACK: No valid authentication found
    console.log('❌ No valid authentication session found');
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
    if (window.location.pathname !== '/secure-admin-login') {
      window.location.href = '/secure-admin-login';
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders({ url });
  
  // Create timeout controller - longer for uploads (5 minutes)
  const controller = new AbortController();
  const isUploadRequest = url.includes('/upload') || url.includes('/google-drive');
  const timeout = isUploadRequest ? 300000 : 60000; // 5 min for uploads, 1 min for others
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
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
    const url = queryKey.join("/") as string;
    const authHeaders = await getAuthHeaders({ url });
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...authHeaders,
      },
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      handle401Error(url);
      return null;
    }

    await throwIfResNotOk(res, url);
    
    try {
      return await res.json();
    } catch (jsonError) {
      // Enhanced error logging for JSON parsing issues
      console.error(`❌ JSON parsing failed for endpoint: ${queryKey.join("/")}`);
      console.error(`Response status: ${res.status} ${res.statusText}`);
      
      // Clone response before trying to read text to avoid "Response body already used" error
      let responseText = 'Unable to read response';
      try {
        // Create a new response from the same body stream
        const clonedRes = res.clone();
        responseText = await clonedRes.text();
        console.error(`Response body preview:`, responseText.substring(0, 500));
        
        // If response looks like HTML error page, throw a more descriptive error
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
          throw new Error(`Server returned HTML error page instead of JSON for ${queryKey.join("/")}`);
        }
      } catch (textError) {
        console.error(`Could not read response text:`, textError.message);
      }
      
      throw new Error(`Invalid JSON response from ${queryKey.join("/")}: ${jsonError.message}`);
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
