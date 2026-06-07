// ==========================================
// AURA V2 — Train Page
// Route: /train
// ==========================================

import { getState, setState, updateState, getTodayDateString } from '../../state/index.js';
import { navigate } from '../../router.js';
import { showToast, showModal, closeModal } from '../../components/shared/ui.js';
import { generateWeeklyPlan, checkForPR, logWorkoutSession } from '../../services/workout-engine.js';
import './train.css';

let _activeDayIdx = 0;
let _activeSheet = null; // { dayIdx, exIdx }
let _restTimer = null;
let _restSeconds = 0;
let _restInterval = null;
let _sessionStartTime = null;
let _celebrationShown = false;

// Calendar State
let _currentCalendarView = 'workout'; // 'workout' | 'calendar'
let _calendarZoomMode = 'week'; // 'week' | 'month'
let _calendarDate = new Date();

// Extra Exercises Database
const EXTRA_EXERCISES_DB = {
  chest: [
    { name: 'Flat Bench Press', type: 'strength', muscle: 'Chest' },
    { name: 'Incline Dumbbell Press', type: 'strength', muscle: 'Chest' },
    { name: 'Cable Crossover', type: 'hypertrophy', muscle: 'Chest' },
    { name: 'Chest Dips', type: 'strength', muscle: 'Chest' },
    { name: 'Push-ups', type: 'bodyweight', muscle: 'Chest' }
  ],
  back: [
    { name: 'Deadlift', type: 'strength', muscle: 'Back' },
    { name: 'Lat Pulldown', type: 'hypertrophy', muscle: 'Back' },
    { name: 'Barbell Row', type: 'strength', muscle: 'Back' },
    { name: 'Pull-ups', type: 'bodyweight', muscle: 'Back' },
    { name: 'Seated Cable Row', type: 'hypertrophy', muscle: 'Back' }
  ],
  shoulders: [
    { name: 'Overhead Press', type: 'strength', muscle: 'Shoulders' },
    { name: 'Dumbbell Lateral Raise', type: 'hypertrophy', muscle: 'Shoulders' },
    { name: 'Rear Delt Fly', type: 'hypertrophy', muscle: 'Shoulders' },
    { name: 'Front Raise', type: 'hypertrophy', muscle: 'Shoulders' }
  ],
  arms: [
    { name: 'Bicep Curl', type: 'hypertrophy', muscle: 'Arms' },
    { name: 'Tricep Pushdown', type: 'hypertrophy', muscle: 'Arms' },
    { name: 'Hammer Curl', type: 'hypertrophy', muscle: 'Arms' },
    { name: 'Skull Crusher', type: 'hypertrophy', muscle: 'Arms' }
  ],
  legs: [
    { name: 'Squat', type: 'strength', muscle: 'Legs' },
    { name: 'Leg Press', type: 'hypertrophy', muscle: 'Legs' },
    { name: 'Leg Curl', type: 'hypertrophy', muscle: 'Legs' },
    { name: 'Leg Extension', type: 'hypertrophy', muscle: 'Legs' },
    { name: 'Romanian Deadlift', type: 'strength', muscle: 'Legs' }
  ],
  core: [
    { name: 'Plank', type: 'duration', muscle: 'Core' },
    { name: 'Ab Wheel Rollout', type: 'strength', muscle: 'Core' },
    { name: 'Russian Twist', type: 'hypertrophy', muscle: 'Core' }
  ],
  abs: [
    { name: 'Crunch', type: 'hypertrophy', muscle: 'Abs' },
    { name: 'Hanging Leg Raise', type: 'strength', muscle: 'Abs' },
    { name: 'Cable Crunch', type: 'hypertrophy', muscle: 'Abs' }
  ],
  glutes: [
    { name: 'Hip Thrust', type: 'strength', muscle: 'Glutes' },
    { name: 'Glute Kickback', type: 'hypertrophy', muscle: 'Glutes' },
    { name: 'Glute Bridge', type: 'bodyweight', muscle: 'Glutes' }
  ],
  forearms: [
    { name: 'Wrist Curl', type: 'hypertrophy', muscle: 'Forearms' },
    { name: 'Reverse Bicep Curl', type: 'hypertrophy', muscle: 'Forearms' },
    { name: 'Farmer\'s Walk', type: 'strength', muscle: 'Forearms' }
  ],
  calves: [
    { name: 'Standing Calf Raise', type: 'hypertrophy', muscle: 'Calves' },
    { name: 'Seated Calf Raise', type: 'hypertrophy', muscle: 'Calves' }
  ],
  cardio: [
    { name: 'Treadmill Run', type: 'cardio', muscle: 'Cardio' },
    { name: 'Cycling', type: 'cardio', muscle: 'Cardio' },
    { name: 'Rowing', type: 'cardio', muscle: 'Cardio' },
    { name: 'Jump Rope', type: 'cardio', muscle: 'Cardio' }
  ]
};

function _getExerciseDetailHTML(name) {
  const details = {
    'Flat Bench Press': {
      desc: 'Lie flat on a bench, grip the barbell slightly wider than shoulder-width, lower it to your mid-chest, and press it back up.',
      mistakes: 'Bouncing bar off chest, flaring elbows out at 90 degrees, lifting hips off the bench.',
      yt: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      anim: '🏋️'
    },
    'Squat': {
      desc: 'Rest barbell on your upper back, keep chest up, squat down by bending hips and knees until thighs are parallel to the floor, then stand back up.',
      mistakes: 'Knees caving inwards, heels rising off the floor, rounding the lower back ("butt wink").',
      yt: 'https://www.youtube.com/watch?v=ultW1Gwy05c',
      anim: '🦵'
    }
  };

  const item = details[name] || {
    desc: `Perform the ${name} with controlled form, focusing on the target muscle contraction.`,
    mistakes: 'Using momentum, cutting range of motion short, ignoring mind-muscle connection.',
    yt: `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' form tutorial')}`,
    anim: '💪'
  };

  return `
    <div class="ex-detail-guide card" style="margin-bottom:14px; background:rgba(255,255,255,0.02)">
      <div class="ex-detail-anim" style="font-size:48px; text-align:center; margin-bottom:8px; animation: bounce 1.5s infinite;">
        ${item.anim}
      </div>
      <div class="ex-detail-section">
        <strong style="color:var(--text-primary); font-size:12px;">How to Perform:</strong>
        <p style="font-size:11px; color:var(--text-secondary); margin-top:2px; line-height:1.4;">${item.desc}</p>
      </div>
      <div class="ex-detail-section" style="margin-top:8px;">
        <strong style="color:var(--aura-rose-light); font-size:12px;">Common Mistakes:</strong>
        <p style="font-size:11px; color:var(--text-secondary); margin-top:2px; line-height:1.4;">⚠️ ${item.mistakes}</p>
      </div>
      <div class="ex-detail-section" style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px;">
        <a href="${item.yt}" target="_blank" style="color:var(--aura-violet-light); font-size:11px; text-decoration:none; display:flex; align-items:center; gap:4px;">
          🎥 Watch YouTube Tutorial →
        </a>
      </div>
    </div>
  `;
}

