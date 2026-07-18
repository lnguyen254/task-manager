import { NextRequest, NextResponse } from "next/server";

import {
  API_BASE_URL,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/backend";

export async function POST(request: NextRequest) {
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
    console.error("Refresh proxy: failed to reach API", error);
    return NextResponse.json(
      { message: "Unable to reach the server. Please try again." },
      { status: 502 },
    );
  }

  if (!refreshResponse.ok) {
    const errorData = await refreshResponse.json().catch(() => null);
    const response = NextResponse.json(
      errorData ?? { message: "Session expired" },
      { status: refreshResponse.status },
    );
    // A rejected refresh token (expired, reused, or already rotated) means
    // the session is dead either way — drop the cookies client-side too.
    clearAuthCookies(response);
    return response;
  }

  const tokens = await refreshResponse.json();
  const response = NextResponse.json({ success: true });
  setAuthCookies(response, tokens, request.nextUrl.protocol === "https:");
  return response;
}
