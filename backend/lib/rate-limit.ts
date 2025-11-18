// Rate Limiting Middleware for API Protection
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many requests. Please try again later.',
};

/**
 * Generate rate limit key from request
 */
function defaultKeyGenerator(request: NextRequest): string {
  // Use IP address as the default key
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  const pathname = new URL(request.url).pathname;
  return `${ip}:${pathname}`;
}

/**
 * Rate limiter middleware
 *
 * Usage in API routes:
 * ```typescript
 * import { rateLimit } from '@/lib/rate-limit';
 *
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = rateLimit(request, {
 *     windowMs: 60000, // 1 minute
 *     maxRequests: 10, // 10 requests per minute
 *   });
 *
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *
 *   // Process request...
 * }
 * ```
 */
export function rateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): { success: boolean; response?: NextResponse } {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const keyGenerator = fullConfig.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(request);

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean up
    cleanupExpiredEntries(now);
  }

  if (!entry || now > entry.resetTime) {
    // New window or expired entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + fullConfig.windowMs,
    });
    return { success: true };
  }

  if (entry.count >= fullConfig.maxRequests) {
    // Rate limit exceeded
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: fullConfig.message,
          retryAfter: resetInSeconds,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': fullConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': resetInSeconds.toString(),
          },
        }
      ),
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return { success: true };
}

/**
 * Strict rate limiter for authentication endpoints
 */
export function strictRateLimit(request: NextRequest) {
  return rateLimit(request, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Only 5 requests per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  });
}

/**
 * Payment rate limiter
 */
export function paymentRateLimit(request: NextRequest) {
  return rateLimit(request, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 payment attempts per hour
    message: 'Too many payment requests. Please try again later.',
  });
}

/**
 * Cleanup expired entries
 */
function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Clear all rate limit entries (use for testing only)
 */
export function clearRateLimitStore() {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): {
  remaining: number;
  resetTime: number;
  isLimited: boolean;
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const keyGenerator = fullConfig.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(request);

  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      remaining: fullConfig.maxRequests,
      resetTime: now + fullConfig.windowMs,
      isLimited: false,
    };
  }

  const remaining = Math.max(0, fullConfig.maxRequests - entry.count);

  return {
    remaining,
    resetTime: entry.resetTime,
    isLimited: entry.count >= fullConfig.maxRequests,
  };
}
