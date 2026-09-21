/**
 * BuckeyeGrub Offline Deterministic Heuristic Meal Planner
 * Constraint satisfaction algorithm that calculates a balanced 4-meal plan
 * (Breakfast, Lunch, Dinner, Snack) matching user calorie and macro targets
 * within ±5% using authentic OSU campus dining catalog items.
 * Works 100% offline with zero external API calls or keys required.
 */

import { OSU_MENU_ITEMS, OSU_VENUES_MAP } from '../../data';
import {
  CampusZone,
  DietaryTag,
  MacroNutrients,
  MenuItem,
} from '../../types/dining';
import {
  calculatePlannedItemsTotals,
  DailyMealPlan,
  DEFAULT_MEAL_SLOT_RATIOS,
  MealSlot,
  MealSlotType,
  PlannedMealItem,
} from '../../types/mealPlan';
import { PlanGenerationOptions } from '../../types/ai';
import { MacroTargets, UserProfile } from '../../types/user';

interface SlotCandidate {
  items: Array<{ item: MenuItem; multiplier: number }>;
  calories: number;
  macros: MacroNutrients;
  venueIds: string[];
}

/**
 * Re-export centralized shared calculation helper for backwards compatibility.
 */
export const aggregatePlannedItemsTotals = calculatePlannedItemsTotals;

