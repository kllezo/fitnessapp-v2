// ==========================================
// AURA V2 — Nutrition Engine
// ==========================================

import { getState } from '../state/index.js';

// ── Indian Meal Database ──
const MEAL_DB = [
  {
    name: 'Dal Chawal',
    protein: 18, calories: 420, carbs: 72, fat: 6,
    dietType: ['veg', 'egg', 'nonveg'],
    stayType: ['home', 'hostel', 'alone'],
    budget: ['low', 'medium', 'premium'],
    cost: { low: 40, medium: 50, premium: 60 },
    emoji: '🍛',
    recipe: 'Cook dal with turmeric, cumin, tomato. Serve over rice.',
    prepTime: '20 min',
    mealType: ['lunch', 'dinner'],
  },
  {
    name: 'Paneer Bhurji',
    protein: 28, calories: 380, carbs: 12, fat: 22,
    dietType: ['veg', 'egg'],
    stayType: ['home', 'alone'],
    budget: ['medium', 'premium'],
    cost: { medium: 80, premium: 120 },
    emoji: '🧀',
    recipe: 'Crumble paneer. Saute onion, tomato, spices. Add paneer, cook 5 min.',
    prepTime: '15 min',
    mealType: ['breakfast', 'lunch'],
  },
  {
    name: 'Soy Chunk Curry',
    protein: 26, calories: 290, carbs: 22, fat: 8,
    dietType: ['veg', 'egg', 'nonveg'],
    stayType: ['home', 'hostel', 'alone'],
    budget: ['low', 'medium'],
    cost: { low: 35, medium: 45 },
    emoji: '🫘',
    recipe: 'Boil soy chunks. Saute with onion gravy, spices. Simmer 10 min.',
    prepTime: '20 min',
    mealType: ['lunch', 'dinner'],
  },
  {
    name: 'Eggs Bhurji',
    protein: 24, calories: 280, carbs: 8, fat: 18,
    dietType: ['egg', 'nonveg'],
    stayType: ['home', 'hostel', 'alone'],
    budget: ['low', 'medium'],
    cost: { low: 25, medium: 35 },
    emoji: '🍳',
    recipe: 'Beat 3 eggs. Saute onion, tomato, chili. Add eggs, scramble.',
    prepTime: '10 min',
    singleServe: true,
    mealType: ['breakfast', 'snack'],
  },
  {
    name: 'Poha',
    protein: 8, calories: 260, carbs: 48, fat: 6,
    dietType: ['veg', 'egg', 'nonveg'],
    stayType: ['home', 'hostel', 'alone'],
    budget: ['low'],
    cost: { low: 20 },
    emoji: '🥣',
    recipe: 'Rinse poha. Temper mustard, curry leaves. Add poha, lemon, peanuts.',
    prepTime: '10 min',
    mealType: ['breakfast'],
  },
  {
    name: 'Chicken Breast Bowl',
    protein: 45, calories: 380, carbs: 28, fat: 10,
    dietType: ['nonveg'],
    stayType: ['home', 'alone'],
    budget: ['medium', 'premium'],
    cost: { medium: 120, premium: 160 },
    emoji: '🍗',
    recipe: 'Marinate chicken. Grill 15 min. Serve with rice and salad.',
    prepTime: '25 min',
    mealType: ['lunch', 'dinner'],
  },
  {
    name: 'Curd Rice',
    protein: 12, calories: 320, carbs: 55, fat: 8,
    dietType: ['veg', 'egg', 'nonveg'],
    stayType: ['home', 'hostel', 'alone'],
    budget: ['low', 'medium'],
    cost: { low: 30, medium: 40 },
    emoji: '🥛',
    recipe: 'Mix cooked rice with curd. Temper mustard, curry leaves.',
    prepTime: '5 min',
    mealType: ['lunch', 'dinner'],
  },
  {
    name: 'Peanut Butter Banana',
    protein: 14, calories: 340, carbs: 42, fat: 16,
    dietType: ['veg', 'egg', 'nonveg'],
    stayType: ['home', 'hostel', 'alone'],
    budget: ['low', 'medium'],
    cost: { low: 30, medium: 35 },
    emoji: '🥜',
    recipe: 'Spread peanut butter on bread. Add banana slices.',
    prepTime: '2 min',
    singleServe: true,
    mealType: ['breakfast', 'snack'],
  },
  {
    name: 'Tuna Salad',
    protein: 38, calories: 290, carbs: 10, fat: 12,
    dietType: ['nonveg'],
    stayType: ['home', 'alone'],
    budget: ['medium', 'premium'],
    cost: { medium: 140, premium: 180 },
    emoji: '🐟',
    recipe: 'Mix tuna with cucumber, onion, lemon juice, salt.',
    prepTime: '5 min',
    mealType: ['lunch', 'snack'],
  },
  {
    name: 'Oats Protein Bowl',
    protein: 20, calories: 350, carbs: 52, fat: 8,
    dietType: ['veg', 'egg', 'nonveg'],
    stayType: ['home', 'hostel', 'alone'],
    budget: ['low', 'medium'],
    cost: { low: 30, medium: 45 },
    emoji: '🥣',
    recipe: 'Cook oats in milk. Add protein powder, banana, honey.',
    prepTime: '10 min',
    mealType: ['breakfast'],
  },
  {
    name: 'Rajma Chawal',
    protein: 22, calories: 460, carbs: 80, fat: 6,
    dietType: ['veg', 'egg', 'nonveg'],
    stayType: ['home', 'alone'],
    budget: ['low', 'medium'],
    cost: { low: 50, medium: 65 },
    emoji: '🫘',
    recipe: 'Soak and cook rajma. Make onion-tomato gravy. Serve with rice.',
    prepTime: '40 min',
    mealType: ['lunch', 'dinner'],
  },
  {
    name: 'Grilled Fish',
    protein: 40, calories: 280, carbs: 4, fat: 12,
    dietType: ['nonveg'],
    stayType: ['home', 'alone'],
    budget: ['medium', 'premium'],
    cost: { medium: 150, premium: 220 },
    emoji: '🐠',
    recipe: 'Marinate fish with spices. Grill 8-10 min each side.',
    prepTime: '20 min',
    mealType: ['lunch', 'dinner'],
  },
];

