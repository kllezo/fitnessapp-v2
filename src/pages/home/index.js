// ==========================================
// AURA V2 — Home Dashboard Page
// Route: /home
// ==========================================

import { getState, setState, updateState, getDisciplineScore, getReadinessLabel, getTodayDateString } from '../../state/index.js';
import { navigate } from '../../router.js';
import { showToast, showModal, closeModal, openBottomSheet, closeActiveBottomSheet } from '../../components/shared/ui.js';
import { computeReadinessScore, generateWeeklyReview, detectHabitPatterns, extractPRFeed } from '../../services/ai-engine.js';
import { getActivityData, updateActivityGoal, updateActivitySteps, getDisciplineBreakdown, getDayIndexMonSun, getDailyBurnGoal, getCalorieBurnBreakdown } from '../../services/activity-engine.js';
import './home.css';

// Daily sync state
let _syncStep = 0;
let _syncAnswers = {};
let _currentActivityView = '7d';
let _currentDisciplineView = 'week';
let _currentMovementMetric = 'steps';
let _currentBurnView = 'week';
let _currentProteinView = '7d';
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

  // Fetch actual protein tracking values
  const proteinConsumed = state.nutrition?.protein?.consumed || 0;
  const proteinTarget = state.nutrition?.protein?.target || 150;
  const proteinPct = proteinTarget > 0 ? Math.round((proteinConsumed / proteinTarget) * 100) : 0;

  // Dynamic calorie burn estimations
  const burnGoal = getDailyBurnGoal(state);
  const burnBreakdown = getCalorieBurnBreakdown(state);
  const burnPct = burnGoal > 0 ? Math.min(100, Math.round((burnBreakdown.total / burnGoal) * 100)) : 0;
  // Dynamic calorie burn estimation: remaining burn details handled in details sheet

  // Active unread messages & notification checks
  const unreadCount = state.socials?.notifications?.length || 0;
  const messagesText = unreadCount > 0 ? `${unreadCount} Unread` : 'No New Messages';

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
        </div>
      </div>

      <!-- Stats Row -->
      <div class="home-section" style="padding-bottom:10px;">
        <div class="stat-grid stat-grid-3" style="gap:8px;">
          <div class="stat-cell home-stat-compact" id="streak-stat-cell" style="cursor:pointer;">
            <div style="font-size:18px; font-weight:800; color:var(--aura-amber); font-family:var(--font-display); line-height:1;">${streak}</div>
            <div style="font-size:8px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-top:1px;">Days</div>
            <div class="stat-label" style="font-size:9px; margin-top:4px;">🔥 Streak</div>
          </div>
          <div class="stat-cell home-stat-compact" id="messages-stat-cell" style="cursor:pointer;">
            <div style="font-size:18px; line-height:1;">📥</div>
            <div style="font-size:11px; font-weight:700; color:#42D4FF; font-family:var(--font-display); margin-top:2px;">Inbox</div>
            <div style="font-size:9px; color:var(--text-muted); margin-top:2px;">${messagesText}</div>
          </div>
          <div class="stat-cell home-stat-compact" id="protein-stat-cell" style="cursor:pointer;">
            <div style="font-size:15px; font-weight:800; color:#00E5A8; font-family:var(--font-display); line-height:1;">${proteinConsumed}g</div>
            <div style="font-size:8px; color:var(--text-muted); margin-top:1px;">/ ${proteinTarget}g · ${proteinPct}%</div>
            <div class="stat-label" style="font-size:9px; margin-top:4px;">💪 Protein</div>
          </div>
        </div>
      </div>

      <!-- Daily Burn Progress Strip -->
      <div class="home-section" style="padding-bottom:14px;">
        <div id="daily-burn-progress-card" style="cursor:pointer; background:#11121A; border:1px solid #23253A; border-radius:12px; padding:10px 14px; position:relative; overflow:hidden; transition:border-color 0.2s ease;">
          <div style="position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#00E5A8,#42D4FF);"></div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:11px; font-weight:700; color:#8E93B8; text-transform:uppercase; letter-spacing:0.8px;">🔥 Daily Burn Progress</span>
            <span style="display:flex; align-items:baseline; gap:4px;">
              <span style="font-size:13px; font-weight:800; color:#FFFFFF;">${burnBreakdown.total}</span>
              <span style="font-size:10px; color:#8E93B8; font-weight:400;">/ ${burnGoal} kcal</span>
              <span style="font-size:11px; color:#00E5A8; font-weight:700;">${burnPct}%</span>
            </span>
          </div>
          <div style="width:100%; height:5px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
            <div class="burn-progress-fill" style="width:${burnPct}%; height:100%; border-radius:3px; transition:width 0.8s cubic-bezier(0.1,1,0.1,1);"></div>
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

  // Clean active sheet
  closeActiveBottomSheet(true);

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
  closeActiveBottomSheet(true);
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
  document.getElementById('notif-btn')?.addEventListener('click', () => showToast('No new notifications', 'default'));
  document.getElementById('profile-btn')?.addEventListener('click', () => navigate('/profile'));

  // Activity & Discipline Ring & Sheet Triggers
  document.getElementById('discipline-ring-wrapper')?.addEventListener('click', _openDisciplineSheet);
  document.getElementById('steps-ring-wrapper')?.addEventListener('click', _openActivitySheet);

  // New Triggers
  document.getElementById('daily-burn-progress-card')?.addEventListener('click', _openBurnSheet);
  document.getElementById('protein-stat-cell')?.addEventListener('click', _openProteinSheet);
  document.getElementById('messages-stat-cell')?.addEventListener('click', () => {
    updateState('socials', { openInboxOnEnter: true });
    navigate('/socials');
  });
}

// ── Discipline Sheet Controllers ──

function _openDisciplineSheet() {
  openBottomSheet({
    id: 'discipline',
    content: _renderDisciplineSheetContent(_currentDisciplineView)
  });
  _wireDisciplineSheetEvents();
}

function _closeDisciplineSheet() {
  closeActiveBottomSheet();
}

