/**
 * BuckeyeGrub Automated Verification Suite – Checkpoint 8
 * Validates:
 *   1. Buckeye Power Score calculation algorithm (0-100), sub-scores, and tier classifications.
 *   2. Buckeye Leaf Streak Tracker, daily transitions, milestone rewards (3, 7, 14, 30 days).
 *   3. BuckID Dining Dollar 35% discount calculations, savings math, and purchasing power.
 *   4. State management synchronization across user store, meal logging, and gamification trackers.
 */

function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg || 'Assertion failed');
  }
}
assert.strictEqual = (actual: unknown, expected: unknown, msg?: string) => {
  if (actual !== expected) {
    throw new Error(msg ? `${msg} (Actual: ${actual}, Expected: ${expected})` : `Expected ${actual} === ${expected}`);
  }
};
assert.ok = (condition: unknown, msg?: string): asserts condition => {
  if (!condition) {
    throw new Error(msg || 'Expected truthy');
  }
};

import {
  calculatePowerScore,
  calculatePowerScoreBreakdown,
  PowerScoreTier,
} from '../utils/nutrition';
import {
  STREAK_MILESTONES,
  evaluateMilestones,
  getNextMilestone,
  evaluateDailyStreak,
} from '../utils/gamification';
import {
  calculateDiningDollarDiscount,
  calculateDiningDollarSavings,
  calculatePurchasingPower,
  getDiningDollarPriceSummary,
  calculateItemsFinancialSavings,
} from '../utils/diningDiscount';
import { useUserStore } from '../store/useUserStore';
import { useMealPlanStore } from '../store/useMealPlanStore';
import { OSU_MENU_ITEMS } from '../data';

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

console.log('--- Starting Checkpoint 8 Verification Suite ---');

// =========================================================================
// Suite 1: Buckeye Power Score Algorithm & Breakdown
// =========================================================================

it('Power Score: returns 0 when no meals or calories are logged', () => {
  const zeroTotals = { calories: 0, macros: { protein: 0, carbs: 0, fat: 0 } };
  const targetCalories = 2400;
  const targetMacros = { protein: 180, carbs: 260, fat: 70 };

  const breakdown = calculatePowerScoreBreakdown(zeroTotals, targetCalories, targetMacros, 0);
  assert.strictEqual(breakdown.totalScore, 0, 'Zero calories logged should produce 0 Power Score');
  assert.strictEqual(breakdown.proteinScore, 0, 'Zero protein score');
  assert.strictEqual(breakdown.calorieScore, 0, 'Zero calorie score');
  assert.strictEqual(breakdown.loggingScore, 0, 'Zero logging score');
  assert.strictEqual(breakdown.tier, 'Freshman', 'Initial tier should be Freshman');
});

it('Power Score: scales accurately to 100 with full macro and calorie adherence', () => {
  const perfectTotals = { calories: 2400, macros: { protein: 180, carbs: 260, fat: 70 } };
  const targetCalories = 2400;
  const targetMacros = { protein: 180, carbs: 260, fat: 70 };

  const breakdown = calculatePowerScoreBreakdown(perfectTotals, targetCalories, targetMacros, 4);
  assert.strictEqual(breakdown.totalScore, 100, 'Perfect adherence + 4 logged slots yields 100 Power Score');
  assert.strictEqual(breakdown.proteinScore, 50, 'Max protein points is 50');
  assert.strictEqual(breakdown.calorieScore, 40, 'Max calorie points is 40');
  assert.strictEqual(breakdown.loggingScore, 10, 'Max logging points is 10');
  assert.strictEqual(breakdown.tier, 'Campus Legend', 'Score 100 is Campus Legend tier');
});

it('Power Score: correctly classifies RPAC Beast and Buckeye Starter tiers', () => {
  const beastTotals = { calories: 2000, macros: { protein: 150, carbs: 200, fat: 55 } };
  const targetCalories = 2400;
  const targetMacros = { protein: 180, carbs: 260, fat: 70 };

  const beastBreakdown = calculatePowerScoreBreakdown(beastTotals, targetCalories, targetMacros, 3);
  assert.ok(beastBreakdown.totalScore >= 75 && beastBreakdown.totalScore < 90, 'Score should fall in RPAC Beast range (75-89)');
  assert.strictEqual(beastBreakdown.tier, 'RPAC Beast', 'Tier should be RPAC Beast');

  const starterTotals = { calories: 1200, macros: { protein: 90, carbs: 130, fat: 35 } };
  const starterBreakdown = calculatePowerScoreBreakdown(starterTotals, targetCalories, targetMacros, 2);
  assert.ok(starterBreakdown.totalScore >= 50 && starterBreakdown.totalScore < 75, 'Score should fall in Buckeye Starter range (50-74)');
  assert.strictEqual(starterBreakdown.tier, 'Buckeye Starter', 'Tier should be Buckeye Starter');
});

