// ==========================================
// AURA V2 — Home Dashboard Page
// Route: /home
// ==========================================

import { getState, setState, updateState, getDisciplineScore, getReadinessLabel, getTodayDateString } from '../../state/index.js';
import { navigate } from '../../router.js';
import { showToast, showModal, closeModal } from '../../components/shared/ui.js';
import { computeReadinessScore, generateWeeklyReview, detectHabitPatterns, extractPRFeed } from '../../services/ai-engine.js';
import { getActivityData, updateActivityGoal, updateActivitySteps, getDisciplineBreakdown, getDayIndexMonSun } from '../../services/activity-engine.js';
import './home.css';

// Daily sync state
let _syncStep = 0;
let _syncAnswers = {};
let _currentActivityView = 'today';
let _currentDisciplineView = 'week';
const SYNC_QUESTIONS = [
  { key: 'sleep', label: 'Sleep Hours', emoji: '😴', opts: ['< 2 Hours', '2–4 Hours', '4–6 Hours', '6–8 Hours', '8+ Hours'] },
  { key: 'energy', label: 'Energy Level', emoji: '⚡', opts: ['🪫 Empty', '😮‍💨 Low', '😐 OK', '💪 Good', '⚡ High'] },
  { key: 'soreness', label: 'Muscle Soreness', emoji: '💊', opts: ['😣 Severe', '😟 High', '😐 Moderate', '😊 Mild', '😁 None'] },
  { key: 'stress', label: 'Stress Level', emoji: '🧠', opts: ['😰 High', '😟 Elevated', '😐 OK', '😌 Low', '😎 Calm'] },
  { key: 'motivation', label: 'Motivation', emoji: '🎯', opts: ['😫 None', '😪 Low', '😐 OK', '😊 Good', '🔥 Fired up'] },
];

