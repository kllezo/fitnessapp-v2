// ==========================================
// AURA V2 — Train Page
// Route: /train
// ==========================================

import { getState, setState, updateState } from '../../state/index.js';
import { navigate } from '../../router.js';
import { showToast } from '../../components/shared/ui.js';
import { generateWeeklyPlan, checkForPR, logWorkoutSession } from '../../services/workout-engine.js';
import './train.css';

let _activeDayIdx = 0;
let _activeSheet = null; // { dayIdx, exIdx }
let _restTimer = null;
let _restSeconds = 0;
let _restInterval = null;
let _sessionStartTime = null;
let _celebrationShown = false;

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

export function render() {
  const state = getState();
  let plan = state.workout?.generatedPlan;
  if (!plan || !plan.length) {
    plan = generateWeeklyPlan(state);
  }
  const today = new Date().getDay();
  _activeDayIdx = today % (plan?.length || 1);

  return `
    <div class="train-page">
      <div class="page-header">
        <h1 class="page-title">Train</h1>
        <div style="display:flex;gap:8px">
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

      <!-- Day Selector -->
      <div class="train-day-scroll" id="day-scroll">
        ${(plan || []).map((day, i) => `
          <button class="day-chip ${i === _activeDayIdx ? 'active' : ''}" data-day="${i}">
            <span class="day-chip-label">D${i + 1}</span>
            <span class="day-chip-name">${day.dayName}</span>
          </button>
        `).join('')}
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
    <div class="exercise-card ${done ? 'done' : ''}" data-ex="${exIdx}" id="ex-card-${exIdx}">
      <div class="ex-card-main">
        <div class="ex-info">
          <div class="ex-status-dot ${done ? 'done' : ''}"></div>
          <div>
            <p class="ex-name">${ex.name}</p>
            <p class="ex-meta">${totalSets} sets · ${ex.sets?.[0]?.targetReps || 10} reps · ${ex.muscle}</p>
          </div>
        </div>
        <div class="ex-right">
          <span class="ex-sets-badge">${setsCompleted}/${totalSets}</span>
          <button class="btn btn-sm btn-secondary ex-open-btn" data-ex="${exIdx}" data-day="${dayIdx}">
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
  _wireEvents();
}

export function onLeave() {
  if (_restInterval) clearInterval(_restInterval);
}

function _wireEvents() {
  // Day chips
  document.querySelectorAll('.day-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      _activeDayIdx = Number(chip.dataset.day);
      document.querySelectorAll('.day-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const state = getState();
      const content = document.getElementById('train-content');
      if (content) content.innerHTML = _renderDay(state.workout?.generatedPlan, _activeDayIdx);
      _wireContentEvents();
    });
  });

  _wireContentEvents();

  document.getElementById('regen-btn')?.addEventListener('click', () => {
    const plan = generateWeeklyPlan(getState());
    const content = document.getElementById('train-content');
    if (content) content.innerHTML = _renderDay(plan, _activeDayIdx);
    _wireContentEvents();
    showToast('Plan regenerated ✦', 'violet');
  });

  document.getElementById('history-btn')?.addEventListener('click', _openHistSheet);
}

function _wireContentEvents() {
  document.querySelectorAll('.ex-open-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const exIdx = Number(btn.dataset.ex);
      const dayIdx = Number(btn.dataset.day);
      _openExSheet(dayIdx, exIdx);
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
    btn.addEventListener('click', () => {
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
  const statsEl = document.getElementById('celebration-stats');
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
      
      // Navigate home
      navigate('/home');
    });
  }
}

