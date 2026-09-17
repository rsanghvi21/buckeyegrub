# Agents.md – Multi-Agent Collaboration & Architecture Guide

## Overview
This document defines the roles, responsibilities, standards, and handover protocols for AI agents and human developers working on **BuckeyeGrub**—a cross-platform nutrition and campus dining application tailored for The Ohio State University (OSU) students.

---

## Agent Roles & Specialties

### 1. Scaffold & Foundation Engineer (`Role: ScaffoldEngineer`)
- **Focus**: Expo configuration, package management, Metro bundler, TypeScript compilation, and routing hierarchy.
- **Responsibilities**:
  - Keep `package.json`, `app.json`, and `tsconfig.json` clean and conflict-free.
  - Maintain file-based routing consistency under `app/` (`app/(auth)/`, `app/(tabs)/`, `app/modal/`).
  - Ensure zero warnings/errors on `npx tsc --noEmit`.

### 2. OSU Domain & Data Specialist (`Role: DataSpecialist`)
- **Focus**: Campus dining venues, Nutrislice data ingestion, nutritional accuracy, and Grubhub mapping.
- **Responsibilities**:
  - Maintain accurate metadata for all 10+ OSU dining locations (Scott, Kennedy, Morrill, Curl, Union Market, 12th Ave, Neil, PAD, Woody's, Berry Cafe).
  - Classify payment types: **Traditions Swipes** vs. **Dining Dollars** (with 35% discount calculation) vs. **BuckID Cash**.
  - Ensure menu items contain precise macro specs (calories, protein, carbs, fat, fiber, allergen tags).
  - Map accurate Grubhub slugs and deep-link URI schemes for each venue.

### 3. UI/UX & Animation Craftsman (`Role: UICraftsman`)
- **Focus**: OSU Scarlet & Grey theme design system, typography, layout, and fluid micro-interactions.
- **Responsibilities**:
  - Enforce official OSU color palette: Scarlet (`#BA0C2F` / `#BB0000`), Buckeye Gray (`#A7B1B7` / `#666666`), Charcoal (`#1E1E24`), Off-white (`#F8F9FA`).
  - Build animated components using `react-native-reanimated` and SVG:
    - Circular macro progress rings (`MacroRing.tsx`).
    - Horizontal animated macro bars (`ProgressBar.tsx`).
    - Swipeable meal cards and bottom sheets.
  - Guarantee responsive, glitch-free layouts across **iOS, Android, and Web**.

### 4. AI & Algorithm Architect (`Role: AIArchitect`)
- **Focus**: BrutusAI intelligence, prompt engineering, Gemini API integration, and offline heuristic optimization.
- **Responsibilities**:
  - Embody the **Brutus Buckeye** persona: encouraging, energetic, campus-savvy (mentions RPAC, Thompson Library, dorm life).
  - Implement structured JSON generation for meal plans adhering strictly to user calorie/macro targets.
  - Maintain the **Offline Heuristic Meal Planner** (`heuristicPlanner.ts`): a deterministic constraint satisfaction algorithm that selects valid campus meals matching target macros within ±5% without requiring an external API key.
  - Implement Grubhub Order Assistant copy generator for meal customizations.

### 5. State & Storage Architect (`Role: StateArchitect`)
- **Focus**: Global client state, local-first persistence, and backend adapters.
- **Responsibilities**:
  - Build and maintain Zustand stores: `useUserStore`, `useMealPlanStore`, `useDiningStore`, `useChatStore`.
  - Ensure persistence via `@react-native-async-storage/async-storage`.
  - Provide seed data for instantaneous first-run demo experience (e.g., pre-configured *"Brutus the Buckeye"* profile).
  - Keep state decoupled so Supabase/Firebase can be plugged in seamlessly via service interfaces.

### 6. QA & Verification Sentinel (`Role: QASentinel`)
- **Focus**: Automated testing, linting, edge-case validation, and release readiness.
- **Responsibilities**:
  - Run `npx tsc --noEmit` and Jest tests at every milestone.
  - Verify deep-link fallbacks (`grubhub://` -> `https://`).
  - Check extreme user profiles (e.g. 1,200 kcal cut vs 3,800 kcal bulk, strict vegan + gluten-free).

---

## Code Quality & Engineering Standards

### 1. TypeScript Strictness
- No `any` types permitted for domain models (`UserProfile`, `MenuItem`, `DiningVenue`, `MealPlan`).
- Strict null checks enabled.

### 2. Styling Rules
- Use centralized design tokens from `src/constants/theme.ts`.
- Avoid hardcoded color hex values or magic numbers in components.
- Support dark and light theme tokens seamlessly.

### 3. Linking & Grubhub Protocol
- Always wrap deep linking with `try/catch` and fallback to standard web browser URLs (`Linking.openURL`).
- Display the **Grubhub Order Assistant** modal before handoff so students know exactly what items to select.

### 4. Error Handling & Offline First
- Network failures must never crash the app; all API calls (Gemini, Nutrislice) must fall back gracefully to local heuristic generators or cached catalogs.
- Provide clear user notifications via in-app toast or alert.

---

## Checkpoint Handover Protocol

Before passing work between agents or concluding a phase:
1. **Compile Check**: Run `npx tsc --noEmit` to guarantee zero compilation errors.
2. **State Check**: Verify all new state fields are accounted for in Zustand store initializers and reset methods.
3. **Documentation**: Update `checklist.md` with checked boxes `[x]` and commit timestamps.
4. **Visual Verification**: Confirm on Expo Web (`npm run web`) or mobile simulator.