it('Power Score: applies penalization when exceeding calorie ceiling by > 15%', () => {
  const overfedTotals = { calories: 3600, macros: { protein: 180, carbs: 400, fat: 120 } }; // 1.5x target
  const targetCalories = 2400;
  const targetMacros = { protein: 180, carbs: 260, fat: 70 };

  const breakdown = calculatePowerScoreBreakdown(overfedTotals, targetCalories, targetMacros, 4);
  assert.ok(breakdown.calorieScore < 40, 'Calorie score should be reduced for exceeding target by 50%');
  assert.ok(breakdown.totalScore < 90, 'Total score should not reach Campus Legend with excessive calories');
});

it('Power Score: handles extreme athlete cut (1200 kcal) and heavy bulk (3800 kcal) profiles', () => {
  // Cut profile
  const cutTargets = { calories: 1200, macros: { protein: 120, carbs: 100, fat: 35 } };
  const cutLogged = { calories: 1200, macros: { protein: 120, carbs: 100, fat: 35 } };
  const cutScore = calculatePowerScore(cutLogged, cutTargets.calories, cutTargets.macros, 4);
  assert.strictEqual(cutScore, 100, 'Athlete cut profile scores 100 on matching targets');

  // Bulk profile
  const bulkTargets = { calories: 3800, macros: { protein: 220, carbs: 480, fat: 110 } };
  const bulkLogged = { calories: 3800, macros: { protein: 220, carbs: 480, fat: 110 } };
  const bulkScore = calculatePowerScore(bulkLogged, bulkTargets.calories, bulkTargets.macros, 4);
  assert.strictEqual(bulkScore, 100, 'Bulk athlete profile scores 100 on matching targets');
});

// =========================================================================
// Suite 2: Buckeye Leaf Streak Tracker & Milestones
// =========================================================================

it('Streak Milestones: defines 3-day, 7-day, 14-day, and 30-day badges', () => {
  assert.strictEqual(STREAK_MILESTONES.length, 4, '4 milestone badges configured');
  assert.strictEqual(STREAK_MILESTONES[0].days, 3, 'Milestone 1 is 3 days');
  assert.strictEqual(STREAK_MILESTONES[0].title, 'Freshman Kickoff', 'Milestone 1 title');
  assert.strictEqual(STREAK_MILESTONES[1].days, 7, 'Milestone 2 is 7 days');
  assert.strictEqual(STREAK_MILESTONES[1].title, 'Varsity Starter', 'Milestone 2 title');
  assert.strictEqual(STREAK_MILESTONES[2].days, 14, 'Milestone 3 is 14 days');
  assert.strictEqual(STREAK_MILESTONES[2].title, 'Gold Pants Champion', 'Milestone 3 title');
  assert.strictEqual(STREAK_MILESTONES[3].days, 30, 'Milestone 4 is 30 days');
  assert.strictEqual(STREAK_MILESTONES[3].title, 'Campus Legend', 'Milestone 4 title');
});

it('evaluateMilestones: accurately tracks unlocked status and progress percentages', () => {
  const day5Milestones = evaluateMilestones(5);
  assert.strictEqual(day5Milestones[0].isUnlocked, true, '3-day milestone unlocked at 5 days');
  assert.strictEqual(day5Milestones[0].progressPercent, 100, '3-day progress is 100%');
  assert.strictEqual(day5Milestones[1].isUnlocked, false, '7-day milestone locked at 5 days');
  assert.strictEqual(day5Milestones[1].daysRemaining, 2, '2 days remaining to 7-day milestone');
  assert.strictEqual(day5Milestones[1].progressPercent, 71, '5/7 days is 71%');

  const day14Milestones = evaluateMilestones(14);
  assert.strictEqual(day14Milestones[0].isUnlocked, true, '3-day unlocked');
  assert.strictEqual(day14Milestones[1].isUnlocked, true, '7-day unlocked');
  assert.strictEqual(day14Milestones[2].isUnlocked, true, '14-day unlocked');
  assert.strictEqual(day14Milestones[3].isUnlocked, false, '30-day locked');
});

