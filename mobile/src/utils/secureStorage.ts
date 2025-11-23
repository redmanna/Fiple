/**
 * Secure Storage Utility
 * Uses expo-secure-store for encrypted storage of sensitive data
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Securely store a value
 * Note: SecureStore only works on iOS and Android (not web)
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Fallback to sessionStorage for web (NOT secure, but functional)
    console.warn('SecureStore not available on web - using sessionStorage');
    sessionStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

/**
 * Retrieve a securely stored value
 */
export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    // Fallback to sessionStorage for web
    return sessionStorage.getItem(key);
  }

  return await SecureStore.getItemAsync(key);
}

/**
 * Remove a securely stored value
 */
export async function removeSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    sessionStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

/**
 * Store object as JSON
 */
export async function setSecureObject(key: string, value: any): Promise<void> {
  await setSecureItem(key, JSON.stringify(value));
}

/**
 * Retrieve object from JSON
 */
export async function getSecureObject<T>(key: string): Promise<T | null> {
  const json = await getSecureItem(key);
  if (!json) return null;

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Failed to parse secure storage item:', key, error);
    return null;
  }
}

// Storage keys (centralized for consistency)
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  REFRESH_TOKEN: 'refreshToken',
} as const;
