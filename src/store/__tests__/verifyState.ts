/**
 * BuckeyeGrub Checkpoint 4 Verification Test Suite
 * Validates Zustand stores (useUserStore, useMealPlanStore, useDiningStore),
 * balance safeguards, demo profiles, item swapping, slot logging, macro aggregation,
 * favorites/saved collections, dining filters, and cross-platform persistence.
 */

import { OSU_MENU_ITEMS, OSU_MENU_ITEMS_MAP } from '../../data';
import { nutrisliceClient } from '../../services';
import { appStorage, clearAllPersistedState, STORAGE_KEYS } from '../storage';
import { useDiningStore } from '../useDiningStore';
import { useMealPlanStore } from '../useMealPlanStore';
import { useUserStore } from '../useUserStore';

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
  console.log('🌰 BuckeyeGrub Checkpoint 4: State Management & Persistence');
  console.log('🌰====================================================\n');

  // Reset all state to clean initial baseline
  await clearAllPersistedState();
  useUserStore.getState().resetToDemo();
  useMealPlanStore.getState().resetToDemoPlan();
  useDiningStore.getState().resetFilters();

  // =========================================================================
  // 1. User Store & Brutus Buckeye Demo Profile
  // =========================================================================
  console.log('--- 1. User Store: Brutus Buckeye Demo Profile ---');

  const initialUser = useUserStore.getState().profile;
  assert(initialUser.name === 'Brutus Buckeye', 'User profile name is Brutus Buckeye');
  assert(initialUser.fitnessGoal === 'athletic', 'Fitness goal initialized to athletic');
  assert(initialUser.targetCalories === 2400, 'Target calories initialized to 2,400 kcal');
  assert(initialUser.targetMacros.protein === 180, 'Protein target initialized to 180g');
  assert(initialUser.targetMacros.carbs === 260, 'Carbs target initialized to 260g');
  assert(initialUser.targetMacros.fat === 70, 'Fat target initialized to 70g');
  assert(initialUser.balances.swipes === 14, 'BuckID swipes initialized to 14 swipes');
  assert(initialUser.balances.diningDollars === 250.0, 'Dining Dollars balance initialized to $250.00');
  assert(initialUser.balances.buckidCash === 50.0, 'BuckID Cash balance initialized to $50.00');
  assert(
    initialUser.dietaryRestrictions.includes('highProtein'),
    'High-Protein dietary restriction active by default'
  );
  assert(initialUser.streakDays === 5, 'Streak tracker initialized to 5 days');
  assert(initialUser.powerScore === 92, 'Buckeye Power Score initialized to 92');

  // =========================================================================
  // 2. User Store Actions & Balance Safeguards
  // =========================================================================
  console.log('\n--- 2. User Store Actions & Currency Safeguards ---');

  // Fitness Goal and Target Updates
  useUserStore.getState().setFitnessGoal('bulk');
  assert(useUserStore.getState().profile.fitnessGoal === 'bulk', 'setFitnessGoal updates to bulk');

  useUserStore.getState().setCalorieTarget(2800);
  assert(useUserStore.getState().profile.targetCalories === 2800, 'setCalorieTarget updates to 2800 kcal');

  useUserStore.getState().setMacroTargets({ protein: 210, carbs: 320 });
  assert(
    useUserStore.getState().profile.targetMacros.protein === 210 &&
      useUserStore.getState().profile.targetMacros.carbs === 320 &&
      useUserStore.getState().profile.targetMacros.fat === 70,
    'setMacroTargets updates target protein and carbs while preserving fat'
  );

  // Traditions Swipe Deduction Safeguards
  const swipeDeducted = useUserStore.getState().deductSwipe();
  assert(swipeDeducted === true, 'deductSwipe succeeds when balance is positive');
  assert(useUserStore.getState().profile.balances.swipes === 13, 'Swipe balance decremented to 13');

  const excessiveSwipe = useUserStore.getState().deductSwipe(20);
  assert(excessiveSwipe === false, 'deductSwipe(20) returns false on overdraft attempt');
  assert(
    useUserStore.getState().profile.balances.swipes === 13,
    'Swipe balance remains protected at 13 after failed overdraft'
  );

  useUserStore.getState().addSwipes(5);
  assert(useUserStore.getState().profile.balances.swipes === 18, 'addSwipes(5) increases balance to 18');

  // Dining Dollars Deductions & Accurate Cent Rounding
  const ddDeducted = useUserStore.getState().deductDiningDollars(12.5);
  assert(ddDeducted === true, 'deductDiningDollars(12.50) succeeds');
  assert(
    useUserStore.getState().profile.balances.diningDollars === 237.5,
    'Dining Dollars balance updated to $237.50'
  );

  const excessiveDD = useUserStore.getState().deductDiningDollars(500.0);
  assert(excessiveDD === false, 'deductDiningDollars(500) returns false on overdraft attempt');
  assert(
    useUserStore.getState().profile.balances.diningDollars === 237.5,
    'Dining Dollars balance remains protected at $237.50'
  );

  useUserStore.getState().addDiningDollars(25.25);
  assert(
    useUserStore.getState().profile.balances.diningDollars === 262.75,
    'addDiningDollars(25.25) updates balance to $262.75'
  );

  // BuckID Cash Deductions
  const cashDeducted = useUserStore.getState().deductBuckIDCash(15.0);
  assert(cashDeducted === true, 'deductBuckIDCash(15.00) succeeds');
  assert(
    useUserStore.getState().profile.balances.buckidCash === 35.0,
    'BuckID Cash balance updated to $35.00'
  );

  const excessiveCash = useUserStore.getState().deductBuckIDCash(100.0);
  assert(excessiveCash === false, 'deductBuckIDCash(100.00) returns false on overdraft');
  assert(
    useUserStore.getState().profile.balances.buckidCash === 35.0,
    'BuckID Cash remains protected at $35.00'
  );

  // Dietary Restrictions Toggling
  useUserStore.getState().toggleDietaryRestriction('glutenFree');
  assert(
    useUserStore.getState().profile.dietaryRestrictions.includes('glutenFree'),
    'toggleDietaryRestriction adds glutenFree tag'
  );

  useUserStore.getState().toggleDietaryRestriction('glutenFree');
  assert(
    !useUserStore.getState().profile.dietaryRestrictions.includes('glutenFree'),
    'toggleDietaryRestriction removes glutenFree tag on second toggle'
  );

  // Streak & Power Score
  useUserStore.getState().incrementStreak();
  assert(useUserStore.getState().profile.streakDays === 6, 'incrementStreak increments streak to 6');

  useUserStore.getState().resetStreak();
  assert(useUserStore.getState().profile.streakDays === 0, 'resetStreak sets streak to 0');

  useUserStore.getState().setPowerScore(98);
  assert(useUserStore.getState().profile.powerScore === 98, 'setPowerScore updates to 98');

  useUserStore.getState().setPowerScore(150);
  assert(useUserStore.getState().profile.powerScore === 100, 'setPowerScore clamps maximum score to 100');

  useUserStore.getState().setPowerScore(-20);
  assert(useUserStore.getState().profile.powerScore === 0, 'setPowerScore clamps minimum score to 0');

  // Reset to Demo
  useUserStore.getState().resetToDemo();
  const resetUser = useUserStore.getState().profile;
  assert(
    resetUser.name === 'Brutus Buckeye' &&
      resetUser.fitnessGoal === 'athletic' &&
      resetUser.targetCalories === 2400 &&
      resetUser.balances.swipes === 14 &&
      resetUser.balances.diningDollars === 250.0 &&
      resetUser.streakDays === 5,
    'resetToDemo() perfectly restores all initial Brutus profile properties'
  );

  // =========================================================================
  // 3. Meal Plan Store & Pre-Seeded 4-Slot Plan
  // =========================================================================
  console.log('\n--- 3. Meal Plan Store: 4-Slot Daily Plan & Macro Aggregation ---');

  const plan = useMealPlanStore.getState().activePlan;
  assert(!!plan.meals.breakfast, 'Plan contains breakfast slot');
  assert(!!plan.meals.lunch, 'Plan contains lunch slot');
  assert(!!plan.meals.dinner, 'Plan contains dinner slot');
  assert(!!plan.meals.snack, 'Plan contains snack slot');

  assert(
    plan.meals.breakfast.items[0]?.menuItem.id === 'scott-traditions-omelet',
    'Breakfast slot contains Scott Traditions Omelet'
  );
  assert(
    plan.meals.lunch.items[0]?.menuItem.id === 'scott-grilled-chicken-brown-rice',
    'Lunch slot contains Scott Grilled Chicken & Brown Rice'
  );
  assert(
    plan.meals.dinner.items[0]?.menuItem.id === 'curl-byo-chicken-pasta-bowl',
    'Dinner slot contains Curl Market Tuscan Chicken Pasta Bowl'
  );
  assert(
    plan.meals.snack.items.length === 2,
    'Snack slot contains 2 items (Greek Yogurt Bowl + Buckeye Snack Box)'
  );

  assert(plan.totalCalories === 2130, `Total daily calories calculated correctly (Actual: ${plan.totalCalories} kcal)`);
  assert(plan.totalMacros.protein === 178, `Total daily protein calculated correctly (Actual: ${plan.totalMacros.protein}g)`);

  // Logged totals in initial state: Breakfast (440) + Lunch (480) = 920 kcal
  const initialLogged = useMealPlanStore.getState().getLoggedTotals();
  assert(
    initialLogged.calories === 920,
    `getLoggedTotals() computes 920 kcal for initially logged Breakfast & Lunch (Actual: ${initialLogged.calories})`
  );
  assert(
    initialLogged.macros.protein === 88,
    `getLoggedTotals() computes 88g protein for logged meals (Actual: ${initialLogged.macros.protein}g)`
  );

  // =========================================================================
  // 4. Meal Plan Item Swapping & Manipulation
  // =========================================================================
  console.log('\n--- 4. Meal Plan Item Swapping & Manipulation ---');

  const turkeyItem = OSU_MENU_ITEMS_MAP['scott-roast-turkey-breast'];
  assert(!!turkeyItem, 'Scott Roast Turkey Breast exists in menu catalog');

  // Swap Lunch item (Chicken Rice: 480 cal, 52g P) -> Turkey Breast (420 cal, 48g P)
  useMealPlanStore.getState().swapItemInSlot('lunch', 'demo_planned_lunch_1', turkeyItem);
  const updatedLunch = useMealPlanStore.getState().activePlan.meals.lunch;
  assert(
    updatedLunch.items[0]?.menuItem.id === 'scott-roast-turkey-breast',
    'swapItemInSlot successfully swapped Lunch item to Roast Turkey Breast'
  );
  assert(
    updatedLunch.items[0]?.isLogged === true,
    'swapItemInSlot preserved isLogged = true status for swapped item'
  );

  const postSwapTotals = useMealPlanStore.getState().getDailyTotals();
  assert(
    postSwapTotals.calories === 2070,
    `Daily calories updated correctly after swap (-60 kcal, Actual: ${postSwapTotals.calories})`
  );
  assert(
    postSwapTotals.macros.protein === 174,
    `Daily protein updated correctly after swap (-4g, Actual: ${postSwapTotals.macros.protein}g)`
  );

  // Add and Remove items from slot
  const salmonItem = OSU_MENU_ITEMS_MAP['kennedy-grilled-salmon-quinoa'];
  assert(!!salmonItem, 'Kennedy Grilled Salmon exists in menu catalog');

  useMealPlanStore.getState().addItemToSlot('dinner', salmonItem);
  assert(
    useMealPlanStore.getState().activePlan.meals.dinner.items.length === 2,
    'addItemToSlot adds second item to Dinner slot'
  );

  const addedItemId = useMealPlanStore.getState().activePlan.meals.dinner.items[1].id;
  useMealPlanStore.getState().removeItemFromSlot('dinner', addedItemId);
  assert(
    useMealPlanStore.getState().activePlan.meals.dinner.items.length === 1,
    'removeItemFromSlot removes item from Dinner slot'
  );

  // =========================================================================
  // 5. Meal Logging Cascades & Toggles
  // =========================================================================
  console.log('\n--- 5. Meal Logging Cascades & Toggles ---');

  // Log Dinner item
  useMealPlanStore.getState().toggleItemLogged('dinner', 'demo_planned_dinner_1');
  const dinnerSlot = useMealPlanStore.getState().activePlan.meals.dinner;
  assert(
    dinnerSlot.items[0].isLogged === true,
    'toggleItemLogged sets item isLogged to true'
  );
  assert(
    dinnerSlot.isLogged === true,
    'Dinner slot automatically reflects isLogged = true when all items are logged'
  );

  // Slot toggle cascade: toggle Snack slot
  useMealPlanStore.getState().toggleSlotLogged('snack');
  const snackSlot = useMealPlanStore.getState().activePlan.meals.snack;
  assert(
    snackSlot.isLogged === true,
    'toggleSlotLogged sets slot isLogged = true'
  );
  assert(
    snackSlot.items.every((i) => i.isLogged === true),
    'toggleSlotLogged cascades isLogged = true to all items in slot'
  );

  const allLoggedTotals = useMealPlanStore.getState().getLoggedTotals();
  const allDailyTotals = useMealPlanStore.getState().getDailyTotals();
  assert(
    allLoggedTotals.calories === allDailyTotals.calories,
    'When all slots are logged, getLoggedTotals() matches getDailyTotals()'
  );

  // Explicit setSlotLogged unlog
  useMealPlanStore.getState().setSlotLogged('snack', false);
  assert(
    useMealPlanStore.getState().activePlan.meals.snack.items.every((i) => i.isLogged === false),
    'setSlotLogged(false) cascades isLogged = false to all items in slot'
  );

  // Reset to Demo Plan
  useMealPlanStore.getState().resetToDemoPlan();
  const resetPlan = useMealPlanStore.getState().activePlan;
  assert(
    resetPlan.meals.lunch.items[0]?.menuItem.id === 'scott-grilled-chicken-brown-rice' &&
      resetPlan.totalCalories === 2130,
    'resetToDemoPlan() restores original demo meal plan and totals'
  );

  // =========================================================================
  // 6. Saved Meal Plans & Favorite Combos
  // =========================================================================
  console.log('\n--- 6. Saved Plans & Favorite Combos ---');

  const saved = useMealPlanStore.getState().saveCurrentPlan(
    'RPAC Heavy Lift Plan',
    'High protein for post-workout recovery',
    ['highProtein', 'bulk']
  );
  assert(
    useMealPlanStore.getState().savedPlans.length === 1,
    'saveCurrentPlan creates 1 saved plan'
  );
  assert(
    useMealPlanStore.getState().savedPlans[0].id === saved.id,
    'Saved plan ID matches returned plan'
  );

  // Modify active plan then reload saved plan
  useMealPlanStore.getState().clearActivePlan();
  assert(
    useMealPlanStore.getState().activePlan.totalCalories === 0,
    'clearActivePlan empties the active plan'
  );

  useMealPlanStore.getState().loadSavedPlan(saved.id);
  assert(
    useMealPlanStore.getState().activePlan.totalCalories === 2130,
    'loadSavedPlan restores original calories from saved plan'
  );

  useMealPlanStore.getState().deleteSavedPlan(saved.id);
  assert(
    useMealPlanStore.getState().savedPlans.length === 0,
    'deleteSavedPlan successfully removes saved plan'
  );

  // Favorite combo
  const waffle = OSU_MENU_ITEMS_MAP['scott-belgian-waffle'];
  assert(!!waffle, 'Scott Belgian Waffle exists in catalog');
  const fav = useMealPlanStore.getState().addFavoriteCombo(
    'Scott Power Breakfast',
    'traditions-at-scott',
    'breakfast',
    [resetPlan.meals.breakfast.items[0].menuItem, waffle]
  );
  assert(
    useMealPlanStore.getState().favorites.length === 1,
    'addFavoriteCombo adds combo to favorites'
  );
  assert(
    fav.totalCalories === 440 + 380,
    `Favorite combo calculates correct combined calories (${fav.totalCalories} kcal)`
  );

  useMealPlanStore.getState().removeFavoriteCombo(fav.id);
  assert(
    useMealPlanStore.getState().favorites.length === 0,
    'removeFavoriteCombo successfully removes combo from favorites'
  );

  // =========================================================================
  // 7. Campus Dining Store Filters
  // =========================================================================
  console.log('\n--- 7. Campus Dining Store Filters ---');

  const dining = useDiningStore.getState();
  assert(dining.selectedZone === 'All', 'Dining zone filter defaults to All');
  assert(dining.selectedPayment === 'All', 'Dining payment filter defaults to All');
  assert(dining.searchQuery === '', 'Dining search query defaults to empty');
  assert(dining.selectedDietaryTags.length === 0, 'Dietary tags default to empty');

  // Filter Actions
  useDiningStore.getState().setZone('North');
  assert(useDiningStore.getState().selectedZone === 'North', 'setZone sets North');

  useDiningStore.getState().setPaymentType('swipe');
  assert(
    useDiningStore.getState().selectedPayment === 'swipe' &&
      useDiningStore.getState().swipeOnly === true,
    'setPaymentType(swipe) sets payment and enables swipeOnly flag'
  );

  useDiningStore.getState().toggleDietaryTag('highProtein');
  assert(
    useDiningStore.getState().selectedDietaryTags.includes('highProtein'),
    'toggleDietaryTag adds highProtein'
  );

  useDiningStore.getState().setSearchQuery('chicken');
  assert(useDiningStore.getState().searchQuery === 'chicken', 'setSearchQuery updates query');

  // getFilterOptions integration with nutrisliceClient
  const filterOpts = useDiningStore.getState().getFilterOptions();
  assert(filterOpts.zone === 'North', 'Filter options zone is North');
  assert(filterOpts.paymentType === 'swipe', 'Filter options paymentType is swipe');
  assert(filterOpts.swipeOnly === true, 'Filter options swipeOnly is true');
  assert(filterOpts.searchQuery === 'chicken', 'Filter options searchQuery is chicken');
  assert(
    !!filterOpts.dietaryTags?.includes('highProtein'),
    'Filter options includes highProtein tag'
  );

  const matchingItems = nutrisliceClient.filterMenuItems(OSU_MENU_ITEMS, filterOpts);
  assert(
    matchingItems.length > 0 &&
      matchingItems.every(
        (i) =>
          i.swipeEligible &&
          i.dietaryTags.includes('highProtein') &&
          (i.name.toLowerCase().includes('chicken') ||
            i.description.toLowerCase().includes('chicken') ||
            i.ingredients?.some((ing) => ing.toLowerCase().includes('chicken')))
      ),
    `Dining store filters integrate seamlessly with nutrisliceClient (${matchingItems.length} matching items found)`
  );

  useDiningStore.getState().resetFilters();
  assert(
    useDiningStore.getState().selectedZone === 'All' &&
      useDiningStore.getState().selectedPayment === 'All' &&
      useDiningStore.getState().searchQuery === '' &&
      useDiningStore.getState().selectedDietaryTags.length === 0,
    'resetFilters restores clean default filter state'
  );

  // =========================================================================
  // 8. Cross-Platform Persistence Roundtrip
  // =========================================================================
  console.log('\n--- 8. Cross-Platform Persistence Roundtrip ---');

  // Mutate state and persist via appStorage
  await appStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ state: { profile: { name: 'Woody Hayes' } } }));
  const storedUserRaw = await appStorage.getItem(STORAGE_KEYS.USER);
  assert(!!storedUserRaw, 'appStorage.getItem retrieves persisted raw JSON');

  const parsed = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  assert(
    parsed?.state?.profile?.name === 'Woody Hayes',
    'appStorage preserves serialized JSON payload across read/write cycles'
  );

  await clearAllPersistedState();
  const clearedUser = await appStorage.getItem(STORAGE_KEYS.USER);
  assert(clearedUser === null, 'clearAllPersistedState clears persisted state completely');

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n🌰====================================================');
  console.log('🌰 Verification Results Summary');
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
    console.error('\n❌ Gate 4 Verification Failed');
    process.exit(1);
  } else {
    console.log('\n✅ Gate 4 Verification Passed: All state management and persistence criteria met!');
  }
}

// Run test suite
runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
