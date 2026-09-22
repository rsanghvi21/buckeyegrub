/**
 * BuckeyeGrub Grubhub Order Assistant Copy Generator
 * Generates clear, human-readable customization copy for students to paste into
 * Grubhub special instructions and order notes, tailored to OSU dining venue menus.
 */

import {
  DailyMealPlan,
  MealSlot,
  MealSlotType,
  PlannedMealItem,
  calculatePlannedItemsTotals,
} from '../../types/mealPlan';

/**
 * Generates structured copy for an entire meal slot ready for Grubhub copy/paste.
 */
export function generateGrubhubCustomizationCopy(
  mealSlot: MealSlot,
  venueName?: string
): string {
  const lines: string[] = [];

  const heading = venueName ? `${venueName} Order (${mealSlot.label}):` : `${mealSlot.label} Order:`;
  lines.push(heading);

  for (const item of mealSlot.items) {
    const mult = item.servingMultiplier > 0 ? item.servingMultiplier : 1;
    const multPrefix = mult === 1 ? '1x' : `${mult}x`;
    lines.push(`- ${multPrefix} ${item.menuItem.name}`);
    if (item.menuItem.customizationRecipe) {
      lines.push(`  Customization: ${item.menuItem.customizationRecipe}`);
    }
  }

  const { calories, macros } = calculatePlannedItemsTotals(mealSlot.items);

  lines.push(
    `Nutrition: ${Math.round(calories)} kcal | ${Math.round(macros.protein * 10) / 10}g P | ${Math.round(macros.carbs * 10) / 10}g C | ${Math.round(macros.fat * 10) / 10}g F`
  );
  lines.push('Notes: Dressing and sauces on side. Thank you!');

  return lines.join('\n');
}

/**
 * Generates single-item customization copy with portion multiplier, recipe, and dietary tags.
 */
export function generateItemCustomizationCopy(item: PlannedMealItem): string {
  const mult = item.servingMultiplier > 0 ? item.servingMultiplier : 1;
  const multPrefix = mult === 1 ? '1x' : `${mult}x`;
  const dietary = item.menuItem.dietaryTags.length > 0
    ? ` (${item.menuItem.dietaryTags.join(', ')})`
    : '';
  const recipe = item.menuItem.customizationRecipe
    ? ` • ${item.menuItem.customizationRecipe}`
    : '';

  return `${multPrefix} ${item.menuItem.name}${dietary}${recipe} - ${item.menuItem.calories * mult} kcal, ${(item.menuItem.macros.protein * mult).toFixed(0)}g protein`;
}

/**
 * Generates order assistant summaries across all 4 meal slots of a daily plan.
 */
export function generateMealPlanGrubhubSummary(
  plan: DailyMealPlan
): Record<MealSlotType, string> {
  return {
    breakfast: generateGrubhubCustomizationCopy(plan.meals.breakfast),
    lunch: generateGrubhubCustomizationCopy(plan.meals.lunch),
    dinner: generateGrubhubCustomizationCopy(plan.meals.dinner),
    snack: generateGrubhubCustomizationCopy(plan.meals.snack),
  };
}
