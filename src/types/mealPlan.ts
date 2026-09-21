/**
 * BuckeyeGrub Domain Models – Meal Plans, Planned Slots & Saved Favorites
 * Strict TypeScript types for daily meal planning, item swapping, and nutrition logging.
 */

import { MacroNutrients, MenuItem } from './dining';
import { MacroTargets } from './user';

export type MealSlotType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannedMealItem {
  id: string; // Unique instance ID in the plan (e.g., 'breakfast_item_1')
  menuItem: MenuItem;
  servingMultiplier: number; // Defaults to 1.0
  isLogged: boolean;
  loggedAt?: string; // ISO 8601 timestamp
}

export interface MealSlot {
  slot: MealSlotType;
  label: string; // "Breakfast", "Lunch", "Dinner", "Snack"
  targetCalories?: number;
  items: PlannedMealItem[];
  isLogged: boolean;
}

export const DEFAULT_MEAL_SLOT_RATIOS: Record<MealSlotType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.30,
  snack: 0.10,
} as const;

/**
 * Calculates sum of calories and macros across an array of planned items.
 * Centralized shared helper to ensure identical precision across store and planner layers.
 */
export function calculatePlannedItemsTotals(items: PlannedMealItem[]): {
  calories: number;
  macros: MacroNutrients;
} {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  let sugar = 0;
  let sodium = 0;

  for (const entry of items) {
    const mult = entry.servingMultiplier > 0 ? entry.servingMultiplier : 1;
    const item = entry.menuItem;
    calories += item.calories * mult;
    protein += item.macros.protein * mult;
    carbs += item.macros.carbs * mult;
    fat += item.macros.fat * mult;
    fiber += (item.macros.fiber ?? 0) * mult;
    sugar += (item.macros.sugar ?? 0) * mult;
    sodium += (item.macros.sodium ?? 0) * mult;
  }

  return {
    calories: Math.round(calories),
    macros: {
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      sugar: Math.round(sugar * 10) / 10,
      sodium: Math.round(sodium),
    },
  };
}

export interface DailyMealPlan {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  meals: Record<MealSlotType, MealSlot>;
  targetCalories: number;
  targetMacros: MacroTargets;
  totalCalories: number;
  totalMacros: MacroNutrients;
  source?: 'gemini' | 'openai' | 'heuristic';
  fallbackReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedMealPlan {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  plan: DailyMealPlan;
  savedAt: string;
}

export interface FavoriteMealCombo {
  id: string;
  name: string;
  slot: MealSlotType;
  venueId: string;
  items: MenuItem[];
  totalCalories: number;
  totalMacros: MacroNutrients;
  savedAt: string;
}

export interface MealPlanStoreState {
  activePlan: DailyMealPlan;
  savedPlans: SavedMealPlan[];
  favorites: FavoriteMealCombo[];
  isLoading: boolean;
  hasHydrated: boolean;
}

export interface MealPlanStoreActions {
  setActivePlan: (plan: DailyMealPlan) => void;
  setSlotItems: (slot: MealSlotType, items: MenuItem[]) => void;
  addItemToSlot: (slot: MealSlotType, item: MenuItem, servingMultiplier?: number) => void;
  removeItemFromSlot: (slot: MealSlotType, plannedItemId: string) => void;
  swapItemInSlot: (slot: MealSlotType, plannedItemId: string, newItem: MenuItem) => void;
  toggleItemLogged: (slot: MealSlotType, plannedItemId: string) => void;
  toggleSlotLogged: (slot: MealSlotType) => void;
  setSlotLogged: (slot: MealSlotType, isLogged: boolean) => void;
  saveCurrentPlan: (name: string, description?: string, tags?: string[]) => SavedMealPlan;
  deleteSavedPlan: (planId: string) => void;
  loadSavedPlan: (planId: string) => void;
  addFavoriteCombo: (
    name: string,
    venueId: string,
    slot: MealSlotType,
    items: MenuItem[]
  ) => FavoriteMealCombo;
  removeFavoriteCombo: (comboId: string) => void;
  clearActivePlan: () => void;
  resetToDemoPlan: () => void;
  getSlotTotals: (slot: MealSlotType) => { calories: number; macros: MacroNutrients };
  getDailyTotals: () => { calories: number; macros: MacroNutrients };
  getLoggedTotals: () => { calories: number; macros: MacroNutrients };
  setHasHydrated: (hydrated: boolean) => void;
}

export type MealPlanStore = MealPlanStoreState & MealPlanStoreActions;