export function render() {
  const state = getState();
  const auth = state.auth;
  const checkIn = state.checkIn;
  const ob = state.onboarding;
  const todayDone = checkIn?.todayDone && checkIn?.lastDate === getTodayDateString();
  const readiness = checkIn?.readinessScore || 65;
  const { label: rLabel, color: rColor } = getReadinessLabel(readiness);
  const discipline = getDisciplineScore(state);
  const streak = state.workout?.streakDays || 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const getGoalLabel = (gVal) => {
    const map = { build_muscle: 'Build Muscle', lose_fat: 'Lose Fat', maintain: 'Maintain', endurance: 'Endurance', flexibility: 'Flexibility' };
    if (Array.isArray(gVal)) return gVal.map(g => map[g]).filter(Boolean).join(' + ') || 'Training';
    return map[gVal] || 'Training';
  };
  const goalLabel = getGoalLabel(ob?.goal);

  return `
    <div class="home-page">
      <!-- Header -->
      <div class="home-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <p class="home-greeting">${greeting}</p>
          <h1 class="home-name">${auth?.profileName?.split(' ')[0] || 'Athlete'}</h1>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button class="notif-btn" id="notif-btn" aria-label="Notifications" style="background:var(--bg-card); border:1px solid var(--border-card); border-radius:var(--radius-md); width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-secondary); position:relative;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            ${(state.socials?.notifications?.length || 0) > 0 ? '<span class="notif-dot" style="position:absolute; top:6px; right:6px; width:6px; height:6px; background:var(--aura-rose); border-radius:50%"></span>' : ''}
          </button>
          <button class="icon-btn" id="profile-btn" aria-label="Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Rings Hero Card -->
      <div class="home-section">
        <div class="home-hero-card card card-glow" style="background:#11121A; border:1px solid #23253A; padding: 20px; display:flex; flex-direction:column; gap:16px;">
          <div class="rings-row" style="display:flex; justify-content:space-around; align-items:center;">
            <!-- Discipline Ring (Left) -->
            <div class="ring-wrapper" id="discipline-ring-wrapper" style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
              <span style="font-family:var(--font-display); font-size:10px; font-weight:700; letter-spacing:1px; color:#8E93B8; text-transform:uppercase; margin-bottom:8px;">Discipline Ring</span>
              <div style="position:relative; width:96px; height:96px; display:flex; align-items:center; justify-content:center;">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="8"/>
                  <circle id="disc-ring-circle" cx="48" cy="48" r="40" fill="none" stroke="#5B5CF6" stroke-width="8"
                    stroke-linecap="round" stroke-dasharray="251.33" stroke-dashoffset="251.33"
                    data-offset="${251.33 - (251.33 * Math.min(discipline, 100) / 100)}"
                    transform="rotate(-90 48 48)" style="transition: stroke-dashoffset 1s cubic-bezier(0.1, 1, 0.1, 1);"/>
                </svg>
                <div style="position:absolute; display:flex; flex-direction:column; align-items:center;">
                  <span style="font-size:18px; font-weight:800; color:#FFFFFF; line-height:1;">${discipline}</span>
                  <span style="font-size:9px; color:#8E93B8; margin-top:2px;">/100</span>
                </div>
              </div>
            </div>

            <!-- Steps Ring (Right) -->
            <div class="ring-wrapper" id="steps-ring-wrapper" style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
              <span style="font-family:var(--font-display); font-size:10px; font-weight:700; letter-spacing:1px; color:#8E93B8; text-transform:uppercase; margin-bottom:8px;">Steps Ring</span>
              <div style="position:relative; width:96px; height:96px; display:flex; align-items:center; justify-content:center;">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="8"/>
                  <circle id="steps-ring-circle" cx="48" cy="48" r="40" fill="none" stroke="#00E5A8" stroke-width="8"
                    stroke-linecap="round" stroke-dasharray="251.33" stroke-dashoffset="251.33"
                    data-offset="${251.33 - (251.33 * Math.min(state.activity?.steps || 0, state.activity?.stepGoal || 10000) / (state.activity?.stepGoal || 10000))}"
                    transform="rotate(-90 48 48)" style="transition: stroke-dashoffset 1s cubic-bezier(0.1, 1, 0.1, 1);"/>
                </svg>
                <div style="position:absolute; display:flex; flex-direction:column; align-items:center;">
                  <span style="font-size:16px; font-weight:800; color:#FFFFFF; line-height:1;">${(state.activity?.steps || 0) >= 1000 ? ((state.activity?.steps || 0)/1000).toFixed(1) + 'k' : (state.activity?.steps || 0)}</span>
                  <span style="font-size:9px; color:#8E93B8; margin-top:2px;">/${(state.activity?.stepGoal || 10000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div style="border-top: 1px solid #23253A; padding-top: 12px; margin-top: 4px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <p style="font-size:12px; color:#8E93B8; margin:0;">${greeting}</p>
              <h2 style="font-size:20px; font-weight:800; color:#FFFFFF; margin:2px 0 0 0;">${auth?.profileName?.split(' ')[0] || 'Athlete'}</h2>
            </div>
            <div style="text-align:right;">
              <p style="font-size:10px; color:#8E93B8; margin:0; text-transform:uppercase; letter-spacing:0.5px;">Discipline Status</p>
              <p style="font-size:14px; font-weight:700; color:${discipline >= 80 ? '#a78bfa' : discipline >= 65 ? '#60a5fa' : discipline >= 50 ? '#fbbf24' : '#fda4af'}; margin:2px 0 0 0;">
                ${discipline >= 80 ? 'Locked In' : discipline >= 65 ? 'Consistent' : discipline >= 50 ? 'Moderate' : 'Starting Out'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="home-section">
        <div class="stat-grid stat-grid-3">
          <div class="stat-cell">
            <div class="stat-value gradient-text">${discipline}</div>
            <div class="stat-label">Discipline</div>
          </div>
          <div class="stat-cell">
            <div class="stat-value" style="color:var(--aura-amber)">${streak}</div>
            <div class="stat-label">Day Streak 🔥</div>
          </div>
          <div class="stat-cell" id="calories-stat-cell">
            <div class="stat-value" style="color:#fda4af">${(state.activity?.caloriesBurned || 0)} kcal</div>
            <div class="stat-label">Calories Burned</div>
          </div>
        </div>
      </div>

      <!-- Today's Session CTA -->
      <div class="home-section">
        <div class="section-label">Today's Mission</div>
        <div class="today-session-card card" id="today-session">
          ${_renderTodaySession(state)}
        </div>
      </div>

      <!-- AI Weekly Review -->
      <div class="home-section" id="weekly-review-section">
        <div class="section-label">Weekly AI Review</div>
        <div id="weekly-review-card"></div>
      </div>

      <!-- Habit Patterns -->
      <div class="home-section" id="habit-patterns-section">
        <div class="section-label">Habit Patterns</div>
        <div class="habit-grid" id="habit-grid"></div>
      </div>

      <!-- PR Feed -->
      <div class="home-section" id="pr-section">
        <div class="section-label">Personal Records 🏅</div>
        <div id="pr-feed"></div>
      </div>

      <!-- Quick Nav -->
      <div class="home-section">
        <div class="section-label">Quick Access</div>
        <div class="quick-nav-grid">
          <button class="quick-nav-card" id="qn-train">
            <span class="quick-nav-icon">🏋️</span>
            <span class="quick-nav-label">Train</span>
          </button>
          <button class="quick-nav-card" id="qn-diet">
            <span class="quick-nav-icon">🥗</span>
            <span class="quick-nav-label">Diet</span>
          </button>
          <button class="quick-nav-card" id="qn-recovery">
            <span class="quick-nav-icon">💤</span>
            <span class="quick-nav-label">Recovery</span>
          </button>
          <button class="quick-nav-card" id="qn-socials">
            <span class="quick-nav-icon">🤝</span>
            <span class="quick-nav-label">Squad</span>
          </button>
        </div>
      </div>

      <!-- Activity Details Sheet -->
      <div class="bottom-sheet-overlay" id="activity-overlay"></div>
      <div class="bottom-sheet" id="activity-sheet" style="background:#11121A; border-top:1px solid #23253A; padding: 12px 20px 32px;">
        <div class="modal-handle"></div>
        <div id="activity-sheet-content"></div>
      </div>

      <!-- Discipline Details Sheet -->
      <div class="bottom-sheet-overlay" id="discipline-overlay"></div>
      <div class="bottom-sheet" id="discipline-sheet" style="background:#11121A; border-top:1px solid #23253A; padding: 12px 20px 32px;">
        <div class="modal-handle"></div>
        <div id="discipline-sheet-content"></div>
      </div>

    </div>
  `;
}

