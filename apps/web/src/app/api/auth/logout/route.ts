import { NextRequest, NextResponse } from "next/server";

import { API_BASE_URL, REFRESH_TOKEN_COOKIE, clearAuthCookies } from "@/lib/backend";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      console.error("Logout proxy: failed to reach API", error);
      // Fall through regardless — the browser should end up logged out
      // locally even if the API couldn't be reached to invalidate the token.
    }
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
