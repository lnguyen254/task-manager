import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/backend";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login", "/register"];

/**
 * Optimistic check only — cookie presence, not signature/expiry. This just
 * fast-paths obvious cases before a page renders; the authoritative check
 * (verifying the token against the API) happens server-side in the page via
 * `getCurrentUser()`. See the Next.js authentication guide's recommended
 * split between Proxy (optimistic) and a DAL (secure).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ||
      request.cookies.get(REFRESH_TOKEN_COOKIE)?.value,
  );

  if (!hasSession && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
