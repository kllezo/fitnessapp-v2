// ==========================================
// AURA V2 — Workout Engine
// ==========================================

import { getState, updateState, setState } from '../state/index.js';

// ── Exercise Database ──
const EXERCISE_DB = {
  chest: [
    { name: 'Barbell Bench Press', type: 'compound', equipment: ['barbell'], muscle: 'chest' },
    { name: 'Incline Dumbbell Press', type: 'compound', equipment: ['dumbbell'], muscle: 'chest' },
    { name: 'Cable Fly', type: 'isolation', equipment: ['cable'], muscle: 'chest' },
    { name: 'Push-Up', type: 'compound', equipment: ['bodyweight'], muscle: 'chest' },
    { name: 'Dumbbell Fly', type: 'isolation', equipment: ['dumbbell'], muscle: 'chest' },
    { name: 'Decline Bench Press', type: 'compound', equipment: ['barbell'], muscle: 'chest' },
  ],
  back: [
    { name: 'Pull-Up', type: 'compound', equipment: ['bodyweight', 'bar'], muscle: 'back' },
    { name: 'Barbell Row', type: 'compound', equipment: ['barbell'], muscle: 'back' },
    { name: 'Lat Pulldown', type: 'compound', equipment: ['cable'], muscle: 'back' },
    { name: 'Seated Cable Row', type: 'compound', equipment: ['cable'], muscle: 'back' },
    { name: 'Dumbbell Row', type: 'compound', equipment: ['dumbbell'], muscle: 'back' },
    { name: 'Face Pull', type: 'isolation', equipment: ['cable'], muscle: 'back' },
  ],
  shoulders: [
    { name: 'Overhead Press', type: 'compound', equipment: ['barbell'], muscle: 'shoulders' },
    { name: 'Lateral Raise', type: 'isolation', equipment: ['dumbbell'], muscle: 'shoulders' },
    { name: 'Front Raise', type: 'isolation', equipment: ['dumbbell'], muscle: 'shoulders' },
    { name: 'Arnold Press', type: 'compound', equipment: ['dumbbell'], muscle: 'shoulders' },
    { name: 'Rear Delt Fly', type: 'isolation', equipment: ['dumbbell'], muscle: 'shoulders' },
  ],
  arms: [
    { name: 'Barbell Curl', type: 'isolation', equipment: ['barbell'], muscle: 'biceps' },
    { name: 'Hammer Curl', type: 'isolation', equipment: ['dumbbell'], muscle: 'biceps' },
    { name: 'Tricep Pushdown', type: 'isolation', equipment: ['cable'], muscle: 'triceps' },
    { name: 'Overhead Tricep Extension', type: 'isolation', equipment: ['dumbbell'], muscle: 'triceps' },
    { name: 'Incline Dumbbell Curl', type: 'isolation', equipment: ['dumbbell'], muscle: 'biceps' },
    { name: 'Skull Crusher', type: 'isolation', equipment: ['barbell'], muscle: 'triceps' },
  ],
  legs: [
    { name: 'Barbell Squat', type: 'compound', equipment: ['barbell'], muscle: 'quads' },
    { name: 'Romanian Deadlift', type: 'compound', equipment: ['barbell'], muscle: 'hamstrings' },
    { name: 'Leg Press', type: 'compound', equipment: ['machine'], muscle: 'quads' },
    { name: 'Leg Extension', type: 'isolation', equipment: ['machine'], muscle: 'quads' },
    { name: 'Leg Curl', type: 'isolation', equipment: ['machine'], muscle: 'hamstrings' },
    { name: 'Calf Raise', type: 'isolation', equipment: ['machine', 'bodyweight'], muscle: 'calves' },
    { name: 'Lunges', type: 'compound', equipment: ['bodyweight', 'dumbbell'], muscle: 'quads' },
    { name: 'Hip Thrust', type: 'compound', equipment: ['barbell'], muscle: 'glutes' },
  ],
  core: [
    { name: 'Plank', type: 'compound', equipment: ['bodyweight'], muscle: 'core' },
    { name: 'Hanging Leg Raise', type: 'isolation', equipment: ['bar'], muscle: 'core' },
    { name: 'Cable Crunch', type: 'isolation', equipment: ['cable'], muscle: 'core' },
    { name: 'Russian Twist', type: 'isolation', equipment: ['bodyweight'], muscle: 'core' },
    { name: 'Ab Wheel Rollout', type: 'compound', equipment: ['ab_wheel'], muscle: 'core' },
    { name: 'Mountain Climber', type: 'compound', equipment: ['bodyweight'], muscle: 'core' },
  ],
};

