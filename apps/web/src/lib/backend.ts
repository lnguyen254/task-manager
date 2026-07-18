import { NextResponse } from "next/server";

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