// ── Macro Calculator (Mifflin-St Jeor) ──
export function calculateMacros(state = getState()) {
  const ob = state.onboarding;
  if (!ob?.weight || !ob?.height || !ob?.age || !ob?.gender) {
    return { calories: 2000, protein: 150, water: 3.0 };
  }

  const { weight, height, age, gender, activityLevel, goal, bodyType } = ob;

  // BMR
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity multiplier
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    active: 1.55,
    very_active: 1.725,
  };
  const tdee = bmr * (multipliers[activityLevel] || 1.375);

  // Goal adjustment
  let calories;
  switch (goal) {
    case 'build_muscle': calories = tdee + 300; break;
    case 'lose_fat': calories = tdee - 400; break;
    case 'endurance': calories = tdee + 100; break;
    default: calories = tdee;
  }

  // Protein target
  const proteinMultiplier = goal === 'build_muscle' ? 2.2 : goal === 'lose_fat' ? 2.0 : 1.8;
  const protein = Math.round(weight * proteinMultiplier);

  // Water target (ml → litres)
  const water = +(weight * 0.035 + (activityLevel === 'very_active' ? 1 : 0.5)).toFixed(1);

  return {
    calories: Math.round(calories),
    protein: Math.min(protein, 220),
    water: Math.min(water, 5.0),
  };
}

// ── Get filtered meals ──
export function getFilteredMeals(state = getState()) {
  const { dietType, budget, stayType } = state.onboarding || {};
  const dt = dietType || 'nonveg';
  const b = budget || 'medium';
  const st = stayType || 'home';

  return MEAL_DB.filter(meal => {
    const dietMatch = dt === 'nonveg'
      ? true
      : dt === 'egg'
        ? meal.dietType.includes('veg') || meal.dietType.includes('egg')
        : meal.dietType.includes('veg');

    const budgetMatch = meal.budget.includes(b) || meal.budget.includes('low');
    const stayMatch = meal.stayType.includes(st) || meal.stayType.includes('home');

    return dietMatch && budgetMatch && stayMatch;
  });
}

// ── Daily meal plan ──
export function getDailyMealPlan(state = getState()) {
  const meals = getFilteredMeals(state);
  const macros = calculateMacros(state);

  const breakfast = meals.filter(m => m.mealType?.includes('breakfast'))[0];
  const lunch = meals.filter(m => m.mealType?.includes('lunch'))[1] || meals[1];
  const dinner = meals.filter(m => m.mealType?.includes('dinner'))[2] || meals[2];
  const snack = meals.filter(m => m.mealType?.includes('snack'))[0] || meals[3];

  return {
    breakfast,
    lunch,
    dinner,
    snack,
    targets: macros,
  };
}

// ── Log food ──
export function quickLogFood(keyword, state = getState()) {
  const QUICK = {
    egg: { protein: 6, calories: 70, emoji: '🥚' },
    eggs: { protein: 18, calories: 210, emoji: '🥚' },
    chicken: { protein: 30, calories: 180, emoji: '🍗' },
    paneer: { protein: 18, calories: 265, emoji: '🧀' },
    dal: { protein: 9, calories: 150, emoji: '🫘' },
    rice: { protein: 4, calories: 200, emoji: '🍚' },
    banana: { protein: 1, calories: 90, emoji: '🍌' },
    milk: { protein: 8, calories: 120, emoji: '🥛' },
    whey: { protein: 25, calories: 120, emoji: '💊' },
    oats: { protein: 10, calories: 300, emoji: '🥣' },
    roti: { protein: 4, calories: 120, emoji: '🫓' },
    fish: { protein: 22, calories: 150, emoji: '🐟' },
    tuna: { protein: 30, calories: 130, emoji: '🐟' },
    peanut: { protein: 8, calories: 190, emoji: '🥜' },
    curd: { protein: 10, calories: 100, emoji: '🥛' },
    soy: { protein: 20, calories: 120, emoji: '🫘' },
  };
  const key = keyword.toLowerCase().trim();
  return QUICK[key] || { protein: 5, calories: 100, emoji: '🍽️' };
}
