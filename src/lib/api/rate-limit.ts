/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, consider using Redis or Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Key prefix for identification
   */
  keyPrefix?: string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory store for rate limit entries
// Note: This will reset on server restart and doesn't work across instances
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every minute
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000);
}

/**
 * Check rate limit for a given key
 *
 * @param key - Unique identifier (e.g., IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const fullKey = `${config.keyPrefix || "rl"}:${key}`;
  const entry = rateLimitStore.get(fullKey);

  if (!entry || entry.resetTime < now) {
    // First request or window expired
    rateLimitStore.set(fullKey, {
      count: 1,
      resetTime: now + config.windowMs,
    });

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(fullKey, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback for development
  return "unknown";
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  /**
   * Standard API rate limit: 100 requests per minute
   */
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    keyPrefix: "api",
  },

  /**
   * Strict rate limit for sensitive operations: 10 requests per minute
   */
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyPrefix: "strict",
  },

  /**
   * Auth rate limit: 5 requests per minute (for login, signup, etc.)
   */
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    keyPrefix: "auth",
  },

  /**
   * Write operations: 30 requests per minute
   */
  write: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    keyPrefix: "write",
  },
} as const;

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter || 60),
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
      },
    }
  );
}

/**
 * Higher-order function to add rate limiting to an API handler
 *
 * @example
 * export const POST = withRateLimit(async (request) => {
 *   // Your handler logic
 * }, rateLimitConfigs.write);
 */
export function withRateLimit<T extends Request>(
  handler: (request: T) => Promise<Response>,
  config: RateLimitConfig = rateLimitConfigs.standard
): (request: T) => Promise<Response> {
  return async (request: T) => {
    const ip = getClientIp(request);
    const result = checkRateLimit(ip, config);

    if (!result.success) {
      return createRateLimitResponse(result);
    }

    const response = await handler(request);

    // Add rate limit headers to response
    response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetTime / 1000)));

    return response;
  };
}