function _renderTodaySession(state) {
  const plan = state.workout?.generatedPlan;
  if (!plan || !plan.length) {
    return `
      <div class="today-empty">
        <p style="color:var(--text-muted);font-size:var(--text-sm)">No workout plan yet</p>
        <button class="btn btn-sm btn-primary" id="gen-plan-btn" style="margin-top:8px">Generate Plan</button>
      </div>
    `;
  }
  const dayIdx = new Date().getDay() % plan.length;
  const todayPlan = plan[dayIdx];
  return `
    <div class="today-session-inner">
      <div class="today-session-meta">
        <div>
          <p class="today-session-title">${todayPlan.label}</p>
          <p class="today-session-sub">${todayPlan.exercises?.length || 0} exercises · ~${todayPlan.estimatedDuration}min</p>
        </div>
        <button class="btn btn-primary btn-sm" id="start-session-btn">Start →</button>
      </div>
      <div class="today-exercise-list">
        ${(todayPlan.exercises || []).slice(0, 3).map(ex => `
          <div class="today-exercise-row">
            <span class="today-exercise-dot"></span>
            <span class="today-exercise-name">${ex.name}</span>
            <span class="today-exercise-sets">${ex.sets?.length || 0}×${ex.sets?.[0]?.targetReps || 10}</span>
          </div>
        `).join('')}
        ${todayPlan.exercises?.length > 3 ? `<p style="font-size:11px;color:var(--text-muted);margin-top:4px">+${todayPlan.exercises.length - 3} more</p>` : ''}
      </div>
    </div>
  `;
}

export function onEnter() {
  _syncStep = 0;
  _syncAnswers = {};
  _wireEvents();
  _loadAIData();
  _checkDailySync();

  // Smooth fill animations for rings
  setTimeout(() => {
    const discCircle = document.getElementById('disc-ring-circle');
    const stepsCircle = document.getElementById('steps-ring-circle');
    if (discCircle) {
      discCircle.style.strokeDashoffset = discCircle.dataset.offset;
    }
    if (stepsCircle) {
      stepsCircle.style.strokeDashoffset = stepsCircle.dataset.offset;
    }
  }, 100);
}

export function onLeave() {
  _closeSyncSheet();
  _closeActivitySheet();
  _closeDisciplineSheet();
}