it('getNextMilestone: identifies the immediate upcoming locked milestone', () => {
  const nextAt2 = getNextMilestone(2);
  assert.ok(nextAt2 !== null);
  assert.strictEqual(nextAt2?.days, 3, 'Next at 2 days is 3-day milestone');

  const nextAt8 = getNextMilestone(8);
  assert.ok(nextAt8 !== null);
  assert.strictEqual(nextAt8?.days, 14, 'Next at 8 days is 14-day milestone');

  const nextAt35 = getNextMilestone(35);
  assert.strictEqual(nextAt35, null, 'No upcoming milestone after 30 days');
});

it('evaluateDailyStreak: increments streak on consecutive calendar day', () => {
  const res = evaluateDailyStreak('2026-09-21', 4, '2026-09-22');
  assert.strictEqual(res.newStreakDays, 5, 'Streak increments from 4 to 5 on consecutive day');
  assert.strictEqual(res.status, 'consecutive_increment', 'Status is consecutive_increment');
  assert.strictEqual(res.dateRecorded, '2026-09-22', 'Date recorded updated to today');
});

it('evaluateDailyStreak: maintains streak idempotently when logging multiple times on same day', () => {
  const res = evaluateDailyStreak('2026-09-22', 5, '2026-09-22');
  assert.strictEqual(res.newStreakDays, 5, 'Streak does not increment twice on same day');
  assert.strictEqual(res.status, 'already_logged_today', 'Status is already_logged_today');
});

it('evaluateDailyStreak: resets streak to 1 when a day is skipped', () => {
  const res = evaluateDailyStreak('2026-09-18', 5, '2026-09-22'); // 4-day gap
  assert.strictEqual(res.newStreakDays, 1, 'Streak restarts at 1 day after broken streak');
  assert.strictEqual(res.status, 'streak_restarted', 'Status is streak_restarted');
});

// =========================================================================
// Suite 3: BuckID 35% Dining Dollar Discount & Financial Engine
// =========================================================================

it('35% Discount: calculates exact discounted prices with rounding', () => {
  assert.strictEqual(calculateDiningDollarDiscount(10.0), 6.5, '$10.00 * 0.65 = $6.50');
  assert.strictEqual(calculateDiningDollarDiscount(12.0), 7.8, '$12.00 * 0.65 = $7.80');
  assert.strictEqual(calculateDiningDollarDiscount(4.5), 2.93, '$4.50 * 0.65 = $2.93');
  assert.strictEqual(calculateDiningDollarDiscount(15.75), 10.24, '$15.75 * 0.65 = $10.24');
  assert.strictEqual(calculateDiningDollarDiscount(0), 0, '$0 = $0');
});

it('35% Savings: calculates exact savings amount matching 35%', () => {
  assert.strictEqual(calculateDiningDollarSavings(10.0), 3.5, '$10.00 * 0.35 = $3.50');
  assert.strictEqual(calculateDiningDollarSavings(12.0), 4.2, '$12.00 * 0.35 = $4.20');
  assert.strictEqual(calculateDiningDollarSavings(4.5), 1.58, '$4.50 * 0.35 = $1.58');

  // Verify discounted + savings === retail (within 1 cent rounding)
  const price = 14.5;
  const disc = calculateDiningDollarDiscount(price);
  const sav = calculateDiningDollarSavings(price);
  assert.ok(Math.abs(disc + sav - price) <= 0.01, 'Sum of discount + savings equals retail price');
});

it('Purchasing Power: expands $250.00 Dining Dollars to $384.62 in retail food buying power', () => {
  const balance250 = 250.0;
  const power250 = calculatePurchasingPower(balance250);
  assert.strictEqual(power250, 384.62, '$250.00 / 0.65 = $384.62 retail purchasing power');

  const balance100 = 100.0;
  const power100 = calculatePurchasingPower(balance100);
  assert.strictEqual(power100, 153.85, '$100.00 / 0.65 = $153.85 retail purchasing power');
});

it('calculateItemsFinancialSavings: aggregates retail meals savings correctly', () => {
  const sampleItems = [
    { price: 12.0 }, // Curl bowl: $7.80, saves $4.20
    { price: 8.5 },  // Berry Cafe panini: $5.53, saves $2.98
    { price: 4.5 },  // Snack box: $2.93, saves $1.58
  ];

  const summary = calculateItemsFinancialSavings(sampleItems);
  assert.strictEqual(summary.itemCount, 3, '3 items processed');
  assert.strictEqual(summary.totalRetailPrice, 25.0, 'Total retail: $25.00');
  assert.strictEqual(summary.totalDiningDollarPrice, 16.26, 'Total dining dollars: $16.26');
  assert.strictEqual(summary.totalSavings, 8.75, 'Total savings: $8.75 (35%)');
});

