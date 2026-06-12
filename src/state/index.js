// ==========================================
// AURA V2 — Global State Management
// ==========================================

const STORAGE_KEY = 'aura_v2_state';

const defaultState = {
  app: {
    initialized: false,
    currentRoute: '/auth',
    readiness: 'high', // 'high' | 'medium' | 'low'
    theme: 'dark',
    selectedTheme: 'deep-indigo',
    lastSync: null,
  },
  auth: {
    isLoggedIn: false,
    userId: null,
    profileName: '',
    username: '',
    bio: '',
    avatar: null, // base64
    country: '',
    city: '',
    gender: '',
    age: null,
    partner: null,
    friends: [],
    matchState: 'idle', // 'idle' | 'searching' | 'found' | 'matched'
    matchCandidate: null,
    matchSearchStart: null,
  },
  onboarding: {
    completed: false,
    currentStep: 0,
    // Step data
    weight: null,         // kg
    height: null,         // cm
    age: null,
    gender: null,
    goal: null,           // 'build_muscle' | 'lose_fat' | 'maintain' | 'endurance' | 'flexibility'
    trainingDays: null,
    experience: null,     // 'beginner' | 'returning' | 'experienced'
    workoutMode: null,    // 'gym' | 'home'
    equipment: [],
    splitPreference: null, // 'ppl' | 'upper_lower' | 'full_body' | 'bro_split'
    dietType: null,       // 'veg' | 'egg' | 'nonveg'
    budget: null,         // 'low' | 'medium' | 'premium'
    stayType: null,       // 'hostel' | 'home' | 'alone'
    cookingAbility: null,
    eatingHabits: null,
    primaryMuscle: null,
    secondaryMuscle: null,
    activityLevel: null,  // 'sedentary' | 'light' | 'active' | 'very_active'
    occupation: null,
    workSchedule: null,
    avgSleep: null,
    avgWater: null,
    bodyType: null,
    targetBodyType: null,
    ambitionLevel: null,  // 'moderate' | 'serious' | 'elite'
    trainingStyle: null,
    // Accountability
    wantsPartner: null,
    personality: null,
    availability: null,
    profession: null,
    incomeRange: null,
    lifeGoals: null,
    communicationStyle: null,
    // Recovery
    recoveryPriority: null,
    sleepGoal: null,
  },
  checkIn: {
    lastDate: null,
    todayDone: false,
    answers: {}, // { sleep, energy, soreness, stress, motivation } — each 1-5
    readinessScore: null,
    history: [], // [{ date, answers, readinessScore }]
  },
  workout: {
    history: [],        // [{ date, day, exercises: [{name, sets:[{weight,reps,difficulty,done}], volume, done}], totalVolume, duration, readinessAtTime, notes }]
    currentSession: null,
    generatedPlan: null,  // weekly split
    streakDays: 0,
    lastWorkoutDate: null,
    prs: {},            // { exerciseName: { weight, reps, date } }
    progressionLog: [], // [{ date, exercise, oldWeight, newWeight }]
  },
  nutrition: {
    calories: { target: 2000, consumed: 0 },
    protein: { target: 150, consumed: 0 },
    water: { target: 3.5, consumed: 0 },
    meals: [],
    history: [],
    lastMealDate: null,
    groceryList: [],
  },
  activity: {
    steps: 4238,
    distanceKm: 3.4,
    caloriesBurned: 218,
    stairsClimbed: 12,
    stepGoal: 10000,
    weeklySteps: [8432, 6512, 11200, 4238, 0, 0, 0], // Mon-Sun
    weeklyDistance: [6.2, 4.8, 8.9, 3.4, 0, 0, 0],
    activityHistory: [
      { date: '2026-06-08', steps: 8432, distanceKm: 6.2, caloriesBurned: 420, stairsClimbed: 18 },
      { date: '2026-06-09', steps: 6512, distanceKm: 4.8, caloriesBurned: 310, stairsClimbed: 14 },
      { date: '2026-06-10', steps: 11200, distanceKm: 8.9, caloriesBurned: 580, stairsClimbed: 25 },
      { date: '2026-06-11', steps: 4238, distanceKm: 3.4, caloriesBurned: 218, stairsClimbed: 12 }
    ]
  },
  recovery: {
    sleepHours: null,
    soreness: null,
    stress: null,
    mood: null,
    energy: null,
    focus: null,
    recoveryScore: null,
    recoveryStreak: 0,
    breathingActive: false,
    noiseActive: false,
  },
  socials: {
    notifications: [],
    friendHistory: [],
    chatMessages: {}, // { userId: [{ from, text, time }] }
    inboxOpen: false,
    activeChatUser: null,
  },
};

// ── State instance ──
let _state = deepClone(defaultState);

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ── Load from localStorage ──
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      _state = deepMerge(deepClone(defaultState), saved);
    }
  } catch (e) {
    console.warn('[State] Failed to load state:', e);
  }
  return _state;
}

// ── Save to localStorage ──
export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch (e) {
    console.warn('[State] Failed to save state:', e);
  }
}

// ── Get state ──
export function getState() {
  return _state;
}

// ── Update state slice ──
export function setState(path, value) {
  const keys = path.split('.');
  let obj = _state;
  for (let i = 0; i < keys.length - 1; i++) {
    if (obj[keys[i]] === undefined) obj[keys[i]] = {};
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
  saveState();
  _emit(path, value);
}

// ── Update multiple state values ──
export function updateState(path, updates) {
  const keys = path.split('.');
  let obj = _state;
  for (const key of keys) {
    if (obj[key] === undefined) obj[key] = {};
    obj = obj[key];
  }
  Object.assign(obj, updates);
  saveState();
  _emit(path, obj);
}

// ── Reactive subscriptions ──
const _listeners = {};

export function subscribe(path, fn) {
  if (!_listeners[path]) _listeners[path] = new Set();
  _listeners[path].add(fn);
  return () => _listeners[path].delete(fn);
}

function _emit(path, value) {
  if (_listeners[path]) {
    for (const fn of _listeners[path]) fn(value);
  }
  // Emit parent paths too
  const parts = path.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const parent = parts.slice(0, i).join('.');
    if (_listeners[parent]) {
      let val = _state;
      for (const k of parts.slice(0, i)) val = val?.[k];
      for (const fn of _listeners[parent]) fn(val);
    }
  }
}

// ── Deep merge ──
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// ── Reset state ──
export function resetState() {
  _state = deepClone(defaultState);
  saveState();
}

// ── Computed helpers ──
export function getDisciplineScore(state = _state) {
  const streak = state.workout?.streakDays || 0;
  const readiness = state.checkIn?.readinessScore || 50;
  const workouts = state.workout?.history?.length || 0;
  const base = Math.min(100, 40 + streak * 2 + workouts * 1.5 + readiness * 0.1);
  return Math.round(Math.min(100, Math.max(35, base)));
}

export function getReadinessLabel(score) {
  if (score >= 80) return { label: 'Peak', theme: 'high', color: 'violet' };
  if (score >= 60) return { label: 'Ready', theme: 'high', color: 'violet' };
  if (score >= 40) return { label: 'Moderate', theme: 'medium', color: 'mint' };
  return { label: 'Low', theme: 'low', color: 'rose' };
}

export function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export function isToday(dateStr) {
  return dateStr === getTodayDateString();
}
