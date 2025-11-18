// API Services for Fiple
import api from './client';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Post,
  User,
  Reward,
  Wallet,
  Transaction,
  PaginatedResponse,
  CreatePostRequest,
} from '../../../shared/types';

// ============================================================================
// AUTH SERVICES
// ============================================================================

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data!;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },
};

// ============================================================================
// FEED SERVICES
// ============================================================================

export const feedService = {
  getFeed: async (params?: {
    page?: number;
    pageSize?: number;
    contentType?: string;
    sortBy?: 'recent' | 'trending' | 'top';
  }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Post>>>('/feed', { params });
    return response.data.data!;
  },
};

// ============================================================================
// POST SERVICES
// ============================================================================

export const postService = {
  getPosts: async (params?: {
    page?: number;
    pageSize?: number;
    userId?: string;
    campusHubId?: string;
  }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Post>>>('/posts', { params });
    return response.data.data!;
  },

  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await api.post<ApiResponse<Post>>('/posts', data);
    return response.data.data!;
  },

  likePost: async (postId: string): Promise<{ liked: boolean }> => {
    const response = await api.post<ApiResponse<{ liked: boolean }>>(`/posts/${postId}/like`);
    return response.data.data!;
  },

  getPostComments: async (postId: string, page = 1): Promise<any> => {
    const response = await api.get(`/posts/${postId}/comments`, {
      params: { page, pageSize: 20 },
    });
    return response.data.data;
  },

  addComment: async (postId: string, content: string): Promise<any> => {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data.data;
  },

  sharePost: async (postId: string): Promise<any> => {
    const response = await api.post(`/posts/${postId}/share`);
    return response.data.data;
  },
};

// ============================================================================
// USER SERVICES
// ============================================================================

export const userService = {
  getProfile: async (userId: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${userId}`);
    return response.data.data!;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/users/me', data);
    return response.data.data!;
  },

  followUser: async (userId: string): Promise<{ following: boolean }> => {
    const response = await api.post<ApiResponse<{ following: boolean }>>(`/users/${userId}/follow`);
    return response.data.data!;
  },

  getFollowers: async (userId: string, page = 1): Promise<PaginatedResponse<User>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<User>>>(`/users/${userId}/followers`, {
      params: { page },
    });
    return response.data.data!;
  },

  getFollowing: async (userId: string, page = 1): Promise<PaginatedResponse<User>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<User>>>(`/users/${userId}/following`, {
      params: { page },
    });
    return response.data.data!;
  },
};

// ============================================================================
// REWARD SERVICES
// ============================================================================

export const rewardService = {
  getRewards: async (): Promise<Reward[]> => {
    const response = await api.get<ApiResponse<Reward[]>>('/rewards');
    return response.data.data!;
  },

  getMilestoneProgress: async (): Promise<any> => {
    const response = await api.get('/rewards/milestone-progress');
    return response.data.data;
  },

  getLeaderboard: async (weekNumber?: number, year?: number): Promise<any> => {
    const response = await api.get('/rewards/leaderboard', {
      params: { weekNumber, year },
    });
    return response.data.data;
  },
};

// ============================================================================
// WALLET SERVICES
// ============================================================================

export const walletService = {
  getWallet: async (): Promise<Wallet> => {
    const response = await api.get<ApiResponse<Wallet>>('/wallet');
    return response.data.data!;
  },

  getTransactions: async (page = 1): Promise<PaginatedResponse<Transaction>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Transaction>>>('/wallet/transactions', {
      params: { page },
    });
    return response.data.data!;
  },

  withdraw: async (amount: number, bankDetails: any): Promise<Transaction> => {
    const response = await api.post<ApiResponse<Transaction>>('/wallet/withdraw', {
      amount,
      ...bankDetails,
    });
    return response.data.data!;
  },
};

// ============================================================================
// NOTIFICATION SERVICES
// ============================================================================

export const notificationService = {
  getNotifications: async (page = 1): Promise<any> => {
    const response = await api.get('/notifications', { params: { page } });
    return response.data.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.data;
  },
};

// ============================================================================
// CAMPUS HUB SERVICES
// ============================================================================

export const campusHubService = {
  getCampusHubs: async (): Promise<any[]> => {
    const response = await api.get('/campus-hubs');
    return response.data.data;
  },

  getCampusHub: async (id: string): Promise<any> => {
    const response = await api.get(`/campus-hubs/${id}`);
    return response.data.data;
  },

  joinCampusHub: async (id: string): Promise<void> => {
    await api.post(`/campus-hubs/${id}/join`);
  },
};

// ============================================================================
// SKILL EXCHANGE SERVICES
// ============================================================================

export const skillService = {
  getListings: async (params?: { category?: string; page?: number }): Promise<any> => {
    const response = await api.get('/skills', { params });
    return response.data.data;
  },

  createListing: async (data: any): Promise<any> => {
    const response = await api.post('/skills', data);
    return response.data.data;
  },

  createOrder: async (listingId: string, data: any): Promise<any> => {
    const response = await api.post(`/skills/${listingId}/orders`, data);
    return response.data.data;
  },

  getMyOrders: async (): Promise<any> => {
    const response = await api.get('/skills/orders/me');
    return response.data.data;
  },
};
