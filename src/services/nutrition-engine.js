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
    case 'aggressive_bulk': calories = tdee + 500; break;
    case 'recomposition': calories = tdee - 150; break;
    default: calories = tdee;
  }

  // Protein target
  const proteinMultiplier = goal === 'build_muscle' ? 2.2 : goal === 'lose_fat' ? 2.0 : goal === 'aggressive_bulk' ? 2.3 : goal === 'recomposition' ? 2.1 : 1.8;
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
  const targets = calculateMacros(state);
  const protTarget = targets.protein;

  // Let's include Pre Workout by default to make it 5 meals max
  const hasPreWorkout = true; 

  // Partition targets
  let breakfastTarget, lunchTarget, snacksTarget, dinnerTarget, preWorkoutTarget;
  if (hasPreWorkout) {
    preWorkoutTarget = Math.round(protTarget * 0.1);
    breakfastTarget = Math.round(protTarget * 0.25);
    lunchTarget = Math.round(protTarget * 0.25);
    snacksTarget = Math.round(protTarget * 0.15);
    dinnerTarget = protTarget - (preWorkoutTarget + breakfastTarget + lunchTarget + snacksTarget);
  } else {
    breakfastTarget = Math.round(protTarget * 0.25);
    lunchTarget = Math.round(protTarget * 0.3);
    snacksTarget = Math.round(protTarget * 0.15);
    dinnerTarget = protTarget - (breakfastTarget + lunchTarget + snacksTarget);
  }

  const rawBreakfast = meals.find(m => m.mealType?.includes('breakfast')) || { name: 'Oats Protein Bowl', emoji: '🥣', prepTime: '10 min', calories: 350, protein: 20, recipe: 'Cook oats with milk.' };
  const rawLunch = meals.find(m => m.mealType?.includes('lunch')) || { name: 'Dal Chawal & Curry', emoji: '🍛', prepTime: '20 min', calories: 420, protein: 18, recipe: 'Standard Dal Chawal.' };
  const rawDinner = meals.find(m => m.mealType?.includes('dinner')) || { name: 'Chicken Breast Bowl', emoji: '🍗', prepTime: '25 min', calories: 380, protein: 45, recipe: 'Grilled chicken.' };
  const rawSnack = meals.find(m => m.mealType?.includes('snack')) || { name: 'Peanut Butter Banana', emoji: '🥜', prepTime: '5 min', calories: 340, protein: 14, recipe: 'PB on bread.' };
  const rawPre = { name: 'Whey Shake & Almonds', emoji: '🥤', prepTime: '2 min', calories: 150, protein: 25, recipe: 'Whey scoop in water + 10 almonds' };

  // Scale macros to hit targets
  const breakfast = {
    ...rawBreakfast,
    protein: breakfastTarget,
    calories: Math.round(rawBreakfast.calories * (breakfastTarget / (rawBreakfast.protein || 20)))
  };
  const lunch = {
    ...rawLunch,
    protein: lunchTarget,
    calories: Math.round(rawLunch.calories * (lunchTarget / (rawLunch.protein || 20)))
  };
  const dinner = {
    ...rawDinner,
    protein: dinnerTarget,
    calories: Math.round(rawDinner.calories * (dinnerTarget / (rawDinner.protein || 40)))
  };
  const snack = {
    ...rawSnack,
    protein: snacksTarget,
    calories: Math.round(rawSnack.calories * (snacksTarget / (rawSnack.protein || 14)))
  };
  const preWorkout = hasPreWorkout ? {
    ...rawPre,
    protein: preWorkoutTarget,
    calories: Math.round(rawPre.calories * (preWorkoutTarget / (rawPre.protein || 25)))
  } : null;

  return {
    breakfast,
    lunch,
    dinner,
    snack,
    preWorkout,
    targets,
  };
}

