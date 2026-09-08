import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const webStorage = {
  getItem: (name: string): Promise<string | null> =>
    new Promise((resolve) => {
      try {
        resolve(typeof window !== 'undefined' ? window.localStorage.getItem(name) : null);
      } catch {
        resolve(null);
      }
    }),
  setItem: (name: string, value: string): Promise<void> =>
    new Promise((resolve, reject) => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(name, value);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    }),
  removeItem: (name: string): Promise<void> =>
    new Promise((resolve, reject) => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(name);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    }),
};

export const secureStorage =
  Platform.OS === 'web'
    ? webStorage
    : {
        getItem: async (name: string) => {
          try {
            return await SecureStore.getItemAsync(name);
          } catch {
            return null;
          }
        },
        setItem: async (name: string, value: string) => {
          try {
            await SecureStore.setItemAsync(name, value);
          } catch {
            // ignore
          }
        },
        removeItem: async (name: string) => {
          try {
            await SecureStore.deleteItemAsync(name);
          } catch {
            // ignore
          }
        },
      };
