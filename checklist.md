# BuckeyeGrub – Master Implementation Checklist

> **Project**: BuckeyeGrub (v1.1 BRD)  
> **Target Platforms**: iOS, Android, Web (React Native + Expo)  
> **Status**: Ready to Begin  

---

## Checkpoint 1: Project Scaffolding & Tooling Setup
- [ ] Initialize Expo project with TypeScript template and Expo Router (`app/` directory).
- [ ] Install production dependencies:
  - Navigation: `expo-router`, `expo-linking`, `expo-constants`, `expo-status-bar`
  - UI & Animation: `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `lucide-react-native`
  - State & Storage: `zustand`, `@react-native-async-storage/async-storage`
- [ ] Configure `app.json` (scheme: `buckeyegrub`, orientation, adaptive icons, web bundler `metro`).
- [ ] Configure `tsconfig.json` with strict type checking and `@/` path alias.
- [ ] Configure `babel.config.js` with `react-native-reanimated/plugin`.
- [ ] Verify clean build and type check (`npx tsc --noEmit`).
- **Gate 1 Acceptance Criteria**: Project starts on Expo web with no errors; basic blank layout renders.

---

## Checkpoint 2: OSU Design System & Component Library
- [ ] Create `src/constants/theme.ts` with official OSU palette:
  - Scarlet: `#BA0C2F` / `#BB0000`
  - Buckeye Gray: `#A7B1B7` / `#666666`
  - Neutral Dark: `#1E1E24`
  - Light Background: `#F8F9FA`
  - Surface White: `#FFFFFF`
  - Accent Gold: `#D4AF37`
- [ ] Implement atomic UI primitives under `src/components/ui/`:
  - [ ] `Button.tsx` (Primary Scarlet, Secondary Grey, Outline, Icon buttons with press animations).
  - [ ] `Card.tsx` (Elevated card with borders, rounded corners, shadow).
  - [ ] `Badge.tsx` (Dietary tags: High-Protein, Vegan, Halal, Gluten-Free).
  - [ ] `Input.tsx` (Branded text input with focus states).
  - [ ] `MacroRing.tsx` (Animated SVG circular progress ring for calories/macros).
  - [ ] `ProgressBar.tsx` (Horizontal animated macro bar for Protein, Carbs, Fat).
- [ ] Create global navigation header component `src/components/navigation/Header.tsx` with Buckeye leaf motif.
- **Gate 2 Acceptance Criteria**: UI components render with theme colors and responsive scaling; animations execute smoothly without console warnings.

---

## Checkpoint 3: Campus Dining & Nutrislice Catalog
- [ ] Define TypeScript types in `src/types/dining.ts` (`DiningVenue`, `MenuItem`, `CampusZone`, `PaymentType`).
- [ ] Populate `src/data/osuVenues.ts` with 10+ OSU campus dining locations:
  - [ ] Traditions at Scott (North Campus)
  - [ ] Traditions at Kennedy (South Campus)
  - [ ] Traditions at Morrill (West Campus)
  - [ ] Curl Market (North Campus)
  - [ ] Union Market (Ohio Union / South Campus)
  - [ ] 12th Avenue Bread Company (South Campus)
  - [ ] Neil Avenue Cafe (South Campus)
  - [ ] PAD - Pizza & Delivery (North Campus)
  - [ ] Woody's Tavern (Ohio Union)
  - [ ] Berry Cafe (Thompson Library)
- [ ] Populate `src/data/osuMenuItems.ts` with 50+ real campus items with accurate calories, protein, carbs, fat, fiber, price, swipe eligibility, and allergen tags.
- [ ] Implement `src/services/nutrislice/nutrisliceClient.ts` with caching, venue filtering, macro sorting, and search.
- **Gate 3 Acceptance Criteria**: Data layer returns accurate dining venues and menu items filtered by campus zone, payment type, or dietary restriction.

---

## Checkpoint 4: State Management & Persistence Layer
- [ ] Define TypeScript models in `src/types/user.ts` and `src/types/mealPlan.ts`.
- [ ] Implement `src/store/useUserStore.ts`:
  - Profile state (name, fitness goal: bulk/cut/maintain, calorie target, macro targets).
  - BuckID balances (Traditions Swipes remaining, Dining Dollars balance).
  - Dietary restrictions array.
  - Pre-seeded demo user (*"Brutus the Buckeye"*).
- [ ] Implement `src/store/useMealPlanStore.ts`:
  - Active daily meal plan (Breakfast, Lunch, Dinner, Snack).
  - Meal logging toggle (`isLogged`).
  - Favorites and saved meal plans collection.
  - Item swap action.
- [ ] Implement `src/store/useDiningStore.ts`:
  - Selected campus zone filter (`North` | `South` | `West` | `All`).
  - Selected payment filter (`All` | `Traditions Swipe` | `Dining Dollars`).
  - Search query and active dietary tags.
- [ ] Wire all stores to `@react-native-async-storage/async-storage` for auto-persistence across app reloads.
- **Gate 4 Acceptance Criteria**: State changes persist across browser/simulator refresh; resetting to demo state works reliably.

---

## Checkpoint 5: BrutusAI Engine (Gemini & Heuristic Fallback)
- [ ] Implement `src/services/ai/prompts.ts`:
  - Brutus Buckeye persona system prompt.
  - Campus knowledge grounding (gyms: RPAC, North Rec; libraries: Thompson, 18th Ave).
  - Strict JSON schema for daily meal plan output.
