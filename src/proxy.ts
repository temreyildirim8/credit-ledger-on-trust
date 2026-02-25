import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

/**
 * Combined middleware for i18n and authentication
 * Uses @supabase/ssr for proper session handling with getUser()
 */
export async function proxy(request: NextRequest) {
  // 1. Create initial response for Supabase
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Create new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  // A simple mistake could make it very hard to debug issues with users being randomly logged out.

  // 3. Get the user - this also refreshes the session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Extract locale from pathname
  const segments = pathname.split("/");
  const locale = segments[1] || "en";

  // Supported locales
  const supportedLocales = ["en", "tr", "es", "hi", "id", "ar", "zu"];
  const isValidLocale = supportedLocales.includes(locale);
  const hasLocalePrefix = isValidLocale;

  // Protected routes (require authentication)
  const protectedPaths = [
    "dashboard",
    "customers",
    "transactions",
    "quick-add",
    "settings",
    "reports",
    "onboarding",
  ];
  const secondSegment = segments[2];
  const isProtectedRoute =
    hasLocalePrefix && protectedPaths.includes(secondSegment || "");

  // Auth routes (redirect to dashboard if already logged in)
  const authPaths = [
    "login",
    "signup",
    "forgot-password",
    "reset-password",
    "verify-otp",
    "reset-success",
  ];
  const isAuthRoute =
    hasLocalePrefix && authPaths.includes(secondSegment || "");

  // Helper to copy cookies from one response to another
  const copyCookies = (from: NextResponse, to: NextResponse) => {
    from.cookies.getAll().forEach((cookie) => {
      to.cookies.set(cookie.name, cookie.value);
    });
  };

  // 4. Handle protected routes - redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL(
      `/${locale}/login?redirect=${encodeURIComponent(pathname)}`,
      request.url
    );
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Copy cookies from supabaseResponse to maintain session
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  // 5. Handle auth routes - redirect authenticated users to onboarding
  // (onboarding page will check if completed and redirect to dashboard if needed)
  if (isAuthRoute && user) {
    const onboardingUrl = new URL(`/${locale}/onboarding`, request.url);
    const redirectResponse = NextResponse.redirect(onboardingUrl);
    // Copy cookies from supabaseResponse to maintain session
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  // 6. Apply next-intl middleware for i18n handling
  // Need to combine supabaseResponse cookies with intl response
  const intlResponse = intlMiddleware(request);

  // IMPORTANT: Copy cookies from supabaseResponse to intlResponse
  // This ensures auth tokens are properly maintained
  copyCookies(supabaseResponse, intlResponse as NextResponse);

  return intlResponse;
}

export const config = {
  // Match all paths except api, _next/static, _next/image, favicon.ico, etc.
  matcher: [
    // Match all paths except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|images).*)",
  ],
};