// ── Calendar Helpers ──
function _formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function _getWeekRangeLabel(date) {
  const temp = new Date(date);
  const day = temp.getDay();
  const diff = temp.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(temp.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const options = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString(undefined, options)} - ${sunday.toLocaleDateString(undefined, options)}`;
}

function _getDayMetrics(dateStr) {
  const state = getState();
  const todayStr = getTodayDateString();

  if (dateStr === todayStr) {
    const historyWorkout = state.workout?.history?.find(h => h.date === todayStr);
    const planDone = state.workout?.generatedPlan?.[_activeDayIdx]?.exercises?.every(e => e.done) || false;
    const workoutDone = planDone || !!historyWorkout;
    const workoutName = planDone ? (state.workout?.generatedPlan?.[_activeDayIdx]?.dayName || 'Workout') : (historyWorkout?.day || 'Rest Day');
    const caloriesConsumed = state.nutrition?.calories?.consumed || 0;
    const caloriesTarget = state.nutrition?.calories?.target || 2000;
    const proteinConsumed = state.nutrition?.protein?.consumed || 0;
    const proteinTarget = state.nutrition?.protein?.target || 140;
    const waterIntake = state.nutrition?.water?.consumed || 0;
    const recoveryScore = state.checkIn?.readinessScore || 75;

    const historyWorkoutCals = historyWorkout?.caloriesBurned || (planDone ? 380 : 0);
    const caloriesBurned = workoutDone ? Math.max(80, historyWorkoutCals) : 80;

    return {
      date: dateStr,
      workout: {
        completed: workoutDone,
        name: workoutName,
        volume: planDone ? 3800 : (historyWorkout?.totalVolume || 0),
        duration: planDone ? 45 : (historyWorkout?.duration || 0)
      },
      caloriesConsumed,
      caloriesTarget,
      caloriesBurned,
      proteinConsumed,
      proteinTarget,
      proteinHit: proteinConsumed >= proteinTarget,
      recoveryScore,
      waterIntake
    };
  }

  const historyWorkout = state.workout?.history?.find(h => h.date === dateStr);
  const checkInEntry = state.checkIn?.history?.find(h => h.date === dateStr);
  const nutritionEntry = state.nutrition?.history?.find(h => h.date === dateStr);

  if (historyWorkout || checkInEntry || nutritionEntry) {
    const workoutDone = !!historyWorkout;
    const caloriesConsumed = nutritionEntry?.caloriesConsumed || (workoutDone ? 2100 : 1800);
    const caloriesTarget = state.nutrition?.calories?.target || 2000;
    const proteinConsumed = nutritionEntry?.proteinConsumed || (workoutDone ? 145 : 120);
    const proteinTarget = state.nutrition?.protein?.target || 140;
    const waterIntake = nutritionEntry?.waterIntake || (workoutDone ? 3.0 : 2.0);
    const recoveryScore = checkInEntry?.readinessScore || 70;

    return {
      date: dateStr,
      workout: {
        completed: workoutDone,
        name: historyWorkout?.day || 'Workout',
        volume: historyWorkout?.totalVolume || 0,
        duration: historyWorkout?.duration || 0
      },
      caloriesConsumed,
      caloriesTarget,
      caloriesBurned: workoutDone ? (historyWorkout?.caloriesBurned || historyWorkout?.duration * 8 || 350) : 80,
      proteinConsumed,
      proteinTarget,
      proteinHit: proteinConsumed >= proteinTarget,
      recoveryScore,
      waterIntake
    };
  }

  // Deterministic mock generator for scrolling past days
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const workoutDone = (hash % 3) !== 0;
  const workoutNames = ['Push', 'Pull', 'Legs', 'Cardio'];
  const workoutName = workoutDone ? workoutNames[Math.abs(hash) % workoutNames.length] : 'Rest Day';
  
  const recoveryScore = 60 + (Math.abs(hash) % 35);
  const waterIntake = (2.0 + (Math.abs(hash * 3) % 20) / 10);
  const caloriesConsumed = 1800 + (Math.abs(hash * 7) % 600);
  const caloriesTarget = state.nutrition?.calories?.target || 2000;
  const proteinTarget = state.nutrition?.protein?.target || 140;
  const proteinConsumed = Math.round(proteinTarget * (0.8 + (Math.abs(hash * 9) % 40) / 100));
  
  return {
    date: dateStr,
    workout: {
      completed: workoutDone,
      name: workoutName,
      volume: workoutDone ? 2800 + (Math.abs(hash) % 2000) : 0,
      duration: workoutDone ? 30 + (Math.abs(hash) % 30) : 0
    },
    caloriesConsumed,
    caloriesTarget,
    caloriesBurned: workoutDone ? 300 + (Math.abs(hash) % 200) : 75,
    proteinConsumed,
    proteinTarget,
    proteinHit: proteinConsumed >= proteinTarget,
    recoveryScore,
    waterIntake: Number(waterIntake.toFixed(1))
  };
}

export function render() {
  const state = getState();
  let plan = state.workout?.generatedPlan;
  if (!plan || !plan.length) {
    plan = generateWeeklyPlan(state);
  }
  const today = new Date().getDay();
  
  // Use active day or fallback to today
  if (_activeDayIdx === undefined || _activeDayIdx >= plan.length) {
    _activeDayIdx = today % (plan?.length || 1);
  }

  if (_currentCalendarView === 'calendar') {
    return _renderCalendarView(plan);
  }

  return `
    <div class="train-page">
      <div class="page-header">
        <h1 class="page-title">Train</h1>
        <div style="display:flex;gap:8px">
          <button class="icon-btn" id="calendar-toggle-btn" aria-label="Workout Calendar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
          <button class="icon-btn" id="history-btn" aria-label="Workout History">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>
            </svg>
          </button>
          <button class="icon-btn" id="regen-btn" aria-label="Regenerate Plan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Expandable Weekly Planner Dropdown -->
      <div class="weekly-planner-container" style="padding: 0 16px 12px; position: relative; z-index: 10;">
        <div class="weekly-planner-header card" id="weekly-planner-toggle" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-card); border: 1.5px solid var(--border-card); border-radius: var(--radius-xl); transition: all var(--dur-fast) ease;">
          <div>
            <span class="planner-day-name" style="font-family: var(--font-display); font-size: 14px; font-weight: var(--fw-bold); color: var(--text-primary); display: block;">Day ${_activeDayIdx + 1} — ${plan[_activeDayIdx]?.dayName || ''}</span>
            <span class="planner-day-summary" style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 2px;">
              ${plan[_activeDayIdx]?.exercises?.length || 0} Exercises • ${plan[_activeDayIdx]?.estimatedDuration || 0} min
            </span>
          </div>
          <svg class="chevron-icon" id="planner-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform var(--dur-fast) ease; color: var(--text-secondary);">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
        <div class="weekly-planner-dropdown hidden" id="weekly-planner-dropdown" style="display: none; flex-direction: column; gap: 6px; background: rgba(15, 15, 27, 0.96); backdrop-filter: blur(15px); border: 1.5px solid var(--border-card); border-radius: var(--radius-xl); padding: 8px; margin-top: 6px; position: absolute; left: 16px; right: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); z-index: 100;">
          ${(plan || []).map((day, i) => `
            <div class="planner-dropdown-item ${i === _activeDayIdx ? 'active' : ''}" data-day="${i}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: var(--radius-lg); cursor: pointer; transition: all var(--dur-fast) ease; background: ${i === _activeDayIdx ? 'rgba(124,58,237,0.1)' : 'transparent'}; border: 1px solid ${i === _activeDayIdx ? 'var(--aura-violet)' : 'transparent'};">
              <span class="item-label" style="font-size: 13px; font-weight: 600; color: ${i === _activeDayIdx ? 'var(--aura-violet-light)' : 'var(--text-secondary)'};">D${i + 1} — ${day.dayName}</span>
              <span class="item-meta" style="font-size: 11px; color: var(--text-muted);">${day.exercises?.length || 0} Ex · ${day.estimatedDuration} min</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Active Day Card -->
      <div class="train-content" id="train-content">
        ${_renderDay(plan, _activeDayIdx)}
      </div>
    </div>

    <!-- Celebration Overlay -->
    <div class="celebration-overlay hidden" id="celebration-overlay">
      <div class="celebration-content" style="max-height: 90vh; overflow-y: auto; padding-bottom: 24px;">
        <div class="celebration-emoji">🎉</div>
        <h2 class="celebration-title">Session Complete!</h2>
        
        <!-- Share Card -->
        <div class="share-card" id="share-card-element">
          <div class="share-card-header">
            <span class="share-card-logo">✦ AURA</span>
            <span class="share-card-date">${new Date().toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
          </div>
          <p class="share-card-title" id="share-card-workout-name">Workout Session</p>
          <div class="share-card-stats" id="share-card-stats"></div>
          <div class="share-card-footer">Adaptive Fitness OS</div>
        </div>

        <div class="share-actions-grid">
          <button class="share-action-btn btn-whatsapp" id="share-whatsapp">Share to WhatsApp</button>
          <button class="share-action-btn btn-instagram" id="share-instagram">Instagram Story</button>
          <button class="share-action-btn btn-download" id="share-download">Download Image</button>
        </div>

        <button class="btn btn-primary btn-full" id="celebration-close" style="margin-top: 16px;">Awesome! 💪</button>
      </div>
    </div>
  `;
}

function _renderCalendarView(plan) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const title = _calendarZoomMode === 'month' 
    ? `${monthNames[_calendarDate.getMonth()]} ${_calendarDate.getFullYear()}`
    : `Week of ${_getWeekRangeLabel(_calendarDate)}`;

  return `
    <div class="train-page">
      <div class="page-header">
        <h1 class="page-title">Train Calendar</h1>
        <div style="display:flex;gap:8px">
          <button class="icon-btn active" id="calendar-toggle-btn" aria-label="Toggle Calendar View" style="background:rgba(124,58,237,0.15); border-color:var(--aura-violet); color:var(--aura-violet-light)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
          <button class="icon-btn" id="history-btn" aria-label="Workout History">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Calendar Container -->
      <div class="calendar-view-container" style="padding: 0 16px;">
        <!-- Controls -->
        <div class="calendar-controls" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); border:1px solid var(--border-card); border-radius:var(--radius-xl); padding:12px; margin-bottom:14px;">
          <div class="calendar-nav" style="display:flex; align-items:center; gap:12px;">
            <button class="calendar-nav-btn" id="cal-prev-btn" style="background:var(--bg-elevated); border:1px solid var(--border-card); color:var(--text-primary); width:30px; height:30px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;">◀</button>
            <span class="calendar-title-text" id="cal-month-title" style="font-size:13px; font-weight:700; color:var(--text-primary); min-width:110px; text-align:center;">${title}</span>
            <button class="calendar-nav-btn" id="cal-next-btn" style="background:var(--bg-elevated); border:1px solid var(--border-card); color:var(--text-primary); width:30px; height:30px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;">▶</button>
          </div>
          <div class="calendar-toggle-mode" style="display:flex; background:var(--bg-elevated); padding:2px; border-radius:var(--radius-lg); border:1px solid var(--border-card);">
            <button class="calendar-mode-btn ${_calendarZoomMode === 'week' ? 'active' : ''}" id="cal-mode-week" style="background:${_calendarZoomMode === 'week' ? 'var(--aura-violet)' : 'transparent'}; border:none; color:${_calendarZoomMode === 'week' ? '#fff' : 'var(--text-secondary)'}; padding:4px 12px; font-size:11px; font-weight:600; border-radius:var(--radius-md); cursor:pointer;">Week</button>
            <button class="calendar-mode-btn ${_calendarZoomMode === 'month' ? 'active' : ''}" id="cal-mode-month" style="background:${_calendarZoomMode === 'month' ? 'var(--aura-violet)' : 'transparent'}; border:none; color:${_calendarZoomMode === 'month' ? '#fff' : 'var(--text-secondary)'}; padding:4px 12px; font-size:11px; font-weight:600; border-radius:var(--radius-md); cursor:pointer;">Month</button>
          </div>
        </div>

        <!-- Swipeable/Navigable Grid wrapper -->
        <div class="calendar-grid-wrapper" id="calendar-swipe-zone" style="overflow:hidden; border-radius:var(--radius-xl); border:1.5px solid var(--border-card); padding:10px; background:var(--bg-card);">
          <div class="calendar-grid" style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">
            <div class="calendar-day-header" style="text-align:center; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">M</div>
            <div class="calendar-day-header" style="text-align:center; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">T</div>
            <div class="calendar-day-header" style="text-align:center; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">W</div>
            <div class="calendar-day-header" style="text-align:center; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">T</div>
            <div class="calendar-day-header" style="text-align:center; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">F</div>
            <div class="calendar-day-header" style="text-align:center; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">S</div>
            <div class="calendar-day-header" style="text-align:center; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">S</div>

            ${_generateCalendarGridHTML()}
          </div>
        </div>
      </div>
    </div>
  `;
}

