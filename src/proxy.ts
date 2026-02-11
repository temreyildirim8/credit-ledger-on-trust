import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

/**
 * Combined middleware for i18n and authentication
 */
export default async function middleware(request: NextRequest) {
  // Check for Supabase auth session cookies (names vary by project)
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);
  const hasSupabaseAuthCookie = cookieNames.some((name) =>
    /^sb-.*-(auth-token|access-token|refresh-token)$/.test(name),
  );
  const isLoggedIn = hasSupabaseAuthCookie;

  const { pathname } = request.nextUrl;

  // Extract locale from pathname (will be validated by next-intl middleware)
  const segments = pathname.split("/");
  const locale = segments[1] || "en";

  // Supported locales
  const supportedLocales = ["en", "tr", "es", "hi", "id", "ar", "zu"];
  const isValidLocale = supportedLocales.includes(locale);
  const hasLocalePrefix = isValidLocale;

  // Protected routes: /{locale}/dashboard, /{locale}/customers, etc.
  const protectedPaths = [
    "dashboard",
    "customers",
    "transactions",
    "quick-add",
    "settings",
  ];
  const secondSegment = segments[2]; // e.g., "dashboard" from /en/dashboard
  const isProtectedRoute =
    hasLocalePrefix && protectedPaths.includes(secondSegment || "");

  // Auth routes: /{locale}/login, /{locale}/signup
  const secondSegmentIsAuth =
    segments[2] === "login" || segments[2] === "signup";
  const isAuthRoute = hasLocalePrefix && secondSegmentIsAuth;

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL(
      `/${locale}/login?redirect=${encodeURIComponent(pathname)}`,
      request.url,
    );
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from login/signup to dashboard
  if (isAuthRoute && isLoggedIn) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Apply next-intl middleware for i18n handling
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except api, _next/static, _next/image, favicon.ico, etc.
  matcher: [
    // Match all paths except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)",
  ],
};
