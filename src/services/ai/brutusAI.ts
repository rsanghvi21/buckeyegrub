/**
 * BuckeyeGrub BrutusAI Client
 * Integrates Google Gemini API with seamless, zero-crash fallback to the
 * deterministic offline heuristic planner.
 * Embodying the Brutus Buckeye persona for 1-Click meal plan generation and chat.
 */

import { OSU_MENU_ITEMS, OSU_MENU_ITEMS_MAP } from '../../data';
import {
  DailyMealPlan,
  MealSlot,
  PlannedMealItem,
} from '../../types/mealPlan';
import {
  ChatMessage,
  PlanGenerationOptions,
} from '../../types/ai';
import { UserProfile } from '../../types/user';
import {
  BRUTUS_PERSONA_SYSTEM_PROMPT,
  buildMealPlanUserPrompt,
  generateLocalConversationalReply,
  MEAL_PLAN_JSON_SYSTEM_PROMPT,
} from './prompts';
import {
  aggregatePlannedItemsTotals,
  heuristicPlanner,
} from './heuristicPlanner';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-1.5-flash';
const REQUEST_TIMEOUT_MS = 10000;

interface GeminiContentPart {
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

interface GeminiResponseCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiResponseCandidate[];
  error?: {
    code: number;
    message: string;
  };
}

interface ParsedMealPlanJson {
  title?: string;
  rationale?: string;
  meals?: {
    breakfast?: { itemIds?: string[] };
    lunch?: { itemIds?: string[] };
    dinner?: { itemIds?: string[] };
    snack?: { itemIds?: string[] };
  };
}

export class BrutusAIClient {
  /**
   * Generates a balanced 4-meal daily plan.
   * Attempts Google Gemini API first if apiKey is provided, falling back seamlessly
   * to the offline heuristic planner on network errors, timeouts, or validation issues.
   */
  public async generateDailyMealPlan(
    profile: UserProfile,
    options?: PlanGenerationOptions
  ): Promise<DailyMealPlan> {
    const apiKey = profile.geminiApiKey?.trim();

    if (apiKey && apiKey.length > 0) {
      try {
        const plan = await this.callGeminiMealPlanner(apiKey, profile, options);
        if (plan) {
          return plan;
        }
      } catch (error) {
        console.warn(
          'BrutusAI: Gemini meal plan generation failed or timed out. Falling back to offline heuristic planner.',
          error
        );
      }
    }

    // Offline / unauthenticated / error fallback
    return heuristicPlanner.generateDailyPlan(profile, options);
  }

  /**
   * Conversational chat with Brutus Buckeye.
   * Connects to Gemini API if apiKey exists, otherwise provides intelligent
   * campus-grounded heuristic responses offline.
   */
  public async chatWithBrutus(
    message: string,
    history: ChatMessage[],
    profile: UserProfile
  ): Promise<string> {
    const apiKey = profile.geminiApiKey?.trim();

    if (apiKey && apiKey.length > 0) {
      try {
        const reply = await this.callGeminiChat(apiKey, message, history);
        if (reply && reply.trim().length > 0) {
          return reply.trim();
        }
      } catch (error) {
        console.warn(
          'BrutusAI: Gemini chat failed or timed out. Falling back to local responses.',
          error
        );
      }
    }

    // Offline local conversational engine
    return generateLocalConversationalReply(message, profile);
  }

