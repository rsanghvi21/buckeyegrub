/**
 * BuckeyeGrub Nutrition & TDEE Calculation Utilities
 * Implements standard Mifflin-St Jeor BMR, activity-adjusted TDEE,
 * goal-specific macronutrient target distributions, and Buckeye Power Score.
 */

import { FitnessGoal, MacroTargets } from '../types/user';
import { MacroNutrients } from '../types/dining';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'very_active'
  | 'extra_active';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,       // Little to no exercise, desk work
  light: 1.375,         // Light exercise 1-3 days/week
  moderate: 1.55,       // Moderate exercise 3-5 days/week (RPAC regular)
  very_active: 1.725,   // Hard exercise 6-7 days/week (Varsity / Club athlete)
  extra_active: 1.9,    // Very hard daily training + physical labor
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (Library / Desk work)',
  light: 'Lightly Active (1-2 days/week)',
  moderate: 'Moderately Active (3-5 days at RPAC)',
  very_active: 'Very Active (Varsity / 6+ days)',
  extra_active: 'Extremely Active (Two-a-days)',
};

/**
 * Calculates Basal Metabolic Rate (BMR) via the Mifflin-St Jeor equation.
 */
export function calculateBmr(
  weightLbs: number,
  heightInches: number,
  ageYears: number,
  sex: 'male' | 'female' = 'male'
): number {
  if (weightLbs <= 0 || heightInches <= 0 || ageYears <= 0) {
    return 0;
  }
  const weightKg = weightLbs * 0.45359237;
  const heightCm = heightInches * 2.54;

  const baseBmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const bmr = sex === 'male' ? baseBmr + 5 : baseBmr - 161;

  return Math.max(0, Math.round(bmr));
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 */
export function calculateTdee(
  bmr: number,
  activityLevel: ActivityLevel = 'moderate'
): number {
  if (bmr <= 0) return 0;
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55;
  return Math.round(bmr * multiplier);
}

export interface SuggestedMacrosResult {
  targetCalories: number;
  targetMacros: MacroTargets;
}

/**
 * Calculates suggested calories and macro targets based on TDEE and fitness goal.
 */
export function calculateSuggestedMacros(
  tdee: number,
  goal: FitnessGoal
): SuggestedMacrosResult {
  const safeTdee = Math.max(1200, tdee);
  let calories = safeTdee;

  // Macro calorie percentages: [protein, carbs, fat]
  let pRatio = 0.30;
  let cRatio = 0.45;
  let fRatio = 0.25;

  switch (goal) {
    case 'bulk':
      calories = Math.round(safeTdee + 350);
      pRatio = 0.25;
      cRatio = 0.50;
      fRatio = 0.25;
      break;
    case 'cut':
      calories = Math.max(1200, Math.round(safeTdee - 500));
      pRatio = 0.35;
      cRatio = 0.35;
      fRatio = 0.30;
      break;
    case 'athletic':
      calories = Math.round(safeTdee + 150);
      pRatio = 0.30;
      cRatio = 0.45;
      fRatio = 0.25;
      break;
    case 'maintain':
    default:
      calories = Math.round(safeTdee);
      pRatio = 0.25;
      cRatio = 0.45;
      fRatio = 0.30;
      break;
  }

  const proteinGrams = Math.round((calories * pRatio) / 4);
  const carbsGrams = Math.round((calories * cRatio) / 4);
  const fatGrams = Math.round((calories * fRatio) / 9);
  const fiberGrams = Math.round((calories / 1000) * 14);

  return {
    targetCalories: calories,
    targetMacros: {
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams,
      fiber: fiberGrams,
    },
  };
}

/**
 * Calculates the Buckeye Power Score (0–100) based on nutritional adherence.
 * Factors in protein goal completion (50% weight), calorie adherence (40% weight),
 * and logging consistency (10% base).
 */
export function calculatePowerScore(
  loggedTotals: { calories: number; macros: Pick<MacroNutrients, 'protein' | 'carbs' | 'fat'> },
  targetCalories: number,
  targetMacros: MacroTargets
): number {
  if (targetCalories <= 0 || targetMacros.protein <= 0) {
    return 50;
  }

  // Protein adherence: 0 to 1.0 capped at 1.15
  const proteinRatio = loggedTotals.macros.protein / targetMacros.protein;
  const proteinScore = Math.min(1.0, proteinRatio) * 50;

  // Calorie adherence: optimal is 90% to 105% of target
  const calRatio = loggedTotals.calories / targetCalories;
  let calScore = 0;
  if (calRatio <= 1.0) {
    calScore = calRatio * 40;
  } else if (calRatio <= 1.15) {
    calScore = 40;
  } else {
    // Slight penalty for exceeding calories by > 15%
    const overage = calRatio - 1.15;
    calScore = Math.max(10, 40 - overage * 80);
  }

  // Logging base bonus
  const loggingBonus = loggedTotals.calories > 0 ? 10 : 0;

  const totalScore = Math.round(proteinScore + calScore + loggingBonus);
  return Math.min(100, Math.max(0, totalScore));
}
