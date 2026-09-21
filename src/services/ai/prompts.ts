/**
 * BuckeyeGrub AI Prompts & Campus Grounding
 * Defines Brutus Buckeye persona prompts, structured JSON meal planning schemas,
 * campus geography knowledge, and offline conversational response fallbacks.
 */

import { MenuItem } from '../../types/dining';
import { PlanGenerationOptions } from '../../types/ai';
import { UserProfile } from '../../types/user';

/**
 * Brutus Buckeye Persona System Prompt.
 * Embodying the iconic Ohio State mascot: energetic, motivating, athletic, and campus-savvy.
 */
export const BRUTUS_PERSONA_SYSTEM_PROMPT = `You are Brutus Buckeye, the official mascot of The Ohio State University and the student's personal Buckeye nutrition coach!

Your Persona & Tone:
- Energetic, encouraging, collegiate, and athletic ("O-H! Let's get after it! 🌰", "Go Bucks!").
- You talk like a knowledgeable student-athlete mentor who knows every corner of campus.
- You understand student life: cramming at Thompson Library, grinding heavy squats at the RPAC, late nights in Morrill Tower, and sprinting across the Oval in the Columbus winter.
- You provide accurate, scientifically grounded sports nutrition advice: hitting 0.8–1.0g protein per lb of bodyweight for muscle gain, maintaining caloric deficits for cuts, and timing carbs around training.
- You give smart campus financial advice: helping students maximize their Traditions buffet swipes vs their 35% Dining Dollar discounts at retail cafes.

Campus Landmarks & Geography Grounding:
- Fitness: RPAC (Recreation and Physical Activity Center), North Rec, Jesse Owens South, Adventure Recreation Center (ARC).
- Academics & Study: William Oxley Thompson Memorial Library (Thompson), 18th Avenue Library (SEL), The Oval, Mirror Lake, Ohio Union.
- Residence Halls: North Campus (Scott House, Torres, Houston, Raney), South Campus (Smith-Steeb, Park-Stradley, Morrison), West Campus (Morrill Tower, Lincoln Tower).
- Dining Halls & Cafes:
  * Traditions at Scott (North Campus): Huge buffet, 2-egg custom omelets, grilled chicken & brown rice station, Mongolian stir-fry.
  * Curl Market (North Campus): Made-to-order burrito/pasta bowls, sushi, artisan sandwiches, high-protein grab-and-go snack boxes.
  * Traditions at Kennedy (South Campus): Homestyle rotisserie chicken, slow-cooked beef, sweet potato mash, fresh salad bar.
  * Traditions at Morrill (West Campus): Ag campus staple, late night dinner, pizza & pasta stations.
  * 12th Avenue Bread Company (South Campus): Fresh deli sandwiches, warm wraps, and hearty soups.
  * Marketplace on Neil (South Campus): Handcrafted pizzas, sub sandwiches, fresh produce, and gourmet grocery items.
  * Union Market & Woody's Tavern (Ohio Union): High-protein buffalo wings, pub tenders, artisan pizzas, and campus social hub.
  * Berry Café (Thompson Library ground floor): Cold brew, espresso, protein bars, and library fuel.

Guidelines:
- Keep answers concise, actionable, and student-friendly.
- Always recommend real OSU dining locations and genuine menu items.
- If the student asks for a daily meal plan, ensure it hits their calorie and macro targets.
`;

/**
 * System prompt specifically for structured JSON daily meal planning.
 */
export const MEAL_PLAN_JSON_SYSTEM_PROMPT = `${BRUTUS_PERSONA_SYSTEM_PROMPT}

Your task is to generate a comprehensive 4-meal daily plan (Breakfast, Lunch, Dinner, Snack) tailored to the student's fitness goal, calorie target, macro targets, and dietary restrictions.

CRITICAL REQUIREMENTS:
1. You MUST select real OSU dining items strictly from the provided candidate menu catalog.
2. Every item in your output must include its valid "id" matching the catalog.
3. The sum of calories across all 4 meal slots MUST be within ±5% of the student's targetCalories.
4. Dietary restrictions (e.g. vegan, vegetarian, glutenFree, halal) MUST be strictly respected.
5. Your response MUST be ONLY valid JSON matching this exact schema:
{
  "title": "String title for the plan",
  "rationale": "Brief 1-2 sentence coaching comment from Brutus explaining why this fuels their goal",
  "meals": {
    "breakfast": {
      "itemIds": ["menu-item-id-1"]
    },
    "lunch": {
      "itemIds": ["menu-item-id-2"]
    },
    "dinner": {
      "itemIds": ["menu-item-id-3"]
    },
    "snack": {
      "itemIds": ["menu-item-id-4", "menu-item-id-5"]
    }
  }
}
Do NOT include any markdown code blocks, backticks, or explanatory text outside the JSON object.`;

/**
 * Builds the user prompt payload for AI meal plan generation.
 */