  /**
   * Invokes Google Gemini REST API to produce a structured JSON meal plan.
   */
  private async callGeminiMealPlanner(
    apiKey: string,
    profile: UserProfile,
    options?: PlanGenerationOptions
  ): Promise<DailyMealPlan | null> {
    const dietaryRestrictions = options?.dietaryRestrictions ?? profile.dietaryRestrictions ?? [];
    const candidateItems = OSU_MENU_ITEMS.filter((item) => {
      if (dietaryRestrictions.length === 0) return true;
      return dietaryRestrictions.every((tag) => item.dietaryTags.includes(tag));
    }).slice(0, 35); // Send top relevant items to optimize prompt tokens

    const userPrompt = buildMealPlanUserPrompt(profile, options, candidateItems);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const endpoint = `${GEMINI_API_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        systemInstruction: {
          parts: [{ text: MEAL_PLAN_JSON_SYSTEM_PROMPT }],
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned HTTP status ${response.status}`);
      }

      const data = (await response.json()) as GeminiResponse;
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini API returned empty candidate text');
      }

      return this.parseAndValidateMealPlanJson(rawText, profile, options);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Invokes Google Gemini REST API for conversational turn with history.
   */
  private async callGeminiChat(
    apiKey: string,
    message: string,
    history: ChatMessage[]
  ): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const endpoint = `${GEMINI_API_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const formattedContents: GeminiContent[] = [];

      // Include up to 6 recent turns of history
      const recentHistory = history.slice(-6);
      for (const turn of recentHistory) {
        if (turn.role === 'user') {
          formattedContents.push({
            role: 'user',
            parts: [{ text: turn.content }],
          });
        } else if (turn.role === 'assistant') {
          formattedContents.push({
            role: 'model',
            parts: [{ text: turn.content }],
          });
        }
      }

      formattedContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const payload = {
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: BRUTUS_PERSONA_SYSTEM_PROMPT }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Gemini chat returned HTTP status ${response.status}`);
      }

      const data = (await response.json()) as GeminiResponse;
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parses and validates raw LLM JSON against genuine OSU menu item IDs.
   */
  private parseAndValidateMealPlanJson(
    rawJson: string,
    profile: UserProfile,
    options?: PlanGenerationOptions
  ): DailyMealPlan | null {
    try {
      // Clean possible markdown code fences
      const cleanJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson) as ParsedMealPlanJson;

      if (!parsed.meals) {
        return null;
      }

      const targetCalories = options?.targetCalories ?? profile.targetCalories;
      const targetProtein = options?.targetMacros?.protein ?? profile.targetMacros.protein;
      const targetCarbs = options?.targetMacros?.carbs ?? profile.targetMacros.carbs;
      const targetFat = options?.targetMacros?.fat ?? profile.targetMacros.fat;

      const buildSlotItems = (
        slotKey: 'breakfast' | 'lunch' | 'dinner' | 'snack',
        itemIds?: string[]
      ): PlannedMealItem[] => {
        const items: PlannedMealItem[] = [];
        if (Array.isArray(itemIds)) {
          for (let i = 0; i < itemIds.length; i++) {
            const id = itemIds[i];
            const menuItem = OSU_MENU_ITEMS_MAP[id];
            if (menuItem) {
              items.push({
                id: `planned_${slotKey}_${i + 1}_${menuItem.id}`,
                menuItem,
                servingMultiplier: 1.0,
                isLogged: false,
              });
            }
          }
        }
        return items;
      };

      const breakfastItems = buildSlotItems('breakfast', parsed.meals.breakfast?.itemIds);
      const lunchItems = buildSlotItems('lunch', parsed.meals.lunch?.itemIds);
      const dinnerItems = buildSlotItems('dinner', parsed.meals.dinner?.itemIds);
      const snackItems = buildSlotItems('snack', parsed.meals.snack?.itemIds);

      // Require every slot to contain at least 1 valid item
      if (
        breakfastItems.length === 0 ||
        lunchItems.length === 0 ||
        dinnerItems.length === 0 ||
        snackItems.length === 0
      ) {
        return null;
      }

      const allItems = [
        ...breakfastItems,
        ...lunchItems,
        ...dinnerItems,
        ...snackItems,
      ];

      const aggregated = aggregatePlannedItemsTotals(allItems);

      // Validate that total calories fall within ±10% tolerance from LLM
      const calorieErrorPct = Math.abs(aggregated.calories - targetCalories) / targetCalories * 100;
      if (calorieErrorPct > 10) {
        return null;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timestamp = now.toISOString();

      const meals: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', MealSlot> = {
        breakfast: {
          slot: 'breakfast',
          label: 'Breakfast',
          targetCalories: Math.round(targetCalories * 0.25),
          items: breakfastItems,
          isLogged: false,
        },
        lunch: {
          slot: 'lunch',
          label: 'Lunch',
          targetCalories: Math.round(targetCalories * 0.35),
          items: lunchItems,
          isLogged: false,
        },
        dinner: {
          slot: 'dinner',
          label: 'Dinner',
          targetCalories: Math.round(targetCalories * 0.30),
          items: dinnerItems,
          isLogged: false,
        },
        snack: {
          slot: 'snack',
          label: 'Snack',
          targetCalories: Math.round(targetCalories * 0.10),
          items: snackItems,
          isLogged: false,
        },
      };

      return {
        id: `plan_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: today,
        title: parsed.title || `${profile.name.split(' ')[0]}'s BrutusAI Plan`,
        meals,
        targetCalories,
        targetMacros: {
          protein: targetProtein,
          carbs: targetCarbs,
          fat: targetFat,
        },
        totalCalories: aggregated.calories,
        totalMacros: aggregated.macros,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    } catch {
      return null;
    }
  }
}

export const brutusAI = new BrutusAIClient();
