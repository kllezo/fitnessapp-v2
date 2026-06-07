// ==========================================
// AURA V2 — Recovery Page
// Route: /recovery
// ==========================================

import { getState, setState, updateState } from '../../state/index.js';
import { showToast, showModal, closeModal, updateModalBody } from '../../components/shared/ui.js';
import { calculateRecoveryScore, calculateRecoveryStreak, calculateSleepDebt, getReadinessTrend } from '../../services/ai-engine.js';
import './recovery.css';

// Audio Context State
let _noiseCtx = null;
let _noiseSource = null;
let _noiseGain = null;
let _noiseTimerInterval = null;
let _noiseDuration = 600; // 10 minutes total
let _noiseSeconds = 0;

// Box Breathing State
let _breatheInterval = null;
let _breathePhase = 0; // 0=inhale 1=hold 2=exhale 3=hold

// Walk Reset State
let _walkInterval = null;
let _walkActive = false;
let _walkSeconds = 0;
let _walkSteps = 0;
let _walkGoal = 1000;

// Mindfulness State
let _mindInterval = null;
let _mindActive = false;
let _mindDuration = 120; // 2 minutes default
let _mindSecondsLeft = 120;
let _mindPromptIndex = 0;

const MIND_GUIDED_PROMPTS = [
  "Inhale slowly. Feel the cool air filling your lungs...",
  "Exhale gently. Let your shoulders drop and relax...",
  "Inhale deeply. Notice the feeling of being present...",
  "Exhale slowly. Let go of any physical tightness...",
  "Inhale calmness. Observe the rise of your chest...",
  "Exhale completely. Release the busy thoughts...",
  "Inhale energy. Feel the breath nourish your body...",
  "Exhale tension. Relax your face, jaw, and eyes..."
];

