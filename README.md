# BuckeyeGrub

A nutrition and campus dining planner built for Ohio State students.

---

## Why BuckeyeGrub?

Eating well on a college campus is surprisingly tricky. Between rushing across 1,700 acres of campus, balancing Traditions swipes with Dining Dollars, and trying to hit specific protein and calorie goals, most students end up guessing what to order. 

You find yourself flipping between Nutrislice menus to check macros, doing mental math on the 35% Dining Dollar discount at Curl Market, and trying to remember what you had earlier in the day.

BuckeyeGrub was built to solve that headache. It connects real Ohio State dining hall menus with automated meal planning, BuckID financial tracking, and Grubhub ordering so you can hit your fitness targets without spending half your day planning food.

---

## Features

### Meal Planning with Brutus
- One-click daily meal plans: Generate a balanced schedule for breakfast, lunch, dinner, and snacks matching your exact calorie and macro targets (protein, carbs, and fat) using real campus meals.
- Conversational dining coach: Ask questions about campus food in plain language (for example: "I just finished a workout at the RPAC and have 1 swipe left. What should I get at Kennedy for 50g of protein?").
- Offline heuristic planner: If you are in a basement classroom without cell service or do not have an API key configured, a local constraint-satisfaction algorithm still generates balanced campus meal plans within +/- 5% of your target macros.
- Flexible AI backends: Powered by Google Gemini with an optional toggle for OpenAI GPT-4o.

### Real Ohio State Dining Menus
- Direct integration with Ohio State's Nutrislice data (`osu.api.nutrislice.com`).
- Covers 10+ campus dining locations:
  - Traditions halls (unlimited buffet swipes): Scott Traditions, Kennedy Traditions, Morrill Traditions.
  - Retail locations and grab-and-go cafes: Curl Market, Union Market, Marketplace on Neil, 12th Ave Bread Company, Woody's Tavern, Berry Cafe at Thompson Library, Juice 2 at the RPAC.
  - Accurate nutritional specs: Calories, protein, carbohydrates, fats, fiber, sodium, and dietary indicators (Vegetarian, Vegan, Gluten-Free, Halal).
  - Fast offline cache: Pre-cached campus catalog so the app opens instantly without waiting on network calls.

### Grubhub Order Assistant
- Solves the limitation of third-party mobile cart handoffs:
  - Generates your exact item recipe (for example: "Double grilled chicken bowl with brown rice, black beans, and fajita veggies").
  - One-tap copy to clipboard so you do not have to retype complex orders.
  - Deep-links directly into the Grubhub app (`grubhub://restaurant/...`) with an automatic fallback to the web browser if the app is not installed.

### BuckID Balance & Discount Tracking
- Handles all three Ohio State currency balances:
  - Traditions Swipes (Scott, Kennedy, Morrill).
  - Dining Dollars (automatically calculates the 35% discount on retail cafe prices).
  - BuckID Cash.
- Shows your effective purchasing power (for example, a $250.00 Dining Dollar balance actually buys $384.62 in retail cafe food).
- Filter items by payment method to stretch your swipes or protect your semester budget.

### Buckeye Power Score & Streaks
- Buckeye Power Score (0 to 100): Daily score calculated based on protein target adherence (+/- 10% target window), calorie balance, and meal tracking consistency.
  - Tier classifications: Campus Legend (90-100), RPAC Beast (75-89), Buckeye Starter (50-74), and Freshman (<50).
  - Contextual tips from Brutus on how to improve your score.
- Buckeye Leaf Streak Tracker: Tracks consecutive days of logging campus meals with milestone badges at 3, 7, 14, and 30 days. Uses local Columbus campus time to prevent UTC midnight rollover issues.