function _wireDisciplineSheetEvents() {
  document.getElementById('disc-toggle-7d')?.addEventListener('click', () => {
    _currentDisciplineView = '7d';
    const content = document.getElementById('discipline-sheet-content');
    if (content) content.innerHTML = _renderDisciplineSheetContent('7d');
    _wireDisciplineSheetEvents();
  });
  document.getElementById('disc-toggle-30d')?.addEventListener('click', () => {
    _currentDisciplineView = '30d';
    const content = document.getElementById('discipline-sheet-content');
    if (content) content.innerHTML = _renderDisciplineSheetContent('30d');
    _wireDisciplineSheetEvents();
  });
  document.getElementById('disc-toggle-90d')?.addEventListener('click', () => {
    _currentDisciplineView = '90d';
    const content = document.getElementById('discipline-sheet-content');
    if (content) content.innerHTML = _renderDisciplineSheetContent('90d');
    _wireDisciplineSheetEvents();
  });
}

function _renderDisciplineSheetContent(view = '7d') {
  const state = getState();
  const discipline = getDisciplineScore(state);
  const streak = state.workout?.streakDays || 0;
  
  let status = 'Needs Attention';
  let statusColor = '#fda4af';
  if (discipline >= 80) {
    status = 'Elite';
    statusColor = '#a78bfa';
  } else if (discipline >= 68) {
    status = 'Strong';
    statusColor = '#60a5fa';
  } else if (discipline >= 50) {
    status = 'Moderate';
    statusColor = '#fbbf24';
  }
  
  const breakdown = getDisciplineBreakdown(state);

  const proteinConsumed = state.nutrition?.protein?.consumed || 0;
  const proteinTarget = state.nutrition?.protein?.target || 150;
  const proteinPct = proteinTarget > 0 ? Math.round((proteinConsumed / proteinTarget) * 100) : 0;

  const sevenActive = view === '7d' ? 'active' : '';
  const thirtyActive = view === '30d' ? 'active' : '';
  const ninetyActive = view === '90d' ? 'active' : '';

  let bodyHtml = '';

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const baseTrend = [44, 47, 49, 52, 55, 54, 52];
  const dayIdx = getDayIndexMonSun();
  const diff = discipline - baseTrend[dayIdx];
  const trendScores = baseTrend.map((v, idx) => {
    if (idx <= dayIdx) return Math.min(100, Math.max(35, v + diff));
    return v;
  });

  if (view === '7d') {
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
            <span style="color:#8E93B8;">Hydration</span>
            <strong style="color:#00E5A8;">+${breakdown.hydration}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Recovery</span>
            <strong style="color:#00E5A8;">+${breakdown.recovery}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Sleep</span>
            <strong style="color:#00E5A8;">+${breakdown.sleep}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Step Goal Adherence</span>
            <strong style="color:#00E5A8;">+${breakdown.stepGoal}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Missed Workouts</span>
            <strong style="color:#fda4af;">${breakdown.missed}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:#8E93B8;">Missed Recovery</span>
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

        <!-- Score Changes / Explanations -->
        <span class="section-label" style="display:block; margin-bottom:8px;">Daily Score Changes</span>
        <div class="card" style="background:rgba(255,255,255,0.02); border:1px solid #23253A; padding:12px; margin-bottom:16px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>Mon</span><span style="color:#00E5A8;">* Workout completed</span></div>
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>Tue</span><span style="color:#00E5A8;">* Protein target hit</span></div>
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>Wed</span><span style="color:#00E5A8;">* Sleep target hit</span></div>
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>Thu</span><span style="color:#fda4af;">- Missed workout</span></div>
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>Fri</span><span style="color:#fda4af;">- Missed hydration</span></div>
        </div>

        <!-- Insights -->
        <span class="section-label" style="display:block; margin-bottom:8px;">Insights</span>
        <div class="card" style="background:rgba(91, 92, 246, 0.05); border:1px solid rgba(91, 92, 246, 0.15); padding:12px; margin-bottom:16px;">
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
  } else if (view === '30d') {
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

        <!-- Score Changes / Explanations -->
        <span class="section-label" style="display:block; margin-bottom:8px;">Recent Key Changes</span>
        <div class="card" style="background:rgba(255,255,255,0.02); border:1px solid #23253A; padding:12px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>June 10</span><span style="color:#00E5A8;">🏋️ Gym session completed (+15)</span></div>
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>June 9</span><span style="color:#00E5A8;">🥩 Protein target achieved (+10)</span></div>
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>June 8</span><span style="color:#fda4af;">🚫 Missed workout (-6)</span></div>
          <div style="display:flex; justify-content:space-between; font-size:12px;"><span>June 7</span><span style="color:#00E5A8;">😴 Sleep target achieved (+10)</span></div>
        </div>
      </div>
    `;
  } else {
    // 90d view
    const avgScore = Math.round(discipline * 0.92 + 5);
    const mockWeeks = [
      { lbl: 'Weeks 9-12', val: Math.min(100, Math.round(discipline * 1.05)), status: 'Elite' },
      { lbl: 'Weeks 5-8', val: Math.round(discipline * 0.95), status: 'Consistent' },
      { lbl: 'Weeks 1-4', val: Math.round(discipline * 0.85), status: 'Moderate' }
    ];

    bodyHtml = `
      <div style="margin-top:16px;">
        <!-- Metrics Row -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px;">
          <div class="card" style="padding:10px; text-align:center; background:#11121A; border:1px solid #23253A;">
            <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">90-day Avg Score</span>
            <strong style="font-size:18px; color:#5B5CF6; display:block; margin-top:4px;">${avgScore}</strong>
          </div>
          <div class="card" style="padding:10px; text-align:center; background:#11121A; border:1px solid #23253A;">
            <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Consistency Rating</span>
            <strong style="font-size:15px; color:#00E5A8; display:block; margin-top:4px;">Elite Stable</strong>
          </div>
        </div>

        <!-- Weekly Averages list -->
        <span class="section-label" style="display:block; margin-bottom:8px;">Weekly Averages</span>
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
          ${mockWeeks.map(w => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(255,255,255,0.02); border-radius:8px;">
              <div>
                <span style="font-weight:600; color:#FFFFFF; display:block;">${w.lbl}</span>
                <span style="font-size:10px; color:#8E93B8;">Status: ${w.status}</span>
              </div>
              <strong style="color:#5B5CF6; font-size:16px;">${w.val}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#FFFFFF; margin:0;">Discipline Score</h3>
        <p style="font-size:11px; color:#8E93B8; margin:2px 0 0 0;">Status: <span style="font-weight:bold; color:${statusColor};">${status}</span></p>
      </div>
      <div style="display:flex; background:rgba(255,255,255,0.04); padding:3px; border-radius:100px;">
        <button class="toggle-opt ${sevenActive}" id="disc-toggle-7d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '7d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '7d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">7 Days</button>
        <button class="toggle-opt ${thirtyActive}" id="disc-toggle-30d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '30d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '30d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">30 Days</button>
        <button class="toggle-opt ${ninetyActive}" id="disc-toggle-90d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '90d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '90d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">90 Days</button>
      </div>
    </div>
    ${bodyHtml}
  `;
}


// ── Activity Sheet Controllers ──

function _openActivitySheet() {
  openBottomSheet({
    id: 'activity',
    content: _renderActivitySheetContent(_currentActivityView)
  });
  _wireActivitySheetEvents();
}

function _closeActivitySheet() {
  closeActiveBottomSheet();
}

function _wireActivitySheetEvents() {
  document.getElementById('act-toggle-7d')?.addEventListener('click', () => {
    _currentActivityView = '7d';
    const content = document.getElementById('activity-sheet-content');
    if (content) content.innerHTML = _renderActivitySheetContent('7d');
    _wireActivitySheetEvents();
  });

  document.getElementById('act-toggle-30d')?.addEventListener('click', () => {
    _currentActivityView = '30d';
    const content = document.getElementById('activity-sheet-content');
    if (content) content.innerHTML = _renderActivitySheetContent('30d');
    _wireActivitySheetEvents();
  });

  document.getElementById('act-toggle-90d')?.addEventListener('click', () => {
    _currentActivityView = '90d';
    const content = document.getElementById('activity-sheet-content');
    if (content) content.innerHTML = _renderActivitySheetContent('90d');
    _wireActivitySheetEvents();
  });

  document.getElementById('act-metric-steps')?.addEventListener('click', () => {
    _currentMovementMetric = 'steps';
    const content = document.getElementById('activity-sheet-content');
    if (content) content.innerHTML = _renderActivitySheetContent(_currentActivityView);
    _wireActivitySheetEvents();
  });

  document.getElementById('act-metric-dist')?.addEventListener('click', () => {
    _currentMovementMetric = 'distance';
    const content = document.getElementById('activity-sheet-content');
    if (content) content.innerHTML = _renderActivitySheetContent(_currentActivityView);
    _wireActivitySheetEvents();
  });

  document.getElementById('act-metric-calories')?.addEventListener('click', () => {
    _currentMovementMetric = 'calories';
    const content = document.getElementById('activity-sheet-content');
    if (content) content.innerHTML = _renderActivitySheetContent(_currentActivityView);
    _wireActivitySheetEvents();
  });

  document.getElementById('change-goal-btn')?.addEventListener('click', () => {
    _openChangeGoalModal();
  });
}

function _renderActivitySheetContent(view = '7d') {
  const state = getState();
  const activity = state.activity || {};
  const steps = activity.steps || 0;
  const goal = activity.stepGoal || 10000;
  const distance = activity.distanceKm || 0.0;
  const calories = activity.caloriesBurned || 0;
  const stairs = activity.stairsClimbed || 0;
  const pct = Math.round((steps / goal) * 100);

  const sevenActive = view === '7d' ? 'active' : '';
  const thirtyActive = view === '30d' ? 'active' : '';
  const ninetyActive = view === '90d' ? 'active' : '';

  let bodyHtml = '';

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

  // Metric selector HTML
  const stepsMetricActive = _currentMovementMetric === 'steps' ? 'active' : '';
  const distMetricActive = _currentMovementMetric === 'distance' ? 'active' : '';
  const calMetricActive = _currentMovementMetric === 'calories' ? 'active' : '';

  const metricSelectorHtml = `
    <div style="display:flex; gap:6px; background:rgba(255,255,255,0.02); padding:3px; border-radius:100px; margin-bottom:14px; justify-content:center;">
      <button class="toggle-opt ${stepsMetricActive}" id="act-metric-steps" style="flex:1; border:none; background:transparent; padding:6px 12px; border-radius:100px; color:${_currentMovementMetric === 'steps' ? '#FFFFFF' : '#8E93B8'}; background:${_currentMovementMetric === 'steps' ? '#00E5A8' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">Steps</button>
      <button class="toggle-opt ${distMetricActive}" id="act-metric-dist" style="flex:1; border:none; background:transparent; padding:6px 12px; border-radius:100px; color:${_currentMovementMetric === 'distance' ? '#FFFFFF' : '#8E93B8'}; background:${_currentMovementMetric === 'distance' ? '#42D4FF' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">Distance</button>
      <button class="toggle-opt ${calMetricActive}" id="act-metric-calories" style="flex:1; border:none; background:transparent; padding:6px 12px; border-radius:100px; color:${_currentMovementMetric === 'calories' ? '#FFFFFF' : '#8E93B8'}; background:${_currentMovementMetric === 'calories' ? '#FF8A00' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">Calories</button>
    </div>
  `;

  // Draw chart based on view and metric
  let graphHtml = '';
  let highestVal = 12000;
  let averageVal = 9200;
  let targetVal = _currentMovementMetric === 'steps' ? goal : _currentMovementMetric === 'distance' ? +(goal * 0.0008).toFixed(1) : Math.round(goal * 0.05);

  let data = [];
  if (_currentMovementMetric === 'steps') {
    if (view === '7d') {
      data = [8200, 9500, 7800, 10200, 11500, steps, 8500];
    } else if (view === '30d') {
      data = [9000, 8500, 10500, 11000, 9500, 10200, 12500, 9800, 9000, steps];
    } else {
      data = [9500, 9800, 10200, 11500, 8900, 10100, 12000, 9800, 9200, steps];
    }
    highestVal = Math.max(...data);
    averageVal = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
  } else if (_currentMovementMetric === 'distance') {
    if (view === '7d') {
      data = [6.5, 7.6, 6.2, 8.1, 9.2, distance, 6.8];
    } else if (view === '30d') {
      data = [7.2, 6.8, 8.4, 8.8, 7.6, 8.1, 10.0, 7.8, 7.2, distance];
    } else {
      data = [7.6, 7.8, 8.1, 9.2, 7.1, 8.0, 9.6, 7.8, 7.3, distance];
    }
    highestVal = +Math.max(...data).toFixed(1);
    averageVal = +(data.reduce((a, b) => a + b, 0) / data.length).toFixed(1);
  } else {
    // Calories
    if (view === '7d') {
      data = [410, 475, 390, 510, 575, calories, 425];
    } else if (view === '30d') {
      data = [450, 425, 525, 550, 475, 510, 625, 490, 450, calories];
    } else {
      data = [475, 490, 510, 575, 445, 505, 600, 490, 460, calories];
    }
    highestVal = Math.max(...data);
    averageVal = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
  }

  const labels = view === '7d' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : view === '30d' ? ['W1', 'W2', 'W3', 'W4'] : ['M1', 'M2', 'M3'];
  graphHtml = _drawMovementSVG(data, labels, targetVal, _currentMovementMetric);

  const valUnit = _currentMovementMetric === 'steps' ? ' steps' : _currentMovementMetric === 'distance' ? ' km' : ' kcal';

  bodyHtml = `
    <div style="margin-top:16px;">
      <!-- Stats list -->
      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #23253A;">
          <span style="color:#8E93B8;">Today's Steps</span>
          <strong style="color:#FFFFFF;">${steps.toLocaleString()} steps</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #23253A;">
          <span style="color:#8E93B8;">Distance</span>
          <strong style="color:#FFFFFF;">${distance} km</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #23253A;">
          <span style="color:#8E93B8;">Calories Burned From Walking</span>
          <strong style="color:#FFFFFF;">${calories} kcal</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #23253A;">
          <span style="color:#8E93B8;">Stairs Climbed</span>
          <strong style="color:#FFFFFF;">${stairs}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #23253A;">
          <span style="color:#8E93B8;">Current Step Goal</span>
          <strong style="color:#00E5A8;">${goal.toLocaleString()} steps</strong>
        </div>
      </div>

      <!-- Metric Selector & Trend Graph -->
      <span class="section-label" style="display:block; margin-bottom:8px;">Movement Trends</span>
      <div class="card" style="background:#11121A; border:1px solid #23253A; padding:12px; margin-bottom:16px;">
        ${metricSelectorHtml}
        ${graphHtml}
        <div style="display:flex; justify-content:space-around; font-size:9px; color:#8E93B8; margin-top:8px; border-top:1px dashed #23253A; padding-top:8px;">
          <div>Average: <strong>${averageVal.toLocaleString()}${valUnit}</strong></div>
          <div>Highest: <strong>${highestVal.toLocaleString()}${valUnit}</strong></div>
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

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <h3 style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#FFFFFF; margin:0;">Movement Analytics</h3>
      <div style="display:flex; background:rgba(255,255,255,0.04); padding:3px; border-radius:100px;">
        <button class="toggle-opt ${sevenActive}" id="act-toggle-7d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '7d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '7d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">7d</button>
        <button class="toggle-opt ${thirtyActive}" id="act-toggle-30d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '30d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '30d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">30d</button>
        <button class="toggle-opt ${ninetyActive}" id="act-toggle-90d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '90d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '90d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">90d</button>
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

// ── Burn Sheet Controllers ──

function _openBurnSheet() {
  openBottomSheet({
    id: 'burn',
    content: _renderBurnSheetContent(_currentBurnView)
  });
  _wireBurnSheetEvents();
}

function _closeBurnSheet() {
  closeActiveBottomSheet();
}

function _wireBurnSheetEvents() {
  document.getElementById('burn-toggle-week')?.addEventListener('click', () => {
    _currentBurnView = 'week';
    const content = document.getElementById('burn-sheet-content');
    if (content) content.innerHTML = _renderBurnSheetContent('week');
    _wireBurnSheetEvents();
  });
  document.getElementById('burn-toggle-month')?.addEventListener('click', () => {
    _currentBurnView = 'month';
    const content = document.getElementById('burn-sheet-content');
    if (content) content.innerHTML = _renderBurnSheetContent('month');
    _wireBurnSheetEvents();
  });
  document.getElementById('burn-toggle-90d')?.addEventListener('click', () => {
    _currentBurnView = '90d';
    const content = document.getElementById('burn-sheet-content');
    if (content) content.innerHTML = _renderBurnSheetContent('90d');
    _wireBurnSheetEvents();
  });
  document.getElementById('edit-burn-goal-btn')?.addEventListener('click', () => {
    _openEditBurnGoalModal();
  });
}

function _renderBurnSheetContent(view = 'week') {
  const state = getState();
  const burnGoal = getDailyBurnGoal(state);
  const burnBreakdown = getCalorieBurnBreakdown(state);
  const burnPct = burnGoal > 0 ? Math.min(100, Math.round((burnBreakdown.total / burnGoal) * 100)) : 0;

  const weekActive = view === 'week' ? 'active' : '';
  const monthActive = view === 'month' ? 'active' : '';
  const ninetyActive = view === '90d' ? 'active' : '';

  const neatPct = burnBreakdown.total > 0 ? Math.round((burnBreakdown.neat / burnBreakdown.total) * 100) : 0;
  const gymPct = burnBreakdown.total > 0 ? Math.round((burnBreakdown.gym / burnBreakdown.total) * 100) : 0;
  const walkPct = burnBreakdown.total > 0 ? Math.round((burnBreakdown.walking / burnBreakdown.total) * 100) : 0;
  
  const burnRemaining = burnGoal - burnBreakdown.total;
  let remainingInsight = '';
  if (burnRemaining <= 0) {
    remainingInsight = `🏆 Target achieved! You've burned ${burnBreakdown.total} kcal today.`;
  } else {
    remainingInsight = `🎯 ${burnRemaining} kcal remaining to hit goal.`;
  }

  let graphHtml = '';
  let highestBurn = 520;
  let weeklyAvg = 410;
  let monthlyAvg = 380;

  if (view === 'week') {
    highestBurn = Math.max(burnBreakdown.total, 650);
    weeklyAvg = Math.round((350 + 420 + 290 + 510 + 600 + burnBreakdown.total) / 6);
    const data = [350, 420, 290, 510, 600, burnBreakdown.total, 380];
    graphHtml = _drawBurnSVG(data, ['M', 'T', 'W', 'T', 'F', 'S', 'S'], burnGoal);
  } else if (view === 'month') {
    highestBurn = 710;
    monthlyAvg = 430;
    const data = [380, 450, 510, 490, 610, 320, 410, 580, 650, 710, 550, 480];
    graphHtml = _drawBurnSVG(data, ['W1', 'W2', 'W3', 'W4'], burnGoal);
  } else {
    highestBurn = 820;
    monthlyAvg = 410;
    const data = [420, 390, 450, 520, 480, 510, 610, 380, 440];
    graphHtml = _drawBurnSVG(data, ['M1', 'M2', 'M3'], burnGoal);
  }

  const workoutHistory = state.workout?.history || [];
  const todayStr = getTodayDateString();
  const todayWorkouts = workoutHistory.filter(w => w.date === todayStr);
  let gymDetailsHtml = '';
  if (todayWorkouts.length > 0) {
    todayWorkouts.forEach(w => {
      const duration = w.duration || 45;
      const intensity = w.intensity || 'Moderate';
      const c = w.caloriesBurned || duration * 8;
      gymDetailsHtml += `
        <div style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#FFFFFF; font-weight:600;">🏋️ ${w.label || 'Workout Session'}</span>
            <span style="color:#00E5A8; font-weight:bold;">${c} kcal</span>
          </div>
          <span style="font-size:10px; color:#8E93B8;">${duration} mins · ${intensity} Intensity</span>
        </div>
      `;
    });
  } else {
    gymDetailsHtml = `
      <div style="font-size:11px; color:#8E93B8;">
        No active gym workouts logged today. Gym calories are calculated based on exercises, sets, reps, and duration recorded in the Train tab.
      </div>
    `;
  }

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#FFFFFF; margin:0;">Calorie Burn</h3>
        <p style="font-size:11px; color:#8E93B8; margin:2px 0 0 0;">Today's Target: <span style="font-weight:bold; color:#00E5A8;">${burnGoal} kcal</span></p>
      </div>
      <div style="display:flex; background:rgba(255,255,255,0.04); padding:3px; border-radius:100px;">
        <button class="toggle-opt ${weekActive}" id="burn-toggle-week" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === 'week' ? '#FFFFFF' : '#8E93B8'}; background:${view === 'week' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">Week</button>
        <button class="toggle-opt ${monthActive}" id="burn-toggle-month" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === 'month' ? '#FFFFFF' : '#8E93B8'}; background:${view === 'month' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">Month</button>
        <button class="toggle-opt ${ninetyActive}" id="burn-toggle-90d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '90d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '90d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">90d</button>
      </div>
    </div>

    <!-- Header Stats -->
    <div class="card" style="background:rgba(255,255,255,0.02); padding:16px; margin-bottom:16px; border-radius:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:12px; color:#8E93B8;">Today's Burn</span>
          <strong style="font-size:24px; color:#FFFFFF; display:block; margin-top:2px;">${burnBreakdown.total} <span style="font-size:14px; font-weight:normal; color:#8E93B8;">kcal</span></strong>
        </div>
        <div style="text-align:right;">
          <span style="font-size:12px; color:#8E93B8;">Progress</span>
          <strong style="font-size:20px; color:#00E5A8; display:block; margin-top:2px;">${burnPct}%</strong>
        </div>
      </div>
      <div style="width:100%; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden; margin-top:10px;">
        <div style="width:${burnPct}%; height:100%; background:#00E5A8; border-radius:4px;"></div>
      </div>
    </div>

    <!-- Calorie Breakdown -->
    <span class="section-label" style="display:block; margin-bottom:8px;">Calorie Breakdown</span>
    <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px; background:rgba(255,255,255,0.02); padding:16px; border-radius:8px;">
      <div style="padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#8E93B8; font-size:13px;">🏋️ Gym Calories</span>
          <strong style="color:#FFFFFF;">${burnBreakdown.gym} kcal</strong>
        </div>
        ${gymDetailsHtml}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.03);">
        <div>
          <span style="color:#8E93B8; font-size:13px; display:block;">👣 Walking Calories</span>
          <span style="font-size:10px; color:#8E93B8;">Based on: Steps, Distance, Pace</span>
        </div>
        <strong style="color:#FFFFFF;">${burnBreakdown.walking} kcal</strong>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.03);">
        <div>
          <span style="color:#8E93B8; font-size:13px; display:block;">🚶 Daily Activity</span>
          <span style="font-size:10px; color:#8E93B8;">Estimated NEAT</span>
        </div>
        <strong style="color:#FFFFFF;">${burnBreakdown.neat} kcal</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:4px;">
        <span style="color:#FFFFFF; font-weight:bold;">🔥 Total Burn</span>
        <strong style="color:#00E5A8; font-size:18px;">${burnBreakdown.total} kcal</strong>
      </div>
    </div>

    <!-- Trend Graph -->
    <div class="card" style="background:#11121A; border:1px solid #23253A; padding:12px; margin-bottom:16px;">
      <p style="font-size:11px; color:#8E93B8; font-weight:var(--fw-bold); text-transform:uppercase; margin-bottom:8px;">Burn Trends</p>
      ${graphHtml}
      <div style="display:flex; justify-content:space-around; font-size:9px; color:#8E93B8; margin-top:8px; border-top:1px dashed #23253A; padding-top:8px;">
        <div>Weekly Average: <strong>${weeklyAvg} kcal</strong></div>
        <div>Monthly Average: <strong>${monthlyAvg} kcal</strong></div>
        <div>Highest Burn Day: <strong>${highestBurn} kcal</strong></div>
      </div>
    </div>

    <!-- Burn Insights -->
    <span class="section-label" style="display:block; margin-bottom:8px;">Burn Insights</span>
    <div class="card" style="background:rgba(0, 229, 168, 0.05); border:1px solid rgba(0, 229, 168, 0.15); padding:12px; margin-bottom:16px;">
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; gap:8px; font-size:12px; color:#FFFFFF; line-height:1.4;">
          <span>✦</span>
          <span>${gymPct > 0 ? `🏋️ Gym workouts contributed ${gymPct}% of your burn today.` : '🏋️ Log a workout in the Train page to increase active gym burn.'}</span>
        </div>
        <div style="display:flex; gap:8px; font-size:12px; color:#FFFFFF; line-height:1.4;">
          <span>✦</span>
          <span>👣 Walking steps contributed ${walkPct}% of your burn today.</span>
        </div>
        <div style="display:flex; gap:8px; font-size:12px; color:#FFFFFF; line-height:1.4;">
          <span>✦</span>
          <span>${remainingInsight}</span>
        </div>
      </div>
    </div>

    <!-- Burn Settings -->
    <button class="btn btn-secondary btn-full" id="edit-burn-goal-btn">Edit Burn Goal</button>
  `;
}

function _openEditBurnGoalModal() {
  const state = getState();
  const currentGoal = getDailyBurnGoal(state);
  const options = [300, 400, 500, 600, 800];
  
  const content = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <p style="font-size:12px; color:#8E93B8;">Select daily burn target (active calories):</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <button class="btn btn-secondary edit-burn-opt ${!state.activity?.burnGoal ? 'active' : ''}" 
          data-val="auto" style="padding:10px; font-size:13px;">
          Auto Recommended
        </button>
        ${options.map(opt => `
          <button class="btn btn-secondary edit-burn-opt ${state.activity?.burnGoal === opt ? 'active' : ''}" 
            data-val="${opt}" style="padding:10px; font-size:13px;">
            ${opt} kcal
          </button>
        `).join('')}
      </div>
      <div style="margin-top:8px;">
        <label style="font-size:11px; color:#8E93B8; display:block; margin-bottom:4px;">Custom Goal (kcal)</label>
        <input class="input" type="number" id="custom-burn-input" placeholder="e.g. 450" style="padding:10px 14px;" />
      </div>
      <button class="btn btn-primary btn-full" id="save-burn-btn" style="margin-top:8px;">Save Goal</button>
    </div>
  `;

  showModal({
    title: 'Edit Burn Goal',
    content: content,
    onClose: () => {}
  });

  document.querySelectorAll('.edit-burn-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      if (val === 'auto') {
        const act = getState().activity || {};
        const newAct = { ...act };
        delete newAct.burnGoal;
        setState('activity', newAct);
        showToast('Set to Auto Recommended target ✓', 'success');
      } else {
        setState('activity.burnGoal', Number(val));
        showToast(`Target updated to ${val} kcal ✓`, 'success');
      }
      closeModal();
      
      const container = document.getElementById('page-content');
      if (container) {
        container.innerHTML = render();
        onEnter();
        _openBurnSheet();
      }
    });
  });

  document.getElementById('save-burn-btn')?.addEventListener('click', () => {
    const customInput = document.getElementById('custom-burn-input');
    const val = Number(customInput?.value?.trim());
    if (val && val >= 100) {
      setState('activity.burnGoal', val);
      closeModal();
      showToast(`Target updated to ${val} kcal ✓`, 'success');
      
      const container = document.getElementById('page-content');
      if (container) {
        container.innerHTML = render();
        onEnter();
        _openBurnSheet();
      }
    } else {
      showToast('Please enter a valid calorie amount (min 100)', 'error');
    }
  });
}

