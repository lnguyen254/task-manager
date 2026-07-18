import { NextRequest, NextResponse } from "next/server";

import {
  API_BASE_URL,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/backend";

function fetchMe(accessToken: string) {
  return fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    const meResponse = await fetchMe(accessToken);
    if (meResponse.ok) {
      return NextResponse.json(await meResponse.json());
    }
  }

  // Access token missing or rejected (likely expired) — try refreshing
  // before giving up, so a valid 7-day session survives a 15-min access
  // token expiry without forcing the user to log in again.
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let refreshResponse: Response;
  try {
    refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    console.error("Me proxy: refresh failed to reach API", error);
    return NextResponse.json(
      { message: "Unable to reach the server. Please try again." },
      { status: 502 },
    );
  }

  if (!refreshResponse.ok) {
    const response = NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const tokens = await refreshResponse.json();
  const meResponse = await fetchMe(tokens.accessToken);

  if (!meResponse.ok) {
    const response = NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const user = await meResponse.json();
  const response = NextResponse.json(user);
  setAuthCookies(response, tokens, request.nextUrl.protocol === "https:");
  return response;
}
