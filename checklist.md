# BuckeyeGrub – Master Implementation Checklist

> **Project**: BuckeyeGrub (v1.1 BRD)  
> **Target Platforms**: iOS, Android, Web (React Native + Expo)  
> **Status**: Ready to Begin  

---

## Checkpoint 1: Project Scaffolding & Tooling Setup
- [x] Initialize Expo project with TypeScript template and Expo Router (`app/` directory).
- [x] Install production dependencies:
  - Navigation: `expo-router`, `expo-linking`, `expo-constants`, `expo-status-bar`
  - UI & Animation: `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `lucide-react-native`
  - State & Storage: `zustand`, `@react-native-async-storage/async-storage`
- [x] Configure `app.json` (scheme: `buckeyegrub`, orientation, adaptive icons, web bundler `metro`).
- [x] Configure `tsconfig.json` with strict type checking and `@/` path alias.
- [x] Configure `babel.config.js` with `react-native-reanimated/plugin`.
- [x] Upgrade toolchain to Expo SDK 57.0.0 (`expo@~57.0.24`, `react@19.2.3`, `react-native@0.86.3`, `react-native-reanimated@4.5.1`, `typescript@~6.0.3`) for iOS Expo Go client compatibility.
- [x] Verify clean build and type check (`npx tsc --noEmit`).
- [x] Verify 21/21 checks pass on `npx expo-doctor`.
- **Gate 1 Acceptance Criteria**: [PASSED] Project bundles and exports clean for Expo web and mobile targets with zero errors; SDK 57 fully aligned with official Expo Go client.

---

## Checkpoint 2: OSU Design System & Component Library
- [x] Create `src/constants/theme.ts` with official OSU palette & seamless Light/Dark theme support:
  - Scarlet: `#BA0C2F` / `#BB0000`
  - Buckeye Gray: `#A7B1B7` / `#666666`
  - Neutral Dark: `#1E1E24`
  - Light Background: `#F8F9FA` / Dark Background: `#121216`
  - Surface White: `#FFFFFF` / Dark Surface: `#1E1E24`
  - Accent Gold: `#D4AF37`
- [x] Implement atomic UI primitives under `src/components/ui/`:
  - [x] `Button.tsx` (Primary Scarlet, Secondary Buckeye Grey, Outline, Icon buttons with press animations).
  - [x] `Card.tsx` (Elevated card with borders, rounded corners, shadow).
  - [x] `SwipeableCard.tsx` (Swipeable meal cards with gesture actions for swap, favorite, log).
  - [x] `Badge.tsx` (Dietary tags: High-Protein, Vegan, Halal, Gluten-Free; pre-scaffolded payment badges for Checkpoints 3 & 8).
  - [x] `Input.tsx` (Branded text input with focus states).
  - [x] `MacroRing.tsx` (Animated SVG circular progress ring for calories/macros, cross-platform Web & Native).
  - [x] `ProgressBar.tsx` (Horizontal animated macro bar for Protein, Carbs, Fat).
- [x] Create global navigation header component `src/components/navigation/Header.tsx` with Buckeye leaf motif and dynamic safe area insets.
- **Gate 2 Acceptance Criteria**: [PASSED] UI components render with theme colors and responsive scaling; animations execute smoothly without console warnings.
- **Commit History**:
  - `853ba87` (2026-09-18T10:24:00-04:00): `feat(design-system): implement checkpoint 2 - OSU theme tokens and atomic UI primitives`
  - `141fea6` (2026-09-18T10:33:00-04:00): `chore(agents): configure code-review skill and skills-lock.json`
  - `1602ef2` (2026-09-18T10:49:00-04:00): `fix(design-system): remediate code review findings for theme, safe areas, and swipe gestures`

---

