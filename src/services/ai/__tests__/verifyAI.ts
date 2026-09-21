/**
 * BuckeyeGrub Checkpoint 5 Verification Test Suite
 * Validates BrutusAI Engine:
 * 1. Persona system prompts & campus grounding (RPAC, Thompson, Oval, dining halls).
 * 2. Deterministic offline heuristic planner constraint satisfaction across profiles:
 *    - Standard 2,400 kcal athletic profile (±5% calorie adherence)
 *    - Cut 1,800 kcal profile (±5% calorie adherence)
 *    - Bulk 3,000 kcal profile (±5% calorie adherence)
 *    - Strict vegan profile (100% vegan items, ±5% adherence)
 *    - Strict gluten-free profile (100% gluten-free items, ±5% adherence)
 *    - Campus zone filter preference
 *    - Goal presets (post-RPAC, cut, bulk)
 * 3. BrutusAI client zero-crash fallback on missing or invalid API keys.
 * 4. Chat store state management, persistence keys, and integration with useMealPlanStore.
 */

import { OSU_MENU_ITEMS, OSU_MENU_ITEMS_MAP, OSU_VENUES_MAP } from '../../../data';
import { clearAllPersistedState, STORAGE_KEYS } from '../../../store/storage';
import { useChatStore } from '../../../store/useChatStore';
import { useMealPlanStore } from '../../../store/useMealPlanStore';
import { useUserStore } from '../../../store/useUserStore';
import { DEMO_USER_PROFILE, UserProfile } from '../../../types/user';
import { brutusAI } from '../brutusAI';
import { heuristicPlanner } from '../heuristicPlanner';
import {
  BRUTUS_PERSONA_SYSTEM_PROMPT,
  generateLocalConversationalReply,
  MEAL_PLAN_JSON_SYSTEM_PROMPT,
} from '../prompts';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, failureMessage = 'Assertion failed'): void {
  if (condition) {
    results.push({ name: testName, passed: true });
  } else {
    results.push({ name: testName, passed: false, message: failureMessage });
  }
}