export function render() {
  const state = getState();
  const { score, label, color } = calculateRecoveryScore(state);
  const recStreak = calculateRecoveryStreak(state);
  const sleepDebt = calculateSleepDebt(state);
  const trend = getReadinessTrend(state);
  const answers = state.checkIn?.answers || {};

  const indicators = [
    { key: 'sleep', label: 'Sleep Quality', val: answers.sleep || 0, icon: '😴' },
    { key: 'energy', label: 'Energy Level', val: answers.energy || 0, icon: '⚡' },
    { key: 'soreness', label: 'Muscle Soreness', val: 6 - (answers.soreness || 3), icon: '💊' },
    { key: 'stress', label: 'Stress Index', val: 6 - (answers.stress || 3), icon: '🧠' },
    { key: 'motivation', label: 'Motivation', val: answers.motivation || 0, icon: '🎯' },
  ];

  // Advanced bio-metrics calculations
  const waterConsumed = state.nutrition?.water?.consumed || 0;
  const waterTarget = state.nutrition?.water?.target || 3;

  const checkIns = state.checkIn?.history || [];
  const last5Stress = checkIns.slice(-5).map(c => c.answers?.stress || 3);
  let stressTrendLabel = 'Stable ⚖️';
  if (last5Stress.length >= 2) {
    const diff = last5Stress[last5Stress.length - 1] - last5Stress[0];
    if (diff > 0.5) stressTrendLabel = 'Rising 📈';
    else if (diff < -0.5) stressTrendLabel = 'Declining 📉';
  }

  const energyVal = answers.energy || 3;
  const motivVal = answers.motivation || 3;
  const moodScore = (energyVal + motivVal) / 2;
  const moodLabel = moodScore >= 4 ? 'Great 😊' : moodScore >= 2.5 ? 'Good 😐' : 'Low 😴';

  const stressVal = answers.stress || 3;
  const mentalLoadLabel = stressVal >= 4 ? 'High 🧠' : stressVal >= 2.5 ? 'Moderate ⚡' : 'Low 🍃';

  const isPlaying = _noiseSource !== null;
  const playIcon = isPlaying ? '❚❚' : '▶';
  const timeElapsed = _getTimerText(_noiseSeconds);
  const timeRemaining = _getTimerText(Math.max(0, _noiseDuration - _noiseSeconds));
  const volumeVal = _noiseGain ? _noiseGain.gain.value : 0.4;
  const progressPct = Math.min(100, (_noiseSeconds / _noiseDuration) * 100);

  return `
    <div class="recovery-page">
      <div class="page-header">
        <h1 class="page-title">Recovery</h1>
        <span class="pill pill-${color === 'mint' ? 'mint' : color === 'rose' ? 'rose' : 'violet'}">${label}</span>
      </div>

      <!-- Recovery Score -->
      <div class="rec-section">
        <div class="rec-score-card card card-glow" id="rec-score-card-btn" style="cursor: pointer;">
          <div class="rec-score-row">
            <div class="rec-score-ring">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
                <circle cx="40" cy="40" r="34" fill="none" stroke="${color === 'mint' ? '#10b981' : color === 'rose' ? '#f43f5e' : '#a78bfa'}" stroke-width="6"
                  stroke-linecap="round" stroke-dasharray="213.6"
                  stroke-dashoffset="${213.6 - 213.6 * score / 100}"
                  transform="rotate(-90 40 40)"/>
              </svg>
              <div class="rec-score-center">
                <span class="rec-score-num">${score}</span>
              </div>
            </div>
            <div class="rec-score-stats">
              <div class="rec-stat">
                <span class="rec-stat-val">${recStreak}</span>
                <span class="rec-stat-label">Rec. Streak</span>
              </div>
              <div class="rec-stat">
                <span class="rec-stat-val ${sleepDebt.status === 'Critical' ? 'text-rose' : ''}">${sleepDebt.hours}h</span>
                <span class="rec-stat-label">Sleep Debt</span>
              </div>
              <div class="rec-stat">
                <span class="rec-stat-val pill-${sleepDebt.status === 'Low' ? 'mint' : sleepDebt.status === 'Moderate' ? 'amber' : 'rose'}">${sleepDebt.status}</span>
                <span class="rec-stat-label">Status</span>
              </div>
            </div>
          </div>

          <!-- 7-day sparkline -->
          <div class="rec-sparkline">
            ${trend.map(d => `
              <div class="spark-col">
                <div class="spark-bar-wrap">
                  <div class="spark-bar ${d.isToday ? 'today' : ''}"
                    style="height:${d.value ? Math.max(4, d.value * 0.36) : 4}px;
                    background:${d.value >= 75 ? '#10b981' : d.value >= 50 ? '#a78bfa' : d.value > 0 ? '#f43f5e' : 'rgba(255,255,255,0.08)'}"></div>
                </div>
                <span class="spark-label ${d.isToday ? 'today' : ''}">${d.day}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>


      <!-- Quick Actions / Recovery Tools (Moved ABOVE Diagnostics) -->
      <div class="rec-section">
        <div class="section-label">Recovery Tools</div>
        <div class="rec-tools-grid">
          <button class="rec-tool-btn" id="breathe-btn">
            <span class="rec-tool-icon">🫁</span>
            <span class="rec-tool-label">Box Breathing</span>
            <span class="rec-tool-sub">4-4-4-4</span>
          </button>
          <button class="rec-tool-btn" id="walk-btn">
            <span class="rec-tool-icon">🚶</span>
            <span class="rec-tool-label">Walk Reset</span>
            <span class="rec-tool-sub">Stopwatch</span>
          </button>
          <button class="rec-tool-btn" id="mind-btn">
            <span class="rec-tool-icon">🧘</span>
            <span class="rec-tool-label">Mindfulness</span>
            <span class="rec-tool-sub">Guided</span>
          </button>
        </div>
      </div>

      <!-- Spotify-style Brown Noise Player (Full-Width card rework) -->
      <div class="rec-section">
        <div class="section-label">Rest Audio</div>
        <div class="spotify-player card card-glow" style="display:flex; flex-direction:column; padding:16px; gap:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:36px; animation: pulse 2s infinite;">🌊</span>
              <div>
                <p style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0;">Deep Space Brown Noise</p>
                <p style="font-size:11px; color:var(--text-muted); margin:2px 0 0 0;">AURA Calming Resonance Block</p>
              </div>
            </div>
            <button class="player-play-btn ${isPlaying ? 'playing' : ''}" id="noise-play-btn" style="width:40px; height:40px; border-radius:50%; background:var(--aura-violet); border:none; color:#fff; font-size:16px; display:flex; align-items:center; justify-content:center; cursor:pointer;">${playIcon}</button>
          </div>
          
          <!-- Progress Slider (Remaining vs Elapsed) -->
          <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
            <div class="player-progress-bar-bg" style="height:4px; background:var(--border-subtle); border-radius:2px; position:relative; overflow:hidden; cursor:pointer;" id="audio-progress-bar">
              <div class="player-progress-fill" id="audio-progress-fill" style="width:${progressPct}%; height:100%; background:var(--aura-violet-light); transition: width 0.3s ease;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted);">
              <span id="audio-elapsed">${timeElapsed}</span>
              <span id="audio-remaining">-${timeRemaining}</span>
            </div>
          </div>

          <!-- Volume Control -->
          <div style="display:flex; align-items:center; gap:10px; justify-content:flex-end;">
            <span style="font-size:12px; color:var(--text-muted);">🔊</span>
            <input type="range" class="volume-slider" id="noise-volume" min="0" max="1" step="0.05" value="${volumeVal}" aria-label="Volume" style="width:100px; accent-color:var(--aura-violet-light);">
          </div>
        </div>
      </div>

      <!-- Advanced Diagnostics -->
      <div class="rec-section">
        <div class="section-label">Advanced Diagnostics</div>
        <div class="rec-diagnostics-grid">
          <div class="diag-card card">
            <div class="diag-header">
              <span class="diag-icon">🎯</span>
              <span class="diag-title">Recovery Rate</span>
            </div>
            <span class="diag-value">${score}%</span>
            <span class="diag-sub text-violet font-semibold">${label}</span>
          </div>
          <div class="diag-card card">
            <div class="diag-header">
              <span class="diag-icon">🔥</span>
              <span class="diag-title">Streak</span>
            </div>
            <span class="diag-value">${recStreak} d</span>
            <span class="diag-sub">Consistency</span>
          </div>
          <div class="diag-card card">
            <div class="diag-header">
              <span class="diag-icon">🛌</span>
              <span class="diag-title">Sleep Debt</span>
            </div>
            <span class="diag-value">${sleepDebt.hours}h</span>
            <span class="diag-sub pill-${sleepDebt.status === 'Low' ? 'mint' : sleepDebt.status === 'Moderate' ? 'amber' : 'rose'}">${sleepDebt.status}</span>
          </div>
          <div class="diag-card card">
            <div class="diag-header">
              <span class="diag-icon">💧</span>
              <span class="diag-title">Hydration</span>
            </div>
            <span class="diag-value">${waterConsumed.toFixed(1)}L</span>
            <span class="diag-sub">Goal: ${waterTarget}L</span>
          </div>
          <div class="diag-card card">
            <div class="diag-header">
              <span class="diag-icon">🧠</span>
              <span class="diag-title">Stress Trend</span>
            </div>
            <span class="diag-value">${stressTrendLabel}</span>
            <span class="diag-sub">Bi-weekly review</span>
          </div>
          <div class="diag-card card">
            <div class="diag-header">
              <span class="diag-icon">🎭</span>
              <span class="diag-title">Mood Check</span>
            </div>
            <span class="diag-value">${moodLabel}</span>
            <span class="diag-sub">Energy/Motivation</span>
          </div>
          <div class="diag-card card">
            <div class="diag-header">
              <span class="diag-icon">☁️</span>
              <span class="diag-title">Mental Load</span>
            </div>
            <span class="diag-value">${mentalLoadLabel}</span>
            <span class="diag-sub">Cognitive strain</span>
          </div>
        </div>
      </div>

      <!-- Recovery Tips -->
      <div class="rec-section">
        <div class="section-label">Recovery Insights</div>
        <div class="card" style="background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(8,145,178,0.04))">
          <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.7;margin:0;">
            ${_getRecoveryInsight(score, sleepDebt, answers)}
          </p>
        </div>
      </div>
    </div>
  `;
}

function _getTimerText(totalSecs) {
  const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const secs = (totalSecs % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function _getRecoveryInsight(score, sleepDebt, answers) {
  if (score >= 80) return '✦ <strong>Excellent recovery.</strong> Your body is primed. This is the optimal window for a high-intensity session or progressive overload attempt.';
  if (sleepDebt.hours > 6) return '⚠️ <strong>Significant sleep debt detected.</strong> Prioritise 8–9h sleep tonight. Consider a deload session rather than peak training.';
  if ((answers.stress || 3) >= 4) return '🧠 <strong>Elevated stress detected.</strong> Box breathing and 10-min walk significantly reduce cortisol. Avoid caffeine after 2pm.';
  if ((answers.soreness || 3) >= 4) return '💊 <strong>High soreness.</strong> Active recovery recommended — light movement, stretching, and increased protein intake will accelerate repair.';
  return '📊 <strong>Stable recovery.</strong> Maintain your hydration, sleep consistency and stress management. Your trend is moving in the right direction.';
}

function _openDetailedRecoveryModal() {
  const state = getState();
  const answers = state.checkIn?.answers || {};
  const sleepHoursVal = answers.sleep ? ['< 2 Hours', '2–4 Hours', '4–6 Hours', '6–8 Hours', '8+ Hours'][answers.sleep - 1] || 'Not Synced' : 'Not Synced';
  
  const energyMap = ['🪫 Empty', '😮‍💨 Low', '😐 OK', '💪 Good', '⚡ High'];
  const sorenessMap = ['😣 Severe', '😟 High', '😐 Moderate', '😊 Mild', '😁 None'];
  const stressMap = ['😰 High', '😟 Elevated', '😐 OK', '😌 Low', '😎 Calm'];
  const motivationMap = ['😫 None', '😪 Low', '😐 OK', '😊 Good', '🔥 Fired up'];

  const energyText = answers.energy ? energyMap[answers.energy - 1] : 'Not Synced';
  const sorenessText = answers.soreness ? sorenessMap[answers.soreness - 1] : 'Not Synced';
  const stressText = answers.stress ? stressMap[answers.stress - 1] : 'Not Synced';
  const motivationText = answers.motivation ? motivationMap[answers.motivation - 1] : 'Not Synced';

  const waterConsumed = state.nutrition?.water?.consumed || 0;
  const waterTarget = state.nutrition?.water?.target || 3;

  const trend = getReadinessTrend(state);

  const content = `
    <div class="detailed-recovery-modal" style="display:flex; flex-direction:column; gap:var(--space-md); padding:var(--space-xs) 0;">
      <p style="font-size:var(--text-xs); color:var(--text-muted); margin-bottom:var(--space-xs);">Today's detailed check-in responses & trend analysis</p>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-sm);">
        <div class="card" style="padding:var(--space-md);">
          <span style="font-size:10px; color:var(--text-muted); display:block;">Sleep Duration</span>
          <strong style="font-size:var(--text-base); color:var(--text-primary); display:block; margin-top:4px;">😴 ${sleepHoursVal}</strong>
        </div>
        <div class="card" style="padding:var(--space-md);">
          <span style="font-size:10px; color:var(--text-muted); display:block;">Energy Level</span>
          <strong style="font-size:var(--text-base); color:var(--text-primary); display:block; margin-top:4px;">${energyText}</strong>
        </div>
        <div class="card" style="padding:var(--space-md);">
          <span style="font-size:10px; color:var(--text-muted); display:block;">Stress Level</span>
          <strong style="font-size:var(--text-base); color:var(--text-primary); display:block; margin-top:4px;">${stressText}</strong>
        </div>
        <div class="card" style="padding:var(--space-md);">
          <span style="font-size:10px; color:var(--text-muted); display:block;">Motivation</span>
          <strong style="font-size:var(--text-base); color:var(--text-primary); display:block; margin-top:4px;">${motivationText}</strong>
        </div>
        <div class="card" style="padding:var(--space-md);">
          <span style="font-size:10px; color:var(--text-muted); display:block;">Hydration</span>
          <strong style="font-size:var(--text-base); color:var(--text-primary); display:block; margin-top:4px;">💧 ${waterConsumed.toFixed(1)}L / ${waterTarget}L</strong>
        </div>
        <div class="card" style="padding:var(--space-md);">
          <span style="font-size:10px; color:var(--text-muted); display:block;">Muscle Soreness</span>
          <strong style="font-size:var(--text-base); color:var(--text-primary); display:block; margin-top:4px;">${sorenessText}</strong>
        </div>
      </div>

      <div class="card" style="padding:var(--space-md); margin-top:var(--space-xs);">
        <span style="font-size:10px; color:var(--text-muted); display:block; margin-bottom:var(--space-sm);">7-Day Readiness Trend</span>
        
        <!-- SVG Trend Chart -->
        <div style="height:100px; display:flex; align-items:flex-end; gap:var(--space-md); padding-top:var(--space-sm);">
          ${trend.map(d => {
            const h = d.value ? Math.max(8, d.value) : 8; // 8% min height to make clickable/visible
            return `
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:var(--space-xs);">
                <div style="position:relative; width:100%; height:80px; display:flex; align-items:flex-end; justify-content:center;">
                  <div style="position:absolute; top:-16px; font-size:9px; color:var(--text-muted); font-weight:var(--fw-medium);">${d.value || '—'}</div>
                  <div style="width:16px; height:${h}%; background:${d.value >= 75 ? 'var(--aura-mint)' : d.value >= 50 ? 'var(--aura-violet)' : d.value > 0 ? 'var(--aura-rose)' : 'rgba(255,255,255,0.06)'}; border-radius:4px 4px 0 0; transition: height 0.5s ease-out;"></div>
                </div>
                <span style="font-size:10px; color:${d.isToday ? 'var(--aura-violet-light)' : 'var(--text-muted)'}; font-weight:${d.isToday ? 'var(--fw-bold)' : 'var(--fw-regular)'};">${d.day}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <button class="btn btn-primary btn-full" id="close-detailed-rec-btn" style="margin-top:var(--space-sm);">Close Details</button>
    </div>
  `;

  showModal({
    title: 'Detailed Recovery Diagnostics',
    content: content,
    onClose: () => {}
  });

  document.getElementById('close-detailed-rec-btn')?.addEventListener('click', closeModal);
}

export function onEnter() {
  _wireEvents();
}

export function onLeave() {
  _stopBreathe();
  _stopNoise();
  _stopWalk();
  _stopMindfulness();
}

function _wireEvents() {
  document.getElementById('breathe-btn')?.addEventListener('click', _openBreathe);
  document.getElementById('walk-btn')?.addEventListener('click', _openWalkReset);
  document.getElementById('mind-btn')?.addEventListener('click', _openMindfulness);
  document.getElementById('rec-score-card-btn')?.addEventListener('click', _openDetailedRecoveryModal);
  
  // Brown Noise triggers
  const playBtn = document.getElementById('noise-play-btn');
  playBtn?.addEventListener('click', _toggleNoise);
  
  document.getElementById('noise-volume')?.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    if (_noiseGain && _noiseCtx) {
      _noiseGain.gain.setValueAtTime(vol, _noiseCtx.currentTime);
    }
  });
}

// ── Box Breathing (4-4-4-4) ──
const PHASES = [
  { label: 'Inhale', secs: 4, color: '#a78bfa' },
  { label: 'Hold', secs: 4, color: '#fcd34d' },
  { label: 'Exhale', secs: 4, color: '#6ee7b7' },
  { label: 'Hold', secs: 4, color: '#fcd34d' },
];

function _openBreathe() {
  _breathePhase = 0;
  showModal({
    title: 'Box Breathing',
    content: _getBreatheContentHtml(),
    className: 'breathe-modal',
    onClose: () => {
      _stopBreathe();
    }
  });
  _wireBreatheModalEvents();
  _startBreathe();
}

function _getBreatheContentHtml() {
  const ph = PHASES[_breathePhase];
  return `
    <div class="breathe-content" style="text-align:center;">
      <p class="breathe-sub" style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">4–4–4–4 pattern for nervous system regulation</p>
      <div class="breathe-ring-wrap" style="display:flex; justify-content:center; margin-bottom:20px;">
        <div class="breathe-ring" id="breathe-ring" style="width:140px; height:140px; border-radius:50%; border:4px solid ${ph.color}; box-shadow: 0 0 20px ${ph.color}40; display:flex; align-items:center; justify-content:center; transition: all 1s ease;">
          <div class="breathe-ring-inner" id="breathe-ring-inner" style="width:110px; height:110px; border-radius:50%; background:${ph.color}15; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <span class="breathe-phase" id="breathe-phase" style="font-size:16px; font-weight:bold; color:var(--text-primary);">${ph.label}</span>
            <span class="breathe-count" id="breathe-count" style="font-size:24px; font-weight:800; color:var(--text-primary); margin-top:4px;">${ph.secs}</span>
          </div>
        </div>
      </div>
      <div class="breathe-phase-dots" style="display:flex; justify-content:center; gap:8px; margin-bottom:20px;">
        ${PHASES.map((p, i) => `<div class="phase-dot ${i === _breathePhase ? 'active' : ''}" style="width:8px; height:8px; border-radius:50%; background:${i === _breathePhase ? p.color : 'rgba(255,255,255,0.1)'}; box-shadow:${i === _breathePhase ? `0 0 8px ${p.color}` : 'none'}"></div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm btn-full" id="stop-breathe-btn">Stop & Close</button>
    </div>
  `;
}

function _wireBreatheModalEvents() {
  document.getElementById('stop-breathe-btn')?.addEventListener('click', () => {
    closeModal();
  });
}

function _startBreathe() {
  let countdown = PHASES[_breathePhase].secs;
  _breatheInterval = setInterval(() => {
    countdown--;
    const countEl = document.getElementById('breathe-count');
    if (countEl) countEl.textContent = countdown;
    if (countdown <= 0) {
      _breathePhase = (_breathePhase + 1) % PHASES.length;
      countdown = PHASES[_breathePhase].secs;
      updateModalBody(_getBreatheContentHtml());
      _wireBreatheModalEvents();
    }
  }, 1000);
}

function _stopBreathe() {
  if (_breatheInterval) { clearInterval(_breatheInterval); _breatheInterval = null; }
}

// ── Walk Reset Rework (Stopwatch Tracker) ──
function _openWalkReset() {
  _walkActive = false;
  _walkSeconds = 0;
  _walkSteps = 0;
  _walkGoal = 1000;

  const content = `
    <div class="walk-reset-modal" style="text-align:center; display:flex; flex-direction:column; gap:16px;">
      <p style="font-size:12px; color:var(--text-muted); margin:0;">Clear your mind with active movement</p>
      
      <!-- Visual Steps Progress Ring -->
      <div style="position:relative; width:140px; height:140px; margin:0 auto;">
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--aura-violet-light)" stroke-width="6"
            stroke-linecap="round" stroke-dasharray="326.7" stroke-dashoffset="326.7"
            transform="rotate(-90 60 60)" id="walk-progress-ring"/>
        </svg>
        <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <span id="walk-steps-val" style="font-size:24px; font-weight:800; color:var(--text-primary);">0</span>
          <span style="font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">steps</span>
        </div>
      </div>

      <div class="stat-grid stat-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div class="card" style="padding:10px;">
          <span style="font-size:10px; color:var(--text-muted); display:block;">Time Elapsed</span>
          <strong id="walk-time-val" style="font-size:18px; color:var(--text-primary); display:block; margin-top:4px;">00:00</strong>
        </div>
        <div class="card" style="padding:10px;">
          <span style="font-size:10px; color:var(--text-muted); display:block;">Est. Calories</span>
          <strong id="walk-cal-val" style="font-size:18px; color:var(--aura-rose-light); display:block; margin-top:4px;">0 kcal</strong>
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-top:8px;">
        <button class="btn btn-primary btn-full" id="walk-start-btn">Start Walk</button>
        <button class="btn btn-ghost btn-sm" id="walk-finish-btn" style="display:none;">Finish & Log</button>
        <button class="btn btn-ghost btn-sm" id="walk-close-btn">Cancel</button>
      </div>
    </div>
  `;

  showModal({
    title: 'Walk Reset Active',
    content: content,
    onClose: () => {
      _stopWalk();
    }
  });

  document.getElementById('walk-start-btn')?.addEventListener('click', _toggleWalk);
  document.getElementById('walk-finish-btn')?.addEventListener('click', _finishWalk);
  document.getElementById('walk-close-btn')?.addEventListener('click', closeModal);
}

function _toggleWalk() {
  const startBtn = document.getElementById('walk-start-btn');
  const finishBtn = document.getElementById('walk-finish-btn');

  if (_walkActive) {
    // Pause walk
    _walkActive = false;
    if (_walkInterval) clearInterval(_walkInterval);
    if (startBtn) startBtn.textContent = 'Resume Walk';
    showToast('Walk paused', 'default');
  } else {
    // Start/Resume walk
    _walkActive = true;
    if (startBtn) startBtn.textContent = 'Pause Walk';
    if (finishBtn) finishBtn.style.display = 'block';
    
    _walkInterval = setInterval(() => {
      _walkSeconds++;
      
      // Simulate steps tick: ~1.6 steps per second
      _walkSteps += Math.floor(Math.random() * 2) + 1;
      
      // Calories tick: ~0.05 kcal per step
      const estCals = Math.round(_walkSteps * 0.05);

      const stepsEl = document.getElementById('walk-steps-val');
      const timeEl = document.getElementById('walk-time-val');
      const calEl = document.getElementById('walk-cal-val');
      const ring = document.getElementById('walk-progress-ring');

      if (stepsEl) stepsEl.textContent = _walkSteps;
      if (timeEl) timeEl.textContent = _getTimerText(_walkSeconds);
      if (calEl) calEl.textContent = `${estCals} kcal`;
      
      if (ring) {
        const circ = 326.7;
        const pct = Math.min(1, _walkSteps / _walkGoal);
        ring.style.strokeDashoffset = circ - circ * pct;
      }
    }, 1000);
    showToast('Walk reset started! Stay active 🚶', 'success');
  }
}

function _finishWalk() {
  _stopWalk();
  const state = getState();
  const loggedCals = Math.round(_walkSteps * 0.05);
  
  // Add walk data to diagnostics / logs in state
  const checklist = state.checkIn || {};
  showToast(`Walk completed! +${_walkSteps} steps | +${loggedCals} kcal burned!`, 'success');
  closeModal();
}

function _stopWalk() {
  if (_walkInterval) {
    clearInterval(_walkInterval);
    _walkInterval = null;
  }
  _walkActive = false;
}

// ── Mindfulness Rework (1, 2, 5 Min Guided Meditation) ──
function _openMindfulness() {
  _mindActive = false;
  _stopMindfulness();

  const content = `
    <div class="mindfulness-modal" style="text-align:center; display:flex; flex-direction:column; gap:16px;">
      <p style="font-size:12px; color:var(--text-muted); margin:0;">Reset your focus with guided breathing</p>
      
      <div class="field-group" style="text-align:left;">
        <label class="field-label">Select Session Length</label>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:6px;">
          <button class="btn btn-secondary mind-dur-select active" data-dur="60">1 Min</button>
          <button class="btn btn-secondary mind-dur-select" data-dur="120">2 Min</button>
          <button class="btn btn-secondary mind-dur-select" data-dur="300">5 Min</button>
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-top:10px;">
        <button class="btn btn-primary btn-full" id="mind-start-btn">Start Guided Session</button>
        <button class="btn btn-ghost btn-sm" id="mind-close-btn">Cancel</button>
      </div>
    </div>
  `;

  showModal({
    title: 'Mindfulness Space',
    content: content,
    onClose: () => {
      _stopMindfulness();
    }
  });

  const durationBtns = document.querySelectorAll('.mind-dur-select');
  durationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durationBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _mindDuration = Number(btn.dataset.dur);
    });
  });

  document.getElementById('mind-start-btn')?.addEventListener('click', _startMindfulnessSession);
  document.getElementById('mind-close-btn')?.addEventListener('click', closeModal);
}

function _startMindfulnessSession() {
  _mindActive = true;
  _mindSecondsLeft = _mindDuration;
  _mindPromptIndex = 0;

  _updateMindfulnessUI();

  _mindInterval = setInterval(() => {
    _mindSecondsLeft--;
    
    // Cycle guided prompts every 8 seconds
    if (_mindSecondsLeft % 8 === 0) {
      _mindPromptIndex = (_mindPromptIndex + 1) % MIND_GUIDED_PROMPTS.length;
    }

    const timerEl = document.getElementById('mind-timer-val');
    const promptEl = document.getElementById('mind-prompt-val');
    
    if (timerEl) timerEl.textContent = _getTimerText(_mindSecondsLeft);
    if (promptEl) promptEl.textContent = MIND_GUIDED_PROMPTS[_mindPromptIndex];

    if (_mindSecondsLeft <= 0) {
      _completeMindfulnessSession();
    }
  }, 1000);
}

function _updateMindfulnessUI() {
  const content = `
    <div class="mind-session-active" style="text-align:center; display:flex; flex-direction:column; gap:20px; padding:10px 0;">
      <p id="mind-timer-val" style="font-size:24px; font-weight:800; color:var(--text-primary); margin:0;">${_getTimerText(_mindSecondsLeft)}</p>
      
      <!-- Breathing Circle Animation -->
      <div style="display:flex; justify-content:center; margin:10px 0;">
        <div class="breathing-circle-outer" style="width:140px; height:140px; border-radius:50%; background:rgba(124,58,237,0.06); display:flex; align-items:center; justify-content:center; border: 2px dashed rgba(124,58,237,0.2);">
          <div class="breathing-circle-inner" style="width:80px; height:80px; border-radius:50%; background:var(--aura-violet); box-shadow:0 0 25px var(--aura-violet-light); animation: breatheAnimation 8s infinite ease-in-out;"></div>
        </div>
      </div>

      <div class="card" style="padding:16px; background:rgba(124,58,237,0.06); border-color:rgba(124,58,237,0.15); min-height:80px; display:flex; align-items:center; justify-content:center;">
        <p id="mind-prompt-val" style="font-size:13px; color:var(--text-primary); line-height:1.6; font-style:italic; margin:0;">${MIND_GUIDED_PROMPTS[_mindPromptIndex]}</p>
      </div>

      <button class="btn btn-ghost btn-sm btn-full" id="mind-stop-btn">End Session</button>
    </div>
  `;

  updateModalBody(content);
  document.getElementById('mind-stop-btn')?.addEventListener('click', closeModal);
}

function _completeMindfulnessSession() {
  _stopMindfulness();
  showToast('🧘 Reset complete! Feel the clarity.', 'success');
  closeModal();
}

function _stopMindfulness() {
  if (_mindInterval) {
    clearInterval(_mindInterval);
    _mindInterval = null;
  }
  _mindActive = false;
}

// ── Brown Noise (Spotify-style player) ──
function _toggleNoise() {
  const playBtn = document.getElementById('noise-play-btn');
  if (_noiseSource) {
    _stopNoise();
    if (playBtn) {
      playBtn.textContent = '▶';
    }
    showToast('🌊 Brown noise paused', 'default');
  } else {
    _startNoise();
    if (playBtn) {
      playBtn.textContent = '❚❚';
    }
  }
}

function _startNoise() {
  try {
    _noiseCtx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = _noiseCtx.sampleRate * 2;
    const buffer = _noiseCtx.createBuffer(1, bufferSize, _noiseCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    _noiseSource = _noiseCtx.createBufferSource();
    _noiseSource.buffer = buffer;
    _noiseSource.loop = true;
    _noiseGain = _noiseCtx.createGain();
    
    const volEl = document.getElementById('noise-volume');
    const vol = volEl ? parseFloat(volEl.value) : 0.4;
    _noiseGain.gain.value = vol;
    
    _noiseSource.connect(_noiseGain);
    _noiseGain.connect(_noiseCtx.destination);
    _noiseSource.start();
    
    _noiseSeconds = 0;
    _startNoiseTimer();
    showToast('🌊 Brown noise started', 'violet');
  } catch (e) {
    showToast('Audio not available', 'error');
  }
}

function _startNoiseTimer() {
  _stopNoiseTimer();
  
  const elapsedEl = document.getElementById('audio-elapsed');
  const remainingEl = document.getElementById('audio-remaining');
  const fillEl = document.getElementById('audio-progress-fill');

  _noiseTimerInterval = setInterval(() => {
    _noiseSeconds++;
    
    if (elapsedEl) elapsedEl.textContent = _getTimerText(_noiseSeconds);
    if (remainingEl) remainingEl.textContent = `-${_getTimerText(Math.max(0, _noiseDuration - _noiseSeconds))}`;
    
    if (fillEl) {
      const pct = Math.min(100, (_noiseSeconds / _noiseDuration) * 100);
      fillEl.style.width = `${pct}%`;
    }

    if (_noiseSeconds >= _noiseDuration) {
      _stopNoise();
      const playBtn = document.getElementById('noise-play-btn');
      if (playBtn) playBtn.textContent = '▶';
      showToast('🌊 Noise playback ended', 'default');
    }
  }, 1000);
}

function _stopNoiseTimer() {
  if (_noiseTimerInterval) {
    clearInterval(_noiseTimerInterval);
    _noiseTimerInterval = null;
  }
}

function _stopNoise() {
  _stopNoiseTimer();
  if (_noiseSource) {
    try { _noiseSource.stop(); } catch (e) {}
    _noiseSource = null;
  }
  if (_noiseCtx) {
    try { _noiseCtx.close(); } catch (e) {}
    _noiseCtx = null;
  }
  _noiseGain = null;
}
