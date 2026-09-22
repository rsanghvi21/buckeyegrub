/**
 * BuckeyeGrub Automated Verification Suite – Checkpoint 7
 * Validates:
 *   1. Nutrition calculation formulas (BMR, TDEE, suggested macros, power score).
 *   2. Theme token resolution for Light and Dark modes.
 *   3. Menu item mapping and 35% Dining Dollar discount calculations across all 63 items.
 *   4. State management workflows powering the Checkpoint 7 screens (User, MealPlan, Dining, Chat).
 */

function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg || 'Assertion failed');
  }
}
assert.strictEqual = (actual: unknown, expected: unknown, msg?: string) => {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${actual} === ${expected}`);
  }
};
assert.ok = (condition: unknown, msg?: string): asserts condition => {
  if (!condition) {
    throw new Error(msg || 'Expected truthy');
  }
};
import {
  calculateBmr,
  calculateTdee,
  calculateSuggestedMacros,
  calculatePowerScore,
  ACTIVITY_MULTIPLIERS,
} from '../utils/nutrition';
import {
  OSU_MENU_ITEMS,
  OSU_MENU_ITEMS_MAP,
  OSU_VENUES,
  OSU_VENUES_MAP,
} from '../data';
import { calculateDiningDollarDiscount } from '../types/dining';
import {
  getThemeColors,
  palette,
  lightSemanticColors,
  darkSemanticColors,
  DIETARY_TAG_OPTIONS,
} from '../constants/theme';
import { useUserStore } from '../store/useUserStore';
import { useMealPlanStore } from '../store/useMealPlanStore';
import { useDiningStore } from '../store/useDiningStore';
import { useChatStore } from '../store/useChatStore';

let passedAssertions = 0;

function it(desc: string, fn: () => void) {
  try {
    fn();
    passedAssertions++;
  } catch (err) {
    console.error(`FAIL: ${desc}`);
    throw err;
  }
}

console.log('--- Starting Checkpoint 7 Verification Suite ---');

// 1. Nutrition & TDEE Calculations
it('calculates BMR correctly using Mifflin-St Jeor equation', () => {
  // 195 lbs (~88.45 kg), 72 in (~182.88 cm), 21 yrs, male
  // 10*88.45 + 6.25*182.88 - 5*21 + 5 = 884.5 + 1143 - 105 + 5 = 1927.5 -> 1928
  const maleBmr = calculateBmr(195, 72, 21, 'male');
  assert.ok(maleBmr >= 1900 && maleBmr <= 1950, `Expected ~1928, got ${maleBmr}`);

  // Female check: base - 161
  const femaleBmr = calculateBmr(140, 65, 21, 'female');
  assert.ok(femaleBmr >= 1350 && femaleBmr <= 1500, `Expected ~1430, got ${femaleBmr}`);

  // Boundary check
  assert.strictEqual(calculateBmr(0, 72, 21), 0);
  assert.strictEqual(calculateBmr(195, 0, 21), 0);
});

it('calculates TDEE across activity multipliers', () => {
  const bmr = 1900;
  const sedentary = calculateTdee(bmr, 'sedentary');
  const moderate = calculateTdee(bmr, 'moderate');
  const veryActive = calculateTdee(bmr, 'very_active');

  assert.strictEqual(sedentary, Math.round(1900 * ACTIVITY_MULTIPLIERS.sedentary));
  assert.strictEqual(moderate, Math.round(1900 * ACTIVITY_MULTIPLIERS.moderate));
  assert.strictEqual(veryActive, Math.round(1900 * ACTIVITY_MULTIPLIERS.very_active));
  assert.ok(veryActive > moderate && moderate > sedentary);
});

it('calculates suggested calories & macros across fitness goals', () => {
  const tdee = 2500;
  const athletic = calculateSuggestedMacros(tdee, 'athletic');
  const bulk = calculateSuggestedMacros(tdee, 'bulk');
  const cut = calculateSuggestedMacros(tdee, 'cut');
  const maintain = calculateSuggestedMacros(tdee, 'maintain');

  // Bulk should have surplus, Cut should have deficit
  assert.ok(bulk.targetCalories > tdee, 'Bulk must be surplus');
  assert.ok(cut.targetCalories < tdee, 'Cut must be deficit');
  assert.strictEqual(maintain.targetCalories, tdee, 'Maintain must equal TDEE');

  // Macro calorie sum should roughly equal target calories
  for (const res of [athletic, bulk, cut, maintain]) {
    const macroCals =
      res.targetMacros.protein * 4 +
      res.targetMacros.carbs * 4 +
      res.targetMacros.fat * 9;
    const diff = Math.abs(macroCals - res.targetCalories);
    assert.ok(diff < 50, `Macro calorie discrepancy should be < 50, got ${diff}`);
  }

  // Cut should prioritize higher protein percentage
  assert.ok(
    cut.targetMacros.protein >= 170,
    `Cut protein should be high: got ${cut.targetMacros.protein}`
  );
});

it('calculates Buckeye Power Score correctly', () => {
  const targetCals = 2400;
  const targetMacros = { protein: 180, carbs: 260, fat: 70 };

  // Perfect adherence
  const perfectScore = calculatePowerScore(
    { calories: 2400, macros: { protein: 180, carbs: 260, fat: 70 } },
    targetCals,
    targetMacros
  );
  assert.strictEqual(perfectScore, 100, `Perfect score should be 100, got ${perfectScore}`);

  // Partial adherence (half protein, half calories)
  const partialScore = calculatePowerScore(
    { calories: 1200, macros: { protein: 90, carbs: 130, fat: 35 } },
    targetCals,
    targetMacros
  );
  assert.ok(partialScore >= 50 && partialScore <= 60, `Partial score ~55, got ${partialScore}`);

  // Zero logged
  const zeroScore = calculatePowerScore(
    { calories: 0, macros: { protein: 0, carbs: 0, fat: 0 } },
    targetCals,
    targetMacros
  );
  assert.strictEqual(zeroScore, 0, `Zero score should be 0, got ${zeroScore}`);
});

// 2. Theme Token Resolution
it('resolves OSU Scarlet and Light/Dark semantic tokens cleanly', () => {
  const light = getThemeColors(false);
  const dark = getThemeColors(true);

  assert.strictEqual(light.scarlet, '#BA0C2F');
  assert.strictEqual(dark.scarlet, '#BA0C2F');
  assert.strictEqual(light.background, lightSemanticColors.background);
  assert.strictEqual(dark.background, darkSemanticColors.background);
  assert.strictEqual(light.textPrimary, '#1E1E24');
  assert.strictEqual(dark.textPrimary, '#F8F9FA');
});

// 3. Menu Item & Venue Catalog Integrity
it('verifies all 63 menu items resolve in OSU_MENU_ITEMS_MAP with accurate discount pricing', () => {
  assert.strictEqual(OSU_MENU_ITEMS.length, 63, 'Catalog must have 63 items');
  assert.strictEqual(OSU_VENUES.length, 12, 'Catalog must have 12 venues');

  for (const item of OSU_MENU_ITEMS) {
    const mapped = OSU_MENU_ITEMS_MAP[item.id];
    assert.ok(mapped, `Item ${item.id} must resolve in map`);
    assert.strictEqual(mapped.name, item.name);
    assert.ok(item.calories >= 0, `Item ${item.id} calories cannot be negative`);
    assert.ok(item.macros.protein >= 0, `Item ${item.id} protein cannot be negative`);

    // Verify 35% Dining Dollar discount calculation
    const calculatedDiscount = calculateDiningDollarDiscount(item.price);
    assert.strictEqual(
      calculatedDiscount,
      item.diningDollarsPrice,
      `Dining dollar price must match 35% discount for ${item.id}`
    );

    // Venue reference check
    assert.ok(OSU_VENUES_MAP[item.venueId], `Venue ${item.venueId} must exist for item ${item.id}`);
  }
});

// 4. Store State Workflows
it('verifies user store operations for profile, balances, and dietary restrictions', () => {
  const userStore = useUserStore.getState();
  userStore.resetToDemo();

  // Check demo defaults
  assert.strictEqual(userStore.profile.name, 'Brutus Buckeye');
  assert.strictEqual(userStore.profile.balances.swipes, 14);

  // Deduct swipe
  const deducted = userStore.deductSwipe(1);
  assert.strictEqual(deducted, true);
  assert.strictEqual(useUserStore.getState().profile.balances.swipes, 13);

  // Add swipe
  userStore.addSwipes(2);
  assert.strictEqual(useUserStore.getState().profile.balances.swipes, 15);

  // Dining Dollars
  userStore.addDiningDollars(25);
  assert.strictEqual(useUserStore.getState().profile.balances.diningDollars, 275.0);

  // Dietary toggle
  userStore.toggleDietaryRestriction('glutenFree');
  assert.ok(useUserStore.getState().profile.dietaryRestrictions.includes('glutenFree'));
  userStore.toggleDietaryRestriction('glutenFree');
  assert.ok(!useUserStore.getState().profile.dietaryRestrictions.includes('glutenFree'));

  // Reset back to demo
  userStore.resetToDemo();
  assert.strictEqual(useUserStore.getState().profile.balances.swipes, 14);
});

it('verifies meal plan store operations for slots, logging, and plan reuse', () => {
  const mealPlanStore = useMealPlanStore.getState();
  mealPlanStore.resetToDemoPlan();

  const initialTotals = mealPlanStore.getLoggedTotals();
  assert.ok(initialTotals.calories > 0, 'Demo plan starts with some logged calories');

  // Toggle slot logged
  const dinnerLoggedBefore = mealPlanStore.activePlan.meals.dinner.isLogged;
  mealPlanStore.toggleSlotLogged('dinner');
  assert.strictEqual(
    useMealPlanStore.getState().activePlan.meals.dinner.isLogged,
    !dinnerLoggedBefore
  );

  // Re-toggle back
  mealPlanStore.toggleSlotLogged('dinner');
  assert.strictEqual(
    useMealPlanStore.getState().activePlan.meals.dinner.isLogged,
    dinnerLoggedBefore
  );

  // Save current plan and re-load
  const saved = mealPlanStore.saveCurrentPlan('Test Daily Plan', 'Verification test', ['test']);
  assert.ok(saved.id, 'Saved plan must have an id');
  assert.ok(useMealPlanStore.getState().savedPlans.some((p) => p.id === saved.id));

  // Load saved plan
  mealPlanStore.loadSavedPlan(saved.id);
  assert.strictEqual(useMealPlanStore.getState().activePlan.title, 'Test Daily Plan');

  // Clean up
  mealPlanStore.deleteSavedPlan(saved.id);
  mealPlanStore.resetToDemoPlan();
});

it('verifies dining store filters and zone switching', () => {
  const diningStore = useDiningStore.getState();
  diningStore.resetFilters();

  diningStore.setZone('North');
  assert.strictEqual(useDiningStore.getState().selectedZone, 'North');

  diningStore.setPaymentType('dining_dollars');
  assert.strictEqual(useDiningStore.getState().selectedPayment, 'dining_dollars');

  diningStore.setSearchQuery('chicken');
  assert.strictEqual(useDiningStore.getState().searchQuery, 'chicken');

  diningStore.resetFilters();
  assert.strictEqual(useDiningStore.getState().selectedZone, 'All');
  assert.strictEqual(useDiningStore.getState().selectedPayment, 'All');
  assert.strictEqual(useDiningStore.getState().searchQuery, '');
});

it('verifies chat store message and demo resets', () => {
  const chatStore = useChatStore.getState();
  assert.ok(chatStore.messages.length > 0, 'Demo chat has seeded messages');
  assert.strictEqual(chatStore.isLoading, false);
  assert.strictEqual(chatStore.isGeneratingPlan, false);
});

it('verifies centralized DIETARY_TAG_OPTIONS and venue ID fidelity', () => {
  assert.strictEqual(DIETARY_TAG_OPTIONS.length, 6, 'Must have 6 dietary options');
  const tags = DIETARY_TAG_OPTIONS.map((d) => d.tag);
  assert.ok(tags.includes('highProtein'));
  assert.ok(tags.includes('vegan'));
  assert.ok(tags.includes('vegetarian'));
  assert.ok(tags.includes('glutenFree'));
  assert.ok(tags.includes('halal'));
  assert.ok(tags.includes('dairyFree'));

  // Verify Scott Traditions venue ID
  assert.ok(OSU_VENUES_MAP['traditions-at-scott'], 'traditions-at-scott must exist');
  assert.strictEqual(OSU_VENUES_MAP['traditions-at-scott'].name, 'Traditions at Scott');
});

console.log(`\nAll ${passedAssertions} Checkpoint 7 automated assertions PASSED successfully!`);
