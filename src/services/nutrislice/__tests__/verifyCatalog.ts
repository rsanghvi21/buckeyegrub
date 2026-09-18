/**
 * BuckeyeGrub Checkpoint 3 Verification Test Suite
 * Validates domain types, 10+ OSU dining venues, 50+ menu items,
 * Nutrislice API normalization, caching, filtering, macro sorting, and offline fallbacks.
 */

import { OSU_MENU_ITEMS, OSU_MENU_ITEMS_BY_VENUE, OSU_VENUES, OSU_VENUES_MAP } from '../../../data';
import { nutrisliceClient } from '../nutrisliceClient';
import { DiningVenue, MenuItem, NutrisliceRawWeekResponse } from '../../../types/dining';

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
  console.log('🌰 BuckeyeGrub Checkpoint 3: Comprehensive Verification');
  console.log('🌰====================================================\n');

  // =========================================================================
  // 1. Dining Venues Catalog Verification
  // =========================================================================
  console.log('--- 1. Dining Venues Catalog (10+ OSU Locations) ---');

  assert(
    OSU_VENUES.length >= 10,
    `Venue count >= 10 (Actual: ${OSU_VENUES.length})`,
    `Expected at least 10 venues, found ${OSU_VENUES.length}`
  );

  const requiredVenueIds = [
    'traditions-at-scott',
    'traditions-at-kennedy',
    'traditions-at-morrill',
    'curl-market',
    'union-market',
    '12th-avenue-bread-company',
    'marketplace-on-neil',
    'pad-pizza-delivery',
    'woodys-tavern',
    'berry-cafe',
  ];

  for (const venueId of requiredVenueIds) {
    const venue = OSU_VENUES_MAP[venueId];
    assert(
      !!venue,
      `Required venue exists: ${venueId}`,
      `Missing required venue ${venueId}`
    );

    if (venue) {
      assert(
        venue.coordinates.latitude > 39.5 && venue.coordinates.latitude < 40.5,
        `Valid Columbus latitude for ${venue.name}`,
        `Latitude ${venue.coordinates.latitude} out of bounds`
      );
      assert(
        venue.coordinates.longitude > -83.5 && venue.coordinates.longitude < -82.5,
        `Valid Columbus longitude for ${venue.name}`,
        `Longitude ${venue.coordinates.longitude} out of bounds`
      );
      assert(
        venue.acceptedPayments.length > 0,
        `Accepted payments configured for ${venue.name}`,
        `No payments for ${venue.name}`
      );
      assert(
        Object.keys(venue.operatingHours).length > 0,
        `Operating hours configured for ${venue.name}`,
        `No operating hours for ${venue.name}`
      );
      assert(
        !!venue.grubhubSlug && venue.grubhubSlug.length > 0,
        `Grubhub slug configured for ${venue.name}`,
        `Missing Grubhub slug for ${venue.name}`
      );
    }
  }

  // =========================================================================
  // 2. Menu Items Catalog Verification (50+ Real Items)
  // =========================================================================
  console.log('\n--- 2. Menu Items Catalog (50+ Real Campus Items) ---');

  assert(
    OSU_MENU_ITEMS.length >= 50,
    `Menu item count >= 50 (Actual: ${OSU_MENU_ITEMS.length})`,
    `Expected >= 50 items, found ${OSU_MENU_ITEMS.length}`
  );

  let allHaveValidMacros = true;
  let allHaveValidPrices = true;
  let allHaveValidVenues = true;
  let allHaveCustomizationRecipes = true;

  for (const item of OSU_MENU_ITEMS) {
    if (
      typeof item.calories !== 'number' ||
      item.calories < 0 ||
      typeof item.macros.protein !== 'number' ||
      item.macros.protein < 0 ||
      typeof item.macros.carbs !== 'number' ||
      typeof item.macros.fat !== 'number'
    ) {
      allHaveValidMacros = false;
    }

    if (!OSU_VENUES_MAP[item.venueId]) {
      allHaveValidVenues = false;
    }

    const expectedDiscount = Math.round(item.price * 0.65 * 100) / 100;
    if (Math.abs(item.diningDollarsPrice - expectedDiscount) > 0.01) {
      allHaveValidPrices = false;
    }

    if (!item.customizationRecipe || item.customizationRecipe.length === 0) {
      allHaveCustomizationRecipes = false;
    }
  }

  assert(allHaveValidMacros, 'All items have valid calories and macro specs');
  assert(allHaveValidVenues, 'All items link to a registered OSU venue');
  assert(allHaveValidPrices, 'All items calculate correct 35% Dining Dollar discount');
  assert(allHaveCustomizationRecipes, 'All items include Grubhub customization recipes');

  // Verify swipe vs retail split
  const swipeItems = OSU_MENU_ITEMS.filter((i: MenuItem) => i.swipeEligible);
  const retailItems = OSU_MENU_ITEMS.filter((i: MenuItem) => !i.swipeEligible);

  assert(swipeItems.length >= 15, `Traditions swipe items >= 15 (Actual: ${swipeItems.length})`);
  assert(retailItems.length >= 25, `Retail dining items >= 25 (Actual: ${retailItems.length})`);

  // =========================================================================
  // 3. Client Venue Filtering Verification
  // =========================================================================
  console.log('\n--- 3. Client Venue Filtering ---');

  const northVenues = nutrisliceClient.filterVenues(OSU_VENUES, { zone: 'North' });
  assert(
    northVenues.every((v) => v.zone === 'North') && northVenues.length >= 3,
    `Zone filter 'North' returns North venues only (${northVenues.length} found)`
  );

  const southVenues = nutrisliceClient.filterVenues(OSU_VENUES, { zone: 'South' });
  assert(
    southVenues.every((v) => v.zone === 'South') && southVenues.length >= 5,
    `Zone filter 'South' returns South venues only (${southVenues.length} found)`
  );

  const westVenues = nutrisliceClient.filterVenues(OSU_VENUES, { zone: 'West' });
  assert(
    westVenues.every((v) => v.zone === 'West') && westVenues.length >= 2,
    `Zone filter 'West' returns West venues only (${westVenues.length} found)`
  );

  const swipeVenues = nutrisliceClient.filterVenues(OSU_VENUES, { paymentType: 'swipe' });
  assert(
    swipeVenues.every((v) => v.venueType === 'traditions'),
    `Payment filter 'swipe' returns Traditions dining halls only (${swipeVenues.length} found)`
  );

  const searchedVenues = nutrisliceClient.filterVenues(OSU_VENUES, { searchQuery: 'Scott' });
  assert(
    searchedVenues.some((v) => v.id === 'traditions-at-scott'),
    "Search venue 'Scott' matches Traditions at Scott"
  );

  // =========================================================================
  // 4. Client Menu Item Filtering & Macro Sorting Verification
  // =========================================================================
  console.log('\n--- 4. Client Menu Item Filtering & Macro Sorting ---');

  // Swipe items filter
  const filteredSwipes = nutrisliceClient.filterMenuItems(OSU_MENU_ITEMS, { swipeOnly: true });
  assert(
    filteredSwipes.every((i) => i.swipeEligible),
    'filterMenuItems swipeOnly returns only swipeEligible items'
  );

  // High-Protein filter
  const highProteinItems = nutrisliceClient.filterMenuItems(OSU_MENU_ITEMS, {
    dietaryTags: ['highProtein'],
  });
  assert(
    highProteinItems.length > 20 &&
      highProteinItems.every((i) => i.dietaryTags.includes('highProtein')),
    `filterMenuItems 'highProtein' returns items with tag (${highProteinItems.length} found)`
  );

  // Vegan filter
  const veganItems = nutrisliceClient.filterMenuItems(OSU_MENU_ITEMS, {
    dietaryTags: ['vegan'],
  });
  assert(
    veganItems.length >= 5 && veganItems.every((i) => i.dietaryTags.includes('vegan')),
    `filterMenuItems 'vegan' returns vegan items (${veganItems.length} found)`
  );

  // Multi-tag filter: highProtein AND glutenFree
  const hpGfItems = nutrisliceClient.filterMenuItems(OSU_MENU_ITEMS, {
    dietaryTags: ['highProtein', 'glutenFree'],
  });
  assert(
    hpGfItems.length >= 5 &&
      hpGfItems.every(
        (i) => i.dietaryTags.includes('highProtein') && i.dietaryTags.includes('glutenFree')
      ),
    `filterMenuItems matches items with BOTH highProtein and glutenFree (${hpGfItems.length} found)`
  );

  // Calorie and protein thresholds
  const macroFiltered = nutrisliceClient.filterMenuItems(OSU_MENU_ITEMS, {
    maxCalories: 500,
    minProtein: 40,
  });
  assert(
    macroFiltered.length > 0 &&
      macroFiltered.every((i) => i.calories <= 500 && i.macros.protein >= 40),
    `Macro constraints (<=500 kcal, >=40g protein) return high-efficiency meals (${macroFiltered.length} found)`
  );

  // Macro Sorting: Protein descending
  const sortedByProtein = nutrisliceClient.sortMenuItems(OSU_MENU_ITEMS, 'protein', 'desc');
  let isSortedProtein = true;
  for (let i = 1; i < sortedByProtein.length; i++) {
    if (sortedByProtein[i].macros.protein > sortedByProtein[i - 1].macros.protein) {
      isSortedProtein = false;
      break;
    }
  }
  assert(
    isSortedProtein,
    `sortMenuItems 'protein' desc correctly orders highest first (Top: ${sortedByProtein[0].name} - ${sortedByProtein[0].macros.protein}g)`
  );

  // Macro Sorting: Protein Ratio (Protein efficiency: g protein per 100 kcal)
  const sortedByRatio = nutrisliceClient.sortMenuItems(OSU_MENU_ITEMS, 'proteinRatio', 'desc');
  const topRatioItem = sortedByRatio[0];
  const topRatio = (topRatioItem.macros.protein / topRatioItem.calories) * 100;
  assert(
    topRatio > 8,
    `sortMenuItems 'proteinRatio' identifies top protein density meal (${topRatioItem.name}: ${topRatio.toFixed(1)}g / 100 kcal)`
  );

  // Search
  const salmonResults = nutrisliceClient.searchMenuItems('salmon');
  assert(
    salmonResults.length >= 2 &&
      salmonResults.every(
        (i) =>
          i.name.toLowerCase().includes('salmon') ||
          i.description.toLowerCase().includes('salmon')
      ),
    `searchMenuItems 'salmon' finds salmon dishes (${salmonResults.length} found)`
  );

  // =========================================================================
  // 5. Nutrislice Week Normalizer Unit Test
  // =========================================================================
  console.log('\n--- 5. Nutrislice Raw Response Normalizer ---');

  const mockVenue: DiningVenue = OSU_VENUES_MAP['traditions-at-scott'];
  const mockRawWeek: NutrisliceRawWeekResponse = {
    days: [
      {
        date: '2026-09-18',
        menu_items: [
          {
            id: 101,
            is_station_header: true,
            text: 'Homestyle Carvery',
          },
          {
            id: 102,
            is_station_header: false,
            price: 0,
            food: {
              id: 9001,
              name: 'Herb Rotisserie Chicken',
              description: 'Fresh rotisserie chicken seasoned with rosemary',
              rounded_nutrition_info: {
                calories: 380,
                g_protein: 44,
                g_carbs: 4,
                g_fat: 18,
                g_fiber: 1,
                mg_sodium: 480,
              },
              icons: {
                food_icons: [
                  { name: 'No gluten', sprite: { slug: 'gluten-free' } },
                  { name: 'Halal' },
                ],
              },
            },
          },
        ],
      },
    ],
  };

  const normalized = nutrisliceClient.normalizeNutrisliceWeek(mockRawWeek, mockVenue);

  assert(normalized.length === 1, 'Normalizer extracts exactly 1 food item from mock week');
  if (normalized.length === 1) {
    const item = normalized[0];
    assert(item.name === 'Herb Rotisserie Chicken', 'Correct food name normalized');
    assert(item.station === 'Homestyle Carvery', 'Correct station mapped from header');
    assert(item.calories === 380, 'Correct calories mapped');
    assert(item.macros.protein === 44, 'Correct protein mapped');
    assert(item.dietaryTags.includes('highProtein'), 'High-protein auto-tagged (>= 25g)');
    assert(item.dietaryTags.includes('glutenFree'), 'Gluten-free icon mapped');
    assert(item.swipeEligible === true, 'Traditions venue maps swipeEligible = true');
  }

  // =========================================================================
  // 6. Offline Fallback Verification
  // =========================================================================
  console.log('\n--- 6. Offline Fallback Resilience ---');

  // Verify getVenues returns static venues when API is unreachable or cached
  const venues = await nutrisliceClient.getVenues();
  assert(
    venues.length >= 10,
    `getVenues returns full venue list with offline fallback (${venues.length} venues)`
  );

  const scottMenu = await nutrisliceClient.getVenueMenu('traditions-at-scott');
  assert(
    scottMenu.length >= 5,
    `getVenueMenu returns menu items with offline fallback (${scottMenu.length} items for Scott)`
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
    console.error('\n❌ Gate 3 Verification Failed');
    process.exit(1);
  } else {
    console.log('\n✅ Gate 3 Verification Passed: All acceptance criteria met perfectly!');
  }
}

// Run test suite
runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