## Checkpoint 3: Campus Dining & Nutrislice Catalog
- [x] Define TypeScript types in `src/types/dining.ts` (`DiningVenue`, `MenuItem`, `CampusZone`, `PaymentType`).
- [x] Populate `src/data/osuVenues.ts` with 10+ OSU campus dining locations:
  - [x] Traditions at Scott (North Campus)
  - [x] Traditions at Kennedy (South Campus)
  - [x] Traditions at Morrill (West Campus)
  - [x] Curl Market (North Campus)
  - [x] Union Market (Ohio Union / South Campus)
  - [x] 12th Avenue Bread Company (South Campus)
  - [x] Neil Avenue Cafe (South Campus)
  - [x] PAD - Pizza & Delivery (North Campus)
  - [x] Woody's Tavern (Ohio Union)
  - [x] Berry Cafe (Thompson Library)
- [x] Populate `src/data/osuMenuItems.ts` with 50+ real campus items with accurate calories, protein, carbs, fat, fiber, price, swipe eligibility, and allergen tags.
- [x] Implement `src/services/nutrislice/nutrisliceClient.ts` with caching, venue filtering, macro sorting, and search.
- **Gate 3 Acceptance Criteria**: [PASSED] Data layer returns accurate dining venues (12 venues) and menu items (63 items) filtered by campus zone, payment type, or dietary restriction; 106 automated verification assertions passed.
- **Commit History**:
  - `fc79a6b` (2026-09-18T13:37:40-04:00): `feat(dining): implement checkpoint 3 - campus dining and nutrislice catalog`
  - `43d62cb` (2026-09-18T14:53:30-04:00): `fix(dining): remediate code review findings for Checkpoint 3`

---

## Checkpoint 4: State Management & Persistence Layer
- [x] Define TypeScript models in `src/types/user.ts` and `src/types/mealPlan.ts`.
- [x] Implement `src/store/useUserStore.ts`:
  - [x] Profile state (name, fitness goal: bulk/cut/maintain, calorie target, macro targets).
  - [x] BuckID balances (Traditions Swipes remaining, Dining Dollars balance).
  - [x] Dietary restrictions array.
  - [x] Pre-seeded demo user (*"Brutus the Buckeye"*).
- [x] Implement `src/store/useMealPlanStore.ts`:
  - [x] Active daily meal plan (Breakfast, Lunch, Dinner, Snack).
  - [x] Meal logging toggle (`isLogged`).
  - [x] Favorites and saved meal plans collection.
  - [x] Item swap action.
- [x] Implement `src/store/useDiningStore.ts`:
  - [x] Selected campus zone filter (`North` | `South` | `West` | `All`).
  - [x] Selected payment filter (`All` | `Traditions Swipe` | `Dining Dollars`).
  - [x] Search query and active dietary tags.
- [x] Wire all stores to `@react-native-async-storage/async-storage` via cross-platform `appStorage` with Node/SSR fallback for auto-persistence across app reloads.
- [x] Bind `app/index.tsx` showcase screen directly to `useUserStore`, `useMealPlanStore`, and `useDiningStore` with interactive demo logging and one-tap demo reset.
- **Gate 4 Acceptance Criteria**: [PASSED] State changes persist across browser/simulator refresh; resetting to demo state works reliably; 91 automated verification assertions passed with zero TypeScript errors.
- **Commit History**:
  - `6273856` (2026-09-18T16:46:36-04:00): `feat(store): implement checkpoint 4 - state management & persistence layer`
  - `a525fd0` (2026-09-21T10:34:56-04:00): `fix(store): reconcile dining store types and storage fallback`

---

## Checkpoint 5: BrutusAI Engine (Gemini & Heuristic Fallback)
- [x] Implement `src/services/ai/prompts.ts`:
  - [x] Brutus Buckeye persona system prompt.
  - [x] Campus knowledge grounding (gyms: RPAC, North Rec; libraries: Thompson, 18th Ave).
  - [x] Strict JSON schema for daily meal plan output.
