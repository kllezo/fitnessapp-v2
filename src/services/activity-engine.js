// ==========================================
// AURA V2 — Activity / Movement Service
// ==========================================

import { getState, setState, updateState, getTodayDateString, getReadinessLabel, getDisciplineScore } from '../state/index.js';
import { computeReadinessScore } from './ai-engine.js';

/**
 * Returns the exact mathematical breakdown of the current discipline score
 */
export function getDisciplineBreakdown(state = getState()) {
  const score = getDisciplineScore(state);
  const missed = -6;
  const skipped = -4;
  
  // Total of positive categories must equal: score - (missed + skipped) = score + 10
  const positiveTotal = score - missed - skipped; // e.g. 52 + 10 = 62
  
  const workout = Math.round(positiveTotal * 0.30); // 30%
  const protein = Math.round(positiveTotal * 0.15); // 15%
  const sleep = Math.round(positiveTotal * 0.20);   // 20%
  const hydration = Math.round(positiveTotal * 0.15); // 15%
  const recovery = Math.round(positiveTotal * 0.10);  // 10%
  const stepGoal = positiveTotal - (workout + protein + sleep + hydration + recovery); // Remainder
  
  return {
    workout: Math.max(0, workout),
    protein: Math.max(0, protein),
    sleep: Math.max(0, sleep),
    hydration: Math.max(0, hydration),
    recovery: Math.max(0, recovery),
    stepGoal: Math.max(0, stepGoal),
    missed,
    skipped,
    total: score
  };
}

/**
 * Returns the index of the day in Mon-Sun array (0 = Mon, 6 = Sun)
 */
export function getDayIndexMonSun() {
  const day = new Date().getDay(); // 0 = Sun, 1 = Mon, ...
  return day === 0 ? 6 : day - 1;
}

/**
 * Abstraction layer to fetch activity data.
 * Future integrations (Apple Health, Google Fit, etc.) will plug in here.
 */
export function getActivityData() {
  const state = getState();
  return state.activity || {
    steps: 0,
    distanceKm: 0,
    caloriesBurned: 0,
    stairsClimbed: 0,
    stepGoal: 10000,
    weeklySteps: [0, 0, 0, 0, 0, 0, 0],
    weeklyDistance: [0, 0, 0, 0, 0, 0, 0],
    activityHistory: []
  };
}

/**
 * Update the daily steps goal.
 */
export function updateActivityGoal(newGoal) {
  const goal = Number(newGoal) || 10000;
  
  // Save in activity, profile, and onboarding states
  setState('activity.stepGoal', goal);
  setState('profile.stepGoal', goal);
  setState('onboarding.stepGoal', goal);

  // Recalculate readiness to incorporate new goal progress modifier
  _recalculateReadiness();
}

/**
 * Update the daily steps value and dynamically scale other stats.
 */
export function updateActivitySteps(steps) {
  const currentSteps = Math.max(0, Number(steps));
  const currentGoal = getActivityData().stepGoal || 10000;

  // Proportional estimations:
  // - Distance: ~0.8m per step (0.0008 km)
  // - Calories: ~0.05 kcal per step
  // - Stairs: ~1 flight per 350 steps
  const distanceKm = Number((currentSteps * 0.0008).toFixed(1));
  const caloriesBurned = Math.round(currentSteps * 0.05);
  const stairsClimbed = Math.round(currentSteps / 350);

  // Update daily activity state
  updateState('activity', {
    steps: currentSteps,
    distanceKm,
    caloriesBurned,
    stairsClimbed
  });

  // Update weekly arrays (Mon-Sun)
  const dayIdx = getDayIndexMonSun();
  const weeklySteps = [...(getActivityData().weeklySteps || [0, 0, 0, 0, 0, 0, 0])];
  const weeklyDistance = [...(getActivityData().weeklyDistance || [0, 0, 0, 0, 0, 0, 0])];
  weeklySteps[dayIdx] = currentSteps;
  weeklyDistance[dayIdx] = distanceKm;
  setState('activity.weeklySteps', weeklySteps);
  setState('activity.weeklyDistance', weeklyDistance);

  // Update activityHistory
  const todayStr = getTodayDateString();
  const history = [...(getActivityData().activityHistory || [])];
  const todayEntryIdx = history.findIndex(h => h.date === todayStr);

  const entry = {
    date: todayStr,
    steps: currentSteps,
    distanceKm,
    caloriesBurned,
    stairsClimbed
  };

  if (todayEntryIdx !== -1) {
    history[todayEntryIdx] = entry;
  } else {
    history.push(entry);
  }
  setState('activity.activityHistory', history);

  // Recalculate readiness since steps changed
  _recalculateReadiness();
}