// ── Split Templates ──
const SPLITS = {
  ppl: [
    { day: 'Push', muscles: ['chest', 'shoulders', 'arms'] },
    { day: 'Pull', muscles: ['back', 'arms'] },
    { day: 'Legs', muscles: ['legs', 'core'] },
    { day: 'Push', muscles: ['chest', 'shoulders', 'arms'] },
    { day: 'Pull', muscles: ['back', 'arms'] },
    { day: 'Legs', muscles: ['legs', 'core'] },
  ],
  upper_lower: [
    { day: 'Upper A', muscles: ['chest', 'back', 'shoulders'] },
    { day: 'Lower A', muscles: ['legs', 'core'] },
    { day: 'Upper B', muscles: ['back', 'chest', 'arms'] },
    { day: 'Lower B', muscles: ['legs', 'core'] },
  ],
  full_body: [
    { day: 'Full Body A', muscles: ['chest', 'back', 'legs', 'core'] },
    { day: 'Full Body B', muscles: ['shoulders', 'arms', 'legs', 'core'] },
    { day: 'Full Body C', muscles: ['chest', 'back', 'legs'] },
  ],
  bro_split: [
    { day: 'Chest', muscles: ['chest', 'core'] },
    { day: 'Back', muscles: ['back', 'core'] },
    { day: 'Shoulders', muscles: ['shoulders', 'core'] },
    { day: 'Arms', muscles: ['arms', 'core'] },
    { day: 'Legs', muscles: ['legs', 'core'] },
  ],
};

// ── Home workout bodyweight substitutions ──
const HOME_SUBS = {
  'Barbell Bench Press': { name: 'Push-Up Variation', type: 'compound', equipment: ['bodyweight'], muscle: 'chest' },
  'Barbell Row': { name: 'Inverted Row', type: 'compound', equipment: ['bodyweight'], muscle: 'back' },
  'Barbell Squat': { name: 'Goblet Squat / Bodyweight Squat', type: 'compound', equipment: ['bodyweight'], muscle: 'quads' },
  'Leg Press': { name: 'Bulgarian Split Squat', type: 'compound', equipment: ['bodyweight'], muscle: 'quads' },
  'Lat Pulldown': { name: 'Resistance Band Pulldown', type: 'compound', equipment: ['band'], muscle: 'back' },
};

export function generateWeeklyPlan(state = getState()) {
  const ob = state.onboarding;
  const readiness = state.checkIn?.readinessScore || 70;
  const split = ob?.splitPreference || 'ppl';
  const days = ob?.trainingDays || 4;
  const mode = ob?.workoutMode || 'gym';
  const experience = ob?.experience || 'returning';
  const equipment = ob?.equipment || [];

  const template = SPLITS[split] || SPLITS.ppl;
  const plan = [];

  for (let i = 0; i < days; i++) {
    const dayTemplate = template[i % template.length];
    const exercises = _buildExercisesForDay(dayTemplate.muscles, mode, experience, readiness, equipment);
    plan.push({
      dayIndex: i,
      dayName: dayTemplate.day,
      label: `Day ${i + 1} — ${dayTemplate.day}`,
      exercises,
      estimatedDuration: _estimateDuration(exercises, readiness),
    });
  }

  setState('workout.generatedPlan', plan);
  return plan;
}

