/**
 * Centralized API Services
 *
 * This file exports all API services for the Fiple mobile app.
 * Import services from here to ensure consistent API usage across the app.
 *
 * Usage:
 * import { marketplaceService, affiliateService } from '@/api/services';
 *
 * const products = await marketplaceService.searchProducts('iPhone');
 */

// Marketplace & E-Commerce
export {
  marketplaceService,
  merchantService,
  type Product,
  type Order,
  type OrderItem,
  type OrderTimelineItem,
  type SearchFilters,
} from './marketplace-service';

// Affiliate & Partnerships
export {
  affiliateService,
  creatorShowcaseService,
  type AffiliateApplication,
  type Partnership,
  type EarningsData,
  type PayoutRequest,
  type ShowcaseProduct,
} from './affiliate-service';

// Battles & Gaming
export {
  battleService,
  type Battle,
  type BattleLeaderboard,
  type LeaderboardEntry,
  type BattleResults,
  type Gift,
  type BattleInvite,
} from './battles-service';

// Admin & Moderation
export {
  adminService,
  type AdminDashboardStats,
  type FlaggedContent,
  type PendingAd,
  type User,
  type PlatformAnalytics,
} from './admin-service';

// Help & Support
export {
  helpService,
  faqService,
  supportService,
  contentQualityService,
  creatorService,
  type HelpCategory,
  type HelpArticle,
  type FAQ,
  type SupportTicket,
  type TicketMessage,
  type ContentAppeal,
  type OriginalityReport,
} from './help-service';

/**
 * API Configuration
 */
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Common API Error Handler
 *
 * Usage:
 * try {
 *   const data = await marketplaceService.searchProducts('iPhone');
 * } catch (error) {
 *   handleAPIError(error);
 * }
 */
export function handleAPIError(error: unknown): string {
  const err = error as any;

  if (err.message) {
    return err.message;
  }

  if (err.response) {
    switch (err.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'Request timeout. Please check your internet connection.';
  }

  if (err.code === 'ERR_NETWORK' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return 'No internet connection. Please check your network.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * API Request Retry Logic
 *
 * Automatically retries failed requests with exponential backoff.
 *
 * Usage:
 * const data = await retryRequest(() => marketplaceService.searchProducts('iPhone'));
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = API_CONFIG.retryAttempts,
  delay: number = API_CONFIG.retryDelay
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      const err = error as any;

      // Don't retry on client errors (4xx)
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}

/**
 * Format currency for Nigerian Naira
 */
export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
