/**
 * BuckeyeGrub Domain Models – Dining, Menus, Nutrition & Nutrislice
 * Strict types for OSU campus dining infrastructure.
 */

import { DietaryTag } from '../constants/theme';

export type CampusZone = 'North' | 'South' | 'West';

export type PaymentType = 'swipe' | 'dining_dollars' | 'buckid_cash';

export type VenueType = 'traditions' | 'retail' | 'cafe' | 'grab_and_go';

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'all_day';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface OperatingHoursDay {
  open: string;
  close: string;
  isClosed?: boolean;
}

export type OperatingHours = Partial<Record<DayOfWeek, OperatingHoursDay>>;

export interface MacroNutrients {
  calories?: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  fiber: number;   // grams
  sugar?: number;  // grams
  sodium?: number; // milligrams
}

export interface ServingSize {
  amount: number | string;
  unit: string;
}

export interface DiningVenue {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  nutrisliceSchoolId?: number;
  zone: CampusZone;
  address: string;
  description: string;
  venueType: VenueType;
  acceptedPayments: PaymentType[];
  hasMobileOrdering: boolean;
  grubhubSlug?: string;
  grubhubUrl?: string;
  coordinates: GeoLocation;
  operatingHours: OperatingHours;
  imageUrl?: string;
  bannerColor?: string;
}

export interface MenuItem {
  id: string;
  venueId: string;
  name: string;
  description: string;
  station?: string;
  category: MealCategory;
  calories: number;
  macros: MacroNutrients;
  price: number;
  swipeEligible: boolean;
  diningDollarsPrice: number;
  allergens: string[];
  dietaryTags: DietaryTag[];
  servingSize?: ServingSize;
  ingredients?: string[];
  imageUrl?: string;
  customizationRecipe?: string;
}

export interface DiningFilterOptions {
  zone?: CampusZone | 'All';
  paymentType?: PaymentType | 'All';
  dietaryTags?: DietaryTag[];
  searchQuery?: string;
  venueId?: string;
  category?: MealCategory | 'All';
  minProtein?: number;
  maxCalories?: number;
  maxPrice?: number;
  swipeOnly?: boolean;
}

export type MacroSortField =
  | 'calories'
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'proteinRatio'
  | 'price';

export type SortDirection = 'asc' | 'desc';

// Nutrislice REST API response typing
export interface NutrisliceRawFoodNutrition {
  calories?: number | null;
  g_fat?: number | null;
  g_saturated_fat?: number | null;
  g_trans_fat?: number | null;
  mg_cholesterol?: number | null;
  g_carbs?: number | null;
  g_added_sugar?: number | null;
  g_sugar?: number | null;
  mg_potassium?: number | null;
  mg_sodium?: number | null;
  g_fiber?: number | null;
  g_protein?: number | null;
  mg_iron?: number | null;
  mg_calcium?: number | null;
  mg_vitamin_c?: number | null;
}

export interface NutrisliceRawFoodIcon {
  id?: number;
  name?: string;
  slug?: string;
  synced_name?: string;
  sprite?: {
    slug?: string;
    name?: string;
  };
}

export interface NutrisliceRawFood {
  id: number;
  name: string;
  description?: string;
  price?: number | null;
  rounded_nutrition_info?: NutrisliceRawFoodNutrition | null;
  serving_size_info?: {
    serving_size_amount?: string | number | null;
    serving_size_unit?: string | null;
  } | null;
  icons?: {
    food_icons?: NutrisliceRawFoodIcon[];
  } | null;
  ingredients?: string;
  synced_ingredients?: string;
  subtext?: string;
  synced_subtext?: string;
}

export interface NutrisliceRawMenuItem {
  id: number;
  position?: number;
  is_section_title?: boolean;
  is_station_header?: boolean;
  text?: string;
  station_id?: number;
  price?: number | null;
  food?: NutrisliceRawFood | null;
}

export interface NutrisliceRawDay {
  date: string;
  menu_items?: NutrisliceRawMenuItem[];
}

export interface NutrisliceRawWeekResponse {
  start_date?: string;
  menu_type_id?: number;
  days?: NutrisliceRawDay[];
  last_updated?: string;
}

export interface NutrisliceRawSchoolMenuType {
  id: number;
  name: string;
  slug: string;
  urls?: {
    digest_menu_by_date_api_url_template?: string;
    digest_menu_by_week_api_url_template?: string;
    full_menu_by_date_api_url_template?: string;
  };
}

export interface NutrisliceRawSchool {
  id: number;
  name: string;
  slug: string;
  address?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  phone_number?: string;
  active_menu_types?: NutrisliceRawSchoolMenuType[];
}
