// Authentication Store
import { create } from 'zustand';
import { authService } from '../api/services';
import type { User, LoginRequest, RegisterRequest } from '../../../shared/types';
import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  setSecureObject,
  getSecureObject,
  STORAGE_KEYS,
} from '../utils/secureStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (credentials) => {
    try {
      const response = await authService.login(credentials);

      await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      await setSecureObject(STORAGE_KEYS.USER, response.user);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    try {
      const response = await authService.register(data);

      await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      await setSecureObject(STORAGE_KEYS.USER, response.user);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    await removeSecureItem(STORAGE_KEYS.USER);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadUser: async () => {
    try {
      const token = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      const user = await getSecureObject<User>(STORAGE_KEYS.USER);

      if (token && user) {
        // Refresh user data from server
        try {
          const freshUser = await authService.getMe();
          await setSecureObject(STORAGE_KEYS.USER, freshUser);

          set({
            user: freshUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // If refresh fails, use cached user
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  updateUser: (user) => {
    setSecureObject(STORAGE_KEYS.USER, user);
    set({ user });
  },
}));
