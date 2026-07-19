import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side base URL for the NestJS API. The browser never talks to the
 * API directly — every request goes through this app's Route Handlers,
 * which forward here and translate the response into httpOnly cookies.
 * Defaults to localhost for running `next dev` outside Docker; the Docker
 * Compose `web` service overrides this to the `api` container's hostname.
 */
export const API_BASE_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3000";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Reads a JWT's `exp` claim so the cookie's expiry mirrors the token's.
 * This is only a client-side cleanup hint, not a trust boundary — the API
 * independently verifies the token's signature on every request, so a
 * stale or malformed cookie is harmless either way.
 */
function getJwtExpiry(token: string): Date | undefined {
  const payload = token.split(".")[1];
  if (!payload) return undefined;
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const { exp } = JSON.parse(json) as { exp?: unknown };
    return typeof exp === "number" ? new Date(exp * 1000) : undefined;
  } catch {
    return undefined;
  }
}

function cookieOptions(secure: boolean, expires: Date | undefined) {
  return {
    httpOnly: true,
    secure,
    sameSite: "strict" as const,
    path: "/",
    expires,
  };
}

/**
 * `secure` is derived from the actual incoming request's protocol rather
 * than hardcoded, because a `Secure` cookie set over plain HTTP is silently
 * dropped by the browser — that would break login/register entirely when
 * testing locally (`next dev`, or `docker compose up` on localhost, both
 * plain HTTP). It becomes `true` automatically once this runs behind real
 * HTTPS.
 */
export function setAuthCookies(
  response: NextResponse,
  tokens: AuthTokens,
  secure: boolean,
) {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    cookieOptions(secure, getJwtExpiry(tokens.accessToken)),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    cookieOptions(secure, getJwtExpiry(tokens.refreshToken)),
  );
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}

interface ProxyOptions {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

async function fetchApi(path: string, accessToken: string, options: ProxyOptions) {
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
}

async function toNextResponse(apiResponse: Response) {
  if (apiResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await apiResponse.json().catch(() => null);
  return NextResponse.json(data, { status: apiResponse.status });
}

/**
 * Forwards a request to a JWT-protected NestJS endpoint, attaching the
 * access token cookie as a Bearer header (the API never sees the cookie
 * itself). On a 401 — missing or expired access token — attempts one
 * silent refresh-and-retry before giving up, the same behavior `/api/auth/me`
 * implements for its own single endpoint, shared here across every
 * task/tag route so the flow isn't reimplemented per-route.
 */
export async function proxyAuthedRequest(
  request: NextRequest,
  path: string,
  options: ProxyOptions,
): Promise<NextResponse> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    let apiResponse: Response;
    try {
      apiResponse = await fetchApi(path, accessToken, options);
    } catch (error) {
      console.error(`API proxy: failed to reach API at ${path}`, error);
      return NextResponse.json(
        { message: "Unable to reach the server. Please try again." },
        { status: 502 },
      );
    }
    if (apiResponse.status !== 401) {
      return toNextResponse(apiResponse);
    }
  }

  // Access token missing or rejected — try refreshing before giving up.
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
    console.error(`API proxy: refresh failed to reach API for ${path}`, error);
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

  const tokens: AuthTokens = await refreshResponse.json();

  let apiResponse: Response;
  try {
    apiResponse = await fetchApi(path, tokens.accessToken, options);
  } catch (error) {
    console.error(`API proxy: retry failed to reach API at ${path}`, error);
    return NextResponse.json(
      { message: "Unable to reach the server. Please try again." },
      { status: 502 },
    );
  }

  const response = await toNextResponse(apiResponse);
  setAuthCookies(response, tokens, request.nextUrl.protocol === "https:");
  return response;
}
