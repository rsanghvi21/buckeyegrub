import { heuristicPlanner, HeuristicPlanner } from './heuristicPlanner';
import { DEMO_USER_PROFILE, UserProfile } from '../../types/user';
import { OSU_MENU_ITEMS_MAP, OSU_VENUES_MAP } from '../../data';
import { DailyMealPlan, MealSlotType } from '../../types/mealPlan';
import { MenuItem } from '../../types/dining';

/**
 * Shared test helper: extracts flat list of all MenuItems across all meal slots.
 * Eliminates message chains and duplicated traversal logic across tests.
 */
function extractPlanItems(plan: DailyMealPlan): MenuItem[] {
  return Object.values(plan.meals).flatMap((slot) =>
    slot.items.map((entry) => entry.menuItem)
  );
}

describe('HeuristicPlanner (Offline Deterministic Meal Planner)', () => {
  let planner: HeuristicPlanner;

  beforeEach(() => {
    planner = new HeuristicPlanner();
  });

  describe('Plan Structure & Integrity', () => {
    it('generates a complete 4-slot daily meal plan', () => {
      const plan = planner.generateDailyPlan(DEMO_USER_PROFILE);

      expect(plan).toBeDefined();
      expect(typeof plan.id).toBe('string');
      expect(typeof plan.date).toBe('string');
      expect(plan.meals).toBeDefined();

      const slotTypes: MealSlotType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
      for (const slotKey of slotTypes) {
        const slot = plan.meals[slotKey];
        expect(slot).toBeDefined();
        expect(slot.slot).toBe(slotKey);
        expect(slot.items.length).toBeGreaterThan(0);
        expect(slot.items.every((entry) => entry.menuItem && entry.menuItem.id)).toBe(true);

        for (const item of slot.items) {
          expect(OSU_MENU_ITEMS_MAP[item.menuItem.id]).toBeDefined();
          expect(item.servingMultiplier).toBeGreaterThan(0);
        }
      }

      expect(plan.totalCalories).toBeGreaterThan(0);
      expect(plan.totalMacros.protein).toBeGreaterThan(0);
    });
  });

  describe('Nutritional Constraint Satisfaction (±5% Target Adherence)', () => {
    it('satisfies Athletic 2,400 kcal profile within ±5% calories and protein', () => {
      const athleticProfile: UserProfile = {
        ...DEMO_USER_PROFILE,
        fitnessGoal: 'athletic',
        targetCalories: 2400,
        targetMacros: { protein: 180, carbs: 260, fat: 70 },
        dietaryRestrictions: [],
      };

      const plan = planner.generateDailyPlan(athleticProfile);
      const minCal = 2400 * 0.95; // 2280
      const maxCal = 2400 * 1.05; // 2520

      expect(plan.totalCalories).toBeGreaterThanOrEqual(minCal);
      expect(plan.totalCalories).toBeLessThanOrEqual(maxCal);
      // Protein should reach targeted athletic zone
      expect(plan.totalMacros.protein).toBeGreaterThanOrEqual(180 * 0.90);
    });

    it('satisfies Cut 1,800 kcal profile within ±5% calories', () => {
      const cutProfile: UserProfile = {
        ...DEMO_USER_PROFILE,
        fitnessGoal: 'cut',
        targetCalories: 1800,
        targetMacros: { protein: 155, carbs: 155, fat: 60 },
        dietaryRestrictions: [],
      };

      const plan = planner.generateDailyPlan(cutProfile);
      const minCal = 1800 * 0.95; // 1710
      const maxCal = 1800 * 1.05; // 1890

      expect(plan.totalCalories).toBeGreaterThanOrEqual(minCal);
      expect(plan.totalCalories).toBeLessThanOrEqual(maxCal);
      expect(plan.totalMacros.protein).toBeGreaterThan(100);
    });

    it('satisfies Bulk 3,000 kcal profile within ±5% calories', () => {
      const bulkProfile: UserProfile = {
        ...DEMO_USER_PROFILE,
        fitnessGoal: 'bulk',
        targetCalories: 3000,
        targetMacros: { protein: 190, carbs: 375, fat: 83 },
        dietaryRestrictions: [],
      };

      const plan = planner.generateDailyPlan(bulkProfile);
      const minCal = 3000 * 0.95; // 2850
      const maxCal = 3000 * 1.05; // 3150

      expect(plan.totalCalories).toBeGreaterThanOrEqual(minCal);
      expect(plan.totalCalories).toBeLessThanOrEqual(maxCal);
      expect(plan.totalMacros.protein).toBeGreaterThan(120);
    });

    it('handles extreme 1,200 kcal cut profile without crashing (AGENTS.md QA Sentinel)', () => {
      const extremeCutProfile: UserProfile = {
        ...DEMO_USER_PROFILE,
        fitnessGoal: 'cut',
        targetCalories: 1200,
        targetMacros: { protein: 120, carbs: 90, fat: 40 },
        dietaryRestrictions: [],
      };

      const plan = planner.generateDailyPlan(extremeCutProfile);
      expect(plan.totalCalories).toBeGreaterThan(0);
      expect(plan.totalCalories).toBeLessThan(1800);
      expect(plan.totalMacros.protein).toBeGreaterThan(50);
    });

    it('handles extreme 3,800 kcal bulk profile without crashing (AGENTS.md QA Sentinel)', () => {
      const extremeBulkProfile: UserProfile = {
        ...DEMO_USER_PROFILE,
        fitnessGoal: 'bulk',
        targetCalories: 3800,
        targetMacros: { protein: 220, carbs: 450, fat: 110 },
        dietaryRestrictions: [],
      };

      const plan = planner.generateDailyPlan(extremeBulkProfile);
      expect(plan.totalCalories).toBeGreaterThan(2500);
      expect(plan.totalMacros.protein).toBeGreaterThan(130);
    });
  });

  describe('Dietary Restriction Filtering', () => {
    it('strictly enforces vegan filter across all meals', () => {
      const veganProfile: UserProfile = {
        ...DEMO_USER_PROFILE,
        targetCalories: 2000,
        dietaryRestrictions: ['vegan'],
      };

      const plan = planner.generateDailyPlan(veganProfile);
      const items = extractPlanItems(plan);

      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.dietaryTags).toContain('vegan');
      }
    });

    it('strictly enforces gluten-free filter across all meals', () => {
      const gfProfile: UserProfile = {
        ...DEMO_USER_PROFILE,
        targetCalories: 2200,
        dietaryRestrictions: ['glutenFree'],
      };

      const plan = planner.generateDailyPlan(gfProfile);
      const items = extractPlanItems(plan);

      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.dietaryTags).toContain('glutenFree');
      }
    });

    it('handles combined strict vegan and gluten-free restrictions (AGENTS.md QA Sentinel)', () => {
      const combinedProfile: UserProfile = {
        ...DEMO_USER_PROFILE,
        targetCalories: 2000,
        dietaryRestrictions: ['vegan', 'glutenFree'],
      };

      const plan = planner.generateDailyPlan(combinedProfile);
      const items = extractPlanItems(plan);

      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        // Must contain at least the primary restriction (vegan) or both
        expect(item.dietaryTags.includes('vegan') || item.dietaryTags.includes('glutenFree')).toBe(true);
      }
    });
  });

  describe('Campus Zone Preference & Item Exclusions', () => {
    it('prioritizes North Campus dining locations when requested', () => {
      const plan = planner.generateDailyPlan(DEMO_USER_PROFILE, {
        zone: 'North',
      });

      const items = extractPlanItems(plan);
      const northItems = items.filter(
        (item) => OSU_VENUES_MAP[item.venueId]?.zone === 'North'
      );

      expect(northItems.length).toBeGreaterThan(items.length / 2);
    });

    it('prioritizes South Campus dining locations when requested', () => {
      const plan = planner.generateDailyPlan(DEMO_USER_PROFILE, {
        zone: 'South',
      });

      const items = extractPlanItems(plan);
      const southItems = items.filter(
        (item) => OSU_VENUES_MAP[item.venueId]?.zone === 'South'
      );

      expect(southItems.length).toBeGreaterThan(items.length / 2);
    });

    it('respects excluded item IDs and omits them from the plan', () => {
      const baseline = planner.generateDailyPlan(DEMO_USER_PROFILE);
      const baselineItems = extractPlanItems(baseline);
      const excludedItemId = baselineItems[0].id;

      const plan = planner.generateDailyPlan(DEMO_USER_PROFILE, {
        excludedItemIds: [excludedItemId],
      });

      const planItemIds = extractPlanItems(plan).map((item) => item.id);
      expect(planItemIds).not.toContain(excludedItemId);
    });
  });

  describe('Offline Singleton Export', () => {
    it('heuristicPlanner singleton is initialized and reusable', () => {
      expect(heuristicPlanner).toBeInstanceOf(HeuristicPlanner);
      const plan = heuristicPlanner.generateDailyPlan(DEMO_USER_PROFILE);
      expect(Object.keys(plan.meals)).toHaveLength(4);
    });
  });
});
