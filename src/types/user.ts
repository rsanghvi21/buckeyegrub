/**
 * BuckeyeGrub Domain Models – User Profile, Fitness Targets & BuckID Balances
 * Strict TypeScript types for student identity, nutrition goals, and campus currency.
 */

import { DietaryTag } from '../constants/theme';

export type FitnessGoal = 'bulk' | 'cut' | 'maintain' | 'athletic';

export interface MacroTargets {
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
  fiber?: number;  // in grams
}

export interface BuckIDBalances {
  swipes: number;          // Traditions Swipes remaining (e.g., 14)
  diningDollars: number;   // Dining Dollars balance in USD (e.g., 250.00)
  buckidCash: number;      // BuckID Cash balance in USD (e.g., 50.00)
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  enableHaptics?: boolean;
  enableNotifications?: boolean;
  defaultCampusZone?: 'North' | 'South' | 'West' | 'All';
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  fitnessGoal: FitnessGoal;
  weightLbs?: number;
  heightInches?: number;
  targetCalories: number;
  targetMacros: MacroTargets;
  balances: BuckIDBalances;
  dietaryRestrictions: DietaryTag[];
  geminiApiKey?: string;
  openaiApiKey?: string;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  powerScore: number;     // 0 - 100
  preferences?: UserPreferences;
}

export const DEMO_USER_PROFILE: UserProfile = {
  id: 'brutus-buckeye-demo',
  name: 'Brutus Buckeye',
  email: 'brutus.1@osu.edu',
  fitnessGoal: 'athletic',
  weightLbs: 195,
  heightInches: 72,
  targetCalories: 2400,
  targetMacros: {
    protein: 180,
    carbs: 260,
    fat: 70,
    fiber: 35,
  },
  balances: {
    swipes: 14,
    diningDollars: 250.0,
    buckidCash: 50.0,
  },
  dietaryRestrictions: ['highProtein'],
  streakDays: 5,
  lastActiveDate: '2026-09-18',
  powerScore: 92,
  preferences: {
    theme: 'light',
    enableHaptics: true,
    enableNotifications: true,
    defaultCampusZone: 'North',
  },
};

export interface UserStoreState {
  profile: UserProfile;
  isLoading: boolean;
  hasHydrated: boolean;
}

export interface UserStoreActions {
  updateProfile: (updates: Partial<UserProfile>) => void;
  setFitnessGoal: (goal: FitnessGoal) => void;
  setCalorieTarget: (calories: number) => void;
  setMacroTargets: (targets: Partial<MacroTargets>) => void;
  updateBalances: (balances: Partial<BuckIDBalances>) => void;
  deductSwipe: (count?: number) => boolean;
  addSwipes: (count: number) => void;
  deductDiningDollars: (amount: number) => boolean;
  addDiningDollars: (amount: number) => void;
  deductBuckIDCash: (amount: number) => boolean;
  addBuckIDCash: (amount: number) => void;
  setDietaryRestrictions: (restrictions: DietaryTag[]) => void;
  toggleDietaryRestriction: (tag: DietaryTag) => void;
  setApiKeys: (keys: { geminiApiKey?: string; openaiApiKey?: string }) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  setPowerScore: (score: number) => void;
  resetToDemo: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export type UserStore = UserStoreState & UserStoreActions;
