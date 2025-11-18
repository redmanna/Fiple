import apiClient from './client';

export const adService = {
  // Record ad impression
  recordImpression: async (adId: string, userId?: string) => {
    return apiClient.post('/ads/impression', {
      adId,
      userId,
      placement: 'feed',
    });
  },

  // Record ad click
  recordClick: async (adId: string, userId?: string) => {
    return apiClient.post('/ads/click', {
      adId,
      userId,
    });
  },

  // Record ad conversion
  recordConversion: async (adId: string, userId?: string, conversionType: string, value?: number) => {
    return apiClient.post('/ads/conversion', {
      adId,
      userId,
      conversionType,
      value,
    });
  },

  // Get ads for feed
  getAdsForFeed: async (userId?: string, placement: string = 'feed', limit: number = 1) => {
    return apiClient.get('/ads/serve', {
      params: { userId, placement, limit },
    });
  },
};

export const businessService = {
  // Business Account
  createBusinessAccount: async (token: string, data: any) => {
    return apiClient.post('/business/account', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getBusinessAccount: async (token: string) => {
    return apiClient.get('/business/account', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Ads
  createAd: async (token: string, data: any) => {
    return apiClient.post('/business/ads', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getAds: async (token: string, params: any) => {
    return apiClient.get('/business/ads', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
  },

  getAdDetails: async (token: string, adId: string) => {
    return apiClient.get(`/business/ads/${adId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  updateAd: async (token: string, adId: string, data: any) => {
    return apiClient.put(`/business/ads/${adId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  deleteAd: async (token: string, adId: string) => {
    return apiClient.delete(`/business/ads/${adId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Campaigns
  createCampaign: async (token: string, data: any) => {
    return apiClient.post('/business/campaigns', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getCampaigns: async (token: string) => {
    return apiClient.get('/business/campaigns', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Analytics
  getAnalytics: async (token: string, timeRange: string = '7d') => {
    return apiClient.get('/business/analytics', {
      headers: { Authorization: `Bearer ${token}` },
      params: { timeRange },
    });
  },

  // Promoted Posts
  createPromotedPost: async (token: string, data: any) => {
    return apiClient.post('/business/promoted-posts', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getPromotedPosts: async (token: string) => {
    return apiClient.get('/business/promoted-posts', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