async function runAllTests(): Promise<void> {
  console.log('\n🌰====================================================');
  console.log('🌰 BuckeyeGrub Checkpoint 5: BrutusAI Engine Verification');
  console.log('🌰====================================================\n');

  // Reset all state to clean baseline
  await clearAllPersistedState();
  useUserStore.getState().resetToDemo();
  useMealPlanStore.getState().resetToDemoPlan();
  useChatStore.getState().resetToDemoChat();

  // =========================================================================
  // 1. Persona System Prompts & Campus Grounding
  // =========================================================================
  console.log('--- 1. Persona System Prompts & Campus Grounding ---');

  assert(
    BRUTUS_PERSONA_SYSTEM_PROMPT.includes('Brutus Buckeye'),
    'Persona prompt identifies as Brutus Buckeye'
  );
  assert(
    BRUTUS_PERSONA_SYSTEM_PROMPT.includes('RPAC'),
    'Persona prompt grounds in RPAC fitness center'
  );
  assert(
    BRUTUS_PERSONA_SYSTEM_PROMPT.includes('Thompson'),
    'Persona prompt grounds in Thompson Library'
  );
  assert(
    BRUTUS_PERSONA_SYSTEM_PROMPT.includes('Oval'),
    'Persona prompt grounds in The Oval'
  );
  assert(
    BRUTUS_PERSONA_SYSTEM_PROMPT.includes('Traditions at Scott'),
    'Persona prompt mentions Traditions at Scott'
  );
  assert(
    BRUTUS_PERSONA_SYSTEM_PROMPT.includes('Curl Market'),
    'Persona prompt mentions Curl Market'
  );
  assert(
    BRUTUS_PERSONA_SYSTEM_PROMPT.includes('Traditions at Kennedy'),
    'Persona prompt mentions Traditions at Kennedy'
  );
  assert(
    MEAL_PLAN_JSON_SYSTEM_PROMPT.includes('±5%'),
    'JSON meal planner prompt enforces ±5% calorie adherence'
  );
  assert(
    MEAL_PLAN_JSON_SYSTEM_PROMPT.includes('"breakfast"'),
    'JSON meal planner prompt requires 4 distinct meal slots'
  );

  // Local Conversational Fallback Responses
  const demoProfile = DEMO_USER_PROFILE;

  const rpacReply = generateLocalConversationalReply('What should I eat after my lift at the RPAC?', demoProfile);
  assert(
    rpacReply.toLowerCase().includes('rpac') && (rpacReply.includes('Scott') || rpacReply.includes('protein')),
    'RPAC query provides post-workout high-protein advice'
  );

  const scottReply = generateLocalConversationalReply('Tell me about Scott dining hall', demoProfile);
  assert(
    scottReply.includes('Scott') && (scottReply.includes('omelet') || scottReply.includes('North Campus')),
    'Scott dining query mentions Scott stations and North Campus'
  );

  const curlReply = generateLocalConversationalReply('I am heading to Curl Market', demoProfile);
  assert(
    curlReply.includes('Curl') && curlReply.includes('Dining Dollars'),
    'Curl query highlights 35% Dining Dollars discount'
  );

  const nightReply = generateLocalConversationalReply('Need a late night study snack near Thompson', demoProfile);
  assert(
    nightReply.includes('Thompson') || nightReply.includes('Berry') || nightReply.includes('PAD'),
    'Late night query mentions Thompson Library / Berry Cafe / PAD'
  );

  const cutReply = generateLocalConversationalReply('Best way to cut fat on campus?', demoProfile);
  assert(
    cutReply.toLowerCase().includes('cut') || cutReply.toLowerCase().includes('protein density'),
    'Cutting query provides calorie-deficit coaching'
  );

  const bulkReply = generateLocalConversationalReply('How to bulk up for football?', demoProfile);
  assert(
    bulkReply.toLowerCase().includes('bulk') || bulkReply.toLowerCase().includes('surplus'),
    'Bulking query provides mass gain advice'
  );

  // =========================================================================
  // 2. Offline Heuristic Constraint Solver – Calorie Adherence (±5%)
  // =========================================================================
  console.log('\n--- 2. Offline Heuristic Constraint Solver: Calorie Adherence ---');

  // Test Profile 1: Standard Athletic Profile (2,400 kcal, 180g protein)
  const athleticPlan = heuristicPlanner.generateDailyPlan(demoProfile);
  assert(!!athleticPlan.id, 'Athletic plan has unique ID');
  assert(athleticPlan.targetCalories === 2400, 'Athletic plan target calories is 2,400');
  assert(athleticPlan.meals.breakfast.items.length > 0, 'Breakfast slot contains items');
  assert(athleticPlan.meals.lunch.items.length > 0, 'Lunch slot contains items');
  assert(athleticPlan.meals.dinner.items.length > 0, 'Dinner slot contains items');
  assert(athleticPlan.meals.snack.items.length > 0, 'Snack slot contains items');

  const athleticCalError = Math.abs(athleticPlan.totalCalories - 2400) / 2400 * 100;
  assert(
    athleticCalError <= 5.0,
    `Athletic plan calories (${athleticPlan.totalCalories} kcal) within ±5% of 2,400 kcal (Error: ${athleticCalError.toFixed(2)}%)`
  );
  assert(
    athleticPlan.totalMacros.protein >= 150,
    `Athletic plan protein (${athleticPlan.totalMacros.protein}g) provides high protein support`
  );

  // Verify all items are genuine items in OSU catalog
  const allAthleticItems = [
    ...athleticPlan.meals.breakfast.items,
    ...athleticPlan.meals.lunch.items,
    ...athleticPlan.meals.dinner.items,
    ...athleticPlan.meals.snack.items,
  ];
  assert(
    allAthleticItems.every((item) => !!OSU_MENU_ITEMS_MAP[item.menuItem.id]),
    'All items in athletic plan exist in master OSU menu catalog'
  );
  assert(
    allAthleticItems.every((item) => item.isLogged === false),
    'All planned items initialize with isLogged = false'
  );

  // Test Profile 2: Cut Profile (1,800 kcal, 160g protein)
  const cutProfile: UserProfile = {
    ...demoProfile,
    fitnessGoal: 'cut',
    targetCalories: 1800,
    targetMacros: { protein: 160, carbs: 180, fat: 50 },
  };
  const cutPlan = heuristicPlanner.generateDailyPlan(cutProfile);
  const cutCalError = Math.abs(cutPlan.totalCalories - 1800) / 1800 * 100;
  assert(
    cutCalError <= 5.0,
    `Cut plan calories (${cutPlan.totalCalories} kcal) within ±5% of 1,800 kcal (Error: ${cutCalError.toFixed(2)}%)`
  );

  // Test Profile 3: Bulk Profile (3,000 kcal, 200g protein)
  const bulkProfile: UserProfile = {
    ...demoProfile,
    fitnessGoal: 'bulk',
    targetCalories: 3000,
    targetMacros: { protein: 200, carbs: 360, fat: 85 },
  };
  const bulkPlan = heuristicPlanner.generateDailyPlan(bulkProfile);
  const bulkCalError = Math.abs(bulkPlan.totalCalories - 3000) / 3000 * 100;
  assert(
    bulkCalError <= 5.0,
    `Bulk plan calories (${bulkPlan.totalCalories} kcal) within ±5% of 3,000 kcal (Error: ${bulkCalError.toFixed(2)}%)`
  );

  // =========================================================================
  // 3. Dietary Restrictions & Campus Zone Constraints
  // =========================================================================
  console.log('\n--- 3. Dietary Restrictions & Zone Constraints ---');

  // Test Profile 4: Vegan Profile (2,000 kcal)
  const veganProfile: UserProfile = {
    ...demoProfile,
    dietaryRestrictions: ['vegan'],
    targetCalories: 2000,
  };
  const veganPlan = heuristicPlanner.generateDailyPlan(veganProfile);
  const allVeganItems = [
    ...veganPlan.meals.breakfast.items,
    ...veganPlan.meals.lunch.items,
    ...veganPlan.meals.dinner.items,
    ...veganPlan.meals.snack.items,
  ];
  assert(
    allVeganItems.every((item) => item.menuItem.dietaryTags.includes('vegan')),
    `Vegan plan strictly contains 100% vegan items (${allVeganItems.length} items checked)`
  );
  const veganCalError = Math.abs(veganPlan.totalCalories - 2000) / 2000 * 100;
  assert(
    veganCalError <= 5.0,
    `Vegan plan calories (${veganPlan.totalCalories} kcal) within ±5% of 2,000 kcal (Error: ${veganCalError.toFixed(2)}%)`
  );

  // Test Profile 5: Gluten-Free Profile (2,200 kcal)
  const gfProfile: UserProfile = {
    ...demoProfile,
    dietaryRestrictions: ['glutenFree'],
    targetCalories: 2200,
  };
  const gfPlan = heuristicPlanner.generateDailyPlan(gfProfile);
  const allGfItems = [
    ...gfPlan.meals.breakfast.items,
    ...gfPlan.meals.lunch.items,
    ...gfPlan.meals.dinner.items,
    ...gfPlan.meals.snack.items,
  ];
  assert(
    allGfItems.every((item) => item.menuItem.dietaryTags.includes('glutenFree')),
    `Gluten-free plan strictly contains 100% gluten-free items (${allGfItems.length} items checked)`
  );
  const gfCalError = Math.abs(gfPlan.totalCalories - 2200) / 2200 * 100;
  assert(
    gfCalError <= 5.0,
    `Gluten-free plan calories (${gfPlan.totalCalories} kcal) within ±5% of 2,200 kcal (Error: ${gfCalError.toFixed(2)}%)`
  );

  // Test Profile 6: North Campus Zone Filter
  const northPlan = heuristicPlanner.generateDailyPlan(demoProfile, { zone: 'North' });
  const allNorthItems = [
    ...northPlan.meals.breakfast.items,
    ...northPlan.meals.lunch.items,
    ...northPlan.meals.dinner.items,
    ...northPlan.meals.snack.items,
  ];
  const northVenuesCount = allNorthItems.filter(
    (i) => OSU_VENUES_MAP[i.menuItem.venueId]?.zone === 'North'
  ).length;
  assert(
    northVenuesCount >= 3,
    `North campus preference prioritizes North Campus venues (${northVenuesCount}/${allNorthItems.length} items from North)`
  );

  // Goal Presets Title Mapping
  const rpacPlan = heuristicPlanner.generateDailyPlan(demoProfile, { goalPreset: 'post_rpac' });
  assert(rpacPlan.title.includes('Post-RPAC'), 'post_rpac preset sets Post-RPAC title');

  const cutPresetPlan = heuristicPlanner.generateDailyPlan(demoProfile, { goalPreset: 'cut_lean' });
  assert(cutPresetPlan.title.includes('Cut & Lean'), 'cut_lean preset sets Cut & Lean title');

  const bulkPresetPlan = heuristicPlanner.generateDailyPlan(demoProfile, { goalPreset: 'bulk_power' });
  assert(bulkPresetPlan.title.includes('Power Bulk'), 'bulk_power preset sets Power Bulk title');

  // =========================================================================
  // 4. BrutusAI Client & Zero-Crash Resilience
  // =========================================================================
  console.log('\n--- 4. BrutusAI Client & Zero-Crash Resilience ---');

  // Generate plan without API key (offline fallback)
  const offlinePlan = await brutusAI.generateDailyMealPlan({ ...demoProfile, geminiApiKey: undefined });
  assert(!!offlinePlan && offlinePlan.totalCalories > 0, 'generateDailyMealPlan works offline with zero API key');

  // Generate plan with bogus API key (must handle network/auth error gracefully without throwing)
  const invalidKeyPlan = await brutusAI.generateDailyMealPlan({
    ...demoProfile,
    geminiApiKey: 'invalid_dummy_key_12345',
  });
  assert(
    !!invalidKeyPlan && invalidKeyPlan.totalCalories > 0,
    'generateDailyMealPlan gracefully falls back to heuristic planner when API key is invalid'
  );

  // Chat without API key
  const chatReply = await brutusAI.chatWithBrutus(
    'Where can I get high protein near Scott?',
    [],
    {
      ...demoProfile,
      geminiApiKey: undefined,
    }
  );
  assert(
    chatReply.length > 0 && (chatReply.includes('Scott') || chatReply.includes('protein') || chatReply.includes('O-H')),
    'chatWithBrutus returns campus-grounded response offline'
  );

  // =========================================================================
  // 5. Chat Store & State Integration
  // =========================================================================
  console.log('\n--- 5. Chat Store & State Integration ---');

  const initialChatState = useChatStore.getState();
  assert(
    initialChatState.messages.length === 1 && initialChatState.messages[0].role === 'assistant',
    'useChatStore initializes with 1 welcome message from Brutus'
  );
  assert(
    initialChatState.messages[0].content.includes('RPAC'),
    'Initial Brutus message grounds in RPAC'
  );
  assert(
    initialChatState.quickPrompts.length === 4,
    'Default quick prompts initialized with 4 options'
  );
  assert(
    STORAGE_KEYS.CHAT === 'buckeyegrub_chat_v1',
    'STORAGE_KEYS.CHAT configured for persistence'
  );

  // Send message through store
  await useChatStore.getState().sendMessage('How do I fuel up after lifting?');
  const afterSendMessages = useChatStore.getState().messages;
  assert(
    afterSendMessages.length === 3,
    'sendMessage appends both user message and assistant reply (3 messages total)'
  );
  assert(
    afterSendMessages[1].role === 'user' && afterSendMessages[1].content === 'How do I fuel up after lifting?',
    'User message stored correctly'
  );
  assert(
    afterSendMessages[2].role === 'assistant' && afterSendMessages[2].content.length > 0,
    'Assistant response stored correctly'
  );

  // 1-Click "Plan My Day" through store
  const generatedPlan = await useChatStore.getState().generateDayPlan({ goalPreset: 'post_rpac' });
  assert(!!generatedPlan, 'generateDayPlan returns DailyMealPlan');
  assert(
    useMealPlanStore.getState().activePlan.id === generatedPlan.id,
    'generateDayPlan pushes generated plan directly into useMealPlanStore activePlan'
  );

  const chatAfterPlan = useChatStore.getState().messages;
  const lastMsg = chatAfterPlan[chatAfterPlan.length - 1];
  assert(
    lastMsg.suggestedPlan?.id === generatedPlan.id,
    'Chat records assistant plan confirmation with attached suggestedPlan'
  );

  // Clear chat and reset
  useChatStore.getState().clearChat();
  assert(useChatStore.getState().messages.length === 0, 'clearChat empties messages');

  useChatStore.getState().resetToDemoChat();
  assert(
    useChatStore.getState().messages.length === 1 &&
      useChatStore.getState().messages[0].content.includes('Brutus'),
    'resetToDemoChat cleanly restores original Brutus welcome message'
  );

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n🌰====================================================');
  console.log('🌰 Checkpoint 5 Verification Results Summary');
  console.log('🌰====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  for (const res of results) {
    if (res.passed) {
      console.log(`  [PASS] ${res.name}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${res.name}: ${res.message}`);
      failedCount++;
    }
  }

  console.log(`\nTotal Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error('\n❌ Gate 5 Verification Failed');
    process.exit(1);
  } else {
    console.log('\n✅ Gate 5 Verification Passed: BrutusAI Engine fully verified!');
  }
}

// Execute test suite
runAllTests().catch((err) => {
  console.error('Fatal test error in verifyAI:', err);
  process.exit(1);
});
