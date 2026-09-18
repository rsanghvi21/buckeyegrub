/**
 * BuckeyeGrub Cross-Platform Persistence Storage Adapter
 * Wraps @react-native-async-storage/async-storage for Zustand persist middleware.
 * Includes automatic in-memory fallback for Node.js test environments and SSR.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

// In-memory fallback map for non-browser / headless Node.js environments
const memoryStorage = new Map<string, string>();

const isNodeOrSSR = typeof window === 'undefined' && typeof navigator === 'undefined';

export const appStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (isNodeOrSSR) {
      return memoryStorage.get(name) ?? null;
    }
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return memoryStorage.get(name) ?? null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (isNodeOrSSR) {
      memoryStorage.set(name, value);
      return;
    }
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      memoryStorage.set(name, value);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (isNodeOrSSR) {
      memoryStorage.delete(name);
      return;
    }
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      memoryStorage.delete(name);
    }
  },
};

export const STORAGE_KEYS = {
  USER: 'buckeyegrub_user_v1',
  MEAL_PLAN: 'buckeyegrub_mealplan_v1',
  DINING: 'buckeyegrub_dining_v1',
} as const;

/**
 * Resets all stored state across memory and persistent storage.
 * Useful for automated test teardown and student log-out workflows.
 */
export async function clearAllPersistedState(): Promise<void> {
  memoryStorage.clear();
  try {
    const keys = Object.values(STORAGE_KEYS);
    if (!isNodeOrSSR) {
      await AsyncStorage.multiRemove(keys);
    }
  } catch {
    // Graceful swallow during headless runs
  }
}
