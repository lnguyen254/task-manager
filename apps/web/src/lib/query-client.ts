import { QueryClient, isServer } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
    },
  });
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
