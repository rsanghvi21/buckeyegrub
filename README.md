# BuckeyeGrub 🌰🍽️

> **The Ohio State University (OSU) Student Nutrition & Campus Dining Intelligence Platform**  
> Plan, optimize, and order nutritionally balanced campus meals tailored to your fitness goals and BuckID budget.

---

## 📖 Overview

**BuckeyeGrub** is a cross-platform mobile and web application built with **React Native**, **Expo (SDK 52)**, and **TypeScript** designed specifically for Ohio State students. 

Navigating campus dining while trying to hit specific calorie or macro targets (cutting, bulking, athletic performance, or dietary restrictions) can be overwhelming across OSU's 1,700-acre campus. BuckeyeGrub bridges this gap by merging real-time dining hall menus, an intelligent AI nutrition coach (**BrutusAI**), BuckID financial tracking, and frictionless Grubhub ordering.

---

## ✨ Key Features

### 🤖 1. BrutusAI Meal Planner
- **Dual Planning Modes**:
  - **1-Click "Plan My Day"**: Instantly generates Breakfast, Lunch, Dinner, and Snack matching your exact daily calories and macro split (Protein / Carbs / Fat) using real items from campus venues.
  - **Conversational Campus Coach**: Ask Brutus contextual questions (*"Just hit chest at the RPAC and have 1 swipe left. What should I get at Kennedy for 50g protein?"*).
- **Offline Heuristic Optimizer**: Deterministic constraint satisfaction planner that calculates valid campus meal combinations matching macro targets within ±5% even without an API key or internet connection.
- **Pluggable AI Backend**: Powered by **Google Gemini API** with optional toggle for **OpenAI GPT-4o**.

### 🥗 2. Live OSU Nutrislice Dining Integration
- Direct integration with Ohio State's live Nutrislice REST API (`osu.api.nutrislice.com`).
- Full coverage of **10+ major OSU campus dining facilities**:
  - **Traditions Locations** (All-you-care-to-eat swipes): Scott, Kennedy, Morrill.
  - **Retail Cafes & Grab-and-Go**: Curl Market, Union Market, Marketplace on Neil, 12th Ave Bread Co, Woody's Tavern, Berry Café (Thompson Library), Juice @ RPAC.
- **Accurate Nutrition Profiles**: Itemized calories, protein, carbs, fats, fiber, sodium, and dietary flags (`Vegetarian`, `Vegan`, `Gluten-Free`, `Halal`).
- **Hybrid Caching Architecture**: Live API fetcher paired with a high-fidelity offline fallback snapshot for instantaneous zero-latency browsing.

### 📱 3. Grubhub "Order Assistant"
- Solves third-party mobile cart limitations by displaying an interactive **Order Assistant Sheet**:
  - Item details, macro counts, and exact customization recipes (e.g., *"Double grilled chicken, brown rice, black beans, fajita veggies"*).
  - **1-Tap "Copy Customization"**: Copies meal details directly to your clipboard.
  - **Deep-Link Handoff**: Launches the native Grubhub app (`grubhub://restaurant/[slug]`) with automatic web fallback (`https://www.grubhub.com/restaurant/[slug]`).

### 💳 4. BuckID Currency Intelligence
- Distinguishes and tracks:
  - **Traditions Swipes** (Scott, Kennedy, Morrill).
  - **Dining Dollars** (with automatic 35% discount calculations displayed on retail items).
  - **BuckID Cash**.
- Filter meals by payment type to maximize protein per swipe or stay within a weekly Dining Dollar budget.

### 📊 5. OSU Scarlet & Grey Design System
- Official Ohio State color palette: Scarlet (`#BA0C2F` / `#BB0000`), Buckeye Gray (`#A7B1B7` / `#666666`), Charcoal (`#1E1E24`), Off-white (`#F8F9FA`).
- Animated circular macro progress rings (`MacroRing`) and horizontal progress bars (`ProgressBar`) built with `react-native-reanimated` and SVG.
- Responsive layout optimized across iOS, Android, and Web viewports.