it('Catalog Validation: all 63 OSU items compute correct 35% discount pricing', () => {
  let verifiedItems = 0;
  for (const item of OSU_MENU_ITEMS) {
    const discounted = calculateDiningDollarDiscount(item.price);
    const savings = calculateDiningDollarSavings(item.price);
    assert.ok(discounted > 0, `Discounted price must be positive for ${item.id}`);
    assert.ok(discounted < item.price, `Discounted price must be strictly less than retail for ${item.id}`);
    assert.ok(savings > 0, `Savings must be positive for ${item.id}`);
    verifiedItems++;
  }
  assert.strictEqual(verifiedItems, OSU_MENU_ITEMS.length, `Verified all ${OSU_MENU_ITEMS.length} items`);
});

// =========================================================================
// Suite 4: State Synchronization & Store Operations
// =========================================================================

it('UserStore: recordMealLoggedStreak updates streak and milestone list in store', () => {
  const userStore = useUserStore.getState();
  userStore.resetToDemo();

  assert.strictEqual(useUserStore.getState().profile.streakDays, 5, 'Demo user starts with 5 days');

  // Record streak on next consecutive day
  const result = useUserStore.getState().recordMealLoggedStreak('2026-09-19'); // consecutive after 2026-09-18
  assert.strictEqual(result.newStreakDays, 6, 'Streak increments to 6');
  assert.strictEqual(useUserStore.getState().profile.streakDays, 6, 'Store updated with 6 days');
  assert.strictEqual(useUserStore.getState().profile.lastActiveDate, '2026-09-19', 'Store date updated');
});

it('UserStore: recalculatePowerScore updates profile.powerScore in store', () => {
  const userStore = useUserStore.getState();
  userStore.resetToDemo();

  const loggedTotals = { calories: 2400, macros: { protein: 180, carbs: 260, fat: 70 } };
  const newScore = userStore.recalculatePowerScore(loggedTotals, 4);

  assert.strictEqual(newScore, 100, 'recalculatePowerScore returns 100 on perfect day');
  assert.strictEqual(useUserStore.getState().profile.powerScore, 100, 'Store profile updated with 100');
});

it('MealPlanStore + UserStore: logging a meal increases logged calories and dynamic power score', () => {
  const mealStore = useMealPlanStore.getState();
  const userStore = useUserStore.getState();

  userStore.resetToDemo();
  mealStore.resetToDemoPlan();

  // Initially in demo plan, some items or slots may be planned
  // Let's set slot logged to false for all slots
  mealStore.setSlotLogged('breakfast', false);
  mealStore.setSlotLogged('lunch', false);
  mealStore.setSlotLogged('dinner', false);
  mealStore.setSlotLogged('snack', false);

  const emptyTotals = mealStore.getLoggedTotals();
  assert.strictEqual(emptyTotals.calories, 0, 'No meals logged initially');
  const scoreInitial = calculatePowerScore(emptyTotals, 2400, { protein: 180, carbs: 260, fat: 70 }, 0);
  assert.strictEqual(scoreInitial, 0, 'Initial score with 0 logged meals is 0');

  // Log breakfast
  mealStore.setSlotLogged('breakfast', true);
  const breakfastTotals = mealStore.getLoggedTotals();
  assert.ok(breakfastTotals.calories > 0, 'Logged calories increased after logging breakfast');

  const scoreAfterBreakfast = calculatePowerScore(breakfastTotals, 2400, { protein: 180, carbs: 260, fat: 70 }, 1);
  assert.ok(scoreAfterBreakfast > scoreInitial, `Logging breakfast increases power score (${scoreAfterBreakfast} > ${scoreInitial})`);

  // Log lunch
  mealStore.setSlotLogged('lunch', true);
  const lunchTotals = mealStore.getLoggedTotals();
  const scoreAfterLunch = calculatePowerScore(lunchTotals, 2400, { protein: 180, carbs: 260, fat: 70 }, 2);
  assert.ok(scoreAfterLunch > scoreAfterBreakfast, `Logging lunch increases power score (${scoreAfterLunch} > ${scoreAfterBreakfast})`);
});

console.log(`\nAll ${passedAssertions} Checkpoint 8 automated assertions PASSED successfully!\n`);
