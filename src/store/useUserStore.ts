/**
 * BuckeyeGrub User State Store
 * Manages user profile, fitness goals, calorie/macro targets, BuckID balances, and habit streaks.
 * Persisted locally via AsyncStorage.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  BuckIDBalances,
  DEMO_USER_PROFILE,
  DietaryTag,
  FitnessGoal,
  MacroTargets,
  UserProfile,
  UserStore,
} from '../types';
import { appStorage, STORAGE_KEYS } from './storage';

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: { ...DEMO_USER_PROFILE },
      isLoading: false,
      hasHydrated: false,

      updateProfile: (updates: Partial<UserProfile>) => {
        set((state) => ({
          profile: {
            ...state.profile,
            ...updates,
          },
        }));
      },

      setFitnessGoal: (goal: FitnessGoal) => {
        set((state) => ({
          profile: {
            ...state.profile,
            fitnessGoal: goal,
          },
        }));
      },

      setCalorieTarget: (calories: number) => {
        set((state) => ({
          profile: {
            ...state.profile,
            targetCalories: Math.max(0, Math.round(calories)),
          },
        }));
      },

      setMacroTargets: (targets: Partial<MacroTargets>) => {
        set((state) => ({
          profile: {
            ...state.profile,
            targetMacros: {
              ...state.profile.targetMacros,
              ...targets,
            },
          },
        }));
      },

      updateBalances: (balances: Partial<BuckIDBalances>) => {
        set((state) => ({
          profile: {
            ...state.profile,
            balances: {
              ...state.profile.balances,
              ...balances,
            },
          },
        }));
      },

      deductSwipe: (count = 1): boolean => {
        const currentSwipes = get().profile.balances.swipes;
        if (currentSwipes < count) {
          return false;
        }
        set((state) => ({
          profile: {
            ...state.profile,
            balances: {
              ...state.profile.balances,
              swipes: currentSwipes - count,
            },
          },
        }));
        return true;
      },

      addSwipes: (count: number) => {
        if (count <= 0) return;
        set((state) => ({
          profile: {
            ...state.profile,
            balances: {
              ...state.profile.balances,
              swipes: state.profile.balances.swipes + count,
            },
          },
        }));
      },

      deductDiningDollars: (amount: number): boolean => {
        const currentBalance = get().profile.balances.diningDollars;
        if (amount <= 0 || currentBalance < amount) {
          return false;
        }
        const updated = Math.round((currentBalance - amount) * 100) / 100;
        set((state) => ({
          profile: {
            ...state.profile,
            balances: {
              ...state.profile.balances,
              diningDollars: updated,
            },
          },
        }));
        return true;
      },

      addDiningDollars: (amount: number) => {
        if (amount <= 0) return;
        set((state) => ({
          profile: {
            ...state.profile,
            balances: {
              ...state.profile.balances,
              diningDollars: Math.round((state.profile.balances.diningDollars + amount) * 100) / 100,
            },
          },
        }));
      },

      deductBuckIDCash: (amount: number): boolean => {
        const currentBalance = get().profile.balances.buckidCash;
        if (amount <= 0 || currentBalance < amount) {
          return false;
        }
        const updated = Math.round((currentBalance - amount) * 100) / 100;
        set((state) => ({
          profile: {
            ...state.profile,
            balances: {
              ...state.profile.balances,
              buckidCash: updated,
            },
          },
        }));
        return true;
      },

      addBuckIDCash: (amount: number) => {
        if (amount <= 0) return;
        set((state) => ({
          profile: {
            ...state.profile,
            balances: {
              ...state.profile.balances,
              buckidCash: Math.round((state.profile.balances.buckidCash + amount) * 100) / 100,
            },
          },
        }));
      },

      setDietaryRestrictions: (restrictions: DietaryTag[]) => {
        set((state) => ({
          profile: {
            ...state.profile,
            dietaryRestrictions: [...restrictions],
          },
        }));
      },

      toggleDietaryRestriction: (tag: DietaryTag) => {
        set((state) => {
          const current = state.profile.dietaryRestrictions;
          const exists = current.includes(tag);
          return {
            profile: {
              ...state.profile,
              dietaryRestrictions: exists
                ? current.filter((t) => t !== tag)
                : [...current, tag],
            },
          };
        });
      },

      setApiKeys: (keys: { geminiApiKey?: string; openaiApiKey?: string }) => {
        set((state) => ({
          profile: {
            ...state.profile,
            ...keys,
          },
        }));
      },

      incrementStreak: () => {
        set((state) => ({
          profile: {
            ...state.profile,
            streakDays: state.profile.streakDays + 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
          },
        }));
      },

      resetStreak: () => {
        set((state) => ({
          profile: {
            ...state.profile,
            streakDays: 0,
          },
        }));
      },

      setPowerScore: (score: number) => {
        const clamped = Math.max(0, Math.min(100, Math.round(score)));
        set((state) => ({
          profile: {
            ...state.profile,
            powerScore: clamped,
          },
        }));
      },

      resetToDemo: () => {
        set({
          profile: { ...DEMO_USER_PROFILE },
        });
      },

      setHasHydrated: (hydrated: boolean) => {
        set({ hasHydrated: hydrated });
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        profile: state.profile,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
