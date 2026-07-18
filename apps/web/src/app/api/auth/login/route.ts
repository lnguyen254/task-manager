import { NextRequest, NextResponse } from "next/server";

import { API_BASE_URL, setAuthCookies } from "@/lib/backend";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  let loginResponse: Response;
  try {
    loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("Login proxy: failed to reach API", error);
    return NextResponse.json(
      { message: "Unable to reach the server. Please try again." },
      { status: 502 },
    );
  }

  if (!loginResponse.ok) {
    const errorData = await loginResponse.json().catch(() => null);
    return NextResponse.json(
      errorData ?? { message: "Login failed" },
      { status: loginResponse.status },
    );
  }

  // Tokens live only in httpOnly cookies — never in a JSON body client JS can read.
  const tokens = await loginResponse.json();
  const response = NextResponse.json({ success: true });
  setAuthCookies(response, tokens, request.nextUrl.protocol === "https:");
  return response;
}
