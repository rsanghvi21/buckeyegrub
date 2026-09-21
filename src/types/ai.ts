/**
 * BuckeyeGrub Domain Models – AI, Prompts, Planner Options & Chat Store
 * Strict TypeScript types for BrutusAI conversational intelligence, prompt options,
 * and conversational history state.
 */

import { CampusZone, DietaryTag } from './dining';
import { DailyMealPlan } from './mealPlan';
import { MacroTargets, UserProfile } from './user';

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatQuickAction {
  label: string;
  action: 'apply_plan' | 'view_menu' | 'open_grubhub';
  payload?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string; // ISO 8601
  suggestedPlan?: DailyMealPlan;
  quickActions?: ChatQuickAction[];
  source?: 'gemini' | 'openai' | 'heuristic' | 'local';
}

export type GoalPreset =
  | 'post_rpac'
  | 'cut_lean'
  | 'budget_day'
  | 'bulk_power'
  | 'custom';

export interface PlanGenerationOptions {
  prompt?: string;
  goalPreset?: GoalPreset;
  zone?: CampusZone | 'All';
  dietaryRestrictions?: DietaryTag[];
  targetCalories?: number;
  targetMacros?: Partial<MacroTargets>;
  maxSwipeCount?: number;
  preferredVenueIds?: string[];
  excludedItemIds?: string[];
}

export interface ChatStoreState {
  messages: ChatMessage[];
  isLoading: boolean;
  isGeneratingPlan: boolean;
  error: string | null;
  fallbackNotice: string | null;
  quickPrompts: string[];
  hasHydrated: boolean;
}

export interface ChatStoreActions {
  sendMessage: (content: string) => Promise<void>;
  sendMessageStreaming: (content: string, onToken?: (token: string) => void) => Promise<void>;
  generateDayPlan: (options?: PlanGenerationOptions) => Promise<DailyMealPlan>;
  clearChat: () => void;
  resetToDemoChat: () => void;
  clearFallbackNotice: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export type ChatStore = ChatStoreState & ChatStoreActions;
