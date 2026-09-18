/**
 * BuckeyeGrub Meal Plan State Store
 * Manages active daily meal plans across 4 slots (Breakfast, Lunch, Dinner, Snack),
 * item swaps, logging toggles, macro aggregations, and saved plans/favorites.
 * Persisted locally via AsyncStorage.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { OSU_MENU_ITEMS, OSU_MENU_ITEMS_MAP } from '../data';
import {
  DailyMealPlan,
  FavoriteMealCombo,
  MacroNutrients,
  MealPlanStore,
  MealSlot,
  MealSlotType,
  MenuItem,
  PlannedMealItem,
  SavedMealPlan,
} from '../types';
import { appStorage, STORAGE_KEYS } from './storage';

/**
 * Calculates sum of calories and macros across an array of planned items.
 */
function calculateItemsTotals(items: PlannedMealItem[]): {
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

/**
 * Calculates total daily calories and macros across all 4 meal slots.
 */
function calculatePlanTotals(meals: Record<MealSlotType, MealSlot>): {
  totalCalories: number;
  totalMacros: MacroNutrients;
} {
  const allItems: PlannedMealItem[] = [
    ...meals.breakfast.items,
    ...meals.lunch.items,
    ...meals.dinner.items,
    ...meals.snack.items,
  ];
  const aggregated = calculateItemsTotals(allItems);
  return {
    totalCalories: aggregated.calories,
    totalMacros: aggregated.macros,
  };
}

/**
 * Creates the pre-seeded demo daily meal plan using authentic OSU menu items.
 */
export function createDemoDailyPlan(): DailyMealPlan {
  const today = new Date().toISOString().split('T')[0];

  // Fallback items in case data map is sparse
  const fallbackItem = OSU_MENU_ITEMS[0];
  const omelet = OSU_MENU_ITEMS_MAP['scott-traditions-omelet'] ?? fallbackItem;
  const chickenRice = OSU_MENU_ITEMS_MAP['scott-grilled-chicken-brown-rice'] ?? fallbackItem;
  const pastaBowl = OSU_MENU_ITEMS_MAP['curl-byo-chicken-pasta-bowl'] ?? fallbackItem;
  const yogurt = OSU_MENU_ITEMS_MAP['kennedy-greek-yogurt-fruit-bowl'] ?? fallbackItem;
  const snackBox = OSU_MENU_ITEMS_MAP['curl-protein-power-snack-box'] ?? fallbackItem;

  const breakfastItems: PlannedMealItem[] = [
    {
      id: 'demo_planned_breakfast_1',
      menuItem: omelet,
      servingMultiplier: 1.0,
      isLogged: true,
      loggedAt: `${today}T08:30:00.000Z`,
    },
  ];

  const lunchItems: PlannedMealItem[] = [
    {
      id: 'demo_planned_lunch_1',
      menuItem: chickenRice,
      servingMultiplier: 1.0,
      isLogged: true,
      loggedAt: `${today}T12:45:00.000Z`,
    },
  ];

  const dinnerItems: PlannedMealItem[] = [
    {
      id: 'demo_planned_dinner_1',
      menuItem: pastaBowl,
      servingMultiplier: 1.0,
      isLogged: false,
    },
  ];

  const snackItems: PlannedMealItem[] = [
    {
      id: 'demo_planned_snack_1',
      menuItem: yogurt,
      servingMultiplier: 1.0,
      isLogged: false,
    },
    {
      id: 'demo_planned_snack_2',
      menuItem: snackBox,
      servingMultiplier: 1.0,
      isLogged: false,
    },
  ];

  const meals: Record<MealSlotType, MealSlot> = {
    breakfast: {
      slot: 'breakfast',
      label: 'Breakfast',
      targetCalories: 450,
      items: breakfastItems,
      isLogged: true,
    },
    lunch: {
      slot: 'lunch',
      label: 'Lunch',
      targetCalories: 600,
      items: lunchItems,
      isLogged: true,
    },
    dinner: {
      slot: 'dinner',
      label: 'Dinner',
      targetCalories: 750,
      items: dinnerItems,
      isLogged: false,
    },
    snack: {
      slot: 'snack',
      label: 'Snack',
      targetCalories: 600,
      items: snackItems,
      isLogged: false,
    },
  };

  const { totalCalories, totalMacros } = calculatePlanTotals(meals);

  return {
    id: 'demo-daily-meal-plan',
    date: today,
    title: "Brutus's Game-Day Power Plan",
    meals,
    targetCalories: 2400,
    targetMacros: {
      protein: 180,
      carbs: 260,
      fat: 70,
      fiber: 35,
    },
    totalCalories,
    totalMacros,
    createdAt: `${today}T07:00:00.000Z`,
    updatedAt: `${today}T07:00:00.000Z`,
  };
}

export const useMealPlanStore = create<MealPlanStore>()(
  persist(
    (set, get) => ({
      activePlan: createDemoDailyPlan(),
      savedPlans: [],
      favorites: [],
      isLoading: false,
      hasHydrated: false,

      setActivePlan: (plan: DailyMealPlan) => {
        const { totalCalories, totalMacros } = calculatePlanTotals(plan.meals);
        set({
          activePlan: {
            ...plan,
            totalCalories,
            totalMacros,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      setSlotItems: (slot: MealSlotType, items: MenuItem[]) => {
        set((state) => {
          const newPlannedItems: PlannedMealItem[] = items.map((item, idx) => ({
            id: `${slot}_${item.id}_${Date.now()}_${idx}`,
            menuItem: item,
            servingMultiplier: 1.0,
            isLogged: false,
          }));

          const updatedMeals: Record<MealSlotType, MealSlot> = {
            ...state.activePlan.meals,
            [slot]: {
              ...state.activePlan.meals[slot],
              items: newPlannedItems,
              isLogged: false,
            },
          };

          const { totalCalories, totalMacros } = calculatePlanTotals(updatedMeals);

          return {
            activePlan: {
              ...state.activePlan,
              meals: updatedMeals,
              totalCalories,
              totalMacros,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      addItemToSlot: (slot: MealSlotType, item: MenuItem, servingMultiplier = 1.0) => {
        set((state) => {
          const currentSlot = state.activePlan.meals[slot];
          const newPlannedItem: PlannedMealItem = {
            id: `${slot}_${item.id}_${Date.now()}`,
            menuItem: item,
            servingMultiplier: Math.max(0.1, servingMultiplier),
            isLogged: false,
          };

          const updatedSlotItems = [...currentSlot.items, newPlannedItem];
          const updatedMeals: Record<MealSlotType, MealSlot> = {
            ...state.activePlan.meals,
            [slot]: {
              ...currentSlot,
              items: updatedSlotItems,
              isLogged: false,
            },
          };

          const { totalCalories, totalMacros } = calculatePlanTotals(updatedMeals);

          return {
            activePlan: {
              ...state.activePlan,
              meals: updatedMeals,
              totalCalories,
              totalMacros,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      removeItemFromSlot: (slot: MealSlotType, plannedItemId: string) => {
        set((state) => {
          const currentSlot = state.activePlan.meals[slot];
          const updatedSlotItems = currentSlot.items.filter((i) => i.id !== plannedItemId);
          const isSlotLogged =
            updatedSlotItems.length > 0 && updatedSlotItems.every((i) => i.isLogged);

          const updatedMeals: Record<MealSlotType, MealSlot> = {
            ...state.activePlan.meals,
            [slot]: {
              ...currentSlot,
              items: updatedSlotItems,
              isLogged: isSlotLogged,
            },
          };

          const { totalCalories, totalMacros } = calculatePlanTotals(updatedMeals);

          return {
            activePlan: {
              ...state.activePlan,
              meals: updatedMeals,
              totalCalories,
              totalMacros,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      swapItemInSlot: (slot: MealSlotType, plannedItemId: string, newItem: MenuItem) => {
        set((state) => {
          const currentSlot = state.activePlan.meals[slot];
          const index = currentSlot.items.findIndex((i) => i.id === plannedItemId);
          if (index === -1) {
            return state;
          }

          const existing = currentSlot.items[index];
          const swappedItem: PlannedMealItem = {
            id: plannedItemId,
            menuItem: newItem,
            servingMultiplier: existing.servingMultiplier,
            isLogged: existing.isLogged,
            loggedAt: existing.loggedAt,
          };

          const updatedSlotItems = [...currentSlot.items];
          updatedSlotItems[index] = swappedItem;

          const updatedMeals: Record<MealSlotType, MealSlot> = {
            ...state.activePlan.meals,
            [slot]: {
              ...currentSlot,
              items: updatedSlotItems,
            },
          };

          const { totalCalories, totalMacros } = calculatePlanTotals(updatedMeals);

          return {
            activePlan: {
              ...state.activePlan,
              meals: updatedMeals,
              totalCalories,
              totalMacros,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      toggleItemLogged: (slot: MealSlotType, plannedItemId: string) => {
        set((state) => {
          const currentSlot = state.activePlan.meals[slot];
          const updatedSlotItems = currentSlot.items.map((entry) => {
            if (entry.id === plannedItemId) {
              const nextLogged = !entry.isLogged;
              return {
                ...entry,
                isLogged: nextLogged,
                loggedAt: nextLogged ? new Date().toISOString() : undefined,
              };
            }
            return entry;
          });

          const isSlotLogged =
            updatedSlotItems.length > 0 && updatedSlotItems.every((i) => i.isLogged);

          const updatedMeals: Record<MealSlotType, MealSlot> = {
            ...state.activePlan.meals,
            [slot]: {
              ...currentSlot,
              items: updatedSlotItems,
              isLogged: isSlotLogged,
            },
          };

          return {
            activePlan: {
              ...state.activePlan,
              meals: updatedMeals,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      toggleSlotLogged: (slot: MealSlotType) => {
        set((state) => {
          const currentSlot = state.activePlan.meals[slot];
          const nextLogged = !currentSlot.isLogged;
          const timestamp = nextLogged ? new Date().toISOString() : undefined;

          const updatedSlotItems = currentSlot.items.map((entry) => ({
            ...entry,
            isLogged: nextLogged,
            loggedAt: timestamp,
          }));

          const updatedMeals: Record<MealSlotType, MealSlot> = {
            ...state.activePlan.meals,
            [slot]: {
              ...currentSlot,
              items: updatedSlotItems,
              isLogged: nextLogged,
            },
          };

          return {
            activePlan: {
              ...state.activePlan,
              meals: updatedMeals,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      setSlotLogged: (slot: MealSlotType, isLogged: boolean) => {
        set((state) => {
          const currentSlot = state.activePlan.meals[slot];
          const timestamp = isLogged ? new Date().toISOString() : undefined;

          const updatedSlotItems = currentSlot.items.map((entry) => ({
            ...entry,
            isLogged,
            loggedAt: timestamp,
          }));

          const updatedMeals: Record<MealSlotType, MealSlot> = {
            ...state.activePlan.meals,
            [slot]: {
              ...currentSlot,
              items: updatedSlotItems,
              isLogged,
            },
          };

          return {
            activePlan: {
              ...state.activePlan,
              meals: updatedMeals,
              updatedAt: new Date().toISOString(),
            },
          };
        });
      },

      saveCurrentPlan: (name: string, description?: string, tags: string[] = []): SavedMealPlan => {
        const currentPlan = get().activePlan;
        const savedPlan: SavedMealPlan = {
          id: `saved_plan_${Date.now()}`,
          name: name.trim() || `Plan for ${currentPlan.date}`,
          description,
          tags,
          plan: JSON.parse(JSON.stringify(currentPlan)),
          savedAt: new Date().toISOString(),
        };

        set((state) => ({
          savedPlans: [savedPlan, ...state.savedPlans],
        }));

        return savedPlan;
      },

      deleteSavedPlan: (planId: string) => {
        set((state) => ({
          savedPlans: state.savedPlans.filter((p) => p.id !== planId),
        }));
      },

      loadSavedPlan: (planId: string) => {
        const planToLoad = get().savedPlans.find((p) => p.id === planId);
        if (!planToLoad) return;

        const today = new Date().toISOString().split('T')[0];
        const loadedPlan: DailyMealPlan = {
          ...JSON.parse(JSON.stringify(planToLoad.plan)),
          id: `daily_plan_${Date.now()}`,
          date: today,
          updatedAt: new Date().toISOString(),
        };

        set({ activePlan: loadedPlan });
      },

      addFavoriteCombo: (
        name: string,
        venueId: string,
        slot: MealSlotType,
        items: MenuItem[]
      ): FavoriteMealCombo => {
        const plannedDummies: PlannedMealItem[] = items.map((i) => ({
          id: i.id,
          menuItem: i,
          servingMultiplier: 1.0,
          isLogged: false,
        }));
        const { calories, macros } = calculateItemsTotals(plannedDummies);

        const favorite: FavoriteMealCombo = {
          id: `favorite_${Date.now()}`,
          name: name.trim() || `${items[0]?.name ?? 'Meal'} Combo`,
          venueId,
          slot,
          items: [...items],
          totalCalories: calories,
          totalMacros: macros,
          savedAt: new Date().toISOString(),
        };

        set((state) => ({
          favorites: [favorite, ...state.favorites],
        }));

        return favorite;
      },

      removeFavoriteCombo: (comboId: string) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== comboId),
        }));
      },

      clearActivePlan: () => {
        const today = new Date().toISOString().split('T')[0];
        const emptyMeals: Record<MealSlotType, MealSlot> = {
          breakfast: { slot: 'breakfast', label: 'Breakfast', items: [], isLogged: false },
          lunch: { slot: 'lunch', label: 'Lunch', items: [], isLogged: false },
          dinner: { slot: 'dinner', label: 'Dinner', items: [], isLogged: false },
          snack: { slot: 'snack', label: 'Snack', items: [], isLogged: false },
        };

        set((state) => ({
          activePlan: {
            id: `plan_${Date.now()}`,
            date: today,
            title: 'Custom Meal Plan',
            meals: emptyMeals,
            targetCalories: state.activePlan.targetCalories,
            targetMacros: state.activePlan.targetMacros,
            totalCalories: 0,
            totalMacros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      resetToDemoPlan: () => {
        set({
          activePlan: createDemoDailyPlan(),
        });
      },

      getSlotTotals: (slot: MealSlotType) => {
        const currentSlot = get().activePlan.meals[slot];
        return calculateItemsTotals(currentSlot.items);
      },

      getDailyTotals: () => {
        const { totalCalories, totalMacros } = get().activePlan;
        return { calories: totalCalories, macros: totalMacros };
      },

      getLoggedTotals: () => {
        const { meals } = get().activePlan;
        const loggedItems: PlannedMealItem[] = [];

        for (const slotKey of ['breakfast', 'lunch', 'dinner', 'snack'] as MealSlotType[]) {
          const slot = meals[slotKey];
          for (const item of slot.items) {
            if (item.isLogged) {
              loggedItems.push(item);
            }
          }
        }

        return calculateItemsTotals(loggedItems);
      },

      setHasHydrated: (hydrated: boolean) => {
        set({ hasHydrated: hydrated });
      },
    }),
    {
      name: STORAGE_KEYS.MEAL_PLAN,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        activePlan: state.activePlan,
        savedPlans: state.savedPlans,
        favorites: state.favorites,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
