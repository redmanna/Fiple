// Security Middleware - Rate Limiting, Validation, Protection
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  AUTH_LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  AUTH_REGISTER: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour

  // Content creation
  POST_CREATE: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 posts per hour
  COMMENT_CREATE: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 comments per hour

  // Engagement
  LIKE_ACTION: { maxRequests: 500, windowMs: 60 * 60 * 1000 }, // 500 likes per hour
  FOLLOW_ACTION: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 follows per hour

  // API general
  API_GENERAL: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 requests per hour

  // Payment/Withdrawal
  WITHDRAWAL: { maxRequests: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 withdrawals per day

  // Admin actions
  ADMIN_ACTION: { maxRequests: 1000, windowMs: 60 * 60 * 1000 },
};

/**
 * Rate limit middleware
 */
export function rateLimit(config: { maxRequests: number; windowMs: number }) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const ip = req.headers.get('x-forwarded-for') ||
               req.headers.get('x-real-ip') ||
               'unknown';

    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();

    // Get current rate limit data
    const limitData = rateLimitStore.get(key);

    // Reset if window expired
    if (!limitData || now > limitData.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null; // Allow request
    }

    // Check if limit exceeded
    if (limitData.count >= config.maxRequests) {
      const resetIn = Math.ceil((limitData.resetTime - now) / 1000);

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please try again in ${resetIn} seconds.`,
          retryAfter: resetIn,
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetIn.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitData.resetTime.toString(),
          },
        }
      );
    }

    // Increment count
    limitData.count++;
    rateLimitStore.set(key, limitData);

    return null; // Allow request
  };
}

/**
 * Input validation helpers
 */
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  },

  username: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  },

  password: (password: string): boolean => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
  },

  displayName: (name: string): boolean => {
    return name.length >= 2 && name.length <= 50;
  },

  phoneNumber: (phone: string): boolean => {
    // Nigerian phone format: +234XXXXXXXXXX or 0XXXXXXXXXX
    const phoneRegex = /^(\+234|0)[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Sanitize user input to prevent XSS
  sanitizeHtml: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // Validate and sanitize caption
  caption: (caption: string): { valid: boolean; sanitized: string } => {
    const sanitized = validators.sanitizeHtml(caption.substring(0, 2000));
    return {
      valid: caption.length <= 2000,
      sanitized,
    };
  },

  // Validate URL
  url: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },
};

/**
 * Validate request body against schema
 */
export function validateBody<T>(
  body: any,
  schema: Record<keyof T, (value: any) => boolean>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [field, validator] of Object.entries(schema)) {
    if (!validator(body[field])) {
      errors.push(`Invalid ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Security headers middleware
 */
export function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self), microphone=(self), camera=(self)',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

/**
 * CSRF Token generation and validation
 */
export const csrf = {
  generateToken: (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },

  validateToken: (token: string, storedToken: string): boolean => {
    return token === storedToken && token.length > 0;
  },
};

/**
 * IP-based suspicious activity detection
 */
const suspiciousActivityStore = new Map<string, {
  failedLogins: number;
  rapidRequests: number;
  lastActivity: number;
}>();

export function trackSuspiciousActivity(ip: string, activityType: 'failed_login' | 'rapid_request') {
  const key = ip;
  const data = suspiciousActivityStore.get(key) || {
    failedLogins: 0,
    rapidRequests: 0,
    lastActivity: Date.now(),
  };

  if (activityType === 'failed_login') {
    data.failedLogins++;
  } else if (activityType === 'rapid_request') {
    data.rapidRequests++;
  }

  data.lastActivity = Date.now();
  suspiciousActivityStore.set(key, data);

  // Auto-reset after 1 hour
  setTimeout(() => {
    suspiciousActivityStore.delete(key);
  }, 60 * 60 * 1000);

  return data;
}

export function isSuspiciousIP(ip: string): boolean {
  const data = suspiciousActivityStore.get(ip);
  if (!data) return false;

  // Flag as suspicious if:
  // - More than 10 failed logins in last hour
  // - More than 1000 rapid requests
  return data.failedLogins > 10 || data.rapidRequests > 1000;
}

/**
 * File upload validation
 */
export const fileValidation = {
  // Allowed MIME types
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],

  // Max file sizes (in bytes)
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB

  validateImage: (file: File): { valid: boolean; error?: string } => {
    if (!fileValidation.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid image type' };
    }
    if (file.size > fileValidation.MAX_IMAGE_SIZE) {
      return { valid: false, error: 'Image too large (max 10MB)' };
    }
    return { valid: true };
  },

  validateVideo: (file: File): { valid: boolean; error?: string } => {
    if (!fileValidation.ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid video type' };
    }
    if (file.size > fileValidation.MAX_VIDEO_SIZE) {
      return { valid: false, error: 'Video too large (max 100MB)' };
    }
    return { valid: true };
  },

  // Sanitize filename
  sanitizeFilename: (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
  },
};

/**
 * Password strength checker
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-5
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length < 8) feedback.push('Use at least 8 characters');

  // Complexity
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Add special characters');

  // Common passwords check (simplified)
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }

  return {
    score: Math.min(5, score),
    feedback,
  };
}

/**
 * Email verification token generation
 */
export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Clean up old rate limit data (run periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