// Food metrics scaling database
const FOOD_METRIC_DB = {
  rice: { unit: 'g', caloriesPerUnit: 1.3, proteinPerUnit: 0.027, emoji: '🍚' },
  chicken: { unit: 'g', caloriesPerUnit: 1.65, proteinPerUnit: 0.31, emoji: '🍗' },
  milk: { unit: 'ml', caloriesPerUnit: 0.6, proteinPerUnit: 0.032, emoji: '🥛' },
  tea: { unit: 'cup', caloriesPerUnit: 40, proteinPerUnit: 1, emoji: '☕' },
  coffee: { unit: 'cup', caloriesPerUnit: 30, proteinPerUnit: 0.5, emoji: '☕' },
  curd: { unit: 'g', caloriesPerUnit: 0.98, proteinPerUnit: 0.043, emoji: '🥛' },
  buttermilk: { unit: 'ml', caloriesPerUnit: 0.4, proteinPerUnit: 0.03, emoji: '🥛' },
  roti: { unit: 'piece', caloriesPerUnit: 80, proteinPerUnit: 3, emoji: '🫓' },
  dal: { unit: 'g', caloriesPerUnit: 1.2, proteinPerUnit: 0.08, emoji: '🫘' },
  paneer: { unit: 'g', caloriesPerUnit: 2.65, proteinPerUnit: 0.18, emoji: '🧀' },
  eggs: { unit: 'piece', caloriesPerUnit: 70, proteinPerUnit: 6, emoji: '🥚' },
  egg: { unit: 'piece', caloriesPerUnit: 70, proteinPerUnit: 6, emoji: '🥚' },
  fish: { unit: 'g', caloriesPerUnit: 1.2, proteinPerUnit: 0.2, emoji: '🐟' },
  'peanut butter': { unit: 'g', caloriesPerUnit: 5.88, proteinPerUnit: 0.25, emoji: '🥜' },
  oats: { unit: 'g', caloriesPerUnit: 3.89, proteinPerUnit: 0.169, emoji: '🥣' },
  banana: { unit: 'piece', caloriesPerUnit: 90, proteinPerUnit: 1.1, emoji: '🍌' },
  fruit: { unit: 'g', caloriesPerUnit: 0.52, proteinPerUnit: 0.003, emoji: '🍎' },
  fruits: { unit: 'g', caloriesPerUnit: 0.52, proteinPerUnit: 0.003, emoji: '🍎' },
  'protein powder': { unit: 'scoop', caloriesPerUnit: 120, proteinPerUnit: 25, emoji: '🥤' },
  'protein bar': { unit: 'bar', caloriesPerUnit: 200, proteinPerUnit: 20, emoji: '🍫' }
};

export function calculateCustomMacros(foodName, quantity, unit) {
  const name = foodName.toLowerCase().trim();
  let match = null;
  
  for (const [key, val] of Object.entries(FOOD_METRIC_DB)) {
    if (name.includes(key)) {
      match = val;
      break;
    }
  }
  
  const qty = parseFloat(quantity) || 100;
  
  if (match) {
    return {
      protein: Math.round(match.proteinPerUnit * qty),
      calories: Math.round(match.caloriesPerUnit * qty),
      emoji: match.emoji
    };
  }
  
  // Custom unit fallbacks
  const u = (unit || 'g').toLowerCase().trim();
  if (u === 'g') {
    return { protein: Math.round(0.08 * qty), calories: Math.round(1.2 * qty), emoji: '🍽️' };
  } else if (u === 'ml') {
    return { protein: Math.round(0.03 * qty), calories: Math.round(0.6 * qty), emoji: '🥛' };
  } else if (u === 'scoop' || u === 'scoops') {
    return { protein: Math.round(25 * qty), calories: Math.round(120 * qty), emoji: '🥤' };
  } else if (u === 'bar' || u === 'bars') {
    return { protein: Math.round(15 * qty), calories: Math.round(180 * qty), emoji: '🍫' };
  } else if (u === 'cup' || u === 'cups') {
    return { protein: Math.round(1 * qty), calories: Math.round(40 * qty), emoji: '☕' };
  } else {
    // default piece
    return { protein: Math.round(2 * qty), calories: Math.round(80 * qty), emoji: '🍽️' };
  }
}

// ── Log food ──
export function quickLogFood(keyword, state = getState()) {
  const name = keyword.toLowerCase().trim();
  const res = calculateCustomMacros(name, 100, 'g');
  return res;
}
