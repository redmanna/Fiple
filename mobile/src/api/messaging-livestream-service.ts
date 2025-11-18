import apiClient from './client';

// ============================================================================
// MESSAGING SERVICES
// ============================================================================

export const messageService = {
  // Get user's conversations (inbox)
  getConversations: async (token: string, page: number = 1) => {
    return apiClient.get('/messages/conversations', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page },
    });
  },

  // Get messages in a conversation
  getMessages: async (token: string, conversationId: string, page: number = 1) => {
    return apiClient.get(`/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page },
    });
  },

  // Send a message
  sendMessage: async (token: string, data: {
    recipientId: string;
    content: string;
    mediaUrls?: string[];
    mediaTypes?: string[];
    replyToId?: string;
  }) => {
    return apiClient.post('/messages/send', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Delete message
  deleteMessage: async (token: string, messageId: string) => {
    return apiClient.post(`/messages/${messageId}/delete`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // React to message
  reactToMessage: async (token: string, messageId: string, emoji: string) => {
    return apiClient.post(`/messages/${messageId}/react`, { emoji }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// ============================================================================
// LIVE STREAMING SERVICES
// ============================================================================

export const livestreamService = {
  // Create live stream
  createStream: async (token: string, data: {
    title: string;
    description?: string;
    scheduledAt?: string;
    subscribersOnly?: boolean;
  }) => {
    return apiClient.post('/livestream/create', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Start stream
  startStream: async (token: string, streamId: string) => {
    return apiClient.post(`/livestream/${streamId}/start`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // End stream
  endStream: async (token: string, streamId: string) => {
    return apiClient.post(`/livestream/${streamId}/end`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Join stream as viewer
  joinStream: async (streamId: string, data: {
    userId?: string;
    username?: string;
    displayName?: string;
    avatar?: string;
  }) => {
    return apiClient.post(`/livestream/${streamId}/join`, data);
  },

  // Leave stream
  leaveStream: async (streamId: string, viewerId: string, watchDuration: number) => {
    return apiClient.post(`/livestream/${streamId}/leave`, {
      viewerId,
      watchDuration,
    });
  },

  // Send gift
  sendGift: async (token: string, streamId: string, data: {
    giftType: string;
    quantity?: number;
    message?: string;
  }) => {
    return apiClient.post(`/livestream/${streamId}/gift`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Send comment
  sendComment: async (token: string, streamId: string, data: {
    content: string;
    username?: string;
  }) => {
    return apiClient.post(`/livestream/${streamId}/comment`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get viewer rankings
  getRankings: async (streamId: string, limit: number = 50) => {
    return apiClient.get(`/livestream/${streamId}/rankings`, {
      params: { limit },
    });
  },

  // Subscribe to creator
  subscribe: async (token: string, hostId: string, tier: 'BASIC' | 'PREMIUM' | 'VIP') => {
    return apiClient.post('/livestream/subscribe', { hostId, tier }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Create bulletin
  createBulletin: async (token: string, data: {
    title: string;
    content: string;
    tier?: 'BASIC' | 'PREMIUM' | 'VIP';
    isPublic?: boolean;
  }) => {
    return apiClient.post('/livestream/bulletins', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get bulletins
  getBulletins: async (token: string, hostId: string) => {
    return apiClient.get('/livestream/bulletins', {
      headers: { Authorization: `Bearer ${token}` },
      params: { hostId },
    });
  },
};
