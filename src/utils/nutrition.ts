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

export type PowerScoreTier = 'Freshman' | 'Buckeye Starter' | 'RPAC Beast' | 'Campus Legend';
export type PowerScoreTierVariant = 'scarlet' | 'gold' | 'success' | 'default';

export interface PowerScoreBreakdown {
  totalScore: number;
  proteinScore: number; // max 50
  calorieScore: number; // max 40
  loggingScore: number; // max 10
  tier: PowerScoreTier;
  tierVariant: PowerScoreTierVariant;
  tierColor: string;
  proteinRatio: number;
  calorieRatio: number;
  loggedSlotsCount: number;
  coachingTip: string;
}

/**
 * Calculates the Buckeye Power Score (0–100) based on nutritional adherence.
 * Factors in protein goal completion (50% weight), calorie adherence (40% weight),
 * and meal logging consistency (10% weight).
 */
export function calculatePowerScore(
  loggedTotals: { calories: number; macros: Pick<MacroNutrients, 'protein' | 'carbs' | 'fat'> },
  targetCalories: number,
  targetMacros: MacroTargets,
  loggedSlotsCount?: number
): number {
  return calculatePowerScoreBreakdown(loggedTotals, targetCalories, targetMacros, loggedSlotsCount).totalScore;
}

/**
 * Generates an itemized breakdown of the Buckeye Power Score with component points,
 * tier classification, and Brutus coaching tips.
 */
export function calculatePowerScoreBreakdown(
  loggedTotals: { calories: number; macros: Pick<MacroNutrients, 'protein' | 'carbs' | 'fat'> },
  targetCalories: number,
  targetMacros: MacroTargets,
  loggedSlotsCount?: number
): PowerScoreBreakdown {
  if (targetCalories <= 0 || targetMacros.protein <= 0) {
    return {
      totalScore: 50,
      proteinScore: 25,
      calorieScore: 20,
      loggingScore: 5,
      tier: 'Buckeye Starter',
      tierVariant: 'success',
      tierColor: '#2B8A3E',
      proteinRatio: 0.5,
      calorieRatio: 0.5,
      loggedSlotsCount: loggedSlotsCount ?? 0,
      coachingTip: 'Set your calorie and macro targets in Profile to get an accurate Buckeye Power Score!',
    };
  }

  // Protein adherence: up to 50 points (±10% target buffer awards full 50 pts at >= 90%)
  const proteinRatio = targetMacros.protein > 0 ? loggedTotals.macros.protein / targetMacros.protein : 0;
  let proteinScore = 0;
  if (proteinRatio >= 0.90) {
    proteinScore = 50;
  } else {
    proteinScore = Math.min(50, Math.max(0, (proteinRatio / 0.90) * 50));
  }

  // Calorie adherence: up to 40 points
  const calRatio = loggedTotals.calories / targetCalories;
  let calorieScore = 0;
  if (calRatio <= 1.0) {
    calorieScore = Math.max(0, calRatio) * 40;
  } else if (calRatio <= 1.15) {
    calorieScore = 40;
  } else {
    // Slight penalty for exceeding calories by > 15%
    const overage = calRatio - 1.15;
    calorieScore = Math.max(10, 40 - overage * 80);
  }

  // Logging consistency: up to 10 points
  let loggingScore = 0;
  let resolvedSlotCount = loggedSlotsCount ?? 0;
  if (loggedSlotsCount !== undefined) {
    loggingScore = Math.min(10, Math.max(0, resolvedSlotCount * 2.5));
  } else {
    loggingScore = loggedTotals.calories > 0 ? 10 : 0;
    resolvedSlotCount = loggedTotals.calories > 0 ? 1 : 0;
  }

  const rawTotal = proteinScore + calorieScore + loggingScore;
  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  // Tier classification
  let tier: PowerScoreTier = 'Freshman';
  let tierVariant: PowerScoreTierVariant = 'default';
  let tierColor = '#666666';

  if (totalScore >= 90) {
    tier = 'Campus Legend';
    tierVariant = 'scarlet';
    tierColor = '#BA0C2F'; // OSU Scarlet
  } else if (totalScore >= 75) {
    tier = 'RPAC Beast';
    tierVariant = 'gold';
    tierColor = '#D4AF37'; // Gold
  } else if (totalScore >= 50) {
    tier = 'Buckeye Starter';
    tierVariant = 'success';
    tierColor = '#2B8A3E'; // Emerald Green
  } else {
    tier = 'Freshman';
    tierVariant = 'default';
    tierColor = '#666666'; // Buckeye Gray
  }

  // Contextual Brutus coaching tips
  let coachingTip = 'Keep logging meals consistently to build your Buckeye Power Score!';
  if (loggedTotals.calories === 0) {
    coachingTip = 'Start your day by logging breakfast at Scott Traditions or Curl Market!';
  } else if (totalScore >= 90) {
    coachingTip = 'Incredible discipline! You are fueling at Varsity Buckeye level. Go Bucks!';
  } else if (proteinRatio < 0.6) {
    coachingTip = 'Fuel up on protein! Grab grilled chicken at Curl Market or chocolate milk post-RPAC.';
  } else if (calRatio > 1.15) {
    coachingTip = 'You have reached your calorie ceiling. Balance it out with an evening walk near Mirror Lake.';
  } else if (calRatio < 0.5) {
    coachingTip = 'You are under 50% of your energy target. Do not forget to fuel before your library study session!';
  } else if (totalScore >= 75) {
    coachingTip = 'Solid fuel strategy today! One more balanced meal will push you into Campus Legend tier.';
  }

  return {
    totalScore,
    proteinScore: Math.round(proteinScore * 10) / 10,
    calorieScore: Math.round(calorieScore * 10) / 10,
    loggingScore: Math.round(loggingScore * 10) / 10,
    tier,
    tierVariant,
    tierColor,
    proteinRatio: Math.round(proteinRatio * 100) / 100,
    calorieRatio: Math.round(calRatio * 100) / 100,
    loggedSlotsCount: resolvedSlotCount,
    coachingTip,
  };
}

