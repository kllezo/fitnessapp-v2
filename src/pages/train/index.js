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

    <!-- Exercise Sheet -->
    <div class="bottom-sheet-overlay" id="ex-sheet-overlay"></div>
    <div class="bottom-sheet" id="ex-sheet">
      <div class="modal-handle"></div>
      <div id="ex-sheet-content"></div>
    </div>

    <!-- Rest Timer Sheet -->
    <div class="bottom-sheet-overlay" id="rest-overlay"></div>
    <div class="bottom-sheet" id="rest-sheet">
      <div class="modal-handle"></div>
      <div id="rest-content"></div>
    </div>

    <!-- History Sheet -->
    <div class="bottom-sheet-overlay" id="hist-overlay"></div>
    <div class="bottom-sheet" id="hist-sheet">
      <div class="modal-handle"></div>
      <div id="hist-content"></div>
    </div>

    <!-- Celebration Overlay -->
    <div class="celebration-overlay hidden" id="celebration-overlay">
      <div class="celebration-content">
        <div class="celebration-emoji">🎉</div>
        <h2 class="celebration-title">Session Complete!</h2>
        <div class="celebration-stats" id="celebration-stats"></div>
        <button class="btn btn-primary btn-full" id="celebration-close">Awesome! 💪</button>
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
  const allDone = day.exercises?.every(ex => ex.done);

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

    ${allDone ? `
      <div class="session-complete-bar">
        <span>🏆 All exercises done!</span>
        <button class="btn btn-primary btn-sm" id="finish-session-btn">Finish Session</button>
      </div>
    ` : `
      <button class="btn btn-secondary btn-full" style="margin:16px" id="rest-btn-main">
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
  _closeExSheet();
  _closeRestSheet();
  _closeHistSheet();
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

  // Sheet overlays
  document.getElementById('ex-sheet-overlay')?.addEventListener('click', _closeExSheet);
  document.getElementById('rest-overlay')?.addEventListener('click', _closeRestSheet);
  document.getElementById('hist-overlay')?.addEventListener('click', _closeHistSheet);
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
  document.getElementById('gen-btn')?.addEventListener('click', () => {
    generateWeeklyPlan(getState());
    const state = getState();
    const content = document.getElementById('train-content');
    if (content) content.innerHTML = _renderDay(state.workout?.generatedPlan, _activeDayIdx);
    _wireContentEvents();
  });
}

// ── Exercise Sheet ──
function _openExSheet(dayIdx, exIdx) {
  _activeSheet = { dayIdx, exIdx };
  const overlay = document.getElementById('ex-sheet-overlay');
  const sheet = document.getElementById('ex-sheet');
  overlay?.classList.add('open');
  sheet?.classList.add('open');
  _renderExSheetContent(dayIdx, exIdx);
}

function _closeExSheet() {
  document.getElementById('ex-sheet-overlay')?.classList.remove('open');
  document.getElementById('ex-sheet')?.classList.remove('open');
  _activeSheet = null;
}

function _renderExSheetContent(dayIdx, exIdx) {
  const state = getState();
  const plan = state.workout?.generatedPlan;
  if (!plan) return;
  const ex = plan[dayIdx]?.exercises[exIdx];
  if (!ex) return;

  const content = document.getElementById('ex-sheet-content');
  if (!content) return;

  content.innerHTML = `
    <div class="ex-sheet-header">
      <div>
        <h3 class="ex-sheet-title">${ex.name}</h3>
        <p class="ex-sheet-meta">${ex.muscle} · ${ex.type}</p>
      </div>
      <button class="icon-btn" id="close-ex-sheet">✕</button>
    </div>

    <div class="sets-list" id="sets-list">
      ${ex.sets.map((set, i) => _renderSetRow(set, i)).join('')}
    </div>

    <button class="btn btn-secondary btn-sm" id="add-set-btn" style="margin-top:8px;width:100%">
      + Add Set
    </button>

    <div class="ex-sheet-actions">
      <button class="btn btn-primary btn-full ${ex.done ? 'btn-mint' : ''}" id="mark-done-btn">
        ${ex.done ? '✓ Marked Complete' : 'Mark Exercise Done'}
      </button>
    </div>

    <div class="ex-notes">
      <label class="field-label">Session Notes</label>
      <textarea class="input" id="ex-notes" placeholder="How did it feel?" rows="2">${ex.notes || ''}</textarea>
    </div>
  `;

  document.getElementById('close-ex-sheet')?.addEventListener('click', _closeExSheet);

  document.getElementById('mark-done-btn')?.addEventListener('click', () => {
    const state = getState();
    const plan = [...(state.workout?.generatedPlan || [])];
    plan[dayIdx].exercises[exIdx].done = true;
    plan[dayIdx].exercises[exIdx].notes = document.getElementById('ex-notes')?.value || '';

    // Check all sets done and calculate volume
    const sets = plan[dayIdx].exercises[exIdx].sets;
    const volume = sets.reduce((s, set) => s + (set.weight || 0) * (set.targetReps || 0), 0);
    plan[dayIdx].exercises[exIdx].volume = volume;

    // Check PR
    const maxWeight = Math.max(...sets.map(s => s.weight || 0));
    const maxReps = sets[0]?.targetReps || 10;
    if (maxWeight > 0 && checkForPR(ex.name, maxWeight, maxReps)) {
      showToast(`🏆 New PR on ${ex.name}!`, 'violet');
    }

    setState('workout.generatedPlan', plan);
    _closeExSheet();

    // Refresh card
    const content = document.getElementById('train-content');
    if (content) content.innerHTML = _renderDay(plan, _activeDayIdx);
    _wireContentEvents();
    showToast(`${ex.name} complete ✓`, 'success');
  });

  document.getElementById('add-set-btn')?.addEventListener('click', () => {
    const state = getState();
    const plan = [...(state.workout?.generatedPlan || [])];
    const lastSet = plan[dayIdx].exercises[exIdx].sets.slice(-1)[0] || { weight: 0, targetReps: 10 };
    plan[dayIdx].exercises[exIdx].sets.push({ ...lastSet, done: false, difficulty: null });
    setState('workout.generatedPlan', plan);
    _renderExSheetContent(dayIdx, exIdx);
    _wireSetEvents(dayIdx, exIdx);
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
  document.getElementById('rest-overlay')?.classList.add('open');
  document.getElementById('rest-sheet')?.classList.add('open');
  _restSeconds = 60;
  _renderRestContent();
}

function _closeRestSheet() {
  if (_restInterval) { clearInterval(_restInterval); _restInterval = null; }
  document.getElementById('rest-overlay')?.classList.remove('open');
  document.getElementById('rest-sheet')?.classList.remove('open');
}

function _renderRestContent() {
  const content = document.getElementById('rest-content');
  if (!content) return;
  content.innerHTML = `
    <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-bottom:16px;text-align:center">Rest Timer</h3>
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
  `;

  content.querySelectorAll('.rest-dur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_restInterval) { clearInterval(_restInterval); _restInterval = null; }
      _restSeconds = Number(btn.dataset.secs);
      content.querySelectorAll('.rest-dur-btn').forEach(b => b.classList.remove('active'));
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
        _closeRestSheet();
      }
    }, 1000);
  });

  document.getElementById('rest-close-btn')?.addEventListener('click', _closeRestSheet);
}

// ── History ──
function _openHistSheet() {
  document.getElementById('hist-overlay')?.classList.add('open');
  document.getElementById('hist-sheet')?.classList.add('open');
  const content = document.getElementById('hist-content');
  const history = getState().workout?.history || [];
  if (content) {
    content.innerHTML = `
      <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-bottom:16px">Workout History</h3>
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
    `;
    document.getElementById('close-hist-btn')?.addEventListener('click', _closeHistSheet);
  }
}

function _closeHistSheet() {
  document.getElementById('hist-overlay')?.classList.remove('open');
  document.getElementById('hist-sheet')?.classList.remove('open');
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
  if (overlay && statsEl) {
    statsEl.innerHTML = `
      <div class="cel-stat"><span>${totalVolume}kg</span><label>Total Volume</label></div>
      <div class="cel-stat"><span>${day.exercises?.length || 0}</span><label>Exercises</label></div>
      <div class="cel-stat"><span>${duration}min</span><label>Duration</label></div>
    `;
    overlay.classList.remove('hidden');
    document.getElementById('celebration-close')?.addEventListener('click', () => {
      overlay.classList.add('hidden');
      showToast(`Session logged! +${totalVolume}kg volume 🔥`, 'violet');
    });
  }
}
