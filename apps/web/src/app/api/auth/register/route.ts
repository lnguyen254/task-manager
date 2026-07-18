import { NextRequest, NextResponse } from "next/server";

import { API_BASE_URL, setAuthCookies } from "@/lib/backend";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  let registerResponse: Response;
  try {
    registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("Register proxy: failed to reach API", error);
    return NextResponse.json(
      { message: "Unable to reach the server. Please try again." },
      { status: 502 },
    );
  }

  const registerData = await registerResponse.json().catch(() => null);

  if (!registerResponse.ok) {
    return NextResponse.json(
      registerData ?? { message: "Registration failed" },
      { status: registerResponse.status },
    );
  }

  // The API doesn't issue tokens on register, only on login — log the new
  // user in immediately so they don't have to submit their password twice.
  const { email, password } = (body ?? {}) as {
    email?: string;
    password?: string;
  };

  let loginResponse: Response;
  try {
    loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    console.error("Register proxy: post-register login failed to reach API", error);
    return NextResponse.json(registerData, { status: 201 });
  }

  if (!loginResponse.ok) {
    // Account was created but auto-login didn't work; the client can still
    // send the user to /login manually.
    return NextResponse.json(registerData, { status: 201 });
  }

  const tokens = await loginResponse.json();
  const response = NextResponse.json(registerData, { status: 201 });
  setAuthCookies(response, tokens, request.nextUrl.protocol === "https:");
  return response;
}