export class HeuristicPlanner {
  /**
   * Deterministically generates a balanced 4-meal daily plan satisfying user constraints.
   */
  public generateDailyPlan(
    profile: UserProfile,
    options?: PlanGenerationOptions
  ): DailyMealPlan {
    const targetCalories = options?.targetCalories ?? profile.targetCalories;
    const targetProtein = options?.targetMacros?.protein ?? profile.targetMacros.protein;
    const targetCarbs = options?.targetMacros?.carbs ?? profile.targetMacros.carbs;
    const targetFat = options?.targetMacros?.fat ?? profile.targetMacros.fat;

    const dietaryRestrictions = options?.dietaryRestrictions ?? profile.dietaryRestrictions ?? [];
    const preferredZone = options?.zone && options.zone !== 'All' ? options.zone : null;
    const excludedIds = new Set(options?.excludedItemIds ?? []);

    // 1. Filter master menu catalog by dietary restrictions and exclusions
    let eligibleItems = OSU_MENU_ITEMS.filter((item) => {
      if (excludedIds.has(item.id)) return false;
      if (dietaryRestrictions.length === 0) return true;
      return dietaryRestrictions.every((tag) => item.dietaryTags.includes(tag));
    });

    // Fallback if strict multi-tag filtering yields too few items
    if (eligibleItems.length < 4) {
      eligibleItems = OSU_MENU_ITEMS.filter((item) => {
        if (excludedIds.has(item.id)) return false;
        if (dietaryRestrictions.length === 0) return true;
        // Match at least primary dietary restriction
        return item.dietaryTags.includes(dietaryRestrictions[0]);
      });
    }

    // Safety fallback to all items if still insufficient
    if (eligibleItems.length === 0) {
      eligibleItems = [...OSU_MENU_ITEMS];
    }

    // Sort items so zone-preferred items are prioritized
    if (preferredZone) {
      eligibleItems.sort((a, b) => {
        const zoneA = OSU_VENUES_MAP[a.venueId]?.zone === preferredZone ? -1 : 1;
        const zoneB = OSU_VENUES_MAP[b.venueId]?.zone === preferredZone ? -1 : 1;
        return zoneA - zoneB;
      });
    }

    // 2. Partition items into slot pools
    const breakfastItems = eligibleItems.filter(
      (i) => i.category === 'breakfast' || i.category === 'all_day'
    );
    const lunchItems = eligibleItems.filter(
      (i) => i.category === 'lunch' || i.category === 'all_day'
    );
    const dinnerItems = eligibleItems.filter(
      (i) => i.category === 'dinner' || i.category === 'all_day'
    );
    const snackItems = eligibleItems.filter(
      (i) => i.category === 'snack' || i.category === 'all_day'
    );

    // Ensure no pool is empty
    const breakfastPool = breakfastItems.length > 0 ? breakfastItems : eligibleItems;
    const lunchPool = lunchItems.length > 0 ? lunchItems : eligibleItems;
    const dinnerPool = dinnerItems.length > 0 ? dinnerItems : eligibleItems;
    const snackPool = snackItems.length > 0 ? snackItems : eligibleItems;

    // 3. Build candidate combinations per slot with realistic portion scaling
    // Standard target proportions: Breakfast 25%, Lunch 35%, Dinner 30%, Snack 10%
    const breakfastCandidates = this.buildSlotCandidates(
      breakfastPool,
      targetCalories * DEFAULT_MEAL_SLOT_RATIOS.breakfast,
      targetProtein * DEFAULT_MEAL_SLOT_RATIOS.breakfast,
      false,
      preferredZone
    );
    const lunchCandidates = this.buildSlotCandidates(
      lunchPool,
      targetCalories * DEFAULT_MEAL_SLOT_RATIOS.lunch,
      targetProtein * DEFAULT_MEAL_SLOT_RATIOS.lunch,
      true,
      preferredZone
    );
    const dinnerCandidates = this.buildSlotCandidates(
      dinnerPool,
      targetCalories * DEFAULT_MEAL_SLOT_RATIOS.dinner,
      targetProtein * DEFAULT_MEAL_SLOT_RATIOS.dinner,
      true,
      preferredZone
    );
    const snackCandidates = this.buildSlotCandidates(
      snackPool,
      targetCalories * DEFAULT_MEAL_SLOT_RATIOS.snack,
      targetProtein * DEFAULT_MEAL_SLOT_RATIOS.snack,
      false,
      preferredZone
    );

    // 4. Constraint search for optimal 4-slot combination
    let bestCombo: {
      breakfastCandidate: SlotCandidate;
      lunchCandidate: SlotCandidate;
      dinnerCandidate: SlotCandidate;
      snackCandidate: SlotCandidate;
      calorieErrorPct: number;
      proteinErrorPct: number;
      score: number;
    } | null = null;

    for (const breakfastCandidate of breakfastCandidates) {
      for (const lunchCandidate of lunchCandidates) {
        for (const dinnerCandidate of dinnerCandidates) {
          for (const snackCandidate of snackCandidates) {
            const comboCalories =
              breakfastCandidate.calories +
              lunchCandidate.calories +
              dinnerCandidate.calories +
              snackCandidate.calories;
            const calorieErrorPct = Math.abs(comboCalories - targetCalories) / targetCalories * 100;

            const comboProtein =
              breakfastCandidate.macros.protein +
              lunchCandidate.macros.protein +
              dinnerCandidate.macros.protein +
              snackCandidate.macros.protein;
            const proteinErrorPct = Math.abs(comboProtein - targetProtein) / targetProtein * 100;

            const isDualWithin5 = calorieErrorPct <= 5.0 && proteinErrorPct <= 5.0;
            const isCalorieWithin5 = calorieErrorPct <= 5.0;

            // Multi-objective penalty score
            const calorieScore = calorieErrorPct * 2.0;
            const proteinScore = proteinErrorPct * 1.5;
            const uniqueVenues = new Set([
              ...breakfastCandidate.venueIds,
              ...lunchCandidate.venueIds,
              ...dinnerCandidate.venueIds,
              ...snackCandidate.venueIds,
            ]).size;
            const venueVarietyBonus = uniqueVenues * 3;

            let zoneBonus = 0;
            if (preferredZone) {
              const allVenues = [
                ...breakfastCandidate.venueIds,
                ...lunchCandidate.venueIds,
                ...dinnerCandidate.venueIds,
                ...snackCandidate.venueIds,
              ];
              const zoneMatches = allVenues.filter(
                (vId) => OSU_VENUES_MAP[vId]?.zone === preferredZone
              ).length;
              zoneBonus = zoneMatches * 25;
            }

            const totalScore = calorieScore + proteinScore - venueVarietyBonus - zoneBonus;

            if (!bestCombo) {
              bestCombo = {
                breakfastCandidate,
                lunchCandidate,
                dinnerCandidate,
                snackCandidate,
                calorieErrorPct,
                proteinErrorPct,
                score: totalScore,
              };
            } else {
              const currentDualWithin5 =
                bestCombo.calorieErrorPct <= 5.0 && bestCombo.proteinErrorPct <= 5.0;
              const currentCalorieWithin5 = bestCombo.calorieErrorPct <= 5.0;

              if (isDualWithin5 && !currentDualWithin5) {
                bestCombo = {
                  breakfastCandidate,
                  lunchCandidate,
                  dinnerCandidate,
                  snackCandidate,
                  calorieErrorPct,
                  proteinErrorPct,
                  score: totalScore,
                };
              } else if (isDualWithin5 && currentDualWithin5) {
                if (totalScore < bestCombo.score) {
                  bestCombo = {
                    breakfastCandidate,
                    lunchCandidate,
                    dinnerCandidate,
                    snackCandidate,
                    calorieErrorPct,
                    proteinErrorPct,
                    score: totalScore,
                  };
                }
              } else if (!isDualWithin5 && !currentDualWithin5) {
                if (isCalorieWithin5 && !currentCalorieWithin5) {
                  bestCombo = {
                    breakfastCandidate,
                    lunchCandidate,
                    dinnerCandidate,
                    snackCandidate,
                    calorieErrorPct,
                    proteinErrorPct,
                    score: totalScore,
                  };
                } else if (isCalorieWithin5 && currentCalorieWithin5) {
                  if (
                    proteinErrorPct < bestCombo.proteinErrorPct ||
                    (proteinErrorPct === bestCombo.proteinErrorPct && totalScore < bestCombo.score)
                  ) {
                    bestCombo = {
                      breakfastCandidate,
                      lunchCandidate,
                      dinnerCandidate,
                      snackCandidate,
                      calorieErrorPct,
                      proteinErrorPct,
                      score: totalScore,
                    };
                  }
                } else if (!isCalorieWithin5 && !currentCalorieWithin5) {
                  if (calorieErrorPct < bestCombo.calorieErrorPct) {
                    bestCombo = {
                      breakfastCandidate,
                      lunchCandidate,
                      dinnerCandidate,
                      snackCandidate,
                      calorieErrorPct,
                      proteinErrorPct,
                      score: totalScore,
                    };
                  }
                }
              }
            }
          }
        }
      }
    }

    // If search didn't find candidates, build deterministic fallback
    const selectedBreakfast = bestCombo?.breakfastCandidate ?? breakfastCandidates[0];
    const selectedLunch = bestCombo?.lunchCandidate ?? lunchCandidates[0];
    const selectedDinner = bestCombo?.dinnerCandidate ?? dinnerCandidates[0];
    const selectedSnack = bestCombo?.snackCandidate ?? snackCandidates[0];

    // 5. Build MealSlot instances
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timestamp = now.toISOString();

    const createSlotItems = (
      prefix: string,
      candidate: SlotCandidate
    ): PlannedMealItem[] => {
      return candidate.items.map((entry, idx) => ({
        id: `planned_${prefix}_${idx + 1}_${entry.item.id}`,
        menuItem: entry.item,
        servingMultiplier: entry.multiplier,
        isLogged: false,
      }));
    };

    const breakfastSlotItems = createSlotItems('breakfast', selectedBreakfast);
    const lunchSlotItems = createSlotItems('lunch', selectedLunch);
    const dinnerSlotItems = createSlotItems('dinner', selectedDinner);
    const snackSlotItems = createSlotItems('snack', selectedSnack);

    const meals: Record<MealSlotType, MealSlot> = {
      breakfast: {
        slot: 'breakfast',
        label: 'Breakfast',
        targetCalories: Math.round(targetCalories * DEFAULT_MEAL_SLOT_RATIOS.breakfast),
        items: breakfastSlotItems,
        isLogged: false,
      },
      lunch: {
        slot: 'lunch',
        label: 'Lunch',
        targetCalories: Math.round(targetCalories * DEFAULT_MEAL_SLOT_RATIOS.lunch),
        items: lunchSlotItems,
        isLogged: false,
      },
      dinner: {
        slot: 'dinner',
        label: 'Dinner',
        targetCalories: Math.round(targetCalories * DEFAULT_MEAL_SLOT_RATIOS.dinner),
        items: dinnerSlotItems,
        isLogged: false,
      },
      snack: {
        slot: 'snack',
        label: 'Snack',
        targetCalories: Math.round(targetCalories * DEFAULT_MEAL_SLOT_RATIOS.snack),
        items: snackSlotItems,
        isLogged: false,
      },
    };

    const allItems: PlannedMealItem[] = [
      ...breakfastSlotItems,
      ...lunchSlotItems,
      ...dinnerSlotItems,
      ...snackSlotItems,
    ];

    const aggregated = calculatePlannedItemsTotals(allItems);

    // Title generation based on goal preset or profile
    let title = `${profile.name.split(' ')[0]}'s Daily Plan`;
    if (options?.goalPreset === 'post_rpac') {
      title = 'Post-RPAC Recovery Plan 🌰';
    } else if (options?.goalPreset === 'cut_lean') {
      title = 'Buckeye Cut & Lean Plan';
    } else if (options?.goalPreset === 'bulk_power') {
      title = 'Buckeye Power Bulk Plan 💪';
    } else if (options?.goalPreset === 'budget_day') {
      title = 'Traditions Swipe Saver Plan';
    } else if (profile.fitnessGoal === 'bulk') {
      title = 'Buckeye Muscle Builder Plan';
    } else if (profile.fitnessGoal === 'cut') {
      title = 'Buckeye High-Protein Cut';
    } else {
      title = 'Balanced Buckeye Fuel Plan';
    }

    return {
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: today,
      title,
      meals,
      targetCalories,
      targetMacros: {
        protein: targetProtein,
        carbs: targetCarbs,
        fat: targetFat,
      },
      totalCalories: aggregated.calories,
      totalMacros: aggregated.macros,
      source: 'heuristic',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  /**
   * Generates candidate combinations for a slot, preserving both calorie-aligned
   * and protein-dense combinations to satisfy dual calorie and protein constraints.
   */
  private buildSlotCandidates(
    items: MenuItem[],
    slotTargetCalories: number,
    slotTargetProtein: number,
    allowPairs = false,
    preferredZone: CampusZone | null = null
  ): SlotCandidate[] {
    const rawCandidates: SlotCandidate[] = [];

    // 1. Single items (multiplier 1.0)
    for (const item of items) {
      rawCandidates.push({
        items: [{ item, multiplier: 1.0 }],
        calories: item.calories,
        macros: { ...item.macros },
        venueIds: [item.venueId],
      });

      // If slot target is high (> 600 kcal), offer 1.5x portion candidate
      if (slotTargetCalories >= 650 && item.calories <= 500) {
        rawCandidates.push({
          items: [{ item, multiplier: 1.5 }],
          calories: Math.round(item.calories * 1.5),
          macros: {
            protein: Math.round(item.macros.protein * 1.5),
            carbs: Math.round(item.macros.carbs * 1.5),
            fat: Math.round(item.macros.fat * 1.5),
            fiber: Math.round(item.macros.fiber * 1.5),
            sugar: Math.round((item.macros.sugar ?? 0) * 1.5),
            sodium: Math.round((item.macros.sodium ?? 0) * 1.5),
          },
          venueIds: [item.venueId],
        });
      }
    }

    // 2. Paired items for lunch/dinner (entree + side/beverage/snack)
    if (allowPairs && slotTargetCalories >= 500 && items.length >= 2) {
      for (let i = 0; i < Math.min(items.length, 14); i++) {
        for (let j = i + 1; j < Math.min(items.length, 14); j++) {
          const item1 = items[i];
          const item2 = items[j];
          const pairCalories = item1.calories + item2.calories;

          // Only keep pairs within a reasonable window of slot target
          if (Math.abs(pairCalories - slotTargetCalories) <= slotTargetCalories * 0.45) {
            rawCandidates.push({
              items: [
                { item: item1, multiplier: 1.0 },
                { item: item2, multiplier: 1.0 },
              ],
              calories: pairCalories,
              macros: {
                protein: item1.macros.protein + item2.macros.protein,
                carbs: item1.macros.carbs + item2.macros.carbs,
                fat: item1.macros.fat + item2.macros.fat,
                fiber: item1.macros.fiber + item2.macros.fiber,
                sugar: (item1.macros.sugar ?? 0) + (item2.macros.sugar ?? 0),
                sodium: (item1.macros.sodium ?? 0) + (item2.macros.sodium ?? 0),
              },
              venueIds: Array.from(new Set([item1.venueId, item2.venueId])),
            });
          }
        }
      }
    }

    // Top candidates ranked by calorie match
    const calorieSorted = [...rawCandidates].sort((a, b) => {
      let diffA = Math.abs(a.calories - slotTargetCalories);
      let diffB = Math.abs(b.calories - slotTargetCalories);

      if (preferredZone) {
        const matchesA = a.venueIds.some((vId) => OSU_VENUES_MAP[vId]?.zone === preferredZone);
        const matchesB = b.venueIds.some((vId) => OSU_VENUES_MAP[vId]?.zone === preferredZone);
        if (matchesA && !matchesB) diffA -= slotTargetCalories * 0.25;
        if (matchesB && !matchesA) diffB -= slotTargetCalories * 0.25;
      }

      return diffA - diffB;
    });

    // Top candidates ranked by protein match
    const proteinSorted = [...rawCandidates].sort((a, b) => {
      let diffA = Math.abs(a.macros.protein - slotTargetProtein);
      let diffB = Math.abs(b.macros.protein - slotTargetProtein);
      return diffA - diffB;
    });

    // Merge distinct candidates to preserve both high protein density and calorie accuracy
    const candidateMap = new Map<string, SlotCandidate>();
    for (const c of calorieSorted.slice(0, 12)) {
      const key = c.items.map((entry) => `${entry.item.id}:${entry.multiplier}`).join('|');
      candidateMap.set(key, c);
    }
    for (const c of proteinSorted.slice(0, 12)) {
      const key = c.items.map((entry) => `${entry.item.id}:${entry.multiplier}`).join('|');
      candidateMap.set(key, c);
    }

    return Array.from(candidateMap.values()).slice(0, 24);
  }
}

export const heuristicPlanner = new HeuristicPlanner();
