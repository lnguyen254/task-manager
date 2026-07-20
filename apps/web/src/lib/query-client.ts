import { MutationCache, QueryCache, QueryClient, isServer } from "@tanstack/react-query";

import { ApiError } from "@/lib/utils";

/**
 * A 401 from the BFF (lib/tasks.ts / lib/tags.ts) means the refresh token
 * itself is gone or invalid — proxyAuthedRequest already tried a silent
 * refresh before giving up. There's no recovery short of the user logging
 * in again, so every query/mutation shares this handler rather than each
 * call site re-showing its own "Not authenticated" error inline.
 */
function handleQueryError(error: unknown, queryClient: QueryClient) {
  if (
    typeof window === "undefined" ||
    !(error instanceof ApiError) ||
    error.status !== 401 ||
    window.location.pathname === "/login"
  ) {
    return;
  }
  queryClient.clear();
  window.location.href = "/login?sessionExpired=1";
}

function makeQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => handleQueryError(error, queryClient),
    }),
    mutationCache: new MutationCache({
      onError: (error) => handleQueryError(error, queryClient),
    }),
  });
  return queryClient;
}

let browserQueryClient: QueryClient | undefined;

/**
 * On the server, always return a fresh QueryClient — sharing one across
 * requests would leak cached data between users. In the browser, reuse a
 * single instance so navigations don't lose the cache (and so a client
 * isn't recreated if React suspends during the initial render).
 */
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
