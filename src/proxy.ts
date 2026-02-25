import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

// Cookie name to track if user has been redirected based on auto-detection
const LOCALE_DETECTED_COOKIE = "locale-detected";

// Mapping from Accept-Language prefixes to our supported locales
// Based on target markets: TR (Turkey), ID (Indonesia), NG (Nigeria), EG (Egypt), ZA (South Africa), ES/LatAm
const LANGUAGE_TO_LOCALE: Record<string, string> = {
  // Turkish - Turkey
  tr: "tr",
  "tr-TR": "tr",
  // Indonesian - Indonesia
  id: "id",
  "id-ID": "id",
  in: "id", // 'in' is the ISO 639-1 code for Indonesian (Indonesian language code)
  "in-ID": "id",
  // Arabic - Egypt and other Arabic-speaking countries
  ar: "ar",
  "ar-EG": "ar", // Egypt
  "ar-SA": "ar", // Saudi Arabia
  "ar-AE": "ar", // UAE
  "ar-MA": "ar", // Morocco
  "ar-DZ": "ar", // Algeria
  "ar-TN": "ar", // Tunisia
  // Spanish - Spain and Latin America
  es: "es",
  "es-ES": "es", // Spain
  "es-MX": "es", // Mexico
  "es-AR": "es", // Argentina
  "es-CO": "es", // Colombia
  "es-CL": "es", // Chile
  "es-PE": "es", // Peru
  "es-VE": "es", // Venezuela
  // Hindi - India
  hi: "hi",
  "hi-IN": "hi",
  // Zulu - South Africa
  zu: "zu",
  "zu-ZA": "zu",
  // English fallback - default
  en: "en",
  "en-US": "en",
  "en-GB": "en",
  "en-NG": "en", // Nigeria
  "en-ZA": "en", // South Africa (English more common than Zulu)
  "en-PH": "en", // Philippines
};

/**
 * Detect the best matching locale from Accept-Language header
 */
function detectLocaleFromHeader(acceptLanguage: string | null): string {
  if (!acceptLanguage) {
    return routing.defaultLocale;
  }

  // Parse Accept-Language header (e.g., "tr-TR,tr;q=0.9,en;q=0.8")
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";");
      const quality = qValue ? parseFloat(qValue.split("=")[1]) : 1;
      return { code: code.trim(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Try to find a matching locale
  for (const { code } of languages) {
    // Try exact match first (e.g., "tr-TR")
    if (LANGUAGE_TO_LOCALE[code]) {
      return LANGUAGE_TO_LOCALE[code];
    }

    // Try language prefix (e.g., "tr" from "tr-TR")
    const prefix = code.split("-")[0].toLowerCase();
    if (LANGUAGE_TO_LOCALE[prefix]) {
      return LANGUAGE_TO_LOCALE[prefix];
    }
  }

  return routing.defaultLocale;
}

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

  // Helper to copy cookies from one response to another (defined early for use below)
  const copyCookies = (from: NextResponse, to: NextResponse) => {
    from.cookies.getAll().forEach((cookie) => {
      to.cookies.set(cookie.name, cookie.value);
    });
  };

  // 3.5. Auto-detect locale for first-time visitors on root path
  // Only redirect if:
  // - Path is exactly "/" (root)
  // - User doesn't have locale-detected cookie
  const localeDetectedCookie = request.cookies.get(LOCALE_DETECTED_COOKIE);

  if (pathname === "/" && !localeDetectedCookie) {
    const acceptLanguage = request.headers.get("Accept-Language");
    const detectedLocale = detectLocaleFromHeader(acceptLanguage);

    // Redirect to detected locale
    const redirectUrl = new URL(`/${detectedLocale}`, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // Set cookie to remember that we've detected locale (expires in 1 year)
    redirectResponse.cookies.set(LOCALE_DETECTED_COOKIE, detectedLocale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // Copy Supabase cookies to maintain session
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

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