function _generateCalendarGridHTML() {
  const cells = [];
  const todayStr = getTodayDateString();
  const tempDate = new Date(_calendarDate);

  if (_calendarZoomMode === 'month') {
    const year = tempDate.getFullYear();
    const month = tempDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay(); // 0 is Sunday
    // Adjust to Mon=0, Sun=6
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    // Total days in month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    
    // Previous month days
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, lastDayOfPrevMonth - i);
      cells.push({ date: d, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= lastDayOfMonth; i++) {
      const d = new Date(year, month, i);
      cells.push({ date: d, isCurrentMonth: true });
    }
    
    // Next month padding to fill rows of 7
    const totalCells = cells.length > 35 ? 42 : 35;
    const nextDaysNeeded = totalCells - cells.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ date: d, isCurrentMonth: false });
    }
  } else {
    // Week Mode: 7 cells starting from Monday
    const day = tempDate.getDay();
    const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(tempDate.setDate(diff));
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      cells.push({ date: d, isCurrentMonth: true });
    }
  }

  return cells.map(cell => {
    const dateStr = _formatDateKey(cell.date);
    const metrics = _getDayMetrics(dateStr);
    const isTodayCell = dateStr === todayStr;
    const dayNum = cell.date.getDate();

    return `
      <div class="calendar-day-cell ${cell.isCurrentMonth ? '' : 'other-month'} ${isTodayCell ? 'today' : ''}" data-date="${dateStr}" style="background:var(--bg-elevated); border:1px solid ${isTodayCell ? 'var(--aura-violet)' : 'var(--border-card)'}; border-radius:var(--radius-lg); padding:4px 2px; min-height:80px; display:flex; flex-direction:column; justify-content:space-between; cursor:pointer; transition:all var(--dur-fast) ease; opacity: ${cell.isCurrentMonth ? 1 : 0.35};">
        <span class="calendar-day-num" style="font-size:10px; font-weight:700; color:${isTodayCell ? 'var(--aura-violet-light)' : 'var(--text-secondary)'}; padding-left:4px; margin-bottom:2px;">${dayNum}</span>
        
        <div class="calendar-cell-metrics" style="display:flex; flex-direction:column; gap:2px;">
          <!-- Workout Indicator -->
          <div class="cell-metric-row" style="display:flex; align-items:center; gap:2px; font-size:7px; color:var(--text-muted); white-space:nowrap; overflow:hidden;">
            <span class="cell-metric-icon" style="font-size:8px;">${metrics.workout.completed ? '🏋️' : '🛋️'}</span>
          </div>
          <!-- Calories -->
          <div class="cell-metric-row" style="display:flex; align-items:center; gap:2px; font-size:7px; color:var(--text-muted); white-space:nowrap; overflow:hidden;">
            <span class="cell-metric-icon" style="font-size:8px;">🔥</span>
            <span style="font-size: 6.5px;">${metrics.caloriesConsumed}</span>
          </div>
          <!-- Protein -->
          <div class="cell-metric-row" style="display:flex; align-items:center; gap:2px; font-size:7px; color:${metrics.proteinHit ? 'var(--aura-mint-light)' : 'var(--text-muted)'}; white-space:nowrap; overflow:hidden;">
            <span class="cell-metric-icon" style="font-size:8px;">🥩</span>
            <span style="font-size: 6.5px; font-weight:${metrics.proteinHit ? 'bold' : 'normal'}">${metrics.proteinConsumed}g</span>
          </div>
          <!-- Recovery -->
          <div class="cell-metric-row" style="display:flex; align-items:center; gap:2px; font-size:7px; color:var(--text-muted); white-space:nowrap; overflow:hidden;">
            <span class="cell-metric-icon" style="font-size:8px;">💤</span>
            <span style="font-size: 6.5px;">${metrics.recoveryScore}</span>
          </div>
          <!-- Water -->
          <div class="cell-metric-row" style="display:flex; align-items:center; gap:2px; font-size:7px; color:var(--text-muted); white-space:nowrap; overflow:hidden;">
            <span class="cell-metric-icon" style="font-size:8px;">💧</span>
            <span style="font-size: 6.5px;">${metrics.waterIntake}L</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function _openDailySummaryModal(dateStr) {
  const metrics = _getDayMetrics(dateStr);
  const formattedDate = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const content = `
    <div class="daily-summary-modal" style="display:flex; flex-direction:column; gap:14px;">
      <div class="card card-glow" style="background:linear-gradient(135deg, rgba(124,58,237,0.1), rgba(16,185,129,0.05));">
        <p class="section-label" style="margin-bottom:6px;">Workout Details</p>
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:32px;">${metrics.workout.completed ? '🏋️' : '🛋️'}</span>
          <div>
            <p style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0;">${metrics.workout.completed ? metrics.workout.name : 'Rest Day'}</p>
            <p style="font-size:11px; color:var(--text-muted); margin:4px 0 0 0;">${metrics.workout.completed ? `${metrics.workout.duration} min session · ${metrics.workout.volume} kg total volume` : 'Optimal muscle recovery and hydration day'}</p>
          </div>
        </div>
      </div>

      <div class="stat-grid stat-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div class="stat-cell card" style="display:flex; flex-direction:column; align-items:center; padding:10px;">
          <span class="stat-label" style="font-size:10px; color:var(--text-muted);">Readiness Score</span>
          <span class="stat-value" style="color:var(--aura-violet-light); font-size:22px; font-weight:bold; margin-top:4px;">${metrics.recoveryScore}</span>
          <span style="font-size:9px; color:var(--text-muted); margin-top:2px;">Somatic Readiness</span>
        </div>
        <div class="stat-cell card" style="display:flex; flex-direction:column; align-items:center; padding:10px;">
          <span class="stat-label" style="font-size:10px; color:var(--text-muted);">Water Intake</span>
          <span class="stat-value" style="color:var(--aura-blue-light); font-size:22px; font-weight:bold; margin-top:4px;">${metrics.waterIntake} L</span>
          <span style="font-size:9px; color:var(--text-muted); margin-top:2px;">Goal: ${getState().nutrition?.water?.target || 3.5}L</span>
        </div>
      </div>

      <div class="card" style="background:rgba(255,255,255,0.015); padding:12px;">
        <p class="section-label" style="margin-bottom:10px;">Nutrition & Macros</p>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
          <span style="color:var(--text-secondary);">Calories Consumed:</span>
          <strong style="color:var(--text-primary);">${metrics.caloriesConsumed} kcal / ${metrics.caloriesTarget} kcal</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
          <span style="color:var(--text-secondary);">Estimated Calories Burned:</span>
          <strong style="color:var(--aura-rose-light);">${metrics.caloriesBurned} kcal</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span style="color:var(--text-secondary);">Protein Logged:</span>
          <strong style="color: ${metrics.proteinHit ? 'var(--aura-mint-light)' : 'var(--aura-rose-light)'};">${metrics.proteinConsumed}g / ${metrics.proteinTarget}g ${metrics.proteinHit ? '✓' : '✗'}</strong>
        </div>
      </div>

      <button class="btn btn-primary btn-full" id="close-summary-btn">Close Summary</button>
    </div>
  `;

  showModal({
    title: `Day Summary: ${formattedDate.split(',')[1]?.trim() || formattedDate}`,
    content: content
  });

  document.getElementById('close-summary-btn')?.addEventListener('click', closeModal);
}

function _renderDay(plan, dayIdx) {
  if (!plan || !plan[dayIdx]) {
    return `<div class="train-empty">
      <p style="color:var(--text-muted);text-align:center;padding:32px 16px">No plan generated.<br/>
        <button class="btn btn-primary btn-sm" id="gen-btn" style="margin-top:12px">Generate Plan</button>
      </p>
    </div>`;
  }
  const day = plan[dayIdx];
  const allDone = day.exercises?.length > 0 && day.exercises?.every(ex => ex.done);

  return `
    <div class="day-header">
      <div>
        <h2 class="day-title">${day.label}</h2>
        <p class="day-meta">${day.exercises?.length || 0} exercises · ~${day.estimatedDuration}min</p>
      </div>
      <div class="day-progress-ring">
        ${_renderMiniRing(day.exercises)}
      </div>
    </div>

    <div class="exercises-list" id="exercises-list">
      ${(day.exercises || []).map((ex, i) => _renderExerciseCard(ex, i, dayIdx)).join('')}
    </div>

    <!-- Extra actions -->
    <div style="display:flex;gap:10px;margin:16px 0;">
      <button class="btn btn-secondary btn-full btn-sm" id="add-extra-ex-btn">
        🏋️‍♂️ + Add Exercise
      </button>
      <button class="btn btn-secondary btn-full btn-sm" id="log-custom-btn">
        📝 + Custom Log
      </button>
    </div>

    ${allDone ? `
      <div class="session-complete-bar">
        <span>🏆 All exercises done!</span>
        <button class="btn btn-primary btn-sm" id="finish-session-btn">Finish Session</button>
      </div>
    ` : `
      <button class="btn btn-secondary btn-full" style="margin-bottom:16px" id="rest-btn-main">
        ⏱ Rest Timer
      </button>
    `}
  `;
}

function _renderExerciseCard(ex, exIdx, dayIdx) {
  const done = ex.done;
  const setsCompleted = ex.sets?.filter(s => s.done).length || 0;
  const totalSets = ex.sets?.length || 0;

  return `
    <div class="exercise-card ${done ? 'done' : ''}" data-ex="${exIdx}" id="ex-card-${exIdx}" style="cursor: pointer;">
      <div class="ex-card-main">
        <div class="ex-info">
          <div class="ex-status-dot ${done ? 'done' : ''}"></div>
          <div>
            <p class="ex-name" style="margin:0;">${ex.name}</p>
            <p class="ex-meta" style="margin:2px 0 0 0;">${totalSets} sets · ${ex.sets?.[0]?.targetReps || 10} reps · ${ex.muscle}</p>
          </div>
        </div>
        <div class="ex-right">
          <span class="ex-sets-badge">${setsCompleted}/${totalSets}</span>
          <button class="btn btn-sm btn-secondary ex-open-btn" data-ex="${exIdx}" data-day="${dayIdx}" style="pointer-events: none;">
            ${done ? '✓ Done' : 'Log →'}
          </button>
        </div>
      </div>
      <div class="ex-progress-bar">
        <div class="ex-progress-fill" style="width:${totalSets ? (setsCompleted / totalSets) * 100 : 0}%"></div>
      </div>
    </div>
  `;
}

function _renderMiniRing(exercises) {
  const total = exercises?.length || 0;
  const done = exercises?.filter(e => e.done).length || 0;
  const pct = total ? done / total : 0;
  const r = 18, circ = 2 * Math.PI * r;
  return `
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3.5"/>
      <circle cx="22" cy="22" r="${r}" fill="none" stroke="#a78bfa" stroke-width="3.5"
        stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ - circ * pct}"
        transform="rotate(-90 22 22)"/>
      <text x="22" y="27" text-anchor="middle" fill="white" font-size="10" font-weight="600">${done}/${total}</text>
    </svg>
  `;
}

export function onEnter() {
  _sessionStartTime = _sessionStartTime || Date.now();
  _currentCalendarView = 'workout'; // Default back to workout view on enter
  _wireEvents();
}

export function onLeave() {
  if (_restInterval) clearInterval(_restInterval);
}

function _wireEvents() {
  _wireContentEvents();

  document.getElementById('calendar-toggle-btn')?.addEventListener('click', () => {
    _currentCalendarView = _currentCalendarView === 'workout' ? 'calendar' : 'workout';
    const container = document.getElementById('page-content');
    if (container) {
      container.innerHTML = render();
      _wireEvents();
    }
  });

  document.getElementById('regen-btn')?.addEventListener('click', () => {
    const plan = generateWeeklyPlan(getState());
    const content = document.getElementById('train-content');
    if (content) content.innerHTML = _renderDay(plan, _activeDayIdx);
    _wireContentEvents();
    showToast('Plan regenerated ✦', 'violet');
  });

  document.getElementById('history-btn')?.addEventListener('click', _openHistSheet);

  // Weekly Dropdown Toggle
  document.getElementById('weekly-planner-toggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('weekly-planner-dropdown');
    const chevron = document.getElementById('planner-chevron');
    if (dropdown) {
      const isHidden = dropdown.style.display === 'none' || dropdown.classList.contains('hidden');
      if (isHidden) {
        dropdown.style.display = 'flex';
        dropdown.classList.remove('hidden');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      } else {
        dropdown.style.display = 'none';
        dropdown.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      }
    }
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('weekly-planner-dropdown');
    const toggle = document.getElementById('weekly-planner-toggle');
    const chevron = document.getElementById('planner-chevron');
    if (dropdown && !dropdown.contains(e.target) && toggle && !toggle.contains(e.target)) {
      dropdown.style.display = 'none';
      dropdown.classList.add('hidden');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
  });

  // Dropdown Items click
  document.querySelectorAll('.planner-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      _activeDayIdx = Number(item.dataset.day);
      
      const dropdown = document.getElementById('weekly-planner-dropdown');
      const chevron = document.getElementById('planner-chevron');
      if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.classList.add('hidden');
      }
      if (chevron) chevron.style.transform = 'rotate(0deg)';

      const container = document.getElementById('page-content');
      if (container) {
        container.innerHTML = render();
        _wireEvents();
      }
    });
  });

  // Calendar Controls Events
  if (_currentCalendarView === 'calendar') {
    document.getElementById('cal-prev-btn')?.addEventListener('click', () => {
      _navigateCalendar(-1);
    });
    document.getElementById('cal-next-btn')?.addEventListener('click', () => {
      _navigateCalendar(1);
    });
    document.getElementById('cal-mode-week')?.addEventListener('click', () => {
      _calendarZoomMode = 'week';
      _refreshCalendarScreen();
    });
    document.getElementById('cal-mode-month')?.addEventListener('click', () => {
      _calendarZoomMode = 'month';
      _refreshCalendarScreen();
    });

    // Calendar Day Cell Clicks
    document.querySelectorAll('.calendar-day-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const dateStr = cell.dataset.date;
        _openDailySummaryModal(dateStr);
      });
    });

    // Calendar Swipe Gestures
    const zone = document.getElementById('calendar-swipe-zone');
    let touchStartX = 0;
    let touchEndX = 0;
    zone?.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    zone?.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 50) {
        _navigateCalendar(diff > 0 ? -1 : 1);
      }
    }, { passive: true });
  }
}

function _navigateCalendar(dir) {
  if (_calendarZoomMode === 'month') {
    _calendarDate.setMonth(_calendarDate.getMonth() + dir);
  } else {
    _calendarDate.setDate(_calendarDate.getDate() + (dir * 7));
  }
  _refreshCalendarScreen();
}

function _refreshCalendarScreen() {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = render();
    _wireEvents();
  }
}

function _wireContentEvents() {
  // Make entire exercise cards clickable
  document.querySelectorAll('.exercise-card').forEach(card => {
    card.addEventListener('click', () => {
      const exIdx = Number(card.dataset.ex);
      _openExSheet(_activeDayIdx, exIdx);
    });
  });

  document.getElementById('rest-btn-main')?.addEventListener('click', _openRestSheet);
  document.getElementById('finish-session-btn')?.addEventListener('click', _finishSession);
  document.getElementById('add-extra-ex-btn')?.addEventListener('click', () => _openAddExerciseModal(_activeDayIdx));
  document.getElementById('log-custom-btn')?.addEventListener('click', _openCustomLogModal);
  document.getElementById('gen-btn')?.addEventListener('click', () => {
    generateWeeklyPlan(getState());
    const state = getState();
    const content = document.getElementById('train-content');
    if (content) content.innerHTML = _renderDay(state.workout?.generatedPlan, _activeDayIdx);
    _wireContentEvents();
  });
}

// ── Exercise Sheet (Log Set) ──
function _openExSheet(dayIdx, exIdx) {
  _activeSheet = { dayIdx, exIdx };
  const state = getState();
  const plan = state.workout?.generatedPlan;
  if (!plan) return;
  const ex = plan[dayIdx]?.exercises[exIdx];
  if (!ex) return;

  const content = `
    <div id="ex-sheet-content">
      ${_getExerciseDetailHTML(ex.name)}
      
      <div class="sets-list" id="sets-list">
        ${ex.sets.map((set, i) => _renderSetRow(set, i)).join('')}
      </div>

      <button class="btn btn-secondary btn-sm" id="add-set-btn" style="margin-top:8px;width:100%">
        + Add Set
      </button>

      <div class="ex-sheet-actions" style="margin-top:16px;">
        <button class="btn btn-primary btn-full ${ex.done ? 'btn-mint' : ''}" id="mark-done-btn">
          ${ex.done ? '✓ Marked Complete' : 'Mark Exercise Done'}
        </button>
      </div>

      <div class="ex-notes" style="margin-top:12px;">
        <label class="field-label">Session Notes</label>
        <textarea class="input" id="ex-notes" placeholder="How did it feel?" rows="2">${ex.notes || ''}</textarea>
      </div>
    </div>
  `;

  showModal({
    title: ex.name,
    content: content,
    onClose: () => { _activeSheet = null; }
  });

  document.getElementById('mark-done-btn')?.addEventListener('click', () => {
    const state = getState();
    const plan = [...(state.workout?.generatedPlan || [])];
    plan[dayIdx].exercises[exIdx].done = true;
    plan[dayIdx].exercises[exIdx].notes = document.getElementById('ex-notes')?.value || '';

    const sets = plan[dayIdx].exercises[exIdx].sets;
    const volume = sets.reduce((s, set) => s + (set.weight || 0) * (set.targetReps || 0), 0);
    plan[dayIdx].exercises[exIdx].volume = volume;

    const maxWeight = Math.max(...sets.map(s => s.weight || 0));
    const maxReps = sets[0]?.targetReps || 10;
    if (maxWeight > 0 && checkForPR(ex.name, maxWeight, maxReps)) {
      showToast(`🏆 New PR on ${ex.name}!`, 'violet');
    }

    setState('workout.generatedPlan', plan);
    closeModal();

    const contentEl = document.getElementById('train-content');
    if (contentEl) contentEl.innerHTML = _renderDay(plan, _activeDayIdx);
    _wireContentEvents();
    showToast(`${ex.name} complete ✓`, 'success');
  });

  document.getElementById('add-set-btn')?.addEventListener('click', () => {
    const state = getState();
    const plan = [...(state.workout?.generatedPlan || [])];
    const lastSet = plan[dayIdx].exercises[exIdx].sets.slice(-1)[0] || { weight: 0, targetReps: 10 };
    plan[dayIdx].exercises[exIdx].sets.push({ ...lastSet, done: false, difficulty: null });
    setState('workout.generatedPlan', plan);
    _openExSheet(dayIdx, exIdx);
  });

  _wireSetEvents(dayIdx, exIdx);
}

function _renderSetRow(set, idx) {
  return `
    <div class="set-row ${set.done ? 'done' : ''}" id="set-row-${idx}">
      <div class="set-num">${idx + 1}</div>
      <div class="set-inputs">
        <div class="set-input-group">
          <label class="set-input-label">Weight</label>
          <input class="set-input" data-idx="${idx}" data-field="weight"
            type="number" value="${set.weight || 0}" min="0" step="2.5" />
          <span class="set-input-unit">kg</span>
        </div>
        <div class="set-input-group">
          <label class="set-input-label">Reps</label>
          <input class="set-input" data-idx="${idx}" data-field="targetReps"
            type="number" value="${set.targetReps || 10}" min="1" max="100" />
        </div>
        <div class="set-input-group">
          <label class="set-input-label">Diff</label>
          <input class="set-input" data-idx="${idx}" data-field="difficulty"
            type="number" value="${set.difficulty || ''}" min="1" max="10" placeholder="–" />
          <span class="set-input-unit">/10</span>
        </div>
      </div>
      <button class="set-check ${set.done ? 'done' : ''}" data-idx="${idx}">
        ${set.done ? '✓' : '○'}
      </button>
    </div>
  `;
}

function _wireSetEvents(dayIdx, exIdx) {
  document.querySelectorAll('.set-input').forEach(input => {
    input.addEventListener('change', () => {
      const idx = Number(input.dataset.idx);
      const field = input.dataset.field;
      const val = Number(input.value);
      const state = getState();
      const plan = [...(state.workout?.generatedPlan || [])];
      plan[dayIdx].exercises[exIdx].sets[idx][field] = val;
      setState('workout.generatedPlan', plan);
    });
  });

  document.querySelectorAll('.set-check').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop clicking check button from bubbling to modal body closes
      const idx = Number(btn.dataset.idx);
      const state = getState();
      const plan = [...(state.workout?.generatedPlan || [])];
      const set = plan[dayIdx].exercises[exIdx].sets[idx];
      set.done = !set.done;
      setState('workout.generatedPlan', plan);
      const row = document.getElementById(`set-row-${idx}`);
      if (row) {
        row.classList.toggle('done', set.done);
        btn.classList.toggle('done', set.done);
        btn.textContent = set.done ? '✓' : '○';
      }
    });
  });
}

// ── Rest Timer ──
function _openRestSheet() {
  _restSeconds = 60;
  const content = `
    <div id="rest-content">
      <div class="rest-duration-btns">
        ${[30, 60, 90, 120].map(s => `
          <button class="rest-dur-btn ${_restSeconds === s ? 'active' : ''}" data-secs="${s}">${s}s</button>
        `).join('')}
      </div>
      <div class="rest-display" id="rest-display">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="url(#restGrad)" stroke-width="6"
            stroke-linecap="round" stroke-dasharray="326.7" stroke-dashoffset="0"
            transform="rotate(-90 60 60)" id="rest-ring"/>
          <defs><linearGradient id="restGrad"><stop stop-color="#a78bfa"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>
        </svg>
        <div class="rest-time" id="rest-time">${_restSeconds}s</div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-primary btn-full" id="rest-start-btn">Start</button>
        <button class="btn btn-ghost btn-sm" id="rest-close-btn">Close</button>
      </div>
    </div>
  `;

  showModal({
    title: 'Rest Timer',
    content: content,
    onClose: () => { if (_restInterval) { clearInterval(_restInterval); _restInterval = null; } }
  });

  const modal = document.getElementById('modal-sheet');
  modal.querySelectorAll('.rest-dur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_restInterval) { clearInterval(_restInterval); _restInterval = null; }
      _restSeconds = Number(btn.dataset.secs);
      modal.querySelectorAll('.rest-dur-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const timeEl = document.getElementById('rest-time');
      if (timeEl) timeEl.textContent = `${_restSeconds}s`;
      const ring = document.getElementById('rest-ring');
      if (ring) ring.style.strokeDashoffset = '0';
    });
  });

  document.getElementById('rest-start-btn')?.addEventListener('click', () => {
    if (_restInterval) clearInterval(_restInterval);
    const total = _restSeconds;
    let remaining = total;
    const ring = document.getElementById('rest-ring');
    const timeEl = document.getElementById('rest-time');
    _restInterval = setInterval(() => {
      remaining--;
      if (timeEl) timeEl.textContent = `${remaining}s`;
      if (ring) ring.style.strokeDashoffset = `${326.7 * (1 - remaining / total)}`;
      if (remaining <= 0) {
        clearInterval(_restInterval);
        _restInterval = null;
        showToast('Rest complete! Back to work 💪', 'violet');
        closeModal();
      }
    }, 1000);
  });

  document.getElementById('rest-close-btn')?.addEventListener('click', closeModal);
}

// ── History ──
function _openHistSheet() {
  const history = getState().workout?.history || [];
  const content = `
    <div id="hist-content">
      ${!history.length ? '<p style="color:var(--text-muted);text-align:center;padding:24px">No workouts logged yet</p>' :
        history.slice(0, 20).map(h => `
          <div class="hist-row">
            <div>
              <p class="hist-title">${h.day || 'Session'}</p>
              <p class="hist-meta">${h.date} · ${h.exercises?.length || 0} exercises</p>
            </div>
            <span class="hist-vol">${h.totalVolume || 0}kg</span>
          </div>
        `).join('')
      }
      <button class="btn btn-ghost btn-sm btn-full" id="close-hist-btn" style="margin-top:16px">Close</button>
    </div>
  `;

  showModal({
    title: 'Workout History',
    content: content
  });

  document.getElementById('close-hist-btn')?.addEventListener('click', closeModal);
}

// ── Add Extra Exercise Modal ──
function _openAddExerciseModal(dayIdx) {
  const categories = [
    { id: 'chest', label: 'Chest 🏋️‍♂️' },
    { id: 'back', label: 'Back 🦅' },
    { id: 'shoulders', label: 'Shoulders 🔱' },
    { id: 'arms', label: 'Arms 💪' },
    { id: 'legs', label: 'Legs 🦵' },
    { id: 'core', label: 'Core ⚡' },
    { id: 'abs', label: 'Abs 🍫' },
    { id: 'glutes', label: 'Glutes 🍑' },
    { id: 'forearms', label: 'Forearms ✊' },
    { id: 'calves', label: 'Calves 🦵' },
    { id: 'cardio', label: 'Cardio 🏃' }
  ];

  const content = `
    <div class="add-ex-flow">
      <p class="section-label" style="margin-bottom:12px">Select Muscle Group</p>
      <div class="selector-grid selector-grid-2" style="max-height: 250px; overflow-y: auto;">
        ${categories.map(c => `
          <button class="selector-card add-ex-cat-btn" data-cat="${c.id}" style="padding:12px; font-size:13px;">
            ${c.label}
          </button>
        `).join('')}
      </div>
      <div id="add-ex-list-container" style="margin-top:16px;"></div>
    </div>
  `;

  showModal({
    title: 'Add Extra Exercise',
    content: content
  });

  const modal = document.getElementById('modal-sheet');
  modal.querySelectorAll('.add-ex-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      modal.querySelectorAll('.add-ex-cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      const listContainer = document.getElementById('add-ex-list-container');
      if (!listContainer) return;

      const exercises = EXTRA_EXERCISES_DB[cat] || [];
      listContainer.innerHTML = `
        <p class="section-label" style="margin-bottom:8px">Select Exercise</p>
        <div style="display:flex; flex-direction:column; gap:6px; max-height:200px; overflow-y:auto;">
          ${exercises.map(ex => `
            <button class="btn btn-secondary btn-sm select-add-ex-btn" data-name="${ex.name}" data-muscle="${ex.muscle}" data-type="${ex.type}" style="justify-content:flex-start; text-align:left; font-size:12px;">
              ✦ ${ex.name}
            </button>
          `).join('')}
        </div>
      `;

      listContainer.querySelectorAll('.select-add-ex-btn').forEach(exBtn => {
        exBtn.addEventListener('click', () => {
          const exName = exBtn.dataset.name;
          const exMuscle = exBtn.dataset.muscle;
          const exType = exBtn.dataset.type;

          const state = getState();
          const plan = [...(state.workout?.generatedPlan || [])];
          if (!plan[dayIdx]) return;

          plan[dayIdx].exercises.push({
            name: exName,
            muscle: exMuscle,
            type: exType,
            done: false,
            sets: [
              { weight: 10, targetReps: 10, difficulty: null, done: false }
            ]
          });

          setState('workout.generatedPlan', plan);
          closeModal();
          showToast(`${exName} added!`, 'success');

          const trainContainer = document.getElementById('train-content');
          if (trainContainer) trainContainer.innerHTML = _renderDay(plan, dayIdx);
          _wireContentEvents();
        });
      });
    });
  });
}

// ── Custom External Exercise Log Modal ──
function _openCustomLogModal() {
  const content = `
    <div class="custom-log-form" style="display:flex; flex-direction:column; gap:12px;">
      <div class="field-group">
        <label class="field-label">Exercise Name</label>
        <input class="input" id="cust-log-name" placeholder="e.g. Morning Run, Pushups..." />
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div class="field-group">
          <label class="field-label">Sets</label>
          <input class="input" id="cust-log-sets" type="number" value="3" min="1" />
        </div>
        <div class="field-group">
          <label class="field-label">Reps per set</label>
          <input class="input" id="cust-log-reps" type="number" value="10" min="1" />
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div class="field-group">
          <label class="field-label">Weight (kg)</label>
          <input class="input" id="cust-log-weight" type="number" value="0" min="0" />
        </div>
        <div class="field-group">
          <label class="field-label">Duration (min)</label>
          <input class="input" id="cust-log-duration" type="number" value="15" min="1" />
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Approx Calories Burned</label>
        <input class="input" id="cust-log-calories" type="number" value="150" min="0" />
      </div>
      <button class="btn btn-primary btn-full" id="cust-log-save-btn" style="margin-top:8px">Log Workout ✓</button>
    </div>
  `;

  showModal({
    title: 'Log External Exercise',
    content: content
  });

  document.getElementById('cust-log-save-btn')?.addEventListener('click', () => {
    const name = document.getElementById('cust-log-name')?.value?.trim();
    const sets = Number(document.getElementById('cust-log-sets')?.value || 1);
    const reps = Number(document.getElementById('cust-log-reps')?.value || 10);
    const weight = Number(document.getElementById('cust-log-weight')?.value || 0);
    const duration = Number(document.getElementById('cust-log-duration')?.value || 15);
    const caloriesBurned = Number(document.getElementById('cust-log-calories')?.value || 150);

    if (!name) {
      showToast('Please enter an exercise name', 'error');
      return;
    }

    const state = getState();
    const sessionData = {
      day: 'External Session',
      date: getTodayDateString(),
      exercises: [
        {
          name: name,
          sets: Array.from({ length: sets }, () => ({ weight, targetReps: reps, done: true, difficulty: 5 })),
          volume: weight * reps * sets,
          done: true
        }
      ],
      totalVolume: weight * reps * sets,
      duration: duration,
      caloriesBurned: caloriesBurned,
      readinessAtTime: state.checkIn?.readinessScore || 65,
      notes: 'Logged outside weekly plan.'
    };
    logWorkoutSession(sessionData);
    closeModal();
    showToast(`Logged external session: ${name} ✓`, 'success');
  });
}

function _downloadShareCardImage(workoutName, totalVolume, exercisesCount, duration) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 400);
  grad.addColorStop(0, '#131324');
  grad.addColorStop(1, '#080810');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 400);

  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 380, 380);

  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('✦ AURA', 30, 45);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  const dateStr = new Date().toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
  ctx.fillText(dateStr, 280, 45);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(workoutName, 30, 100);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.fillText('Session Summary', 30, 125);

  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(`${totalVolume}kg`, 30, 200);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText('Total Volume', 30, 220);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(`${exercisesCount}`, 170, 200);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText('Exercises', 170, 220);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(`${duration}m`, 290, 200);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText('Duration', 290, 220);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('AURA — ADAPTIVE FITNESS OS', 30, 360);

  try {
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `aura-workout-${Date.now()}.png`;
    a.click();
    showToast('Downloaded Performance Card image ✓', 'success');
  } catch (e) {
    showToast('Download not supported in this browser', 'error');
  }
}

// ── Finish Session ──
function _finishSession() {
  const state = getState();
  const plan = state.workout?.generatedPlan;
  if (!plan) return;
  const day = plan[_activeDayIdx];
  const duration = Math.round((Date.now() - (_sessionStartTime || Date.now())) / 60000);
  const totalVolume = day.exercises?.reduce((s, ex) => s + (ex.volume || 0), 0) || 0;
  const sessionData = {
    day: day.dayName,
    exercises: day.exercises,
    totalVolume,
    duration: Math.max(1, duration),
    readinessAtTime: state.checkIn?.readinessScore || 65,
  };
  logWorkoutSession(sessionData);
  _sessionStartTime = null;

  const overlay = document.getElementById('celebration-overlay');
  const workoutNameEl = document.getElementById('share-card-workout-name');
  const shareStatsEl = document.getElementById('share-card-stats');

  if (workoutNameEl) workoutNameEl.textContent = day.label;
  if (shareStatsEl) {
    shareStatsEl.innerHTML = `
      <div class="cel-stat"><span>${totalVolume}kg</span><label>Volume</label></div>
      <div class="cel-stat"><span>${day.exercises?.length || 0}</span><label>Exercises</label></div>
      <div class="cel-stat"><span>${duration}min</span><label>Duration</label></div>
    `;
  }

  if (overlay) {
    overlay.classList.remove('hidden');
    
    // Wire sharing actions
    document.getElementById('share-whatsapp')?.addEventListener('click', () => {
      const text = encodeURIComponent(`✦ AURA Workout Complete: Completed ${day.label} workout! Stats: Volume: ${totalVolume}kg, Exercises: ${day.exercises?.length || 0}, Duration: ${duration}min. Keep grinding! 💪`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    });

    document.getElementById('share-instagram')?.addEventListener('click', () => {
      try {
        navigator.clipboard.writeText(`AURA Workout Complete! Volume: ${totalVolume}kg | Exercises: ${day.exercises?.length || 0} | Duration: ${duration}min`);
        showToast('✦ Copy template to clipboard! Open Instagram to share.', 'violet');
      } catch (e) {
        showToast('Instagram template copied', 'success');
      }
    });

    document.getElementById('share-download')?.addEventListener('click', () => {
      _downloadShareCardImage(day.label, totalVolume, day.exercises?.length || 0, duration);
    });

    document.getElementById('celebration-close')?.addEventListener('click', () => {
      overlay.classList.add('hidden');
      showToast(`Session logged! +${totalVolume}kg volume 🔥`, 'violet');
      navigate('/home');
    });
  }
}
