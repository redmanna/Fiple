import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Types
export interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  articleCount: number;
}

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  viewCount: number;
  helpfulCount: number;
  relatedArticles?: {
    id: string;
    slug: string;
    title: string;
    category: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'user' | 'support';
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface ContentAppeal {
  id: string;
  contentId: string;
  userId: string;
  reason: string;
  explanation: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
}

export interface OriginalityReport {
  id: string;
  contentId: string;
  userId: string;
  originalityScore: number;
  issues: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  watermarkDetected: boolean;
  platformMentions: string[];
  restrictionStatus: 'none' | 'limited' | 'removed';
  checkedAt: string;
}

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem('auth_token');
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// Help Center Services
export const helpService = {
  // Get Help Categories
  async getCategories(): Promise<{ categories: HelpCategory[] }> {
    return apiRequest('/api/help/categories');
  },

  // Search Articles
  async searchArticles(query: string): Promise<{ articles: HelpArticle[] }> {
    return apiRequest(
      `/api/help/articles/search?q=${encodeURIComponent(query)}`
    );
  },

  // Get Articles by Category
  async getArticlesByCategory(
    category: string
  ): Promise<{ articles: HelpArticle[] }> {
    return apiRequest(`/api/help/articles?category=${category}`);
  },

  // Get Article by Slug
  async getArticle(slug: string): Promise<{ article: HelpArticle }> {
    return apiRequest(`/api/help/articles/${slug}`);
  },

  // Mark Article as Helpful
  async markArticleHelpful(
    articleId: string,
    isHelpful: boolean
  ): Promise<{ success: boolean }> {
    return apiRequest(`/api/help/articles/${articleId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ isHelpful }),
    });
  },

  // Get Popular Articles
  async getPopularArticles(): Promise<{ articles: HelpArticle[] }> {
    return apiRequest('/api/help/articles/popular');
  },

  // Get Recent Articles
  async getRecentArticles(): Promise<{ articles: HelpArticle[] }> {
    return apiRequest('/api/help/articles/recent');
  },
};

// FAQ Services
export const faqService = {
  // Get All FAQs
  async getFAQs(): Promise<{
    groupedFAQs: Record<string, FAQ[]>;
  }> {
    return apiRequest('/api/help/faqs');
  },

  // Get FAQs by Category
  async getFAQsByCategory(category: string): Promise<{ faqs: FAQ[] }> {
    return apiRequest(`/api/help/faqs?category=${category}`);
  },

  // Search FAQs
  async searchFAQs(query: string): Promise<{ faqs: FAQ[] }> {
    return apiRequest(`/api/help/faqs/search?q=${encodeURIComponent(query)}`);
  },
};

// Support Ticket Services
export const supportService = {
  // Create Ticket
  async createTicket(data: {
    subject: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    message: string;
    attachments?: string[];
  }): Promise<{ ticket: SupportTicket }> {
    return apiRequest('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get User Tickets
  async getTickets(
    status?: 'open' | 'in_progress' | 'resolved' | 'closed'
  ): Promise<{ tickets: SupportTicket[] }> {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/support/tickets${params}`);
  },

  // Get Ticket Details
  async getTicket(ticketId: string): Promise<{ ticket: SupportTicket }> {
    return apiRequest(`/api/support/tickets/${ticketId}`);
  },

  // Send Message in Ticket
  async sendMessage(
    ticketId: string,
    message: string,
    attachments?: string[]
  ): Promise<{ message: TicketMessage }> {
    return apiRequest(`/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, attachments }),
    });
  },

  // Close Ticket
  async closeTicket(ticketId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/support/tickets/${ticketId}/close`, {
      method: 'POST',
    });
  },

  // Reopen Ticket
  async reopenTicket(ticketId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/support/tickets/${ticketId}/reopen`, {
      method: 'POST',
    });
  },

  // Rate Support
  async rateSupport(
    ticketId: string,
    rating: number,
    feedback?: string
  ): Promise<{ success: boolean }> {
    return apiRequest(`/api/support/tickets/${ticketId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    });
  },
};

// Content Quality Services
export const contentQualityService = {
  // Get Originality Report
  async getOriginalityReport(
    contentId: string
  ): Promise<{ report: OriginalityReport }> {
    return apiRequest(`/api/content/originality/${contentId}`);
  },

  // Request Content Review
  async requestReview(contentId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/content/review`, {
      method: 'POST',
      body: JSON.stringify({ contentId }),
    });
  },

  // Submit Appeal
  async submitAppeal(data: {
    contentId: string;
    reason: string;
    explanation: string;
  }): Promise<{ appeal: ContentAppeal }> {
    return apiRequest('/api/content/appeals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get User Appeals
  async getAppeals(
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<{ appeals: ContentAppeal[] }> {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/content/appeals${params}`);
  },

  // Get Appeal Details
  async getAppeal(appealId: string): Promise<{ appeal: ContentAppeal }> {
    return apiRequest(`/api/content/appeals/${appealId}`);
  },

  // Get Content Quality Guidelines
  async getGuidelines(): Promise<{
    guidelines: {
      category: string;
      rules: { title: string; description: string }[];
    }[];
  }> {
    return apiRequest('/api/content/guidelines');
  },
};

// Creator Services (Subscriptions & Bulletins)
export const creatorService = {
  // Get Subscription Settings
  async getSubscriptionSettings(): Promise<{
    settings: {
      enabled: boolean;
      tiers: {
        basic: { enabled: boolean; price: number; benefits: string[] };
        premium: { enabled: boolean; price: number; benefits: string[] };
        vip: { enabled: boolean; price: number; benefits: string[] };
      };
    };
    followerCount: number;
    subscriberCount: number;
  }> {
    return apiRequest('/api/creator/subscription/settings');
  },

  // Update Subscription Settings
  async updateSubscriptionSettings(settings: {
    enabled: boolean;
    tiers: {
      basic: { enabled: boolean; price: number; benefits: string[] };
      premium: { enabled: boolean; price: number; benefits: string[] };
      vip: { enabled: boolean; price: number; benefits: string[] };
    };
  }): Promise<{ success: boolean }> {
    return apiRequest('/api/creator/subscription/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Get Bulletins
  async getBulletins(): Promise<{
    bulletins: {
      id: string;
      title: string;
      content: string;
      targetTier: 'all' | 'premium' | 'vip';
      viewCount: number;
      createdAt: string;
    }[];
  }> {
    return apiRequest('/api/creator/bulletins');
  },

  // Create Bulletin
  async createBulletin(data: {
    title: string;
    content: string;
    targetTier: 'all' | 'premium' | 'vip';
  }): Promise<{ success: boolean }> {
    return apiRequest('/api/creator/bulletins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Delete Bulletin
  async deleteBulletin(bulletinId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/creator/bulletins/${bulletinId}`, {
      method: 'DELETE',
    });
  },

  // Get Subscriber Stats
  async getSubscriberStats(): Promise<{
    total: number;
    byTier: { basic: number; premium: number; vip: number };
    revenue: {
      monthly: number;
      total: number;
    };
  }> {
    return apiRequest('/api/creator/subscribers/stats');
  },
};