### Ohio State Design System
- Built with official university colors: Scarlet (#BA0C2F), Buckeye Gray (#A7B1B7), Charcoal (#1E1E24), and Off-white (#F8F9FA).
- Animated macro progress rings and bars built with React Native Reanimated and SVG.
- Light and dark theme support with centralized design tokens.
- Native micro-interactions including animated toast notifications and mobile haptic feedback.
- Responsive layout that works cleanly on iOS, Android, and web browsers.

---

## Tech Stack

| Layer | Tools |
|---|---|
| Framework | React Native (0.76.7) with Expo (SDK 52) |
| Routing | Expo Router v4 (file-based navigation) |
| Language | TypeScript (strict mode enabled) |
| Animations & Icons | React Native Reanimated 3, React Native SVG, Lucide React Native |
| State Management | Zustand with AsyncStorage persistence |
| AI & Algorithms | Google Gemini API, OpenAI toggle, offline deterministic heuristic solver |
| Campus Dining Data | OSU Nutrislice REST API with local snapshot fallbacks |
| Deep Linking | Expo Linking with Grubhub URI scheme and web fallback |

---

## Project Structure

```
buckeyegrub/
├── app/                              # Expo Router file-based routes
│   ├── _layout.tsx                   # Root navigation shell and theme provider
│   ├── index.tsx                     # Entry redirect and route landing
│   ├── (auth)/                       # Onboarding and fitness goal setup
│   ├── (tabs)/                       # Main tab screens (Dashboard, AI Planner, Menus, Saved, Profile)
│   └── modal/                        # Modals (Power Score, 35% Discount Calculator, Grubhub Assistant)
│
├── src/
│   ├── assets/                       # Static imagery and icon assets
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # Buttons, cards, badges, modal headers, toast notifications
│   │   ├── dashboard/                # Daily timelines, macro summaries, streak visualizers
│   │   ├── dining/                   # Venue cards, menu item rows, discount badges
│   │   ├── gamification/             # Streak milestone cards and leaf trackers
│   │   └── ai/                       # Chat bubbles and suggestion chips
│   ├── constants/                    # Theme tokens, campus zones, typography, colors
│   ├── context/                      # Theme and Toast notification context providers
│   ├── data/                         # Verified OSU dining halls and menu item catalog
│   ├── services/                     # Nutrislice client, BrutusAI engine, Grubhub deep-linker
│   ├── store/                        # Zustand stores (useUserStore, useMealPlanStore, useDiningStore, useChatStore)
│   ├── types/                        # TypeScript domain interfaces
│   └── utils/                        # Nutrition math, streak calculators, dining discount formulas, haptics
│
├── checklist.md                      # 10-checkpoint development roadmap and audit log
├── AGENTS.md                         # Architecture guide and engineering standards
├── package.json                      # Dependencies and npm scripts
└── tsconfig.json                     # Strict TypeScript configuration
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or v20+ recommended)
- npm, yarn, or pnpm
- Expo Go on iOS or Android (optional, for physical device testing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rsanghvi21/buckeyegrub.git
   cd buckeyegrub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

### Running on Platforms

- Web browser:
  ```bash
  npm run web
  ```
- iOS Simulator (macOS):
  ```bash
  npm run ios
  ```
- Android Emulator:
  ```bash
  npm run android
  ```
- Type checking:
  ```bash
  npx tsc --noEmit
  ```
- Run test suites:
  ```bash
  npx tsx src/__tests__/verifyCheckpoint8.ts
  npx tsx src/__tests__/verifyCheckpoint7.ts
  ```

---

## Roadmap & Status

Development is tracked through the milestone checkpoints in `checklist.md`:

- [x] Checkpoint 1: Project Scaffolding & Tooling Setup (Expo SDK 52, TypeScript strict mode, Metro bundler)
- [x] Checkpoint 2: OSU Design System & Component Library (Scarlet and Gray palette, MacroRing, ProgressBar)
- [x] Checkpoint 3: Campus Dining & Nutrislice Catalog (API client, 10+ OSU venues, macro normalizer)
- [x] Checkpoint 4: State Management & Persistence Layer (Zustand + AsyncStorage persistence, demo profile)
- [x] Checkpoint 5: BrutusAI Engine (Gemini integration, prompt engineering, offline heuristic planner)
- [x] Checkpoint 6: Grubhub Deep-Link & Order Assistant Modal (Customization copier, mobile scheme handoff)
- [x] Checkpoint 7: Core Screens & Navigation (Dashboard, AI Planner, Menus, Saved, Profile)
- [x] Checkpoint 8: Gamification, Financial Trackers & Polish (Power Score, streaks, 35% discount calculator, toasts)
- [ ] Checkpoint 9: Automated Verification & Cross-Platform Testing
- [ ] Checkpoint 10: Final Documentation & Release Readiness

---

## Author & Notes

- Author: Rahul Sanghvi
- Affiliation: The Ohio State University
- Dining Data: Ohio State Dining Services / Nutrislice
- Mobile Orders: Grubhub Campus Dining