function _loadAIData() {
  const state = getState();

  // Weekly review
  const review = generateWeeklyReview(state);
  const reviewCard = document.getElementById('weekly-review-card');
  if (reviewCard) {
    if (review.empty) {
      reviewCard.innerHTML = `<div class="card" style="text-align:center;padding:16px">
        <p style="color:var(--text-muted);font-size:var(--text-sm)">Complete your first workout to see your weekly review</p>
      </div>`;
    } else {
      const stars = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);
      reviewCard.innerHTML = `
        <div class="card card-glow weekly-review-card">
          <div class="wr-header">
            <span class="wr-stars">${stars}</span>
            <span class="wr-days">${review.loggedDays} sessions</span>
          </div>
          <p class="wr-message">"${review.message}"</p>
          ${review.strengths.length ? `
            <div class="wr-grid">
              ${review.strengths.map(s => `<div class="wr-chip wr-positive">${s.icon} ${s.text}</div>`).join('')}
              ${review.focusAreas.map(f => `<div class="wr-chip wr-warning">${f.icon} ${f.text}</div>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  // Habit patterns
  const patterns = detectHabitPatterns(state);
  const habitGrid = document.getElementById('habit-grid');
  if (habitGrid) {
    habitGrid.innerHTML = patterns.map(p => `
      <div class="habit-card habit-${p.type}">
        <span class="habit-icon">${p.icon}</span>
        <span class="habit-label">${p.label}</span>
        <span class="habit-sub">${p.sub}</span>
      </div>
    `).join('');
  }

  // PR Feed
  const prs = extractPRFeed(state);
  const prFeed = document.getElementById('pr-feed');
  if (prFeed) {
    if (!prs.length) {
      prFeed.innerHTML = `<div class="card" style="text-align:center;padding:16px">
        <p style="color:var(--text-muted);font-size:var(--text-sm)">Log workouts to track personal records 🏆</p>
      </div>`;
    } else {
      const medals = ['🥇', '🥈', '🥉', '🏅', '🏅'];
      prFeed.innerHTML = `<div class="card card-amber pr-feed-card">
        ${prs.map((pr, i) => `
          <div class="pr-row">
            <span class="pr-medal">${medals[i]}</span>
            <div class="pr-info">
              <span class="pr-name">${pr.name}</span>
              <span class="pr-meta">${pr.reps} reps · ${pr.date}</span>
            </div>
            <span class="pr-weight">${pr.weight}kg</span>
          </div>
        `).join('')}
      </div>`;
    }
  }
}

function _checkDailySync() {
  const state = getState();
  const today = getTodayDateString();
  const todayDone = state.checkIn?.todayDone && state.checkIn?.lastDate === today;
  const alreadyPrompted = state.app?.lastSyncPrompt === today;
  if (!todayDone && !alreadyPrompted && state.onboarding?.completed) {
    setState('app.lastSyncPrompt', today);
    setTimeout(() => _openSyncSheet(), 1500);
  }
}

function _openSyncSheet() {
  _syncStep = 0;
  _syncAnswers = {};
  showModal({
    className: 'sync-modal',
    content: `<div id="sync-content"></div>`,
    onClose: () => {}
  });
  _renderSyncStep();
}

function _closeSyncSheet() {
  closeModal();
}

function _renderSyncStep() {
  const content = document.getElementById('sync-content');
  if (!content) return;

  if (_syncStep >= SYNC_QUESTIONS.length) {
    _completeSyncFlow();
    return;
  }

  const q = SYNC_QUESTIONS[_syncStep];
  const progress = `${_syncStep + 1} / ${SYNC_QUESTIONS.length}`;

  content.innerHTML = `
    <div class="sync-progress">${progress}</div>
    <div class="sync-question">
      <span class="sync-emoji">${q.emoji}</span>
      <h3 class="sync-title">${q.label}</h3>
      <p class="sync-hint">How are you feeling?</p>
    </div>
    <div class="sync-options">
      ${q.opts.map((opt, i) => `
        <button class="sync-opt ${_syncAnswers[q.key] === i + 1 ? 'selected' : ''}"
          data-key="${q.key}" data-val="${i + 1}">
          ${opt}
        </button>
      `).join('')}
    </div>
    <div class="sync-nav">
      ${_syncStep > 0 ? `<button class="btn btn-ghost btn-sm" id="sync-back-btn">← Back</button>` : '<div></div>'}
      <button class="btn btn-primary btn-sm" id="sync-next-btn">
        ${_syncStep === SYNC_QUESTIONS.length - 1 ? 'Calculate →' : 'Next →'}
      </button>
    </div>
  `;

  content.querySelectorAll('.sync-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('.sync-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      _syncAnswers[btn.dataset.key] = Number(btn.dataset.val);
      setTimeout(() => {
        _syncStep++;
        _renderSyncStep();
      }, 300);
    });
  });

  document.getElementById('sync-next-btn')?.addEventListener('click', () => {
    _syncStep++;
    _renderSyncStep();
  });
  document.getElementById('sync-back-btn')?.addEventListener('click', () => {
    _syncStep = Math.max(0, _syncStep - 1);
    _renderSyncStep();
  });
}

function _completeSyncFlow() {
  const score = computeReadinessScore(_syncAnswers);
  const today = getTodayDateString();
  const { label, color } = getReadinessLabel(score);

  const history = [...(getState().checkIn?.history || [])];
  history.push({ date: today, answers: { ..._syncAnswers }, readinessScore: score });

  updateState('checkIn', {
    todayDone: true,
    lastDate: today,
    answers: { ..._syncAnswers },
    readinessScore: score,
    history: history.slice(-60),
  });
  setState('app.readiness', color === 'violet' ? 'high' : color === 'mint' ? 'medium' : 'low');
  document.getElementById('phone-shell')?.setAttribute('data-readiness', color === 'violet' ? 'high' : color === 'mint' ? 'medium' : 'low');

  const content = document.getElementById('sync-content');
  if (content) {
    content.innerHTML = `
      <div class="sync-complete">
        <div class="sync-score-ring">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke="url(#syncGrad)" stroke-width="6"
              stroke-linecap="round" stroke-dasharray="213.6"
              stroke-dashoffset="${213.6 - (213.6 * score / 100)}"
              transform="rotate(-90 40 40)"/>
            <defs><linearGradient id="syncGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stop-color="#a78bfa"/><stop offset="1" stop-color="#7c3aed"/>
            </linearGradient></defs>
          </svg>
          <div class="sync-score-label">
            <span class="sync-score-num">${score}</span>
          </div>
        </div>
        <h3 class="sync-result-title">Readiness: ${label}</h3>
        <p class="sync-result-sub">${score >= 75 ? 'Body is primed. Hit it hard today.' : score >= 50 ? 'Train smart, respect recovery.' : 'Low battery. MVS mode recommended.'}</p>
        <button class="btn btn-primary btn-full" id="sync-done-btn" style="margin-top:20px">Let's Go →</button>
      </div>
    `;
  }

  document.getElementById('sync-done-btn')?.addEventListener('click', () => {
    _closeSyncSheet();
    showToast(`Readiness: ${score} — ${label}`, 'violet');
    const container = document.getElementById('page-content');
    if (container) {
      container.innerHTML = render();
      onEnter();
    }
  });
}

function _wireEvents() {
  document.getElementById('sync-btn')?.addEventListener('click', _openSyncSheet);
  document.getElementById('sync-overlay')?.addEventListener('click', _closeSyncSheet);
  document.getElementById('start-session-btn')?.addEventListener('click', () => navigate('/train'));
  document.getElementById('gen-plan-btn')?.addEventListener('click', () => navigate('/train'));
  document.getElementById('qn-train')?.addEventListener('click', () => navigate('/train'));
  document.getElementById('qn-diet')?.addEventListener('click', () => navigate('/diet'));
  document.getElementById('qn-recovery')?.addEventListener('click', () => navigate('/recovery'));
  document.getElementById('qn-socials')?.addEventListener('click', () => navigate('/socials'));
  document.getElementById('notif-btn')?.addEventListener('click', () => showToast('No new notifications', 'default'));
  document.getElementById('profile-btn')?.addEventListener('click', () => navigate('/profile'));

  // Activity & Discipline Ring & Sheet Triggers
  document.getElementById('discipline-ring-wrapper')?.addEventListener('click', _openDisciplineSheet);
  document.getElementById('steps-ring-wrapper')?.addEventListener('click', _openActivitySheet);
  document.getElementById('discipline-overlay')?.addEventListener('click', _closeDisciplineSheet);
  document.getElementById('activity-overlay')?.addEventListener('click', _closeActivitySheet);
}

// ── Discipline Sheet Controllers ──

function _openDisciplineSheet() {
  const overlay = document.getElementById('discipline-overlay');
  const sheet = document.getElementById('discipline-sheet');
  const content = document.getElementById('discipline-sheet-content');
  if (!overlay || !sheet || !content) return;

  content.innerHTML = _renderDisciplineSheetContent(_currentDisciplineView);
  overlay.classList.add('open');
  sheet.classList.add('open');

  _wireDisciplineSheetEvents();
}

function _closeDisciplineSheet() {
  const overlay = document.getElementById('discipline-overlay');
  const sheet = document.getElementById('discipline-sheet');
  if (overlay && sheet) {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
  }
}

function _wireDisciplineSheetEvents() {
  document.getElementById('disc-toggle-week')?.addEventListener('click', () => {
    _currentDisciplineView = 'week';
    const content = document.getElementById('discipline-sheet-content');
    if (content) content.innerHTML = _renderDisciplineSheetContent('week');
    _wireDisciplineSheetEvents();
  });

  document.getElementById('disc-toggle-month')?.addEventListener('click', () => {
    _currentDisciplineView = 'month';
    const content = document.getElementById('discipline-sheet-content');
    if (content) content.innerHTML = _renderDisciplineSheetContent('month');
    _wireDisciplineSheetEvents();
  });
}

function _renderDisciplineSheetContent(view = 'week') {
  const state = getState();
  const discipline = getDisciplineScore(state);
  const streak = state.workout?.streakDays || 0;
  const status = discipline >= 80 ? 'Locked In' : discipline >= 65 ? 'Consistent' : discipline >= 50 ? 'Moderate' : 'Starting Out';
  const breakdown = getDisciplineBreakdown(state);

  const weekActive = view === 'week' ? 'active' : '';
  const monthActive = view === 'month' ? 'active' : '';

  let bodyHtml = '';

  if (view === 'week') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseTrend = [44, 47, 49, 52, 55, 54, 52];
    const dayIdx = getDayIndexMonSun();
    const diff = discipline - baseTrend[dayIdx];
    const trendScores = baseTrend.map((v, idx) => {
      if (idx <= dayIdx) return Math.min(100, Math.max(35, v + diff));
      return v;
    });

    const maxVal = Math.max(...trendScores, 100);
    const minVal = Math.min(...trendScores, 30);
    const range = maxVal - minVal || 1;
    const width = 280;
    const height = 80;
    const padding = 15;

    const points = trendScores.map((val, i) => {
      const x = padding + (i * (width - 2 * padding) / 6);
      const y = height - padding - ((val - minVal) * (height - 2 * padding) / range);
      return `${x},${y}`;
    }).join(' ');

    const trendPointsHtml = trendScores.map((val, i) => {
      const x = padding + (i * (width - 2 * padding) / 6);
      const y = height - padding - ((val - minVal) * (height - 2 * padding) / range);
      return `<circle cx="${x}" cy="${y}" r="3" fill="#5B5CF6" />`;
    }).join('');

    const insights = [
      `🔥 Workout consistency is strong (+${breakdown.workout} points).`,
      breakdown.hydration < 8 
        ? `💧 Hydration lowered score by 4 points.` 
        : `💧 Hydration added ${breakdown.hydration} points to your consistency.`,
      `😴 Sleep quality added ${breakdown.sleep} points.`,
      `🎯 Reach 60+ by hitting protein targets 3 days straight.`
    ];

    bodyHtml = `
      <div style="margin-top:16px;">
        <!-- Breakdown table -->
        <span class="section-label" style="display:block; margin-bottom:8px;">Why is my score this?</span>
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px; background:rgba(255,255,255,0.02); padding:12px; border-radius:8px;">
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Workout Consistency</span>
            <strong style="color:#00E5A8;">+${breakdown.workout}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Protein Adherence</span>
            <strong style="color:#00E5A8;">+${breakdown.protein}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Sleep Quality</span>
            <strong style="color:#00E5A8;">+${breakdown.sleep}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Hydration</span>
            <strong style="color:#00E5A8;">+${breakdown.hydration}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Missed Sessions</span>
            <strong style="color:#fda4af;">${breakdown.missed}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Skipped Recovery</span>
            <strong style="color:#fda4af;">${breakdown.skipped}</strong>
          </div>
          <div style="border-top:1px dashed #23253A; margin-top:8px; padding-top:8px; display:flex; justify-content:space-between;">
            <span style="color:#FFFFFF; font-weight:bold;">TOTAL</span>
            <strong style="color:#5B5CF6; font-size:18px;">${breakdown.total}</strong>
          </div>
        </div>

        <!-- Line Chart Trend -->
        <div class="card" style="background:#11121A; border:1px solid #23253A; padding:12px; margin-bottom:16px;">
          <p style="font-size:11px; color:#8E93B8; font-weight:var(--fw-bold); text-transform:uppercase; margin-bottom:8px;">7 Day Trend</p>
          <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:80px; overflow:visible;">
            <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2" />
            <line x1="${padding}" y1="${height / 2}" x2="${width - padding}" y2="${height / 2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2" />
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.06)" />
            
            <polyline fill="none" stroke="#5B5CF6" stroke-width="2.5" points="${points}" stroke-linecap="round" stroke-linejoin="round" />
            ${trendPointsHtml}
            
            ${days.map((day, i) => {
              const x = padding + (i * (width - 2 * padding) / 6);
              return `<text x="${x}" y="${height - 2}" font-size="7.5" fill="#8E93B8" text-anchor="middle" font-weight="${i === dayIdx ? 'bold' : 'normal'}">${day}</text>`;
            }).join('')}
          </svg>
        </div>

        <!-- Insights -->
        <span class="section-label" style="display:block; margin-bottom:8px;">Insights</span>
        <div class="card" style="background:rgba(91, 92, 246, 0.05); border:1px solid rgba(91, 92, 246, 0.15); padding:12px;">
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${insights.map(ins => `
              <div style="display:flex; gap:8px; font-size:12px; color:#FFFFFF; line-height:1.4;">
                <span>✦</span>
                <span>${ins}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else {
    // Month View
    const avgScore = Math.round(discipline * 0.95 + 4);
    const maxScore = Math.max(discipline + 12, 85);
    const mock30Days = Array.from({ length: 30 }, (_, i) => {
      const base = 50 + Math.sin(i / 2) * 15;
      const final = i === 29 ? discipline : Math.round(base + (Math.random() * 8 - 4));
      return Math.min(100, Math.max(35, final));
    });

    bodyHtml = `
      <div style="margin-top:16px;">
        <!-- Metrics Row -->
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:16px;">
          <div class="card" style="padding:10px; text-align:center; background:#11121A; border:1px solid #23253A;">
            <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Avg Score</span>
            <strong style="font-size:18px; color:#5B5CF6; display:block; margin-top:4px;">${avgScore}</strong>
          </div>
          <div class="card" style="padding:10px; text-align:center; background:#11121A; border:1px solid #23253A;">
            <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Highest</span>
            <strong style="font-size:18px; color:#00E5A8; display:block; margin-top:4px;">${maxScore}</strong>
          </div>
          <div class="card" style="padding:10px; text-align:center; background:#11121A; border:1px solid #23253A;">
            <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Streak</span>
            <strong style="font-size:18px; color:var(--aura-amber); display:block; margin-top:4px;">${streak}d 🔥</strong>
          </div>
        </div>

        <!-- 30-Day Grid -->
        <div class="card" style="background:#11121A; border:1px solid #23253A; padding:12px; margin-bottom:16px;">
          <p style="font-size:11px; color:#8E93B8; font-weight:var(--fw-bold); text-transform:uppercase; margin-bottom:12px;">30 Day History</p>
          <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:8px; justify-items:center;">
            ${mock30Days.map((scoreVal, idx) => {
              const bg = scoreVal >= 80 ? 'rgba(167,139,250,0.3)' : scoreVal >= 65 ? 'rgba(96,165,250,0.3)' : scoreVal >= 50 ? 'rgba(251,191,36,0.3)' : 'rgba(244,63,94,0.3)';
              const borderCol = scoreVal >= 80 ? '#a78bfa' : scoreVal >= 65 ? '#60a5fa' : scoreVal >= 50 ? '#fbbf24' : '#f43f5e';
              return `
                <div style="width:36px; height:36px; border-radius:6px; background:${bg}; border:1px solid ${borderCol}; display:flex; align-items:center; justify-content:center;" title="Day ${idx + 1}: ${scoreVal}">
                  <span style="font-size:10px; font-weight:bold; color:#FFFFFF;">${scoreVal}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#FFFFFF; margin:0;">Discipline Score</h3>
        <p style="font-size:11px; color:#8E93B8; margin:2px 0 0 0;">Status: <span style="font-weight:bold; color:#FFFFFF;">${status}</span></p>
      </div>
      <div style="display:flex; background:rgba(255,255,255,0.04); padding:3px; border-radius:100px;">
        <button class="toggle-opt ${weekActive}" id="disc-toggle-week" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === 'week' ? '#FFFFFF' : '#8E93B8'}; background:${view === 'week' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">Week</button>
        <button class="toggle-opt ${monthActive}" id="disc-toggle-month" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === 'month' ? '#FFFFFF' : '#8E93B8'}; background:${view === 'month' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">Month</button>
      </div>
    </div>
    ${bodyHtml}
  `;
}

// ── Activity Sheet Controllers ──

function _openActivitySheet() {
  const overlay = document.getElementById('activity-overlay');
  const sheet = document.getElementById('activity-sheet');
  const content = document.getElementById('activity-sheet-content');
  if (!overlay || !sheet || !content) return;

  content.innerHTML = _renderActivitySheetContent(_currentActivityView);
  overlay.classList.add('open');
  sheet.classList.add('open');

  _wireActivitySheetEvents();
}

function _closeActivitySheet() {
  const overlay = document.getElementById('activity-overlay');
  const sheet = document.getElementById('activity-sheet');
  if (overlay && sheet) {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
  }
}

function _wireActivitySheetEvents() {
  document.getElementById('act-toggle-today')?.addEventListener('click', () => {
    _currentActivityView = 'today';
    const content = document.getElementById('activity-sheet-content');
    if (content) content.innerHTML = _renderActivitySheetContent('today');
    _wireActivitySheetEvents();
  });

  document.getElementById('act-toggle-week')?.addEventListener('click', () => {
    _currentActivityView = 'week';
    const content = document.getElementById('activity-sheet-content');
    if (content) content.innerHTML = _renderActivitySheetContent('week');
    _wireActivitySheetEvents();
  });

  document.getElementById('change-goal-btn')?.addEventListener('click', () => {
    _openChangeGoalModal();
  });
}

function _renderActivitySheetContent(view = 'today') {
  const state = getState();
  const activity = state.activity || {};
  const steps = activity.steps || 0;
  const goal = activity.stepGoal || 10000;
  const distance = activity.distanceKm || 0.0;
  const calories = activity.caloriesBurned || 0;
  const stairs = activity.stairsClimbed || 0;
  const pct = Math.round((steps / goal) * 100);

  const todayActive = view === 'today' ? 'active' : '';
  const weekActive = view === 'week' ? 'active' : '';

  let bodyHtml = '';

  if (view === 'today') {
    let insightText = '';
    if (pct >= 100) {
      insightText = `🏆 Goal achieved! You're at ${pct}% of your steps target.`;
    } else if (steps < 5000) {
      insightText = `🚶 A 15-minute walk will push you above 5,000 steps.`;
    } else if (goal - steps <= 2000) {
      insightText = `🎯 You're only ${(goal - steps).toLocaleString()} steps away from today's target!`;
    } else {
      insightText = `💪 Consistent movement improves recovery readiness.`;
    }

    const hourlyData = [120, 50, 0, 300, 1100, 850, 420, 200, 680, 1200, 800, 200];
    const maxVal = Math.max(...hourlyData);

    bodyHtml = `
      <div style="margin-top:16px;">
        <!-- Stats list -->
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #23253A;">
            <span style="color:#8E93B8;">Steps</span>
            <strong style="color:#FFFFFF;">${steps.toLocaleString()} / ${goal.toLocaleString()}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #23253A;">
            <span style="color:#8E93B8;">Distance</span>
            <strong style="color:#FFFFFF;">${distance} km</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #23253A;">
            <span style="color:#8E93B8;">Calories Burned</span>
            <strong style="color:#FFFFFF;">${calories} kcal</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #23253A;">
            <span style="color:#8E93B8;">Stairs Climbed</span>
            <strong style="color:#FFFFFF;">${stairs}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #23253A;">
            <span style="color:#8E93B8;">Goal Progress</span>
            <strong style="color:#00E5A8;">${pct}%</strong>
          </div>
        </div>

        <!-- Hourly Mini Chart -->
        <div class="card" style="background:#11121A; border:1px solid #23253A; padding:12px; margin-bottom:16px;">
          <p style="font-size:11px; color:#8E93B8; font-weight:var(--fw-bold); text-transform:uppercase; margin-bottom:8px;">Hourly Activity</p>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; height:60px; padding:0 4px;">
            ${hourlyData.map((val, idx) => {
              const h = maxVal > 0 ? (val / maxVal) * 100 : 0;
              return `
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end;">
                  <div style="width:8px; height:${Math.max(4, h)}%; background:#00E5A8; border-radius:2px;"></div>
                </div>
              `;
            }).join('')}
          </div>
          <div style="display:flex; justify-content:space-between; font-size:8px; color:#8E93B8; margin-top:4px; padding:0 2px;">
            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
          </div>
        </div>

        <!-- Today's Insight -->
        <div class="card" style="background:rgba(0, 229, 168, 0.05); border:1px solid rgba(0, 229, 168, 0.15); padding:12px; margin-bottom:20px; display:flex; align-items:center; gap:8px;">
          <span style="font-size:16px;">💡</span>
          <p style="font-size:12px; color:#FFFFFF; margin:0; line-height:1.4;">${insightText}</p>
        </div>

        <button class="btn btn-primary btn-full" id="change-goal-btn">Change Goal</button>
      </div>
    `;
  } else {
    // Week View
    const weeklySteps = activity.weeklySteps || [0,0,0,0,0,0,0];
    const weeklyDistance = activity.weeklyDistance || [0,0,0,0,0,0,0];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const activeDays = weeklySteps.filter(s => s > 0).length || 1;
    const totalSteps = weeklySteps.reduce((sum, s) => sum + s, 0);
    const avgSteps = Math.round(totalSteps / activeDays);

    const maxSteps = Math.max(...weeklySteps, 1);

    bodyHtml = `
      <div style="margin-top:16px;">
        <!-- Weekly average -->
        <div class="card" style="background:#11121A; border:1px solid #23253A; padding:12px; margin-bottom:16px; text-align:center;">
          <span style="font-size:10px; color:#8E93B8; text-transform:uppercase;">Weekly Average</span>
          <strong style="font-size:24px; color:#FFFFFF; display:block; margin-top:2px;">${avgSteps.toLocaleString()} <span style="font-size:12px; font-weight:normal; color:#8E93B8;">steps/day</span></strong>
        </div>

        <!-- Weekly Mini Chart -->
        <div class="card" style="background:#11121A; border:1px solid #23253A; padding:12px; margin-bottom:16px;">
          <p style="font-size:11px; color:#8E93B8; font-weight:var(--fw-bold); text-transform:uppercase; margin-bottom:8px;">Weekly Step Distribution</p>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; height:70px; padding:0 8px;">
            ${weeklySteps.map((val, idx) => {
              const h = (val / maxSteps) * 100;
              return `
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end;">
                  <span style="font-size:8px; color:#8E93B8; font-weight:bold;">${val > 0 ? (val >= 1000 ? (val/1000).toFixed(1) + 'k' : val) : '0'}</span>
                  <div style="width:14px; height:${Math.max(4, h)}%; background:${val >= goal ? '#00E5A8' : '#5B5CF6'}; border-radius:3px 3px 0 0;"></div>
                  <span style="font-size:9px; color:#8E93B8; margin-top:2px;">${days[idx]}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Daily details list -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          <p style="font-size:11px; color:#8E93B8; font-weight:var(--fw-bold); text-transform:uppercase; margin-bottom:4px;">Daily Breakdown</p>
          ${days.map((day, idx) => {
            const stepVal = weeklySteps[idx] || 0;
            const distVal = weeklyDistance[idx] || 0.0;
            return `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(255,255,255,0.02); border-radius:8px;">
                <span style="font-weight:600; color:#FFFFFF;">${day}</span>
                <div style="text-align:right;">
                  <span style="font-weight:bold; color:#FFFFFF; display:block;">${stepVal.toLocaleString()} steps</span>
                  <span style="font-size:10px; color:#8E93B8;">${distVal} km</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <h3 style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#FFFFFF; margin:0;">Activity</h3>
      <div style="display:flex; background:rgba(255,255,255,0.04); padding:3px; border-radius:100px;">
        <button class="toggle-opt ${todayActive}" id="act-toggle-today" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === 'today' ? '#FFFFFF' : '#8E93B8'}; background:${view === 'today' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">Today</button>
        <button class="toggle-opt ${weekActive}" id="act-toggle-week" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === 'week' ? '#FFFFFF' : '#8E93B8'}; background:${view === 'week' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">Week</button>
      </div>
    </div>
    ${bodyHtml}
  `;
}

function _openChangeGoalModal() {
  const currentGoal = getState().activity?.stepGoal || 10000;
  const options = [5000, 7500, 10000, 12500, 15000, 20000];
  
  const content = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <p style="font-size:12px; color:#8E93B8;">Select a daily steps target:</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        ${options.map(opt => `
          <button class="btn btn-secondary change-goal-opt ${currentGoal === opt ? 'active' : ''}" 
            data-val="${opt}" style="padding:10px; font-size:14px; background:${currentGoal === opt ? 'rgba(91,92,246,0.15)' : ''}; border-color:${currentGoal === opt ? '#5B5CF6' : ''}; color:${currentGoal === opt ? '#5B5CF6' : ''};">
            ${opt.toLocaleString()}
          </button>
        `).join('')}
      </div>
      <div style="margin-top:8px;">
        <label style="font-size:11px; color:#8E93B8; display:block; margin-bottom:4px;">Custom Goal</label>
        <input class="input" type="number" id="custom-goal-input" placeholder="Enter steps (e.g. 12000)" style="padding:10px 14px;" />
      </div>
      <button class="btn btn-primary btn-full" id="save-goal-btn" style="margin-top:8px;">Save Goal</button>
    </div>
  `;

  showModal({
    title: 'Change Step Goal',
    content: content,
    onClose: () => {}
  });

  document.querySelectorAll('.change-goal-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = Number(btn.dataset.val);
      updateActivityGoal(val);
      closeModal();
      showToast(`Daily steps goal updated to ${val.toLocaleString()} ✓`, 'success');
      
      const container = document.getElementById('page-content');
      if (container) {
        container.innerHTML = render();
        onEnter();
        _openActivitySheet();
      }
    });
  });

  document.getElementById('save-goal-btn')?.addEventListener('click', () => {
    const customInput = document.getElementById('custom-goal-input');
    const val = Number(customInput?.value?.trim());
    if (val && val >= 1000) {
      updateActivityGoal(val);
      closeModal();
      showToast(`Daily steps goal updated to ${val.toLocaleString()} ✓`, 'success');
      
      const container = document.getElementById('page-content');
      if (container) {
        container.innerHTML = render();
        onEnter();
        _openActivitySheet();
      }
    } else {
      showToast('Please enter a valid step count (min 1,000)', 'error');
    }
  });
}
