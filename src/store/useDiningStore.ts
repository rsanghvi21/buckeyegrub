/**
 * BuckeyeGrub Campus Dining Filter State Store
 * Manages reactive filters for campus zones, payment types, dietary tags,
 * search queries, and macro constraints.
 * Persisted locally via AsyncStorage.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  CampusZone,
  DietaryTag,
  DiningFilterOptions,
  DiningStore,
  MealCategory,
  PaymentType,
} from '../types';
import { appStorage, STORAGE_KEYS } from './storage';

const DEFAULT_FILTER_STATE = {
  selectedZone: 'All' as CampusZone | 'All',
  selectedPayment: 'All' as PaymentType | 'All',
  searchQuery: '',
  selectedDietaryTags: [] as DietaryTag[],
  selectedVenueId: null as string | null,
  selectedCategory: 'All' as MealCategory | 'All',
  minProtein: null as number | null,
  maxCalories: null as number | null,
  maxPrice: null as number | null,
  swipeOnly: false,
};

export const useDiningStore = create<DiningStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_FILTER_STATE,
      hasHydrated: false,

      setZone: (zone: CampusZone | 'All') => {
        set({ selectedZone: zone });
      },

      setPaymentType: (payment: PaymentType | 'All') => {
        set({
          selectedPayment: payment,
          swipeOnly: payment === 'swipe',
        });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      toggleDietaryTag: (tag: DietaryTag) => {
        set((state) => {
          const current = state.selectedDietaryTags;
          const exists = current.includes(tag);
          return {
            selectedDietaryTags: exists
              ? current.filter((t) => t !== tag)
              : [...current, tag],
          };
        });
      },

      setDietaryTags: (tags: DietaryTag[]) => {
        set({ selectedDietaryTags: [...tags] });
      },

      clearDietaryTags: () => {
        set({ selectedDietaryTags: [] });
      },

      setSelectedVenueId: (venueId: string | null) => {
        set({ selectedVenueId: venueId });
      },

      setSelectedCategory: (category: MealCategory | 'All') => {
        set({ selectedCategory: category });
      },

      setMacroConstraints: (constraints: {
        minProtein?: number | null;
        maxCalories?: number | null;
        maxPrice?: number | null;
        swipeOnly?: boolean;
      }) => {
        set((state) => ({
          minProtein: constraints.minProtein !== undefined ? constraints.minProtein : state.minProtein,
          maxCalories: constraints.maxCalories !== undefined ? constraints.maxCalories : state.maxCalories,
          maxPrice: constraints.maxPrice !== undefined ? constraints.maxPrice : state.maxPrice,
          swipeOnly: constraints.swipeOnly !== undefined ? constraints.swipeOnly : state.swipeOnly,
        }));
      },

      resetFilters: () => {
        set({
          ...DEFAULT_FILTER_STATE,
        });
      },

      getFilterOptions: (): DiningFilterOptions => {
        const state = get();
        const options: DiningFilterOptions = {
          zone: state.selectedZone,
          paymentType: state.selectedPayment,
          category: state.selectedCategory,
          swipeOnly: state.swipeOnly || state.selectedPayment === 'swipe',
        };

        if (state.selectedDietaryTags.length > 0) {
          options.dietaryTags = [...state.selectedDietaryTags];
        }

        const trimmedQuery = state.searchQuery.trim();
        if (trimmedQuery.length > 0) {
          options.searchQuery = trimmedQuery;
        }

        if (state.selectedVenueId) {
          options.venueId = state.selectedVenueId;
        }

        if (typeof state.minProtein === 'number' && state.minProtein > 0) {
          options.minProtein = state.minProtein;
        }

        if (typeof state.maxCalories === 'number' && state.maxCalories > 0) {
          options.maxCalories = state.maxCalories;
        }

        if (typeof state.maxPrice === 'number' && state.maxPrice > 0) {
          options.maxPrice = state.maxPrice;
        }

        return options;
      },

      setHasHydrated: (hydrated: boolean) => {
        set({ hasHydrated: hydrated });
      },
    }),
    {
      name: STORAGE_KEYS.DINING,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        selectedZone: state.selectedZone,
        selectedPayment: state.selectedPayment,
        selectedDietaryTags: state.selectedDietaryTags,
        selectedVenueId: state.selectedVenueId,
        selectedCategory: state.selectedCategory,
        minProtein: state.minProtein,
        maxCalories: state.maxCalories,
        maxPrice: state.maxPrice,
        swipeOnly: state.swipeOnly,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