// ── Protein Sheet Controllers ──

function _openProteinSheet() {
  openBottomSheet({
    id: 'protein',
    content: _renderProteinSheetContent(_currentProteinView)
  });
  _wireProteinSheetEvents();
}

function _closeProteinSheet() {
  closeActiveBottomSheet();
}

function _wireProteinSheetEvents() {
  document.getElementById('prot-toggle-7d')?.addEventListener('click', () => {
    _currentProteinView = '7d';
    const content = document.getElementById('protein-sheet-content');
    if (content) content.innerHTML = _renderProteinSheetContent('7d');
    _wireProteinSheetEvents();
  });
  document.getElementById('prot-toggle-30d')?.addEventListener('click', () => {
    _currentProteinView = '30d';
    const content = document.getElementById('protein-sheet-content');
    if (content) content.innerHTML = _renderProteinSheetContent('30d');
    _wireProteinSheetEvents();
  });
  document.getElementById('prot-toggle-90d')?.addEventListener('click', () => {
    _currentProteinView = '90d';
    const content = document.getElementById('protein-sheet-content');
    if (content) content.innerHTML = _renderProteinSheetContent('90d');
    _wireProteinSheetEvents();
  });
}

function _renderProteinSheetContent(view = '7d') {
  const state = getState();
  const proteinConsumed = state.nutrition?.protein?.consumed || 0;
  const proteinTarget = state.nutrition?.protein?.target || 150;
  const proteinPct = proteinTarget > 0 ? Math.min(100, Math.round((proteinConsumed / proteinTarget) * 100)) : 0;
  const proteinRemaining = Math.max(0, proteinTarget - proteinConsumed);

  const sevenActive = view === '7d' ? 'active' : '';
  const thirtyActive = view === '30d' ? 'active' : '';
  const ninetyActive = view === '90d' ? 'active' : '';

  const onboarding = state.onboarding || {};
  const weight = onboarding.weight || 75;
  const weightUnit = onboarding.weightUnit || 'kg';
  const goal = onboarding.goal || 'maintain';
  const activityLevel = onboarding.activityLevel || 'light';
  const proteinMultiplier = goal === 'build_muscle' ? 2.0 : goal === 'lose_fat' ? 2.2 : 1.6;

  let mealsList = [
    { name: '🌅 Breakfast', val: Math.round(proteinConsumed * 0.35) || 0, details: 'Eggs, oats, or high-protein milk' },
    { name: '☀️ Lunch', val: Math.round(proteinConsumed * 0.40) || 0, details: 'Chicken breast, dal, paneer with rice' },
    { name: '🍿 Snack', val: Math.round(proteinConsumed * 0.10) || 0, details: 'Protein bar, handful of almonds' },
    { name: '🌙 Dinner', val: Math.round(proteinConsumed * 0.15) || 0, details: 'Fish, soy chunks, or greek yogurt' }
  ];

  let graphHtml = '';
  let highestProt = 160;
  let weeklyAvg = 120;

  if (view === '7d') {
    highestProt = Math.max(proteinConsumed, 140);
    weeklyAvg = Math.round((110 + 130 + 95 + 120 + 135 + proteinConsumed) / 6);
    const data = [110, 130, 95, 120, 135, proteinConsumed, 115];
    graphHtml = _drawProteinSVG(data, ['M', 'T', 'W', 'T', 'F', 'S', 'S'], proteinTarget);
  } else if (view === '30d') {
    highestProt = 155;
    weeklyAvg = 125;
    const data = [115, 120, 130, 110, 125, 135, 140, 118, 120, 130];
    graphHtml = _drawProteinSVG(data, ['W1', 'W2', 'W3', 'W4'], proteinTarget);
  } else {
    highestProt = 165;
    weeklyAvg = 118;
    const data = [120, 115, 130, 125, 110, 120, 135, 122, 118];
    graphHtml = _drawProteinSVG(data, ['M1', 'M2', 'M3'], proteinTarget);
  }

  const remainingText = proteinRemaining > 0 
    ? `💪 ${proteinRemaining}g remaining to meet today's target.` 
    : '🏆 Daily protein target achieved!';
  const breakfastContribution = proteinConsumed > 0 ? Math.round((mealsList[0].val / proteinConsumed) * 100) : 0;
  
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#FFFFFF; margin:0;">Protein Analytics</h3>
        <p style="font-size:11px; color:#8E93B8; margin:2px 0 0 0;">Daily Goal: <span style="font-weight:bold; color:#00E5A8;">${proteinTarget}g</span></p>
      </div>
      <div style="display:flex; background:rgba(255,255,255,0.04); padding:3px; border-radius:100px;">
        <button class="toggle-opt ${sevenActive}" id="prot-toggle-7d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '7d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '7d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">7d</button>
        <button class="toggle-opt ${thirtyActive}" id="prot-toggle-30d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '30d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '30d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">30d</button>
        <button class="toggle-opt ${ninetyActive}" id="prot-toggle-90d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '90d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '90d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">90d</button>
      </div>
    </div>

    <!-- Header Stats -->
    <div class="card" style="background:rgba(255,255,255,0.02); padding:16px; margin-bottom:16px; border-radius:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:12px; color:#8E93B8;">Today's Protein</span>
          <strong style="font-size:24px; color:#FFFFFF; display:block; margin-top:2px;">${proteinConsumed} <span style="font-size:14px; font-weight:normal; color:#8E93B8;">g</span></strong>
        </div>
        <div style="text-align:right;">
          <span style="font-size:12px; color:#8E93B8;">Goal Adherence</span>
          <strong style="font-size:20px; color:#00E5A8; display:block; margin-top:2px;">${proteinPct}%</strong>
        </div>
      </div>
      <div style="width:100%; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden; margin-top:10px;">
        <div style="width:${proteinPct}%; height:100%; background:#00E5A8; border-radius:4px;"></div>
      </div>
    </div>

    <!-- Target Breakdown -->
    <span class="section-label" style="display:block; margin-bottom:8px;">Target Breakdown</span>
    <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; margin-bottom:16px;">
      <div class="card" style="padding:10px; background:#11121A; border:1px solid #23253A;">
        <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Weight</span>
        <strong style="font-size:14px; color:#FFFFFF; display:block; margin-top:2px;">${weight} ${weightUnit}</strong>
      </div>
      <div class="card" style="padding:10px; background:#11121A; border:1px solid #23253A;">
        <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Goal</span>
        <strong style="font-size:14px; color:#FFFFFF; display:block; margin-top:2px; text-transform:capitalize;">${goal.replace('_', ' ')}</strong>
      </div>
      <div class="card" style="padding:10px; background:#11121A; border:1px solid #23253A;">
        <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Activity Level</span>
        <strong style="font-size:14px; color:#FFFFFF; display:block; margin-top:2px; text-transform:capitalize;">${activityLevel.replace('_', ' ')}</strong>
      </div>
      <div class="card" style="padding:10px; background:#11121A; border:1px solid #23253A;">
        <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Experience</span>
        <strong style="font-size:14px; color:#FFFFFF; display:block; margin-top:2px; text-transform:capitalize;">${onboarding.experience || 'Intermediate'}</strong>
      </div>
      <div class="card" style="padding:10px; background:#11121A; border:1px solid #23253A;">
        <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Body Fat %</span>
        <strong style="font-size:14px; color:#FFFFFF; display:block; margin-top:2px;">${onboarding.bodyFatPct || 18}%</strong>
      </div>
      <div class="card" style="padding:10px; background:#11121A; border:1px solid #23253A;">
        <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Protein Multiplier</span>
        <strong style="font-size:14px; color:#FFFFFF; display:block; margin-top:2px;">${proteinMultiplier} g/kg</strong>
      </div>
      <div class="card" style="padding:10px; background:#11121A; border:1px solid #23253A; grid-column: span 2;">
        <span style="font-size:9px; color:#8E93B8; display:block; text-transform:uppercase;">Target Protein</span>
        <strong style="font-size:14px; color:#00E5A8; display:block; margin-top:2px;">${proteinTarget} g</strong>
      </div>
    </div>

    <!-- Protein Sources -->
    <span class="section-label" style="display:block; margin-bottom:8px;">Protein Sources</span>
    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
      ${mealsList.map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:rgba(255,255,255,0.02); border-radius:8px;">
          <div>
            <span style="font-weight:600; color:#FFFFFF; display:block; font-size:13px;">${m.name}</span>
            <span style="font-size:10px; color:#8E93B8;">${m.details}</span>
          </div>
          <strong style="color:#00E5A8; font-size:14px;">${m.val}g</strong>
        </div>
      `).join('')}
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:rgba(255,255,255,0.02); border-radius:8px; border-top:1px dashed #23253A;">
        <span style="font-weight:bold; color:#FFFFFF; font-size:13px;">Total</span>
        <strong style="color:#00E5A8; font-size:14px;">${proteinConsumed}g</strong>
      </div>
    </div>

    <!-- Trend Graph -->
    <div class="card" style="background:#11121A; border:1px solid #23253A; padding:12px; margin-bottom:16px;">
      <p style="font-size:11px; color:#8E93B8; font-weight:var(--fw-bold); text-transform:uppercase; margin-bottom:8px;">Protein Intake Trends</p>
      ${graphHtml}
      <div style="display:flex; justify-content:space-around; font-size:9px; color:#8E93B8; margin-top:8px; border-top:1px dashed #23253A; padding-top:8px;">
        <div>Protein Goal: <strong>${proteinTarget}g</strong></div>
        <div>Protein Intake: <strong>${weeklyAvg}g</strong></div>
        <div>Adherence: <strong>${Math.round((weeklyAvg / proteinTarget) * 100)}%</strong></div>
      </div>
    </div>

    <!-- Protein Insights -->
    <span class="section-label" style="display:block; margin-bottom:8px;">Protein Insights</span>
    <div class="card" style="background:rgba(91, 92, 246, 0.05); border:1px solid rgba(91, 92, 246, 0.15); padding:12px; margin-bottom:16px;">
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; gap:8px; font-size:12px; color:#FFFFFF; line-height:1.4;">
          <span>✦</span>
          <span>${remainingText}</span>
        </div>
        ${breakfastContribution > 0 ? `
          <div style="display:flex; gap:8px; font-size:12px; color:#FFFFFF; line-height:1.4;">
            <span>✦</span>
            <span>🥚 Breakfast contributed ${breakfastContribution}% of your protein intake today.</span>
          </div>
        ` : ''}
        <div style="display:flex; gap:8px; font-size:12px; color:#FFFFFF; line-height:1.4;">
          <span>✦</span>
          <span>🎯 Hit your lunch and dinner protein targets to stay on pace.</span>
        </div>
      </div>
    </div>
  `;
}

// ── Graph Render Helpers ──

function _drawMovementSVG(data, labels, targetLineVal, metric) {
  const maxVal = Math.max(...data, targetLineVal || 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;
  const width = 280;
  const height = 80;
  const padding = 15;

  const points = data.map((val, i) => {
    const x = padding + (i * (width - 2 * padding) / (data.length - 1 || 1));
    const y = height - padding - ((val - minVal) * (height - 2 * padding) / range);
    return `${x},${y}`;
  }).join(' ');

  let strokeColor = '#00E5A8'; // steps (mint)
  if (metric === 'distance') strokeColor = '#42D4FF'; // distance (blue)
  else if (metric === 'calories') strokeColor = '#FF8A00'; // calories (orange)

  const pointsHtml = data.map((val, i) => {
    const x = padding + (i * (width - 2 * padding) / (data.length - 1 || 1));
    const y = height - padding - ((val - minVal) * (height - 2 * padding) / range);
    return `<circle cx="${x}" cy="${y}" r="3.5" fill="${strokeColor}" />`;
  }).join('');

  const targetY = height - padding - ((targetLineVal - minVal) * (height - 2 * padding) / range);
  const targetLineHtml = targetLineVal > 0 ? `
    <line x1="${padding}" y1="${targetY}" x2="${width - padding}" y2="${targetY}" stroke="${strokeColor}" stroke-dasharray="3,3" stroke-width="1" opacity="0.4" />
    <text x="${width - padding}" y="${targetY - 2}" font-size="6.5" fill="${strokeColor}" text-anchor="end">Goal: ${targetLineVal}</text>
  ` : '';

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:80px; overflow:visible;">
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.02)" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.06)" />
      
      ${targetLineHtml}
      <polyline fill="none" stroke="${strokeColor}" stroke-width="2" points="${points}" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
      ${pointsHtml}
      
      ${labels.map((lbl, i) => {
        const x = padding + (i * (width - 2 * padding) / (labels.length - 1 || 1));
        return `<text x="${x}" y="${height - 2}" font-size="7.5" fill="#8E93B8" text-anchor="middle">${lbl}</text>`;
      }).join('')}
    </svg>
  `;
}

function _drawBurnSVG(data, labels, targetLineVal) {
  const maxVal = Math.max(...data, targetLineVal || 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;
  const width = 280;
  const height = 80;
  const padding = 15;

  const points = data.map((val, i) => {
    const x = padding + (i * (width - 2 * padding) / (data.length - 1 || 1));
    const y = height - padding - ((val - minVal) * (height - 2 * padding) / range);
    return `${x},${y}`;
  }).join(' ');

  const pointsHtml = data.map((val, i) => {
    const x = padding + (i * (width - 2 * padding) / (data.length - 1 || 1));
    const y = height - padding - ((val - minVal) * (height - 2 * padding) / range);
    return `<circle cx="${x}" cy="${y}" r="3.5" fill="#00E5A8" />`;
  }).join('');

  const targetY = height - padding - ((targetLineVal - minVal) * (height - 2 * padding) / range);
  const targetLineHtml = targetLineVal > 0 ? `
    <line x1="${padding}" y1="${targetY}" x2="${width - padding}" y2="${targetY}" stroke="rgba(0, 229, 168, 0.4)" stroke-dasharray="3,3" stroke-width="1" />
    <text x="${width - padding}" y="${targetY - 2}" font-size="6.5" fill="#00E5A8" text-anchor="end">Goal: ${targetLineVal}</text>
  ` : '';

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:80px; overflow:visible;">
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.02)" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.06)" />
      
      ${targetLineHtml}
      <polyline fill="none" stroke="rgba(0, 229, 168, 0.7)" stroke-width="2" points="${points}" stroke-linecap="round" stroke-linejoin="round" />
      ${pointsHtml}
      
      ${labels.map((lbl, i) => {
        const x = padding + (i * (width - 2 * padding) / (labels.length - 1 || 1));
        return `<text x="${x}" y="${height - 2}" font-size="7.5" fill="#8E93B8" text-anchor="middle">${lbl}</text>`;
      }).join('')}
    </svg>
  `;
}

function _drawProteinSVG(data, labels, targetLineVal) {
  const maxVal = Math.max(...data, targetLineVal || 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;
  const width = 280;
  const height = 80;
  const padding = 15;

  const points = data.map((val, i) => {
    const x = padding + (i * (width - 2 * padding) / (data.length - 1 || 1));
    const y = height - padding - ((val - minVal) * (height - 2 * padding) / range);
    return `${x},${y}`;
  }).join(' ');

  const pointsHtml = data.map((val, i) => {
    const x = padding + (i * (width - 2 * padding) / (data.length - 1 || 1));
    const y = height - padding - ((val - minVal) * (height - 2 * padding) / range);
    return `<circle cx="${x}" cy="${y}" r="3.5" fill="#5B5CF6" />`;
  }).join('');

  const targetY = height - padding - ((targetLineVal - minVal) * (height - 2 * padding) / range);
  const targetLineHtml = targetLineVal > 0 ? `
    <line x1="${padding}" y1="${targetY}" x2="${width - padding}" y2="${targetY}" stroke="rgba(91, 92, 246, 0.4)" stroke-dasharray="3,3" stroke-width="1" />
    <text x="${width - padding}" y="${targetY - 2}" font-size="6.5" fill="#5B5CF6" text-anchor="end">Goal: ${targetLineVal}g</text>
  ` : '';

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:80px; overflow:visible;">
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.02)" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.06)" />
      
      ${targetLineHtml}
      <polyline fill="none" stroke="rgba(91, 92, 246, 0.7)" stroke-width="2" points="${points}" stroke-linecap="round" stroke-linejoin="round" />
      ${pointsHtml}
      
      ${labels.map((lbl, i) => {
        const x = padding + (i * (width - 2 * padding) / (labels.length - 1 || 1));
        return `<text x="${x}" y="${height - 2}" font-size="7.5" fill="#8E93B8" text-anchor="middle">${lbl}</text>`;
      }).join('')}
    </svg>
  `;
}
