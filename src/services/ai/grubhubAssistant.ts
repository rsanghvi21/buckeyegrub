/**
 * BuckeyeGrub Grubhub Order Assistant Copy Generator
 * Generates clear, human-readable customization copy for students to paste into
 * Grubhub special instructions and order notes, tailored to OSU dining venue menus.
 */

import { DailyMealPlan, MealSlot, MealSlotType, PlannedMealItem } from '../../types/mealPlan';

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

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const item of mealSlot.items) {
    const mult = item.servingMultiplier > 0 ? item.servingMultiplier : 1;
    const multPrefix = mult === 1 ? '1x' : `${mult}x`;
    lines.push(`- ${multPrefix} ${item.menuItem.name}`);

    totalCalories += item.menuItem.calories * mult;
    totalProtein += item.menuItem.macros.protein * mult;
    totalCarbs += item.menuItem.macros.carbs * mult;
    totalFat += item.menuItem.macros.fat * mult;
  }

  lines.push(
    `Nutrition: ${Math.round(totalCalories)} kcal | ${Math.round(totalProtein * 10) / 10}g P | ${Math.round(totalCarbs * 10) / 10}g C | ${Math.round(totalFat * 10) / 10}g F`
  );
  lines.push('Notes: Dressing and sauces on side. Thank you!');

  return lines.join('\n');
}

/**
 * Generates single-item customization copy with portion multiplier and dietary tags.
 */
export function generateItemCustomizationCopy(item: PlannedMealItem): string {
  const mult = item.servingMultiplier > 0 ? item.servingMultiplier : 1;
  const multPrefix = mult === 1 ? '1x' : `${mult}x`;
  const dietary = item.menuItem.dietaryTags.length > 0
    ? ` (${item.menuItem.dietaryTags.join(', ')})`
    : '';

  return `${multPrefix} ${item.menuItem.name}${dietary} - ${item.menuItem.calories * mult} kcal, ${(item.menuItem.macros.protein * mult).toFixed(0)}g protein`;
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
