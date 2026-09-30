import { heuristicPlanner, HeuristicPlanner } from './heuristicPlanner';
import { DEMO_USER_PROFILE, UserProfile } from '../../types/user';
import { OSU_MENU_ITEMS_MAP, OSU_VENUES_MAP } from '../../data';
import { MealSlotType } from '../../types/mealPlan';

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
    it('satisfies Athletic 2,400 kcal profile within ±5%', () => {
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
      expect(plan.totalMacros.protein).toBeGreaterThanOrEqual(180 * 0.90);
    });

    it('satisfies Cut 1,800 kcal profile within ±5%', () => {
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
    });

    it('satisfies Bulk 3,000 kcal profile within ±5%', () => {
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
      const slots = Object.values(plan.meals);

      for (const slot of slots) {
        for (const item of slot.items) {
          expect(item.menuItem.dietaryTags).toContain('vegan');
        }
      }
    });

    it('strictly enforces gluten-free filter across all meals', () => {
      const gfProfile: UserProfile = {
        ...DEMO_USER_PROFILE,
        targetCalories: 2200,
        dietaryRestrictions: ['glutenFree'],
      };

      const plan = planner.generateDailyPlan(gfProfile);
      const slots = Object.values(plan.meals);

      for (const slot of slots) {
        for (const item of slot.items) {
          expect(item.menuItem.dietaryTags).toContain('glutenFree');
        }
      }
    });
  });

  describe('Campus Zone Preference & Item Exclusions', () => {
    it('prioritizes North Campus dining locations when requested', () => {
      const plan = planner.generateDailyPlan(DEMO_USER_PROFILE, {
        zone: 'North',
      });

      const slots = Object.values(plan.meals);
      const allItems = slots.flatMap((s) => s.items.map((i) => i.menuItem));
      const northItems = allItems.filter(
        (item) => OSU_VENUES_MAP[item.venueId]?.zone === 'North'
      );

      // North zone items should make up the majority
      expect(northItems.length).toBeGreaterThan(allItems.length / 2);
    });

    it('prioritizes South Campus dining locations when requested', () => {
      const plan = planner.generateDailyPlan(DEMO_USER_PROFILE, {
        zone: 'South',
      });

      const slots = Object.values(plan.meals);
      const allItems = slots.flatMap((s) => s.items.map((i) => i.menuItem));
      const southItems = allItems.filter(
        (item) => OSU_VENUES_MAP[item.venueId]?.zone === 'South'
      );

      // South zone items should make up the majority
      expect(southItems.length).toBeGreaterThan(allItems.length / 2);
    });

    it('respects excluded item IDs and omits them from the plan', () => {
      // Pick first item from a baseline plan and exclude it
      const baseline = planner.generateDailyPlan(DEMO_USER_PROFILE);
      const excludedItemId = baseline.meals.breakfast.items[0].menuItem.id;

      const plan = planner.generateDailyPlan(DEMO_USER_PROFILE, {
        excludedItemIds: [excludedItemId],
      });

      const slots = Object.values(plan.meals);
      const planItemIds = slots.flatMap((s) =>
        s.items.map((i) => i.menuItem.id)
      );
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