- [x] Implement `src/services/ai/heuristicPlanner.ts`:
  - [x] Constraint-satisfaction algorithm that calculates a 4-meal plan matching user's calorie and protein goals within ±5% using real OSU dining items.
  - [x] Works 100% offline with zero API keys required.
- [x] Implement `src/services/ai/brutusAI.ts`:
  - [x] Connects to Google Gemini API (with support for OpenAI key toggle).
  - [x] Handles streaming chat interactions and 1-Click meal plan generation.
  - [x] Seamlessly falls back to heuristic planner if offline or API key is missing.
- [x] Implement `src/services/ai/grubhubAssistant.ts`:
  - [x] Generates human-readable meal customization copy for Grubhub order notes.
- [x] Implement `src/store/useChatStore.ts` for conversational history with Brutus (streaming tokens & fallback notification observability).
- **Gate 5 Acceptance Criteria**: [PASSED] 1-Click "Plan My Day" produces balanced 4-meal plan using real campus items (±5% calorie and protein adherence across athletic, cut, bulk, vegan, and gluten-free profiles); chat responds in Brutus's persona with streaming support; zero-crash fallback with UI alert observability; automated verification assertions passed with zero TypeScript errors.
- **Commit History**:
  - `8409b4f` (2026-09-21T10:53:33-04:00): `feat(ai): implement checkpoint 5 - brutusAI engine (gemini & heuristic fallback)`
  - `a60fce9` (2026-09-21T11:49:57-04:00): `fix(ai): remediate code review findings for Checkpoint 5 (standards & spec)`

---

## Checkpoint 6: Grubhub Deep-Link & Order Assistant
- [x] Implement `src/services/grubhub/deepLinkService.ts`:
  - Generate Grubhub URL: `https://www.grubhub.com/restaurant/[slug]` and app scheme `grubhub://restaurant/[slug]`.
  - Deep-link launcher with `Linking.canOpenURL` and graceful web fallback.
- [x] Create `app/modal/grubhub-assistant.tsx`:
  - Venue name, address, and operating hours.
  - Recommended meal items and customization recipe (e.g. *"Double grilled chicken, brown rice, black beans"*).
  - One-tap **"Copy Customization"** to clipboard with haptic/visual feedback.
  - Macro summary card (Calories, Protein, Carbs, Fat).
  - **"Open Grubhub to Order"** action button.
- **Gate 6 Acceptance Criteria**: [PASSED] Tapping order launches Grubhub link (native `grubhub://` deep link with graceful `https://` web fallback); customization copies cleanly to clipboard via `expo-clipboard` with `expo-haptics` feedback. 64 automated verification assertions passed across all 12 Grubhub-mapped venues; `npx tsc --noEmit` clean; Expo web bundle exported successfully (3177 modules).
- **Implementation Notes**:
  - `deepLinkService.ts` exposes pure, testable URL builders (`buildGrubhubWebUrl`, `buildGrubhubAppUri`) accepting either a `DiningVenue` or standalone slug string, plus `openVenueOrder`, which wraps `expo-linking` in a zero-crash linking contract.
  - Order Assistant modal accepts `venueId` (required) and optional `slot` route params; it filters the active meal-plan slot to the target venue, otherwise falls back to the venue's catalog items. Supports dynamic dark/light mode themes and haptic feedback via `expo-haptics`.
  - Modal route registered in `app/_layout.tsx` with `presentation: 'modal'`; launched from the showcase screen's "Assistant" button.
  - Added dependencies: `expo-clipboard@~57.0.2`, `expo-haptics@~57.0.3`.
  - Verifier: `src/services/grubhub/__tests__/verifyDeepLink.ts` (run via `npx tsx src/services/grubhub/__tests__/verifyDeepLink.ts`).
- **Commit History**:
  - `25130cf` (2026-09-22T11:18:30-04:00): `feat(grubhub): implement checkpoint 6 - grubhub deep-link & order assistant`
  - `b40f5e1` (2026-09-22T12:41:30-04:00): `fix(grubhub): remediate code review findings for Checkpoint 6 (standards & spec)`

