import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Types
export interface AffiliateApplication {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  audienceSize: number;
  primaryPlatform: string;
  createdAt: string;
}

export interface Partnership {
  id: string;
  merchantId: string;
  merchantName: string;
  status: 'active' | 'paused' | 'ended';
  commission: number;
  affiliateLink: string;
  totalSales: number;
  totalEarnings: number;
  productsCount: number;
  createdAt: string;
}

export interface EarningsData {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  conversionRate: number;
  totalClicks: number;
  totalSales: number;
  earningsByMerchant: {
    merchantId: string;
    merchantName: string;
    earnings: number;
    sales: number;
  }[];
}

export interface PayoutRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
}

export interface ShowcaseProduct {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  commission: number;
  sales: number;
  earnings: number;
  isShowcased: boolean;
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

// Affiliate Services
export const affiliateService = {
  // Apply for Affiliate Program
  async applyForAffiliate(data: {
    audienceSize: number;
    primaryPlatform: string;
    contentType: string;
    reason: string;
  }): Promise<{ application: AffiliateApplication }> {
    return apiRequest('/api/affiliate/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Check Affiliate Status
  async getAffiliateStatus(): Promise<{
    isAffiliate: boolean;
    application?: AffiliateApplication;
  }> {
    return apiRequest('/api/affiliate/status');
  },

  // Get Earnings
  async getEarnings(): Promise<EarningsData> {
    return apiRequest('/api/affiliate/earnings');
  },

  // Request Payout
  async requestPayout(amount: number): Promise<{ payout: PayoutRequest }> {
    return apiRequest('/api/affiliate/payout', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // Get Payout History
  async getPayoutHistory(): Promise<{ payouts: PayoutRequest[] }> {
    return apiRequest('/api/affiliate/payouts');
  },

  // Get Partnerships
  async getPartnerships(
    status?: 'active' | 'paused' | 'ended'
  ): Promise<{ partnerships: Partnership[] }> {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/affiliate/partnerships${params}`);
  },

  // Update Partnership Status
  async updatePartnershipStatus(
    partnershipId: string,
    status: 'active' | 'paused'
  ): Promise<{ success: boolean }> {
    return apiRequest(`/api/affiliate/partnerships/${partnershipId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Get Showcase Products
  async getShowcaseProducts(): Promise<{ products: ShowcaseProduct[] }> {
    return apiRequest('/api/affiliate/showcase');
  },

  // Add Product to Showcase
  async addToShowcase(productId: string): Promise<{ success: boolean }> {
    return apiRequest('/api/affiliate/showcase', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  // Remove Product from Showcase
  async removeFromShowcase(productId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/affiliate/showcase/${productId}`, {
      method: 'DELETE',
    });
  },

  // Get Affiliate Analytics
  async getAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<{
    clicks: number;
    sales: number;
    earnings: number;
    conversionRate: number;
    chartData: any[];
  }> {
    return apiRequest(`/api/affiliate/analytics?period=${period}`);
  },

  // Generate Affiliate Link
  async generateAffiliateLink(
    productId: string
  ): Promise<{ link: string; qrCode?: string }> {
    return apiRequest(`/api/affiliate/generate-link`, {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },
};

// Creator Showcase Services (for live streaming)
export const creatorShowcaseService = {
  // Get Showcased Products for Live Stream
  async getShowcaseProducts(): Promise<{ products: ShowcaseProduct[] }> {
    return apiRequest('/api/creator/showcase/products');
  },

  // Add Product to Live Showcase
  async addProductToShowcase(
    productId: string
  ): Promise<{ success: boolean }> {
    return apiRequest('/api/creator/showcase/products', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  // Remove Product from Live Showcase
  async removeProductFromShowcase(
    productId: string
  ): Promise<{ success: boolean }> {
    return apiRequest(`/api/creator/showcase/products/${productId}`, {
      method: 'DELETE',
    });
  },

  // Get Showcase Earnings
  async getShowcaseEarnings(): Promise<{
    totalEarnings: number;
    products: ShowcaseProduct[];
  }> {
    return apiRequest('/api/creator/showcase/earnings');
  },

  // Update Product Showcase Order
  async updateShowcaseOrder(
    productIds: string[]
  ): Promise<{ success: boolean }> {
    return apiRequest('/api/creator/showcase/order', {
      method: 'PUT',
      body: JSON.stringify({ productIds }),
    });
  },
};
