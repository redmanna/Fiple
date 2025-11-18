import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Types
export interface AdminDashboardStats {
  urgentActions: {
    flaggedContent: number;
    pendingAds: number;
    reportedUsers: number;
  };
  platformStats: {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalRevenue: number;
  };
}

export interface FlaggedContent {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'message';
  authorId: string;
  authorUsername: string;
  reason: string;
  reportCount: number;
  status: 'pending' | 'approved' | 'removed';
  contentPreview: string;
  contentUrl?: string;
  createdAt: string;
  issues?: string[];
}

export interface PendingAd {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  mediaUrl: string;
  targetAudience: string;
  budget: number;
  duration: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'active' | 'warned' | 'banned';
  isVerified: boolean;
  role: 'user' | 'creator' | 'merchant' | 'admin';
  joinedAt: string;
  lastActive: string;
}

export interface PlatformAnalytics {
  overview: {
    dau: number;
    mau: number;
    retentionRate: number;
    avgSessionDuration: number;
  };
  revenue: {
    total: number;
    bySource: {
      subscriptions: number;
      marketplace: number;
      advertising: number;
      battles: number;
    };
  };
  topCreators: {
    userId: string;
    username: string;
    earnings: number;
    followers: number;
  }[];
  userGrowth: {
    date: string;
    newUsers: number;
    activeUsers: number;
  }[];
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

// Admin Services
export const adminService = {
  // Get Dashboard Stats
  async getDashboardStats(): Promise<AdminDashboardStats> {
    return apiRequest('/api/admin/dashboard');
  },

  // Content Moderation
  async getFlaggedContent(): Promise<{ content: FlaggedContent[] }> {
    return apiRequest('/api/admin/moderation/flagged');
  },

  async approveContent(contentId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/admin/moderation/content/${contentId}/approve`, {
      method: 'POST',
    });
  },

  async warnContent(
    contentId: string,
    reason: string
  ): Promise<{ success: boolean }> {
    return apiRequest(`/api/admin/moderation/content/${contentId}/warn`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async removeContent(
    contentId: string,
    reason: string
  ): Promise<{ success: boolean }> {
    return apiRequest(`/api/admin/moderation/content/${contentId}/remove`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Ad Approval
  async getPendingAds(): Promise<{ ads: PendingAd[] }> {
    return apiRequest('/api/admin/ads/pending');
  },

  async approveAd(adId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/admin/ads/${adId}/approve`, {
      method: 'POST',
    });
  },

  async rejectAd(adId: string, reason: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/admin/ads/${adId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // User Management
  async searchUsers(query: string): Promise<{ users: User[] }> {
    return apiRequest(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
  },

  async getUsers(filter?: {
    status?: 'active' | 'warned' | 'banned';
    role?: string;
  }): Promise<{ users: User[] }> {
    const params = new URLSearchParams(filter as any);
    return apiRequest(`/api/admin/users?${params}`);
  },

  async getUserDetails(userId: string): Promise<{ user: User }> {
    return apiRequest(`/api/admin/users/${userId}`);
  },

  async verifyUser(userId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/admin/users/${userId}/verify`, {
      method: 'POST',
    });
  },

  async warnUser(userId: string, reason: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/admin/users/${userId}/warn`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async banUser(
    userId: string,
    reason: string,
    duration?: number
  ): Promise<{ success: boolean }> {
    return apiRequest(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason, duration }),
    });
  },

  async unbanUser(userId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/admin/users/${userId}/unban`, {
      method: 'POST',
    });
  },

  // Platform Analytics
  async getAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<PlatformAnalytics> {
    return apiRequest(`/api/admin/analytics?period=${period}`);
  },

  async getRevenueReport(
    startDate: string,
    endDate: string
  ): Promise<{
    total: number;
    bySource: any;
    byDay: any[];
  }> {
    return apiRequest(
      `/api/admin/analytics/revenue?start=${startDate}&end=${endDate}`
    );
  },

  async getUserGrowthReport(period: '7d' | '30d' | '90d' = '30d'): Promise<{
    newUsers: number;
    activeUsers: number;
    churnRate: number;
    data: any[];
  }> {
    return apiRequest(`/api/admin/analytics/user-growth?period=${period}`);
  },

  // Reports
  async getReports(status?: 'pending' | 'resolved'): Promise<{
    reports: {
      id: string;
      type: string;
      targetId: string;
      reason: string;
      reporterId: string;
      status: string;
      createdAt: string;
    }[];
  }> {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/admin/reports${params}`);
  },

  async resolveReport(
    reportId: string,
    action: 'dismiss' | 'warn' | 'remove' | 'ban',
    note?: string
  ): Promise<{ success: boolean }> {
    return apiRequest(`/api/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, note }),
    });
  },

  // System Settings
  async getSystemSettings(): Promise<{ settings: Record<string, any> }> {
    return apiRequest('/api/admin/settings');
  },

  async updateSystemSettings(
    settings: Record<string, any>
  ): Promise<{ success: boolean }> {
    return apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Announcements
  async createAnnouncement(data: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'maintenance';
    targetAudience: 'all' | 'creators' | 'merchants';
  }): Promise<{ success: boolean }> {
    return apiRequest('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
