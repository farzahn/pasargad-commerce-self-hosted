/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, use Redis instead.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Unique identifier for the rate limit (e.g., 'site-access', 'api') */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param key - Unique identifier for the client (e.g., IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup();

  const { limit, windowMs, identifier = 'default' } = config;
  const now = Date.now();
  const fullKey = `${identifier}:${key}`;

  // Get or create entry
  let entry = rateLimitStore.get(fullKey);

  if (!entry || entry.resetTime < now) {
    // Create new window
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(fullKey, entry);

  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  return {
    success,
    remaining,
    reset: entry.resetTime,
    limit,
  };
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  };
}

/**
 * Extract client identifier from request
 * Uses X-Forwarded-For header if behind a proxy, otherwise falls back to a default
 */
export function getClientId(request: Request): string {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Get the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  // Check for real IP header (some proxies use this)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback - in production, this should be configured properly
  return 'unknown';
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  /** Strict limit for authentication attempts: 5 requests per minute */
  auth: { limit: 5, windowMs: 60 * 1000, identifier: 'auth' },

  /** Standard API limit: 60 requests per minute */
  api: { limit: 60, windowMs: 60 * 1000, identifier: 'api' },

  /** Loose limit for general access: 100 requests per minute */
  general: { limit: 100, windowMs: 60 * 1000, identifier: 'general' },

  /** Very strict limit for sensitive operations: 3 requests per 5 minutes */
  sensitive: { limit: 3, windowMs: 5 * 60 * 1000, identifier: 'sensitive' },
};

/**
 * Clear the rate limit store (useful for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
