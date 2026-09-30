import {
  calculateBmr,
  calculateTdee,
  calculateSuggestedMacros,
  calculatePowerScore,
  calculatePowerScoreBreakdown,
  ACTIVITY_MULTIPLIERS,
  ACTIVITY_LABELS,
  ActivityLevel,
} from './nutrition';
import { lightTheme } from '../constants/theme';

describe('Nutrition & TDEE Calculation Utilities', () => {
  describe('calculateBmr (Mifflin-St Jeor equation)', () => {
    it('calculates expected BMR for male profiles', () => {
      // 180 lbs = 81.6466 kg, 70 inches = 177.8 cm, age 21
      // base = 10 * 81.6466 + 6.25 * 177.8 - 5 * 21 = 816.466 + 1111.25 - 105 = 1822.716
      // male = base + 5 = 1827.716 -> Math.round = 1828
      const bmr = calculateBmr(180, 70, 21, 'male');
      expect(bmr).toBe(1828);
    });

    it('calculates expected BMR for female profiles', () => {
      // 140 lbs = 63.5029 kg, 65 inches = 165.1 cm, age 20
      // base = 10 * 63.5029 + 6.25 * 165.1 - 5 * 20 = 635.029 + 1031.875 - 100 = 1566.904
      // female = base - 161 = 1405.904 -> Math.round = 1406
      const bmr = calculateBmr(140, 65, 20, 'female');
      expect(bmr).toBe(1406);
    });

    it('defaults to male if sex is omitted', () => {
      const bmrDefault = calculateBmr(180, 70, 21);
      const bmrMale = calculateBmr(180, 70, 21, 'male');
      expect(bmrDefault).toBe(bmrMale);
    });

    it('clamps to 0 for invalid or non-positive measurements', () => {
      expect(calculateBmr(0, 70, 21)).toBe(0);
      expect(calculateBmr(-150, 70, 21)).toBe(0);
      expect(calculateBmr(180, 0, 21)).toBe(0);
      expect(calculateBmr(180, 70, 0)).toBe(0);
      expect(calculateBmr(-50, -50, -20)).toBe(0);
    });
  });

  describe('calculateTdee (Total Daily Energy Expenditure)', () => {
    const testBmr = 1800;

    it('applies standard activity multipliers correctly', () => {
      expect(calculateTdee(testBmr, 'sedentary')).toBe(Math.round(1800 * 1.2)); // 2160
      expect(calculateTdee(testBmr, 'light')).toBe(Math.round(1800 * 1.375)); // 2475
      expect(calculateTdee(testBmr, 'moderate')).toBe(Math.round(1800 * 1.55)); // 2790
      expect(calculateTdee(testBmr, 'very_active')).toBe(Math.round(1800 * 1.725)); // 3105
      expect(calculateTdee(testBmr, 'extra_active')).toBe(Math.round(1800 * 1.9)); // 3420
    });

    it('defaults to moderate activity (1.55) when activityLevel is omitted', () => {
      expect(calculateTdee(testBmr)).toBe(calculateTdee(testBmr, 'moderate'));
    });

    it('returns 0 if BMR is 0 or negative', () => {
      expect(calculateTdee(0, 'moderate')).toBe(0);
      expect(calculateTdee(-500, 'very_active')).toBe(0);
    });

    it('contains valid activity labels for all activity levels', () => {
      const levels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very_active', 'extra_active'];
      for (const level of levels) {
        expect(ACTIVITY_MULTIPLIERS[level]).toBeGreaterThan(1.0);
        expect(typeof ACTIVITY_LABELS[level]).toBe('string');
        expect(ACTIVITY_LABELS[level].length).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateSuggestedMacros', () => {
    const tdee = 2500;

    it('calculates bulk targets (+350 kcal, 25% P, 50% C, 25% F)', () => {
      const result = calculateSuggestedMacros(tdee, 'bulk');
      const expectedCalories = 2500 + 350; // 2850
      expect(result.targetCalories).toBe(expectedCalories);
      expect(result.targetMacros.protein).toBe(Math.round((2850 * 0.25) / 4)); // 178g
      expect(result.targetMacros.carbs).toBe(Math.round((2850 * 0.50) / 4)); // 356g
      expect(result.targetMacros.fat).toBe(Math.round((2850 * 0.25) / 9)); // 79g
      expect(result.targetMacros.fiber).toBe(Math.round((2850 / 1000) * 14)); // 40g
    });

    it('calculates cut targets (-500 kcal, 35% P, 35% C, 30% F)', () => {
      const result = calculateSuggestedMacros(tdee, 'cut');
      const expectedCalories = 2500 - 500; // 2000
      expect(result.targetCalories).toBe(expectedCalories);
      expect(result.targetMacros.protein).toBe(Math.round((2000 * 0.35) / 4)); // 175g
      expect(result.targetMacros.carbs).toBe(Math.round((2000 * 0.35) / 4)); // 175g
      expect(result.targetMacros.fat).toBe(Math.round((2000 * 0.30) / 9)); // 67g
      expect(result.targetMacros.fiber).toBe(Math.round((2000 / 1000) * 14)); // 28g
    });

    it('enforces a safe calorie floor of 1200 kcal for aggressive cuts', () => {
      const lowTdee = 1400;
      const result = calculateSuggestedMacros(lowTdee, 'cut');
      expect(result.targetCalories).toBe(1200);
      expect(result.targetCalories).toBeGreaterThanOrEqual(1200);
    });

    it('calculates athletic targets (+150 kcal, 30% P, 45% C, 25% F)', () => {
      const result = calculateSuggestedMacros(tdee, 'athletic');
      const expectedCalories = 2500 + 150; // 2650
      expect(result.targetCalories).toBe(expectedCalories);
      expect(result.targetMacros.protein).toBe(Math.round((2650 * 0.30) / 4)); // 199g
      expect(result.targetMacros.carbs).toBe(Math.round((2650 * 0.45) / 4)); // 298g
      expect(result.targetMacros.fat).toBe(Math.round((2650 * 0.25) / 9)); // 74g
    });

    it('calculates maintain targets (baseline safe TDEE, 25% P, 45% C, 30% F)', () => {
      const result = calculateSuggestedMacros(tdee, 'maintain');
      expect(result.targetCalories).toBe(2500);
      expect(result.targetMacros.protein).toBe(Math.round((2500 * 0.25) / 4)); // 156g
      expect(result.targetMacros.carbs).toBe(Math.round((2500 * 0.45) / 4)); // 281g
      expect(result.targetMacros.fat).toBe(Math.round((2500 * 0.30) / 9)); // 83g
    });
  });

  describe('calculatePowerScore & calculatePowerScoreBreakdown', () => {
    const targetCalories = 2400;
    const targetMacros = { protein: 180, carbs: 260, fat: 70, fiber: 34 };

    it('awards maximum points and Campus Legend tier for optimal nutritional intake', () => {
      const perfectLogged = {
        calories: 2400,
        macros: { protein: 180, carbs: 260, fat: 70 },
      };
      const breakdown = calculatePowerScoreBreakdown(perfectLogged, targetCalories, targetMacros, 4);

      expect(breakdown.proteinScore).toBe(50);
      expect(breakdown.calorieScore).toBe(40);
      expect(breakdown.loggingScore).toBe(10);
      expect(breakdown.totalScore).toBe(100);
      expect(breakdown.tier).toBe('Campus Legend');
      expect(breakdown.tierVariant).toBe('scarlet');
      expect(breakdown.tierColor).toBe(lightTheme.colors.scarlet);
    });

    it('classifies RPAC Beast tier for 75-89 score', () => {
      const partialLogged = {
        calories: 2000,
        macros: { protein: 145, carbs: 220, fat: 60 },
      };
      const breakdown = calculatePowerScoreBreakdown(partialLogged, targetCalories, targetMacros, 3);
      expect(breakdown.totalScore).toBeGreaterThanOrEqual(75);
      expect(breakdown.totalScore).toBeLessThan(90);
      expect(breakdown.tier).toBe('RPAC Beast');
      expect(breakdown.tierVariant).toBe('gold');
    });

    it('classifies Buckeye Starter tier for 50-74 score', () => {
      const lowLogged = {
        calories: 1400,
        macros: { protein: 100, carbs: 150, fat: 40 },
      };
      const breakdown = calculatePowerScoreBreakdown(lowLogged, targetCalories, targetMacros, 2);
      expect(breakdown.totalScore).toBeGreaterThanOrEqual(50);
      expect(breakdown.totalScore).toBeLessThan(75);
      expect(breakdown.tier).toBe('Buckeye Starter');
    });

    it('classifies Freshman tier for < 50 score', () => {
      const minimalLogged = {
        calories: 300,
        macros: { protein: 15, carbs: 40, fat: 10 },
      };
      const breakdown = calculatePowerScoreBreakdown(minimalLogged, targetCalories, targetMacros, 1);
      expect(breakdown.totalScore).toBeLessThan(50);
      expect(breakdown.tier).toBe('Freshman');
    });

    it('provides fallback breakdown when target values are zero', () => {
      const breakdown = calculatePowerScoreBreakdown(
        { calories: 500, macros: { protein: 30, carbs: 50, fat: 15 } },
        0,
        { protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );
      expect(breakdown.totalScore).toBe(50);
      expect(breakdown.coachingTip).toContain('Set your calorie and macro targets');
    });

    it('calculatePowerScore delegates directly to calculatePowerScoreBreakdown totalScore', () => {
      const logged = {
        calories: 2200,
        macros: { protein: 170, carbs: 240, fat: 65 },
      };
      const score = calculatePowerScore(logged, targetCalories, targetMacros, 4);
      const breakdown = calculatePowerScoreBreakdown(logged, targetCalories, targetMacros, 4);
      expect(score).toBe(breakdown.totalScore);
    });
  });
});
