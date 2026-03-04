import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export default async function proxy(request: NextRequest) {
  // Let Auth0 handle its own routes (/auth/login, /auth/callback, /auth/logout)
  const authResponse = await auth0.middleware(request);

  const { pathname } = request.nextUrl;

  // Allow Auth0 routes and static assets to pass through
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return authResponse;
  }

  // Protect all other routes: check for session
  const session = await auth0.getSession(request);
  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(pathname)}`,
        request.url
      )
    );
  }

  return authResponse;
}