function _buildExercisesForDay(muscles, mode, experience, readiness, userEquipment) {
  const exerciseFactor = { beginner: 0.7, returning: 1.0, experienced: 1.25 }[experience] || 1.0;
  const readinessFactor = readiness >= 80 ? 1.1 : readiness >= 55 ? 1.0 : 0.8;

  const exercises = [];
  const exercisesPerMuscle = experience === 'beginner' ? 1 : 2;

  for (const muscle of muscles.slice(0, 3)) {
    const pool = EXERCISE_DB[muscle] || [];
    let filtered = mode === 'gym'
      ? pool
      : pool.filter(e => e.equipment.some(eq => ['bodyweight', 'band', 'bar', 'ab_wheel', 'dumbbell'].includes(eq)));

    // Apply home substitutions
    const selected = filtered.slice(0, exercisesPerMuscle).map(ex => {
      const sub = mode === 'home' && HOME_SUBS[ex.name];
      return sub || ex;
    });

    for (const ex of selected) {
      const baseWeight = _getBaseWeight(ex, experience);
      const sets = _getSetsForExperience(experience, readiness);
      const reps = _getRepsForGoal(getState().onboarding?.goal);

      exercises.push({
        name: ex.name,
        muscle: ex.muscle,
        type: ex.type,
        sets: Array.from({ length: sets }, () => ({
          weight: Math.round(baseWeight * readinessFactor),
          targetReps: reps,
          difficulty: null,
          done: false,
        })),
        volume: 0,
        done: false,
        notes: '',
      });
    }
  }

  return exercises;
}

function _getBaseWeight(ex, experience) {
  if (ex.equipment.includes('bodyweight')) return 0;
  const base = { beginner: 20, returning: 40, experienced: 60 }[experience] || 40;
  if (['legs'].includes(ex.muscle)) return base * 1.5;
  if (['core'].includes(ex.muscle)) return 0;
  return base;
}

function _getSetsForExperience(exp, readiness) {
  const base = { beginner: 2, returning: 3, experienced: 4 }[exp] || 3;
  return readiness < 45 ? Math.max(2, base - 1) : base;
}

function _getRepsForGoal(goal) {
  switch (goal) {
    case 'build_muscle': return 10;
    case 'lose_fat': return 15;
    case 'endurance': return 20;
    default: return 12;
  }
}

function _estimateDuration(exercises, readiness) {
  const baseMinutes = exercises.length * 8;
  const restFactor = readiness >= 70 ? 1.0 : 0.85;
  return Math.round(baseMinutes * restFactor);
}

// ── Check for Personal Records ──
export function checkForPR(exerciseName, weight, reps, state = getState()) {
  const prs = state.workout.prs || {};
  const current = prs[exerciseName];
  if (!current || weight > current.weight || (weight === current.weight && reps > current.reps)) {
    const newPR = { weight, reps, date: new Date().toISOString().split('T')[0] };
    const allPRs = { ...prs, [exerciseName]: newPR };
    setState('workout.prs', allPRs);
    return true;
  }
  return false;
}

// ── Get overload suggestion ──
export function getOverloadSuggestion(exerciseName, currentWeight, difficulty, state = getState()) {
  if (difficulty >= 8) return { weight: currentWeight + 2.5, reps: null, reason: 'Difficulty high — increase load +2.5kg' };
  if (difficulty <= 5) return { weight: null, reps: 1, reason: 'Difficulty low — add 1 rep' };
  return null;
}

// ── Log completed session ──
export function logWorkoutSession(sessionData, state = getState()) {
  const history = [...(state.workout.history || [])];
  history.unshift({ ...sessionData, date: new Date().toISOString().split('T')[0] });
  setState('workout.history', history.slice(0, 90)); // keep 90 days

  // Update streak
  const lastDate = state.workout.lastWorkoutDate;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let streak = state.workout.streakDays || 0;
  if (lastDate === yesterday) streak++;
  else if (lastDate !== today) streak = 1;

  setState('workout.streakDays', streak);
  setState('workout.lastWorkoutDate', today);
}
