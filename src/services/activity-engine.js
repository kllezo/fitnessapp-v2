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
  
  const workout = Math.round(positiveTotal * 0.35); // 35%
  const protein = Math.round(positiveTotal * 0.20); // 20%
  const sleep = Math.round(positiveTotal * 0.25);   // 25%
  const hydration = positiveTotal - (workout + protein + sleep); // Remainder
  
  return {
    workout: Math.max(0, workout),
    protein: Math.max(0, protein),
    sleep: Math.max(0, sleep),
    hydration: Math.max(0, hydration),
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
