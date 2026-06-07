// ==========================================
// AURA V2 — Home Dashboard Page
// Route: /home
// ==========================================

import { getState, setState, updateState, getDisciplineScore, getReadinessLabel, getTodayDateString } from '../../state/index.js';
import { navigate } from '../../router.js';
import { showToast, showModal, closeModal } from '../../components/shared/ui.js';
import { computeReadinessScore, generateWeeklyReview, detectHabitPatterns, extractPRFeed } from '../../services/ai-engine.js';
import './home.css';

// Daily sync state
let _syncStep = 0;
let _syncAnswers = {};
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

      <!-- Readiness Banner -->
      <div class="home-readiness-banner card card-glow" id="readiness-banner" data-readiness="${rColor}">
        <div class="readiness-left">
          <div class="readiness-score-ring">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
              <circle cx="36" cy="36" r="30" fill="none" stroke="url(#readGrad)" stroke-width="6"
                stroke-linecap="round" stroke-dasharray="188.5"
                stroke-dashoffset="${188.5 - (188.5 * readiness / 100)}"
                transform="rotate(-90 36 36)"/>
              <defs>
                <linearGradient id="readGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop stop-color="#a78bfa"/><stop offset="1" stop-color="#7c3aed"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="readiness-score-label">
              <span class="readiness-num">${readiness}</span>
              <span class="readiness-unit">/ 100</span>
            </div>
          </div>
        </div>
        <div class="readiness-right">
          <span class="pill pill-${rColor === 'violet' ? 'violet' : rColor === 'mint' ? 'mint' : 'rose'}">${rLabel}</span>
          <p class="readiness-title">Readiness Score</p>
          <p class="readiness-sub">${readiness >= 75 ? 'You\'re primed to perform' : readiness >= 50 ? 'Train smart today' : 'Prioritise recovery'}</p>
          ${!todayDone ? `<button class="btn btn-sm btn-primary" id="sync-btn" style="margin-top:8px">Daily Sync ↗</button>`
            : `<span style="font-size:11px;color:var(--aura-mint-light)">✓ Synced today</span>`}
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
          <div class="stat-cell">
            <div class="stat-value gradient-text-mint">${goalLabel.split(' ')[0]}</div>
            <div class="stat-label">Goal</div>
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
}

export function onLeave() {
  _closeSyncSheet();
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
}