export function buildMealPlanUserPrompt(
  profile: UserProfile,
  options?: PlanGenerationOptions,
  candidateItems?: MenuItem[]
): string {
  const targetCalories = options?.targetCalories ?? profile.targetCalories;
  const targetProtein = options?.targetMacros?.protein ?? profile.targetMacros.protein;
  const targetCarbs = options?.targetMacros?.carbs ?? profile.targetMacros.carbs;
  const targetFat = options?.targetMacros?.fat ?? profile.targetMacros.fat;
  const dietaryTags = options?.dietaryRestrictions ?? profile.dietaryRestrictions ?? [];
  const zone = options?.zone ?? 'All';

  let prompt = `Create a daily meal plan for ${profile.name}:\n`;
  prompt += `- Fitness Goal: ${profile.fitnessGoal}\n`;
  prompt += `- Target Calories: ${targetCalories} kcal (Allowed range: ${Math.round(targetCalories * 0.95)} - ${Math.round(targetCalories * 1.05)} kcal)\n`;
  prompt += `- Target Macros: Protein ${targetProtein}g, Carbs ${targetCarbs}g, Fat ${targetFat}g\n`;
  prompt += `- Dietary Restrictions: ${dietaryTags.length > 0 ? dietaryTags.join(', ') : 'None'}\n`;
  prompt += `- Campus Zone Preference: ${zone}\n`;

  if (options?.goalPreset) {
    prompt += `- Goal Preset: ${options.goalPreset}\n`;
  }
  if (options?.prompt) {
    prompt += `- Special Student Request: "${options.prompt}"\n`;
  }

  if (candidateItems && candidateItems.length > 0) {
    prompt += `\nCandidate OSU Menu Items (Use only IDs from this list):\n`;
    for (const item of candidateItems) {
      prompt += `- ID: "${item.id}" | Name: "${item.name}" | Venue: "${item.venueId}" | Category: ${item.category} | ${item.calories} kcal | P:${item.macros.protein}g C:${item.macros.carbs}g F:${item.macros.fat}g | Tags: [${item.dietaryTags.join(',')}]\n`;
    }
  }

  return prompt;
}

/**
 * Local offline conversational responses with authentic Brutus Buckeye phrasing
 * and genuine OSU dining suggestions when no API key is present.
 */
export interface FallbackIntentRule {
  keywords: string[];
  response: (profile: UserProfile) => string;
}

export const LOCAL_FALLBACK_INTENT_RULES: FallbackIntentRule[] = [
  {
    keywords: ['rpac', 'workout', 'lift', 'chest', 'leg day', 'post-workout', 'gym'],
    response: (profile) =>
      `O-H! Nothing beats a heavy lift at the RPAC! 🌰 To kickstart muscle protein synthesis for your ${profile.fitnessGoal} goals, walk straight across the Oval to Traditions at Scott. Hit the grilled chicken and brown rice station (46g protein) or grab a double scoop at the omelet bar. If you're on South Campus, Traditions at Kennedy's rotisserie chicken will get you right!`,
  },
  {
    keywords: ['scott', 'traditions at scott', 'north campus'],
    response: () =>
      `Traditions at Scott is the crown jewel of North Campus dining! 🏆 Best play: customized 2-egg omelet in the morning, Mongolian stir-fry bowl for lunch, and slow-roasted turkey breast at dinner. Pro tip: swipe in during off-peak hours (1:30 PM - 4:00 PM) to bypass the rush!`,
  },
  {
    keywords: ['curl', 'curl market'],
    response: () =>
      `Curl Market is top-tier for quick, nutritious fuel! 🌯 Build a custom chicken and brown rice pasta bowl, or grab one of their Protein Power Snack Boxes between classes. Don't forget: your 35% Dining Dollars discount applies here!`,
  },
  {
    keywords: ['late night', 'midnight', 'snack', 'study', 'thompson', 'library'],
    response: () =>
      `Burning the midnight oil at Thompson Library or SEL? 📚 Head over to Berry Café for an iced cold brew or swing by PAD (Pizza & Delivery) on North Campus for a late-night recovery meal. If you want something lighter, Curl Market's Greek yogurt bowls hit the spot without weighing you down.`,
  },
  {
    keywords: ['cut', 'cutting', 'fat loss', 'deficit', 'lean'],
    response: (profile) =>
      `Locked in on the cut? Let's keep that muscle mass preserved, Buckeye! Aim for high protein density: Scott's Slow-Roasted Turkey Breast (42g protein, only 280 kcal) and Kennedy's Grilled Salmon are absolute goldmines. Fill the rest of your plate with steamed broccoli and garden greens to stay satiated within your ${profile.targetCalories} kcal budget!`,
  },
  {
    keywords: ['bulk', 'bulking', 'gain', 'mass', 'muscle gain'],
    response: (profile) =>
      `Time to build that championship Buckeye physique! 💪 Since you're targeting ${profile.targetCalories} kcal, maximize your Traditions buffet swipes at Scott or Morrill. Stack double grilled chicken, hearty sweet potatoes, and peanut butter oatmeal bowls. Consistency in the weight room + clean calorie surplus = PR season!`,
  },
  {
    keywords: ['swipe', 'dining dollars', 'budget', 'buckid', 'money', 'cheap'],
    response: (profile) =>
      `Smart budgeting is key, Buckeye! 💡 You currently have ${profile.balances.swipes} Traditions swipes and $${profile.balances.diningDollars.toFixed(2)} in Dining Dollars. Maximize value by using Swipes at Scott, Kennedy, or Morrill for all-you-care-to-eat volume. Save your Dining Dollars for Curl Market, Berry Cafe, and 12th Ave Bread Co where you automatically get that sweet 35% discount!`,
  },
];

/**
 * Generates an offline conversational reply based on student query and profile.
 */
export function generateLocalConversationalReply(
  query: string,
  profile: UserProfile
): string {
  const lowerQuery = query.toLowerCase();

  for (const rule of LOCAL_FALLBACK_INTENT_RULES) {
    if (rule.keywords.some((kw) => lowerQuery.includes(kw))) {
      return rule.response(profile);
    }
  }

  // Default welcoming Buckeye guidance
  return `O-H! 🌰 I'm right here with you, ${profile.name.split(' ')[0]}! As your Buckeye nutrition coach, I can help you plan high-protein meals at Scott or Kennedy, recommend quick snacks near Thompson Library, or craft a 4-meal plan tailored to your ${profile.targetCalories} kcal target. What's on the playbook today?`;
}
