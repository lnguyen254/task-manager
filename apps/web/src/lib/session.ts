import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE, API_BASE_URL } from "@/lib/backend";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Read-only session check for Server Components (layouts, pages). Verifies
 * the access token against the API directly — no self-fetch to this app's
 * own Route Handlers, per Next's guidance to fetch from the real data source.
 *
 * Deliberately does NOT attempt a refresh: Server Components can read
 * cookies but cannot write them, so there's nowhere to put a rotated token.
 * A visitor whose access token has expired reads as logged-out here even if
 * their refresh token is still valid — `/api/auth/me` (the Route Handler)
 * is the version that can actually refresh, for client-side use.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch (error) {
    console.error("getCurrentUser: failed to reach API", error);
    return null;
  }

  if (!response.ok) return null;
  return response.json();
}