---

## Checkpoint 7: Core Screens & User Experience (Expo Router)
- [x] Root Layout & Shell (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`):
  - [x] Scarlet-accented bottom tab bar with Lucide icons (Home, Bot, Utensils, Star, User).
  - [x] Dark/Light mode theme provider (`src/context/ThemeContext.tsx`).
- [x] Dashboard Screen (`app/(tabs)/index.tsx`):
  - [x] Animated calorie progress ring with percentage indicator.
  - [x] Horizontal animated bars for Protein, Carbs, Fat.
  - [x] Daily timeline: Breakfast, Lunch, Dinner, Snack cards.
  - [x] Buckeye Power Score & Streak indicator.
  - [x] Quick "Order via Grubhub" button on each meal card.
- [x] BrutusAI Planner Screen (`app/(tabs)/ai-planner.tsx`):
  - [x] Tab 1: **1-Click Plan Generator** with goal presets (*"Post-RPAC Chest Day"*, *"Cut & Lean"*, *"Budget Day"*, *"Bulk & Power"*).
  - [x] Tab 2: **Ask Brutus** conversational chat with avatar bubbles and quick suggestion chips.
- [x] Campus Menus Screen (`app/(tabs)/menus.tsx`):
  - [x] Campus Zone Switcher (North / South / West / All).
  - [x] Payment filter (Swipes vs. Dining Dollars with 35% discount calculation).
  - [x] Search input with real-time filtering.
  - [x] Venue cards with expanding menu item lists and nutrition badges.
- [x] Favorites & Saved Screen (`app/(tabs)/saved.tsx`):
  - [x] List of saved daily plans and favorite meal combos with 1-tap re-use.
- [x] Profile Screen (`app/(tabs)/profile.tsx`):
  - [x] Fitness goal selector (Muscle Gain, Fat Loss, Maintenance, Athletic).
  - [x] Calorie & macro targets editor with TDEE calculator assistance (`src/utils/nutrition.ts`).
  - [x] BuckID swipe & Dining Dollar balance manager.
  - [x] Dietary restrictions multi-select.
  - [x] API Key settings for Gemini / OpenAI.
- [x] Nutrition Modal Sheet (`app/modal/meal-details.tsx`):
  - [x] Comprehensive nutrition facts table (calories, protein, carbs, fat, fiber, sodium, allergens).
- **Gate 7 Acceptance Criteria**: [PASSED] All 5 tabs and modals render seamlessly; navigation flows operate without lag or layout shifts; 11/11 automated assertions passed in `src/__tests__/verifyCheckpoint7.ts`; zero regressions across 260+ tests in state, catalog, and Grubhub suites; `npx tsc --noEmit` clean with 0 errors; Expo web bundle exported cleanly with 3,186 modules.
- **Implementation Notes**:
  - Implemented on branch `feat/checkpoint-7-core-screens`.
  - Replaced legacy showcase screen `app/index.tsx` with production Expo Router pathless group architecture in `app/(tabs)/index.tsx`.
  - Added `src/context/ThemeContext.tsx` providing reactive Light/Dark theming synchronized with `useUserStore` and device appearance.
  - Added pure nutrition calculation engine in `src/utils/nutrition.ts` (Mifflin-St Jeor BMR, TDEE activity scaling, goal-based macro distribution, dynamic Buckeye Power Score).
  - Verifier: `src/__tests__/verifyCheckpoint7.ts` (run via `npx tsx src/__tests__/verifyCheckpoint7.ts`).
- **Commit History**:
  - `dba63f0` (2026-09-22T18:13:58-04:00): `feat(screens): implement checkpoint 7 - core screens & user experience (expo router)`
  - `844a542` (2026-09-22T19:03:20-04:00): `fix(screens): remediate code review findings for Checkpoint 7`

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