/**
 * Internal helper to re-compute and update readiness score based on steps.
 */
function _recalculateReadiness() {
  const state = getState();
  const answers = state.checkIn?.answers;
  
  if (answers && Object.keys(answers).length > 0) {
    const score = computeReadinessScore(answers);
    setState('checkIn.readinessScore', score);
    
    // Update readiness category
    const { color } = getReadinessLabel(score);
    setState('app.readiness', color === 'violet' ? 'high' : color === 'mint' ? 'medium' : 'low');
    
    // Attempt to update DOM readiness attribute if mounted
    const shell = document.getElementById('phone-shell');
    if (shell) {
      shell.setAttribute('data-readiness', color === 'violet' ? 'high' : color === 'mint' ? 'medium' : 'low');
    }
  }
}

/**
 * Returns the dynamically calculated daily active burn goal based on user metrics
 */
export function getDailyBurnGoal(state = getState()) {
  if (state.activity?.burnGoal) {
    return state.activity.burnGoal;
  }
  
  const onboarding = state.onboarding || {};
  const profile = state.profile || {};
  
  // 1. Goal Base Target
  const goals = Array.isArray(onboarding.goal) ? onboarding.goal : (onboarding.goal ? [onboarding.goal] : ['maintain']);
  let target = 400;
  
  if (goals.includes('lose_fat')) {
    target = 650;
  } else if (goals.includes('endurance')) {
    target = 550;
  } else if (goals.includes('maintain') || goals.includes('flexibility')) {
    target = 400;
  } else if (goals.includes('build_muscle')) {
    target = 325;
  }
  
  // 2. BMR Modifier (higher baseline metabolism -> higher daily target active burn capability)
  const bmr = Number(profile.bmr) || Number(onboarding.bmr) || 1600;
  const bmrModifier = (bmr - 1600) * 0.1; // adds/subtracts ~10% of deviation from 1600 BMR
  
  // 3. BMI Modifier (higher weight/BMI -> burns more calories for same activity level)
  const bmi = Number(profile.bmi) || Number(onboarding.bmi) || 22;
  const bmiModifier = (bmi - 22) * 5; // adds/subtracts 5 kcal per unit deviation from healthy average BMI of 22
  
  // 4. Workout Frequency Modifier (more training days per week -> higher daily active calorie target)
  const trainingDays = Number(onboarding.trainingDays) || 3;
  const frequencyModifier = (trainingDays - 3) * 25; // 25 kcal adjustment per day deviation from 3 days/wk
  
  // 5. Activity Level Modifier
  const activityLevel = onboarding.activityLevel || 'light';
  const activityModifiers = {
    sedentary: -50,
    light: 0,
    active: 50,
    very_active: 100
  };
  const activityModifier = activityModifiers[activityLevel] || 0;
  
  const finalGoal = Math.round(target + bmrModifier + bmiModifier + frequencyModifier + activityModifier);
  
  return Math.max(250, finalGoal);
}

/**
 * Returns the detailed breakdown of calories burned today
 */
export function getCalorieBurnBreakdown(state = getState()) {
  const todayStr = getTodayDateString();
  const activity = state.activity || {};
  const steps = activity.steps || 0;
  
  // 1. Walking Calories
  const walkingCalories = Math.round(steps * 0.05);
  
  // 2. Gym Calories from logged workouts today
  const workoutHistory = state.workout?.history || [];
  const todayWorkouts = workoutHistory.filter(w => w.date === todayStr);
  let gymCalories = 0;
  if (todayWorkouts.length > 0) {
    todayWorkouts.forEach(w => {
      gymCalories += w.caloriesBurned || (w.duration ? w.duration * 8 : 350);
    });
  }
  
  // 3. NEAT base activity calories
  const activityLevel = state.onboarding?.activityLevel || 'light';
  const neatMap = {
    sedentary: 100,
    light: 150,
    active: 250,
    very_active: 350
  };
  const neatCalories = neatMap[activityLevel] || 150;
  
  // 4. Total Burn
  const totalBurn = gymCalories + walkingCalories + neatCalories;
  
  return {
    walking: walkingCalories,
    gym: gymCalories,
    neat: neatCalories,
    total: totalBurn
  };
}

