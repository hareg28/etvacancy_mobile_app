import './polyfill-crypto';
import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@constants/index';

/**
 * Custom cross-platform storage for Better Auth expoClient plugin.
 * Uses SecureStore on iOS/Android and localStorage on Web.
 */
const customStorage = {
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {}
    } else {
      try {
        SecureStore.setItem(key, value);
      } catch (e) {
        SecureStore.setItemAsync(key, value).catch(() => {});
      }
    }
  },
  getItem: (key: string): string | null => {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem(key)
          : null;
      } catch (e) {
        return null;
      }
    } else {
      try {
        return SecureStore.getItem(key);
      } catch (e) {
        return null;
      }
    }
  },
};

/**
 * Better Auth client for EtVacancy mobile.
 *
 * Uses the `expoClient` plugin which:
 *  - Stores session cookies / tokens in SecureStore on iOS/Android
 *  - Falls back to localStorage on Web
 *  - Intercepts native OAuth deep-links automatically
 */
export const authClient = createAuthClient({
  baseURL: API_BASE_URL.replace(/\/api\/?$/, ''), // Better Auth mounts at the server root, not /api
  plugins: [
    expoClient({
      scheme: 'etvacancy',
      storagePrefix: 'etvacancy.auth',
      storage: customStorage,
    }) as any,
  ],
});

export type Session = (typeof authClient)['$Infer']['Session'];
export type BetterAuthUser = (typeof authClient)['$Infer']['Session']['user'];