- [ ] Implement `src/services/ai/heuristicPlanner.ts`:
  - Constraint-satisfaction algorithm that calculates a 4-meal plan matching user's calorie and protein goals within ±5% using real OSU dining items.
  - Works 100% offline with zero API keys required.
- [ ] Implement `src/services/ai/brutusAI.ts`:
  - Connects to Google Gemini API (with support for OpenAI key toggle).
  - Handles streaming chat interactions and 1-Click meal plan generation.
  - Seamlessly falls back to heuristic planner if offline or API key is missing.
- [ ] Implement `src/store/useChatStore.ts` for conversational history with Brutus.
- **Gate 5 Acceptance Criteria**: 1-Click "Plan My Day" produces balanced 4-meal plan using real campus items; chat responds in Brutus's persona.

---

## Checkpoint 6: Grubhub Deep-Link & Order Assistant
- [ ] Implement `src/services/grubhub/deepLinkService.ts`:
  - Generate Grubhub URL: `https://www.grubhub.com/restaurant/[slug]` and app scheme `grubhub://restaurant/[slug]`.
  - Deep-link launcher with `Linking.canOpenURL` and graceful web fallback.
- [ ] Create `app/modal/grubhub-assistant.tsx`:
  - Venue name, address, and operating hours.
  - Recommended meal items and customization recipe (e.g. *"Double grilled chicken, brown rice, black beans"*).
  - One-tap **"Copy Customization"** to clipboard with haptic/visual feedback.
  - Macro summary card (Calories, Protein, Carbs, Fat).
  - **"Open Grubhub to Order"** action button.
- **Gate 6 Acceptance Criteria**: Tapping order launches Grubhub link; customization copies cleanly to clipboard.

---

## Checkpoint 7: Core Screens & User Experience (Expo Router)
- [ ] Root Layout & Shell (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`):
  - Scarlet-accented bottom tab bar with Lucide icons (Home, Bot, Utensils, Star, User).
  - Dark/Light mode theme provider.
- [ ] Dashboard Screen (`app/(tabs)/index.tsx`):
  - Animated calorie progress ring with percentage indicator.
  - Horizontal animated bars for Protein, Carbs, Fat.
  - Daily timeline: Breakfast, Lunch, Dinner, Snack cards.
  - Buckeye Power Score & Streak indicator.
  - Quick "Order via Grubhub" button on each meal card.
- [ ] BrutusAI Planner Screen (`app/(tabs)/ai-planner.tsx`):
  - Tab 1: **1-Click Plan Generator** with goal presets (*"Post-RPAC Chest Day"*, *"Cut & Lean"*, *"Budget Day"*).
  - Tab 2: **Ask Brutus** conversational chat with avatar bubbles and quick suggestion chips.
- [ ] Campus Menus Screen (`app/(tabs)/menus.tsx`):
  - Campus Zone Switcher (North / South / West).
  - Payment filter (Swipes vs. Dining Dollars).
  - Search input with real-time filtering.
  - Venue cards with expanding menu item lists and nutrition badges.
- [ ] Favorites & Saved Screen (`app/(tabs)/saved.tsx`):
  - List of saved daily plans and favorite meal combos with 1-tap re-use.
- [ ] Profile Screen (`app/(tabs)/profile.tsx`):
  - Fitness goal selector (Muscle Gain, Fat Loss, Maintenance, Athletic).
  - Calorie & macro targets editor with TDEE calculator assistance.
  - BuckID swipe & Dining Dollar balance manager.
  - Dietary restrictions multi-select.
  - API Key settings for Gemini / OpenAI.
- [ ] Nutrition Modal Sheet (`app/modal/meal-details.tsx`):
  - Comprehensive nutrition facts table (calories, protein, carbs, fat, fiber, sodium, allergens).
- **Gate 7 Acceptance Criteria**: All 5 tabs and modals render seamlessly; navigation flows operate without lag or layout shifts.

---

## Checkpoint 8: Gamification, Financial Trackers & Polish
- [ ] Implement **Buckeye Power Score** calculation algorithm (0–100 score based on protein adherence, calorie target, meal logging).
- [ ] Implement **Buckeye Leaf Streak Tracker** with milestone badges (3-day, 7-day, 14-day streaks).
- [ ] Implement BuckID Dining Dollar 35% discount calculator badge on retail venues.
- [ ] Add smooth micro-interactions (press effects, toast notifications, haptics on mobile).
- **Gate 8 Acceptance Criteria**: Logging meals increases power score; streak increments; discount tags calculate accurately.

---

## Checkpoint 9: Automated Verification & Cross-Platform Testing
- [ ] Run full TypeScript compilation check: `npx tsc --noEmit`.
- [ ] Write and run Jest unit tests:
  - `src/utils/nutrition.test.ts` (TDEE, BMR, macro distributions)
  - `src/services/grubhub/deepLinkService.test.ts` (venue URL mapping)
  - `src/services/ai/heuristicPlanner.test.ts` (validates macro constraint solver)
- [ ] Test cross-platform rendering:
  - Verify layout responsiveness on desktop browser and mobile viewport emulator.
- **Gate 9 Acceptance Criteria**: All automated tests pass; no TypeScript errors; layout responds smoothly to window resizing.

---

## Checkpoint 10: Final Documentation & Demo Walkthrough
- [ ] Create comprehensive `README.md` with setup instructions, campus dining features, and architecture overview.
- [ ] Prepare Walkthrough artifact with screenshots, verification logs, and user guide.
- **Gate 10 Acceptance Criteria**: Ready for immediate student demonstration and testing.
