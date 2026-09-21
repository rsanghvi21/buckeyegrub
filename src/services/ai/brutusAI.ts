/**
 * BuckeyeGrub BrutusAI Client
 * Integrates Google Gemini API and OpenAI API (with provider toggle) alongside
 * seamless, zero-crash fallback to the deterministic offline heuristic planner.
 * Embodying the Brutus Buckeye persona for 1-Click meal plan generation and chat.
 */

import { OSU_MENU_ITEMS, OSU_MENU_ITEMS_MAP } from '../../data';
import {
  calculatePlannedItemsTotals,
  DailyMealPlan,
  DEFAULT_MEAL_SLOT_RATIOS,
  MealSlot,
  MealSlotType,
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
import { heuristicPlanner } from './heuristicPlanner';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-1.5-flash';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';
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

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
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

export interface AIExecutionResult {
  source: 'gemini' | 'openai' | 'heuristic' | 'local';
  fallbackReason?: string;
}

export class BrutusAIClient {
  public lastExecutionMetadata: AIExecutionResult = { source: 'local' };

  /**
   * Generates a balanced 4-meal daily plan.
   * Attempts preferred LLM provider (Gemini or OpenAI) first if key is configured,
   * falling back gracefully to the offline heuristic planner on failure, timeout,
   * or if validation fails the strict ±5% constraint.
   */
  public async generateDailyMealPlan(
    profile: UserProfile,
    options?: PlanGenerationOptions
  ): Promise<DailyMealPlan> {
    const preferredProvider = profile.preferences?.aiProvider || 'gemini';
    const geminiKey = profile.geminiApiKey?.trim();
    const openAiKey = profile.openaiApiKey?.trim();

    // 1. Attempt OpenAI if preferred or if it's the only configured key
    if (preferredProvider === 'openai' && openAiKey) {
      try {
        const plan = await this.callOpenAIMealPlanner(openAiKey, profile, options);
        if (plan) {
          this.lastExecutionMetadata = { source: 'openai' };
          return plan;
        }
      } catch (error) {
        console.warn('BrutusAI: OpenAI meal plan failed. Attempting fallback.', error);
      }
    }

    // 2. Attempt Gemini if configured
    if (geminiKey) {
      try {
        const plan = await this.callGeminiMealPlanner(geminiKey, profile, options);
        if (plan) {
          this.lastExecutionMetadata = { source: 'gemini' };
          return plan;
        }
      } catch (error) {
        console.warn('BrutusAI: Gemini meal plan failed. Attempting fallback.', error);
      }
    }

    // 3. Fallback to OpenAI if Gemini was preferred but failed/missing and OpenAI key is available
    if (preferredProvider === 'gemini' && openAiKey) {
      try {
        const plan = await this.callOpenAIMealPlanner(openAiKey, profile, options);
        if (plan) {
          this.lastExecutionMetadata = { source: 'openai' };
          return plan;
        }
      } catch (error) {
        console.warn('BrutusAI: Secondary OpenAI meal plan attempt failed.', error);
      }
    }

    // 4. Offline heuristic constraint planner fallback
    const fallbackReason =
      geminiKey || openAiKey
        ? 'AI service unreachable or meal plan exceeded ±5% tolerance; generated with deterministic Buckeye planner'
        : undefined;

    this.lastExecutionMetadata = {
      source: 'heuristic',
      fallbackReason,
    };

    const heuristicPlan = heuristicPlanner.generateDailyPlan(profile, options);
    return {
      ...heuristicPlan,
      source: 'heuristic',
      fallbackReason,
    };
  }

  /**
   * Conversational chat with Brutus Buckeye.
   */
  public async chatWithBrutus(
    message: string,
    history: ChatMessage[],
    profile: UserProfile
  ): Promise<string> {
    const preferredProvider = profile.preferences?.aiProvider || 'gemini';
    const geminiKey = profile.geminiApiKey?.trim();
    const openAiKey = profile.openaiApiKey?.trim();

    // 1. Attempt OpenAI if selected
    if (preferredProvider === 'openai' && openAiKey) {
      try {
        const reply = await this.callOpenAIChat(openAiKey, message, history);
        if (reply && reply.trim().length > 0) {
          this.lastExecutionMetadata = { source: 'openai' };
          return reply.trim();
        }
      } catch (error) {
        console.warn('BrutusAI: OpenAI chat failed. Falling back.', error);
      }
    }

    // 2. Attempt Gemini
    if (geminiKey) {
      try {
        const reply = await this.callGeminiChat(geminiKey, message, history);
        if (reply && reply.trim().length > 0) {
          this.lastExecutionMetadata = { source: 'gemini' };
          return reply.trim();
        }
      } catch (error) {
        console.warn('BrutusAI: Gemini chat failed. Falling back.', error);
      }
    }

    // 3. Secondary OpenAI attempt
    if (preferredProvider === 'gemini' && openAiKey) {
      try {
        const reply = await this.callOpenAIChat(openAiKey, message, history);
        if (reply && reply.trim().length > 0) {
          this.lastExecutionMetadata = { source: 'openai' };
          return reply.trim();
        }
      } catch (error) {
        console.warn('BrutusAI: Secondary OpenAI chat failed.', error);
      }
    }

    // 4. Offline local conversational engine
    const fallbackReason =
      geminiKey || openAiKey
        ? 'API key error or offline: generated offline campus coach response'
        : undefined;

    this.lastExecutionMetadata = {
      source: 'local',
      fallbackReason,
    };

    return generateLocalConversationalReply(message, profile);
  }

  /**
   * Handles streaming chat interaction with token callbacks.
   */
  public async streamChatWithBrutus(
    message: string,
    history: ChatMessage[],
    profile: UserProfile,
    onToken?: (token: string) => void
  ): Promise<{ reply: string; source: 'gemini' | 'openai' | 'local'; fallbackReason?: string }> {
    const preferredProvider = profile.preferences?.aiProvider || 'gemini';
    const geminiKey = profile.geminiApiKey?.trim();
    const openAiKey = profile.openaiApiKey?.trim();

    // 1. Attempt OpenAI Streaming
    if (preferredProvider === 'openai' && openAiKey) {
      try {
        const reply = await this.callOpenAIStreamingChat(openAiKey, message, history, onToken);
        if (reply && reply.trim().length > 0) {
          this.lastExecutionMetadata = { source: 'openai' };
          return { reply: reply.trim(), source: 'openai' };
        }
      } catch (error) {
        console.warn('BrutusAI: OpenAI streaming failed.', error);
      }
    }

    // 2. Attempt Gemini Streaming
    if (geminiKey) {
      try {
        const reply = await this.callGeminiStreamingChat(geminiKey, message, history, onToken);
        if (reply && reply.trim().length > 0) {
          this.lastExecutionMetadata = { source: 'gemini' };
          return { reply: reply.trim(), source: 'gemini' };
        }
      } catch (error) {
        console.warn('BrutusAI: Gemini streaming failed.', error);
      }
    }

    // 3. Fallback to Local Engine with simulated token streaming
    const fallbackReason =
      geminiKey || openAiKey
        ? 'API error or offline: streamed offline campus coach response'
        : undefined;

    this.lastExecutionMetadata = { source: 'local', fallbackReason };
    const localReply = generateLocalConversationalReply(message, profile);

    if (onToken) {
      const words = localReply.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = i === 0 ? words[i] : ' ' + words[i];
        onToken(chunk);
      }
    }

    return { reply: localReply, source: 'local', fallbackReason };
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
    }).slice(0, 35);

    const userPrompt = buildMealPlanUserPrompt(profile, options, candidateItems);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const endpoint = `${GEMINI_API_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: MEAL_PLAN_JSON_SYSTEM_PROMPT }] },
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
      if (!rawText) throw new Error('Gemini API returned empty text');

      return this.parseAndValidateMealPlanJson(rawText, profile, options, 'gemini');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Invokes OpenAI Chat Completions API to produce a structured JSON meal plan.
   */
  private async callOpenAIMealPlanner(
    apiKey: string,
    profile: UserProfile,
    options?: PlanGenerationOptions
  ): Promise<DailyMealPlan | null> {
    const dietaryRestrictions = options?.dietaryRestrictions ?? profile.dietaryRestrictions ?? [];
    const candidateItems = OSU_MENU_ITEMS.filter((item) => {
      if (dietaryRestrictions.length === 0) return true;
      return dietaryRestrictions.every((tag) => item.dietaryTags.includes(tag));
    }).slice(0, 35);

    const userPrompt = buildMealPlanUserPrompt(profile, options, candidateItems);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const payload = {
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: MEAL_PLAN_JSON_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      };

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned HTTP status ${response.status}`);
      }

      const data = (await response.json()) as OpenAIResponse;
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) throw new Error('OpenAI API returned empty text');

      return this.parseAndValidateMealPlanJson(rawText, profile, options, 'openai');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Standard Gemini conversational turn.
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

      for (const turn of history.slice(-6)) {
        formattedContents.push({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.content }],
        });
      }

      formattedContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const payload = {
        contents: formattedContents,
        systemInstruction: { parts: [{ text: BRUTUS_PERSONA_SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
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
   * Standard OpenAI conversational turn.
   */
  private async callOpenAIChat(
    apiKey: string,
    message: string,
    history: ChatMessage[]
  ): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const messages: Array<{ role: string; content: string }> = [
        { role: 'system', content: BRUTUS_PERSONA_SYSTEM_PROMPT },
      ];

      for (const turn of history.slice(-6)) {
        messages.push({
          role: turn.role === 'assistant' ? 'assistant' : 'user',
          content: turn.content,
        });
      }

      messages.push({ role: 'user', content: message });

      const payload = {
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      };

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI chat returned HTTP status ${response.status}`);
      }

      const data = (await response.json()) as OpenAIResponse;
      return data.choices?.[0]?.message?.content ?? null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Gemini streaming chat implementation.
   */
  private async callGeminiStreamingChat(
    apiKey: string,
    message: string,
    history: ChatMessage[],
    onToken?: (token: string) => void
  ): Promise<string | null> {
    // Fall back gracefully to batch call with incremental dispatch if SSE stream unsupported
    const fullText = await this.callGeminiChat(apiKey, message, history);
    if (fullText && onToken) {
      const words = fullText.split(' ');
      for (let i = 0; i < words.length; i++) {
        onToken(i === 0 ? words[i] : ' ' + words[i]);
      }
    }
    return fullText;
  }

  /**
   * OpenAI streaming chat implementation.
   */
  private async callOpenAIStreamingChat(
    apiKey: string,
    message: string,
    history: ChatMessage[],
    onToken?: (token: string) => void
  ): Promise<string | null> {
    const fullText = await this.callOpenAIChat(apiKey, message, history);
    if (fullText && onToken) {
      const words = fullText.split(' ');
      for (let i = 0; i < words.length; i++) {
        onToken(i === 0 ? words[i] : ' ' + words[i]);
      }
    }
    return fullText;
  }

  /**
   * Parses and validates raw LLM JSON against genuine OSU menu item IDs.
   * Strictly enforces ±5% calorie adherence for Gate 5 compliance.
   */
  private parseAndValidateMealPlanJson(
    rawJson: string,
    profile: UserProfile,
    options?: PlanGenerationOptions,
    source: 'gemini' | 'openai' = 'gemini'
  ): DailyMealPlan | null {
    try {
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
        slotKey: MealSlotType,
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

      const aggregated = calculatePlannedItemsTotals(allItems);

      // Strictly validate that total calories fall within ±5% tolerance (Gate 5 Requirement)
      const calorieErrorPct = Math.abs(aggregated.calories - targetCalories) / targetCalories * 100;
      if (calorieErrorPct > 5.0) {
        return null;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timestamp = now.toISOString();

      const meals: Record<MealSlotType, MealSlot> = {
        breakfast: {
          slot: 'breakfast',
          label: 'Breakfast',
          targetCalories: Math.round(targetCalories * DEFAULT_MEAL_SLOT_RATIOS.breakfast),
          items: breakfastItems,
          isLogged: false,
        },
        lunch: {
          slot: 'lunch',
          label: 'Lunch',
          targetCalories: Math.round(targetCalories * DEFAULT_MEAL_SLOT_RATIOS.lunch),
          items: lunchItems,
          isLogged: false,
        },
        dinner: {
          slot: 'dinner',
          label: 'Dinner',
          targetCalories: Math.round(targetCalories * DEFAULT_MEAL_SLOT_RATIOS.dinner),
          items: dinnerItems,
          isLogged: false,
        },
        snack: {
          slot: 'snack',
          label: 'Snack',
          targetCalories: Math.round(targetCalories * DEFAULT_MEAL_SLOT_RATIOS.snack),
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
        source,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    } catch {
      return null;
    }
  }
}

export const brutusAI = new BrutusAIClient();
