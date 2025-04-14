import { QueryClient, QueryFunction } from "@tanstack/react-query";
// Remove hook imports - they cannot be called here
// import { useAuth } from "@/hooks/use-auth";
// import { useSupabase } from "@/components/providers/SupabaseProvider";
import { SupabaseClient } from "@supabase/supabase-js"; // Import SupabaseClient type
import { useSupabase } from "@/components/providers/SupabaseProvider"; // Import useSupabase hook

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Modify apiRequest to accept supabase client and accessToken
export async function apiRequest(
  supabase: SupabaseClient | null, // Add supabase parameter
  accessToken: string | null, // Add accessToken parameter
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {

  if (!supabase) {
    throw new Error("Supabase client not provided to apiRequest.");
  }
  if (!accessToken) {
    throw new Error("Access token not provided to apiRequest. User not authenticated.");
  }

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`, // Use the correct access token
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "omit", // Keep as omit
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
// Modify getQueryFn to accept supabase client and accessToken
// Note: This might be complex to integrate with react-query's default queryFn setup.
// Consider if a custom query hook wrapping apiRequest might be simpler.
// For now, let's modify it for consistency, but be aware of potential complexity.
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, meta }) => { // Access meta if needed to pass supabase/token

    // Attempt to get supabase and accessToken from meta passed via queryClient.fetchQuery/useQuery
    const supabase = meta?.supabase as SupabaseClient | null;
    const accessToken = meta?.accessToken as string | null;

    if (!supabase) {
       if (unauthorizedBehavior === "returnNull") return null;
       throw new Error("Supabase client not provided via query meta.");
    }
    if (!accessToken) {
       if (unauthorizedBehavior === "returnNull") return null;
       throw new Error("Access token not provided via query meta.");
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "omit",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
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