### 🏆 6. Gamification & Retention
- **Buckeye Power Score** (0–100): Daily score calculated based on protein target adherence (±10%), calorie balance, and meal tracking.
- **Buckeye Leaf Streak Tracker**: Milestone badges for maintaining consistent campus nutrition habits.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) (0.76.7) + [Expo](https://expo.dev/) (SDK 52) |
| **Routing** | [Expo Router](https://docs.expo.dev/router/introduction/) v4 (File-based routing) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Animations & UI** | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) 3, `react-native-svg`, `lucide-react-native` |
| **State Management** | [Zustand](https://zustand.docs.pmnd.rs/) with Local Persistence (`@react-native-async-storage/async-storage`) |
| **AI Engine** | Google Gemini API (`@google/genai`) + Deterministic Heuristic Solver |
| **Dining APIs** | OSU Nutrislice REST API (`osu.api.nutrislice.com`) |
| **Deep Linking** | `expo-linking` (Grubhub URI scheme + web fallback) |

---

## 📁 Project Structure

```
buckeyegrub/
├── app/                              # Expo Router file-based routes
│   ├── _layout.tsx                   # Root navigation shell & theme provider
│   ├── index.tsx                     # Entry redirect / landing
│   ├── (auth)/                       # Onboarding & fitness goal setup
│   ├── (tabs)/                       # Tab navigation (Dashboard, AI Planner, Menus, Saved, Profile)
│   └── modal/                        # Modals (Nutrition sheet, Grubhub Order Assistant)
│
├── src/
│   ├── assets/                       # Static imagery and Buckeye icons
│   ├── components/                   # Reusable components
│   │   ├── ui/                       # Macro rings, progress bars, cards, buttons, badges
│   │   ├── dashboard/                # Daily timeline, macro summary, streak cards
│   │   ├── dining/                   # Venue cards, menu item rows, zone filters
│   │   └── ai/                       # Brutus chat bubbles, suggestion chips
│   ├── constants/                    # OSU theme tokens, campus zones, typography
│   ├── data/                         # Verified OSU dining halls & menu catalog
│   ├── services/                     # Nutrislice client, BrutusAI engine, Grubhub deep-linker
│   ├── store/                        # Zustand state stores (User, MealPlan, Dining, Chat)
│   ├── types/                        # TypeScript domain interfaces
│   └── utils/                        # Nutrition formulas (TDEE, BMR, macro distributions)
│
├── checklist.md                      # Master 10-checkpoint implementation roadmap
├── AGENTS.md                         # Multi-agent collaboration protocol & quality gates
├── app.json                          # Expo configuration
├── babel.config.js                   # Babel & Reanimated configuration
├── package.json                      # Dependencies & npm scripts
└── tsconfig.json                     # TypeScript strict configuration
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+ recommended)
- [npm](https://www.npmjs.com/) or `yarn` / `pnpm`
- [Expo Go](https://expo.dev/go) app (optional, for testing on physical iOS/Android devices)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rsanghvi21/buckeyegrub.git
   cd buckeyegrub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

### Running on Specific Platforms
- **Web (Browser)**:
  ```bash
  npm run web
  ```
- **iOS Simulator**:
  ```bash
  npm run ios
  ```
- **Android Emulator**:
  ```bash
  npm run android
  ```
- **Type-Check**:
  ```bash
  npm run type-check
  ```

---

## 📋 Roadmap & Checkpoints

Project execution follows the master roadmap outlined in [`checklist.md`](checklist.md):
- [x] **Checkpoint 1: Project Scaffolding & Tooling Setup** (Expo Router, TypeScript, Reanimated, Metro web export)
- [x] **Checkpoint 2: OSU Design System & Component Library** (Scarlet & Grey palette, MacroRing, ProgressBar)
- [x] **Checkpoint 3: Campus Dining & Nutrislice Catalog** (Live API client, 10+ OSU venues, macro normalizer)
- [ ] **Checkpoint 4: State Management & Persistence Layer** (Zustand + AsyncStorage with demo profile)
- [ ] **Checkpoint 5: BrutusAI Engine** (Gemini integration + offline heuristic planner)
- [ ] **Checkpoint 6: Grubhub Deep-Link & Order Assistant Modal**
- [ ] **Checkpoint 7: Core Screens & User Experience** (Dashboard, AI Planner, Menus, Saved, Profile)
- [ ] **Checkpoint 8: Gamification & BuckID Trackers** (Buckeye Power Score, Streak tracker)
- [ ] **Checkpoint 9: Automated Testing & Verification**
- [ ] **Checkpoint 10: Final Polish & Release Readiness**

For architectural standards and agent roles, see [`AGENTS.md`](AGENTS.md).

---

## 🎓 Author & Credits

- **Author**: Rahul Sanghvi
- **Affiliation**: The Ohio State University
- **Data Source**: Ohio State Dining Services / [Nutrislice](https://osu.nutrislice.com/menu)
- **Order Handoff**: [Grubhub Campus Dining](https://www.grubhub.com/)