/**
 * BuckeyeGrub BrutusAI Chat Store
 * Manages conversational history with Brutus Buckeye, streaming/async replies,
 * quick prompt chips, and 1-Click "Plan My Day" generation.
 * Persisted locally via AsyncStorage.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { brutusAI } from '../services/ai/brutusAI';
import {
  ChatMessage,
  ChatStore,
  PlanGenerationOptions,
} from '../types/ai';
import { DailyMealPlan } from '../types/mealPlan';
import { appStorage, STORAGE_KEYS } from './storage';
import { useMealPlanStore } from './useMealPlanStore';
import { useUserStore } from './useUserStore';

export const INITIAL_BRUTUS_MESSAGE: ChatMessage = {
  id: 'brutus_welcome_1',
  role: 'assistant',
  content:
    "O-H! 🌰 I'm Brutus, your personal Buckeye nutrition coach! Whether you're fueling up for heavy squats at the RPAC, cramming for exams at Thompson Library, or stretching your Traditions Swipes, I'm here to build your winning game plan. Tap 'Plan My Day' or ask me anything!",
  timestamp: new Date().toISOString(),
  quickActions: [
    { label: 'Plan My Day', action: 'apply_plan' },
  ],
};

export const DEFAULT_QUICK_PROMPTS = [
  'Plan my post-RPAC meals',
  'High-protein lunch at Scott',
  'Late night healthy snack at Curl',
  'Budget day with Traditions Swipes',
];

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [INITIAL_BRUTUS_MESSAGE],
      isLoading: false,
      isGeneratingPlan: false,
      error: null,
      fallbackNotice: null,
      quickPrompts: DEFAULT_QUICK_PROMPTS,
      hasHydrated: false,

      sendMessage: async (content: string) => {
        const trimmed = content.trim();
        if (!trimmed) return;

        const userMsg: ChatMessage = {
          id: `msg_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          role: 'user',
          content: trimmed,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          messages: [...state.messages, userMsg],
          isLoading: true,
          error: null,
        }));

        try {
          const profile = useUserStore.getState().profile;
          const currentHistory = get().messages;
          const reply = await brutusAI.chatWithBrutus(trimmed, currentHistory, profile);
          const meta = brutusAI.lastExecutionMetadata;

          const assistantMsg: ChatMessage = {
            id: `msg_asst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            role: 'assistant',
            content: reply,
            timestamp: new Date().toISOString(),
            source: meta.source,
          };

          set((state) => ({
            messages: [...state.messages, assistantMsg],
            isLoading: false,
            fallbackNotice: meta.fallbackReason ?? null,
          }));
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Failed to reach Brutus';
          set({
            isLoading: false,
            error: errMsg,
          });
        }
      },

      sendMessageStreaming: async (
        content: string,
        onToken?: (token: string) => void
      ) => {
        const trimmed = content.trim();
        if (!trimmed) return;

        const userMsg: ChatMessage = {
          id: `msg_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          role: 'user',
          content: trimmed,
          timestamp: new Date().toISOString(),
        };

        const asstId = `msg_asst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const assistantPlaceholder: ChatMessage = {
          id: asstId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          messages: [...state.messages, userMsg, assistantPlaceholder],
          isLoading: true,
          error: null,
        }));

        try {
          const profile = useUserStore.getState().profile;
          const currentHistory = get().messages.filter((m) => m.id !== asstId);

          let accumulated = '';
          const result = await brutusAI.streamChatWithBrutus(
            trimmed,
            currentHistory,
            profile,
            (token: string) => {
              accumulated += token;
              if (onToken) onToken(token);
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === asstId ? { ...m, content: accumulated } : m
                ),
              }));
            }
          );

          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === asstId
                ? { ...m, content: result.reply, source: result.source }
                : m
            ),
            isLoading: false,
            fallbackNotice: result.fallbackReason ?? null,
          }));
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Failed to reach Brutus';
          set({
            isLoading: false,
            error: errMsg,
          });
        }
      },

      generateDayPlan: async (options?: PlanGenerationOptions): Promise<DailyMealPlan> => {
        set({ isGeneratingPlan: true, error: null });

        try {
          const profile = useUserStore.getState().profile;
          const plan = await brutusAI.generateDailyMealPlan(profile, options);

          // Update active plan in useMealPlanStore
          useMealPlanStore.getState().setActivePlan(plan);

          // Notify student via coach message in chat
          const assistantPlanMsg: ChatMessage = {
            id: `msg_asst_plan_${Date.now()}`,
            role: 'assistant',
            content: `O-H! 🌰 I just drew up a custom game plan for you: "${plan.title}"! Totaling ${plan.totalCalories} kcal and ${plan.totalMacros.protein}g protein across 4 campus meals. I've loaded it directly into your daily meal planner!`,
            timestamp: new Date().toISOString(),
            suggestedPlan: plan,
            source: plan.source,
            quickActions: [
              { label: 'View Today\'s Plan', action: 'apply_plan' },
            ],
          };

          set((state) => ({
            messages: [...state.messages, assistantPlanMsg],
            isGeneratingPlan: false,
            fallbackNotice: plan.fallbackReason ?? null,
          }));

          return plan;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Failed to generate meal plan';
          set({
            isGeneratingPlan: false,
            error: errMsg,
          });
          throw err;
        }
      },

      clearChat: () => {
        set({
          messages: [],
          error: null,
          fallbackNotice: null,
        });
      },

      clearFallbackNotice: () => {
        set({ fallbackNotice: null });
      },

      resetToDemoChat: () => {
        set({
          messages: [{ ...INITIAL_BRUTUS_MESSAGE, timestamp: new Date().toISOString() }],
          isLoading: false,
          isGeneratingPlan: false,
          error: null,
          fallbackNotice: null,
          quickPrompts: DEFAULT_QUICK_PROMPTS,
        });
      },

      setHasHydrated: (hydrated: boolean) => {
        set({ hasHydrated: hydrated });
      },
    }),
    {
      name: STORAGE_KEYS.CHAT,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        messages: state.messages,
        quickPrompts: state.quickPrompts,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
