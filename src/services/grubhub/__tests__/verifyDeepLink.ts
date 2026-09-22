/**
 * BuckeyeGrub Checkpoint 6 Verification Test Suite
 * Validates the Grubhub deep-link URL builders (web + app scheme) across all
 * venues, null-handling for venues without a Grubhub mapping, and the Order
 * Assistant customization copy generator.
 *
 * Note: openVenueOrder() is intentionally NOT invoked here — it depends on the
 * expo-linking native runtime. This suite covers the pure, deterministic logic.
 */

import { OSU_VENUES, OSU_VENUES_MAP } from '../../../data';
import {
  buildGrubhubAppUri,
  buildGrubhubWebUrl,
} from '../deepLinkService';
import {
  generateGrubhubCustomizationCopy,
  generateItemCustomizationCopy,
} from '../../ai/grubhubAssistant';
import { DiningVenue } from '../../../types/dining';
import { MealSlot, PlannedMealItem } from '../../../types/mealPlan';

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
  console.log('🌰 BuckeyeGrub Checkpoint 6: Grubhub Deep-Link Verification');
  console.log('🌰====================================================\n');

  // =========================================================================
  // 1. Web URL builder across all venues with a Grubhub mapping
  // =========================================================================
  console.log('--- 1. Grubhub Web URL Builder ---');

  let venuesWithGrubhub = 0;
  for (const venue of OSU_VENUES) {
    const hasMapping = !!(venue.grubhubUrl || venue.grubhubSlug);
    if (!hasMapping) continue;
    venuesWithGrubhub++;

    const webUrl = buildGrubhubWebUrl(venue);
    assert(
      webUrl !== null && webUrl.startsWith('https://www.grubhub.com/restaurant'),
      `Web URL built for ${venue.shortName}`,
      `Expected a grubhub.com/restaurant URL, got: ${webUrl}`
    );

    // When a curated grubhubUrl exists, the builder must return it verbatim.
    if (venue.grubhubUrl) {
      assert(
        webUrl === venue.grubhubUrl,
        `Web URL for ${venue.shortName} matches curated grubhubUrl`,
        `Expected ${venue.grubhubUrl}, got ${webUrl}`
      );
    }
  }

  assert(
    venuesWithGrubhub >= 10,
    `At least 10 venues have Grubhub mappings (found ${venuesWithGrubhub})`,
    `Expected >= 10 mapped venues, found ${venuesWithGrubhub}`
  );

  // =========================================================================
  // 2. App URI (deep link) builder
  // =========================================================================
  console.log('--- 2. Grubhub App URI Builder ---');

  for (const venue of OSU_VENUES) {
    if (!(venue.grubhubUri || venue.grubhubSlug)) continue;
    const appUri = buildGrubhubAppUri(venue);
    assert(
      appUri !== null && appUri.startsWith('grubhub://restaurant'),
      `App URI built for ${venue.shortName}`,
      `Expected a grubhub://restaurant URI, got: ${appUri}`
    );
    if (venue.grubhubUri) {
      assert(
        appUri === venue.grubhubUri,
        `App URI for ${venue.shortName} matches curated grubhubUri`,
        `Expected ${venue.grubhubUri}, got ${appUri}`
      );
    }
  }

  // =========================================================================
  // 3. Slug-only derivation (no curated url/uri present)
  // =========================================================================
  console.log('--- 3. Slug-based Derivation ---');

  const slugOnlyVenue: DiningVenue = {
    ...OSU_VENUES_MAP['traditions-at-scott'],
    grubhubUrl: undefined,
    grubhubUri: undefined,
    grubhubSlug: 'sample-venue-slug',
  };

  assert(
    buildGrubhubWebUrl(slugOnlyVenue) === 'https://www.grubhub.com/restaurant/sample-venue-slug',
    'Web URL derived from slug when no curated URL exists'
  );
  assert(
    buildGrubhubAppUri(slugOnlyVenue) === 'grubhub://restaurant/sample-venue-slug',
    'App URI derived from slug when no curated URI exists'
  );
  assert(
    buildGrubhubWebUrl('sample-venue-slug') === 'https://www.grubhub.com/restaurant/sample-venue-slug',
    'Web URL derived directly from standalone slug string'
  );
  assert(
    buildGrubhubAppUri('sample-venue-slug') === 'grubhub://restaurant/sample-venue-slug',
    'App URI derived directly from standalone slug string'
  );
  assert(
    buildGrubhubWebUrl('') === null,
    'Web URL returns null for empty slug string'
  );
  assert(
    buildGrubhubAppUri('   ') === null,
    'App URI returns null for whitespace slug string'
  );

  // =========================================================================
  // 4. Null-handling for venues with no Grubhub mapping
  // =========================================================================
  console.log('--- 4. Null Handling (No Grubhub Mapping) ---');

  const noMappingVenue: DiningVenue = {
    ...OSU_VENUES_MAP['traditions-at-scott'],
    grubhubUrl: undefined,
    grubhubUri: undefined,
    grubhubSlug: undefined,
  };

  assert(
    buildGrubhubWebUrl(noMappingVenue) === null,
    'Web URL returns null when venue has no Grubhub mapping'
  );
  assert(
    buildGrubhubAppUri(noMappingVenue) === null,
    'App URI returns null when venue has no Grubhub mapping'
  );

  // =========================================================================
  // 5. Order Assistant customization copy generation
  // =========================================================================
  console.log('--- 5. Customization Copy Generator ---');

  const scott = OSU_VENUES_MAP['traditions-at-scott'];
  const sampleItems: PlannedMealItem[] = [
    {
      id: 'test_item_1',
      menuItem: {
        id: 'test-menu-1',
        venueId: scott.id,
        name: 'Grilled Chicken Power Bowl',
        description: 'Test item',
        category: 'dinner',
        calories: 620,
        macros: { protein: 52, carbs: 58, fat: 16, fiber: 8 },
        price: 0,
        swipeEligible: true,
        diningDollarsPrice: 0,
        allergens: [],
        dietaryTags: ['highProtein'],
      },
      servingMultiplier: 1,
      isLogged: false,
    },
  ];

  const slot: MealSlot = {
    slot: 'dinner',
    label: 'Dinner',
    items: sampleItems,
    isLogged: false,
  };

  const copy = generateGrubhubCustomizationCopy(slot, scott.name);
  assert(copy.length > 0, 'Customization copy is non-empty');
  assert(
    copy.includes('Grilled Chicken Power Bowl'),
    'Customization copy includes the item name'
  );
  assert(
    copy.includes(scott.name),
    'Customization copy includes the venue name in the heading'
  );
  assert(
    /Nutrition:.*kcal/.test(copy),
    'Customization copy includes a nutrition summary line'
  );

  const itemCopy = generateItemCustomizationCopy(sampleItems[0]);
  assert(
    itemCopy.includes('Grilled Chicken Power Bowl') && itemCopy.includes('protein'),
    'Single-item copy includes name and protein'
  );

  const sampleItemsWithRecipe: PlannedMealItem[] = [
    {
      id: 'test_item_recipe',
      menuItem: {
        id: 'test-menu-recipe',
        venueId: scott.id,
        name: 'Build Your Own Omelet',
        description: 'Custom omelet',
        category: 'breakfast',
        calories: 420,
        macros: { protein: 32, carbs: 12, fat: 28, fiber: 2 },
        price: 0,
        swipeEligible: true,
        diningDollarsPrice: 0,
        allergens: ['Eggs'],
        dietaryTags: ['highProtein', 'glutenFree'],
        customizationRecipe: 'Double egg whites, spinach, turkey bacon, cheddar',
      },
      servingMultiplier: 1,
      isLogged: false,
    },
  ];

  const recipeSlot: MealSlot = {
    slot: 'breakfast',
    label: 'Breakfast',
    items: sampleItemsWithRecipe,
    isLogged: false,
  };

  const recipeCopy = generateGrubhubCustomizationCopy(recipeSlot, scott.name);
  assert(
    recipeCopy.includes('Customization: Double egg whites, spinach, turkey bacon, cheddar'),
    'Customization copy includes customization recipe line when present'
  );
  const singleItemRecipeCopy = generateItemCustomizationCopy(sampleItemsWithRecipe[0]);
  assert(
    singleItemRecipeCopy.includes('Double egg whites, spinach, turkey bacon, cheddar'),
    'Single-item copy includes customization recipe text'
  );

  // =========================================================================
  // Final Results Summary
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
    console.error('\n❌ Gate 6 Verification Failed');
    process.exit(1);
  } else {
    console.log('\n✅ Gate 6 Verification Passed: All acceptance criteria met perfectly!');
  }
}

// Run test suite
runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
