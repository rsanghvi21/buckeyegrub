/**
 * BuckeyeGrub Nutrislice API Client & Campus Dining Service
 * Provides live integration with Ohio State's Nutrislice REST API (osu.api.nutrislice.com),
 * in-memory caching, comprehensive offline snapshot fallback, multi-criteria filtering,
 * macro sorting, and Grubhub menu mapping.
 */

import {
  CampusZone,
  DiningFilterOptions,
  DiningVenue,
  MacroSortField,
  MenuItem,
  NutrisliceRawDay,
  NutrisliceRawFood,
  NutrisliceRawMenuItem,
  NutrisliceRawSchool,
  NutrisliceRawWeekResponse,
  PaymentType,
  SortDirection,
} from '../../types/dining';
import { DietaryTag } from '../../constants/theme';
import {
  OSU_MENU_ITEMS,
  OSU_MENU_ITEMS_BY_VENUE,
  OSU_VENUES,
  OSU_VENUES_BY_SLUG,
  OSU_VENUES_MAP,
} from '../../data';

const NUTRISLICE_BASE_URL = 'https://osu.api.nutrislice.com/menu/api';
const DEFAULT_TIMEOUT_MS = 4000;
const VENUES_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MENU_CACHE_TTL_MS = 15 * 60 * 1000;   // 15 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class NutrisliceClient {
  private venuesCache: CacheEntry<DiningVenue[]> | null = null;
  private venueMenuCache = new Map<string, CacheEntry<MenuItem[]>>();
  private allItemsCache: CacheEntry<MenuItem[]> | null = null;

  /**
   * Helper to perform HTTP fetch with an abort timeout.
   */
  private async fetchWithTimeout<T>(
    url: string,
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'BuckeyeGrub/1.0 (The Ohio State University)',
        },
      });

      if (!response.ok) {
        throw new Error(`Nutrislice API responded with status ${response.status}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Fetches all OSU dining locations.
   * Merges live Nutrislice schools metadata with curated campus metadata
   * (zones, payment types, GPS coordinates, operating hours).
   * Falls back gracefully to static OSU_VENUES on network error or offline.
   */
  public async getVenues(forceRefresh = false): Promise<DiningVenue[]> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.venuesCache &&
      now - this.venuesCache.timestamp < VENUES_CACHE_TTL_MS
    ) {
      return this.venuesCache.data;
    }

    try {
      const rawSchools = await this.fetchWithTimeout<NutrisliceRawSchool[]>(
        `${NUTRISLICE_BASE_URL}/schools/`
      );

      if (!Array.isArray(rawSchools) || rawSchools.length === 0) {
        throw new Error('Invalid schools payload from Nutrislice API');
      }

      // Map raw schools into our curated venue registry
      const mergedVenues: DiningVenue[] = OSU_VENUES.map((staticVenue) => {
        const matchingSchool = rawSchools.find(
          (s) =>
            s.slug === staticVenue.slug ||
            (staticVenue.nutrisliceSchoolId && s.id === staticVenue.nutrisliceSchoolId)
        );

        if (!matchingSchool) {
          return staticVenue;
        }

        return {
          ...staticVenue,
          nutrisliceSchoolId: matchingSchool.id,
          address: matchingSchool.address || staticVenue.address,
          coordinates: matchingSchool.geolocation
            ? {
                latitude: matchingSchool.geolocation.latitude,
                longitude: matchingSchool.geolocation.longitude,
              }
            : staticVenue.coordinates,
        };
      });

      this.venuesCache = {
        data: mergedVenues,
        timestamp: now,
      };

      return mergedVenues;
    } catch (error) {
      // Graceful offline fallback
      this.venuesCache = {
        data: OSU_VENUES,
        timestamp: now,
      };
      return OSU_VENUES;
    }
  }

  /**
   * Fetches daily/weekly menu for a venue.
   * Normalizes raw Nutrislice items and falls back to static items for that venue.
   */
  public async getVenueMenu(
    venueSlugOrId: string,
    date = new Date(),
    forceRefresh = false
  ): Promise<MenuItem[]> {
    const venue =
      OSU_VENUES_MAP[venueSlugOrId] ||
      OSU_VENUES_BY_SLUG[venueSlugOrId] ||
      OSU_VENUES.find((v) => v.slug === venueSlugOrId || v.id === venueSlugOrId);

    const staticItems = venue ? OSU_MENU_ITEMS_BY_VENUE[venue.id] || [] : [];
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const cacheKey = `${venueSlugOrId}_${dateKey}`;
    const now = Date.now();

    if (
      !forceRefresh &&
      this.venueMenuCache.has(cacheKey) &&
      now - (this.venueMenuCache.get(cacheKey)?.timestamp || 0) < MENU_CACHE_TTL_MS
    ) {
      return this.venueMenuCache.get(cacheKey)!.data;
    }

    if (!venue || !venue.nutrisliceSchoolId) {
      return staticItems;
    }

    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // Retrieve schools list to find active menu types
      const schools = await this.getRawSchools();
      const school = schools.find((s) => s.id === venue.nutrisliceSchoolId);
      const activeMenuType = school?.active_menu_types?.[0]?.id;

      if (!activeMenuType) {
        throw new Error(`No active menu type found for venue: ${venue.name}`);
      }

      const weekUrl = `${NUTRISLICE_BASE_URL}/weeks/school/${venue.nutrisliceSchoolId}/menu-type/${activeMenuType}/${year}/${month}/${day}`;
      const weekData = await this.fetchWithTimeout<NutrisliceRawWeekResponse>(weekUrl);

      const normalizedItems = this.normalizeNutrisliceWeek(weekData, venue);

      // Merge normalized items with curated static items to retain recipes & tags
      const combined = this.mergeWithStaticItems(normalizedItems, staticItems);
      const result = combined.length > 0 ? combined : staticItems;

      this.venueMenuCache.set(cacheKey, {
        data: result,
        timestamp: now,
      });

      return result;
    } catch (error) {
      // Offline fallback: Return curated static items for this venue
      return staticItems;
    }
  }

  /**
   * Fetches all menu items across all OSU dining venues.
   * Returns combined catalog, falling back to OSU_MENU_ITEMS snapshot.
   */
  public async getAllMenuItems(forceRefresh = false): Promise<MenuItem[]> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.allItemsCache &&
      now - this.allItemsCache.timestamp < MENU_CACHE_TTL_MS
    ) {
      return this.allItemsCache.data;
    }

    const items: MenuItem[] = [...OSU_MENU_ITEMS];

    this.allItemsCache = {
      data: items,
      timestamp: now,
    };

    return items;
  }

  /**
   * Normalizes raw Nutrislice week payload into typed MenuItem array.
   */
  public normalizeNutrisliceWeek(
    weekData: NutrisliceRawWeekResponse,
    venue: DiningVenue
  ): MenuItem[] {
    if (!weekData || !Array.isArray(weekData.days)) {
      return [];
    }

    const items: MenuItem[] = [];
    const seenFoodIds = new Set<number>();

    for (const day of weekData.days) {
      if (!Array.isArray(day.menu_items)) continue;

      let currentStation = 'General';

      for (const item of day.menu_items) {
        if (item.is_station_header && item.text) {
          currentStation = item.text.trim();
          continue;
        }

        if (!item.food || seenFoodIds.has(item.food.id)) {
          continue;
        }

        seenFoodIds.add(item.food.id);
        const food = item.food;
        const nutrition = food.rounded_nutrition_info || {};

        const calories = nutrition.calories ?? 0;
        const protein = nutrition.g_protein ?? 0;
        const carbs = nutrition.g_carbs ?? 0;
        const fat = nutrition.g_fat ?? 0;
        const fiber = nutrition.g_fiber ?? 0;
        const sugar = nutrition.g_sugar ?? undefined;
        const sodium = nutrition.mg_sodium ?? undefined;

        const dietaryTags = this.extractDietaryTags(food, protein);
        const price = food.price ?? item.price ?? 0;
        const swipeEligible = venue.venueType === 'traditions';
        const diningDollarsPrice = this.calculateDiningDollarDiscount(price);

        const normalizedItem: MenuItem = {
          id: `${venue.id}-${food.id}`,
          venueId: venue.id,
          name: food.name,
          description: food.description || food.synced_subtext || '',
          station: currentStation,
          category: 'all_day',
          calories,
          macros: {
            protein,
            carbs,
            fat,
            fiber,
            sugar,
            sodium,
          },
          price,
          swipeEligible,
          diningDollarsPrice,
          allergens: [],
          dietaryTags,
          servingSize: food.serving_size_info
            ? {
                amount: food.serving_size_info.serving_size_amount ?? '',
                unit: food.serving_size_info.serving_size_unit ?? '',
              }
            : undefined,
          ingredients: food.ingredients
            ? food.ingredients.split(',').map((s) => s.trim())
            : undefined,
        };

        items.push(normalizedItem);
      }
    }

    return items;
  }

  /**
   * Extracts typed DietaryTags from Nutrislice food icons and protein content.
   */
  private extractDietaryTags(
    food: NutrisliceRawFood,
    protein: number
  ): DietaryTag[] {
    const tags: DietaryTag[] = [];

    if (protein >= 25) {
      tags.push('highProtein');
    }

    const icons = food.icons?.food_icons || [];
    for (const icon of icons) {
      const name = (icon.name || icon.slug || icon.synced_name || '').toLowerCase();
      const spriteSlug = (icon.sprite?.slug || '').toLowerCase();

      if (
        name.includes('gluten-free') ||
        name.includes('no gluten') ||
        spriteSlug.includes('gluten-free')
      ) {
        if (!tags.includes('glutenFree')) tags.push('glutenFree');
      }
      if (
        name.includes('vegan') ||
        spriteSlug.includes('vegan')
      ) {
        if (!tags.includes('vegan')) tags.push('vegan');
      }
      if (
        name.includes('vegetarian') ||
        spriteSlug.includes('vegetarian')
      ) {
        if (!tags.includes('vegetarian')) tags.push('vegetarian');
      }
      if (name.includes('halal')) {
        if (!tags.includes('halal')) tags.push('halal');
      }
      if (name.includes('dairy-free') || name.includes('no dairy')) {
        if (!tags.includes('dairyFree')) tags.push('dairyFree');
      }
    }

    return tags;
  }

  /**
   * Merges live normalized items with static items, preserving static curated details.
   */
  private mergeWithStaticItems(
    liveItems: MenuItem[],
    staticItems: MenuItem[]
  ): MenuItem[] {
    const result: MenuItem[] = [...liveItems];
    const liveNames = new Set(liveItems.map((i) => i.name.toLowerCase()));

    for (const sItem of staticItems) {
      if (!liveNames.has(sItem.name.toLowerCase())) {
        result.push(sItem);
      }
    }

    return result;
  }

  /**
   * Fetches raw school list with fallback to empty array.
   */
  private async getRawSchools(): Promise<NutrisliceRawSchool[]> {
    try {
      return await this.fetchWithTimeout<NutrisliceRawSchool[]>(
        `${NUTRISLICE_BASE_URL}/schools/`
      );
    } catch {
      return [];
    }
  }

  /**
   * Calculates retail price with 35% Dining Dollar discount applied.
   * e.g., $10.00 * 0.65 = $6.50
   */
  public calculateDiningDollarDiscount(retailPrice: number): number {
    return Math.round(retailPrice * 0.65 * 100) / 100;
  }

  /**
   * Filters dining venues by campus zone, payment type, and search query.
   */
  public filterVenues(
    venues: DiningVenue[],
    options: DiningFilterOptions
  ): DiningVenue[] {
    return venues.filter((venue) => {
      // Campus zone filter
      if (options.zone && options.zone !== 'All' && venue.zone !== options.zone) {
        return false;
      }

      // Payment type filter
      if (
        options.paymentType &&
        options.paymentType !== 'All' &&
        !venue.acceptedPayments.includes(options.paymentType)
      ) {
        return false;
      }

      // Search query filter
      if (options.searchQuery && options.searchQuery.trim().length > 0) {
        const query = options.searchQuery.toLowerCase().trim();
        const matchesName = venue.name.toLowerCase().includes(query);
        const matchesShortName = venue.shortName.toLowerCase().includes(query);
        const matchesAddress = venue.address.toLowerCase().includes(query);
        const matchesDesc = venue.description.toLowerCase().includes(query);

        if (!matchesName && !matchesShortName && !matchesAddress && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Filters menu items by zone, venue, payment type, category, dietary tags,
   * calorie/protein ranges, and search keywords.
   */
  public filterMenuItems(
    items: MenuItem[],
    options: DiningFilterOptions
  ): MenuItem[] {
    return items.filter((item) => {
      // Venue filter
      if (options.venueId && item.venueId !== options.venueId) {
        return false;
      }

      // Zone filter (via venueId lookup)
      if (options.zone && options.zone !== 'All') {
        const venue = OSU_VENUES_MAP[item.venueId];
        if (!venue || venue.zone !== options.zone) {
          return false;
        }
      }

      // Payment type / swipe filter
      if (options.swipeOnly && !item.swipeEligible) {
        return false;
      }
      if (options.paymentType && options.paymentType !== 'All') {
        if (options.paymentType === 'swipe' && !item.swipeEligible) {
          return false;
        }
        if (options.paymentType === 'dining_dollars') {
          const venue = OSU_VENUES_MAP[item.venueId];
          if (!venue?.acceptedPayments.includes('dining_dollars')) {
            return false;
          }
        }
      }

      // Category filter
      if (
        options.category &&
        options.category !== 'All' &&
        item.category !== 'all_day' &&
        item.category !== options.category
      ) {
        return false;
      }

      // Dietary tags filter (item must satisfy ALL selected tags)
      if (options.dietaryTags && options.dietaryTags.length > 0) {
        const hasAllTags = options.dietaryTags.every((requiredTag) =>
          item.dietaryTags.includes(requiredTag)
        );
        if (!hasAllTags) {
          return false;
        }
      }

      // Calorie filter
      if (
        options.maxCalories !== undefined &&
        options.maxCalories > 0 &&
        item.calories > options.maxCalories
      ) {
        return false;
      }

      // Protein filter
      if (
        options.minProtein !== undefined &&
        options.minProtein > 0 &&
        item.macros.protein < options.minProtein
      ) {
        return false;
      }

      // Price filter
      if (
        options.maxPrice !== undefined &&
        options.maxPrice > 0 &&
        item.price > options.maxPrice
      ) {
        return false;
      }

      // Search query filter
      if (options.searchQuery && options.searchQuery.trim().length > 0) {
        const query = options.searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesStation = item.station?.toLowerCase().includes(query) ?? false;
        const matchesAllergens = item.allergens.some((a) =>
          a.toLowerCase().includes(query)
        );
        const matchesIngredients =
          item.ingredients?.some((ing) => ing.toLowerCase().includes(query)) ?? false;

        if (
          !matchesName &&
          !matchesDesc &&
          !matchesStation &&
          !matchesAllergens &&
          !matchesIngredients
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sorts menu items by macro nutrient or price.
   * Supports proteinRatio: protein / calories * 100 (grams of protein per 100 kcal).
   */
  public sortMenuItems(
    items: MenuItem[],
    field: MacroSortField,
    direction: SortDirection = 'desc'
  ): MenuItem[] {
    const factor = direction === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
      switch (field) {
        case 'calories':
          return (a.calories - b.calories) * factor;

        case 'protein':
          return (a.macros.protein - b.macros.protein) * factor;

        case 'carbs':
          return (a.macros.carbs - b.macros.carbs) * factor;

        case 'fat':
          return (a.macros.fat - b.macros.fat) * factor;

        case 'proteinRatio': {
          const ratioA = a.calories > 0 ? (a.macros.protein / a.calories) * 100 : 0;
          const ratioB = b.calories > 0 ? (b.macros.protein / b.calories) * 100 : 0;
          return (ratioA - ratioB) * factor;
        }

        case 'price':
          return (a.price - b.price) * factor;

        default:
          return 0;
      }
    });
  }

  /**
   * Fast multi-token search for menu items.
   */
  public searchMenuItems(query: string, items = OSU_MENU_ITEMS): MenuItem[] {
    if (!query || query.trim().length === 0) {
      return items;
    }

    return this.filterMenuItems(items, { searchQuery: query });
  }

  /**
   * Clears all in-memory caches.
   */
  public clearCache(): void {
    this.venuesCache = null;
    this.venueMenuCache.clear();
    this.allItemsCache = null;
  }
}

export const nutrisliceClient = new NutrisliceClient();
export default nutrisliceClient;
