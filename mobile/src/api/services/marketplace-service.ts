import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  merchantId: string;
  merchantName: string;
  rating?: number;
  stock?: number;
}

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
  shippingAddress?: any;
  trackingNumber?: string;
  timeline?: OrderTimelineItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

export interface OrderTimelineItem {
  status: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface SearchFilters {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
  sortBy?: string;
}

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem('auth_token');
}

// Helper function for API requests with error handling
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

// Marketplace Services
export const marketplaceService = {
  // Product Search
  async searchProducts(
    query: string,
    filters: SearchFilters = {}
  ): Promise<{ products: Product[] }> {
    const params = new URLSearchParams({
      q: query,
      ...filters,
    });
    return apiRequest(`/api/marketplace/search?${params}`);
  },

  // Get Product Details
  async getProductDetails(productId: string): Promise<{ product: Product }> {
    return apiRequest(`/api/marketplace/products/${productId}`);
  },

  // Get Cart
  async getCart(): Promise<{ items: OrderItem[]; total: number }> {
    return apiRequest('/api/marketplace/cart');
  },

  // Add to Cart
  async addToCart(
    productId: string,
    quantity: number
  ): Promise<{ success: boolean }> {
    return apiRequest('/api/marketplace/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  // Update Cart Item
  async updateCartItem(
    itemId: string,
    quantity: number
  ): Promise<{ success: boolean }> {
    return apiRequest(`/api/marketplace/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  // Remove from Cart
  async removeFromCart(itemId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/marketplace/cart/${itemId}`, {
      method: 'DELETE',
    });
  },

  // Create Order
  async createOrder(data: {
    items: { productId: string; quantity: number }[];
    shippingAddress: any;
    paymentMethod: string;
  }): Promise<{ order: Order }> {
    return apiRequest('/api/marketplace/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get Orders
  async getOrders(status?: string): Promise<{ orders: Order[] }> {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/marketplace/orders${params}`);
  },

  // Get Order Details
  async getOrderDetails(orderId: string): Promise<{ order: Order }> {
    return apiRequest(`/api/marketplace/orders/${orderId}`);
  },

  // Pay Order
  async payOrder(
    orderId: string,
    paymentMethod: string
  ): Promise<{ success: boolean; order: Order }> {
    return apiRequest(`/api/marketplace/orders/${orderId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    });
  },

  // Cancel Order
  async cancelOrder(
    orderId: string,
    reason: string
  ): Promise<{ success: boolean }> {
    return apiRequest(`/api/marketplace/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Get Search History
  async getSearchHistory(): Promise<{ searches: string[] }> {
    const searches = await AsyncStorage.getItem('@fiple_recent_searches');
    return { searches: searches ? JSON.parse(searches) : [] };
  },

  // Save Search to History
  async saveSearchToHistory(query: string): Promise<void> {
    const searches = await AsyncStorage.getItem('@fiple_recent_searches');
    const searchHistory: string[] = searches ? JSON.parse(searches) : [];

    // Add to beginning, remove duplicates, keep last 10
    const updatedHistory = [
      query,
      ...searchHistory.filter((s) => s !== query),
    ].slice(0, 10);

    await AsyncStorage.setItem(
      '@fiple_recent_searches',
      JSON.stringify(updatedHistory)
    );
  },

  // Clear Search History
  async clearSearchHistory(): Promise<void> {
    await AsyncStorage.removeItem('@fiple_recent_searches');
  },
};

// Merchant Services
export const merchantService = {
  // Get Merchant Dashboard
  async getDashboard(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    topProducts: Product[];
    revenueData: any[];
  }> {
    return apiRequest('/api/merchant/dashboard');
  },

  // Create Product
  async createProduct(product: {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    images: string[];
    affiliateSettings?: {
      enabled: boolean;
      commission: number;
    };
  }): Promise<{ product: Product }> {
    return apiRequest('/api/merchant/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  // Update Product
  async updateProduct(
    productId: string,
    updates: Partial<Product>
  ): Promise<{ product: Product }> {
    return apiRequest(`/api/merchant/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete Product
  async deleteProduct(productId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/merchant/products/${productId}`, {
      method: 'DELETE',
    });
  },

  // Get Orders
  async getOrders(status?: string): Promise<{ orders: Order[] }> {
    const params = status ? `?status=${status}` : '';
    return apiRequest(`/api/merchant/orders${params}`);
  },

  // Update Order Status
  async updateOrderStatus(
    orderId: string,
    status: string,
    trackingNumber?: string
  ): Promise<{ success: boolean; order: Order }> {
    return apiRequest(`/api/merchant/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, trackingNumber }),
    });
  },
};
