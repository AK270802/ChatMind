import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// In production, API calls should go to the same domain (relative URLs)
// In development, we can use VITE_API_BASE_URL if set
// Force empty API_BASE in production to prevent localhost:5000 issues
let API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// Override if we're in production or if API_BASE contains localhost
if (import.meta.env.MODE === 'production' || API_BASE.includes('localhost')) {
  API_BASE = "";
}

console.log("API_BASE:", API_BASE);
console.log("Environment:", import.meta.env.MODE);
console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
console.log("All env vars:", import.meta.env);

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const fullUrl = url.startsWith("http")
    ? url
    : `${API_BASE}${url}`;

  console.log(`🌐 API Request: ${method} ${url} -> ${fullUrl}`);
  console.log(`🌐 API_BASE: "${API_BASE}"`);
  console.log(`🌐 URL starts with http: ${url.startsWith("http")}`);

  // Additional safety check - if fullUrl contains localhost, force it to be relative
  const finalUrl = fullUrl.includes('localhost') ? url : fullUrl;
  console.log(`🌐 Final URL: ${finalUrl}`);

  const res = await fetch(finalUrl, {

    method,
    headers: data ? { "Content-Type": "application/json" } : {},
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
    const url = queryKey.join("/");
const fullUrl = url.startsWith("http")
  ? url
  : `${API_BASE}${url}`;

const res = await fetch(fullUrl, {

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
