// ==========================================
// AURA V2 — Recovery Page
// Route: /recovery
// ==========================================

import { getState, setState } from '../../state/index.js';
import { showToast, showModal, closeModal, updateModalBody } from '../../components/shared/ui.js';
import { calculateRecoveryScore, calculateRecoveryStreak, calculateSleepDebt, getReadinessTrend } from '../../services/ai-engine.js';
import './recovery.css';

let _breatheInterval = null;
let _breathePhase = 0; // 0=inhale 1=hold 2=exhale 3=hold
let _noiseCtx = null;
let _noiseSource = null;
let _noiseGain = null;
let _noiseTimerInterval = null;
let _noiseSeconds = 0;

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
  const timerText = isPlaying ? _getTimerText() : '00:00';
  const volumeVal = _noiseGain ? _noiseGain.gain.value : 0.4;

  return `
    <div class="recovery-page">
      <div class="page-header">
        <h1 class="page-title">Recovery</h1>
        <span class="pill pill-${color === 'mint' ? 'mint' : color === 'rose' ? 'rose' : 'violet'}">${label}</span>
      </div>

      <!-- Recovery Score -->
      <div class="rec-section">
        <div class="rec-score-card card card-glow">
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

      <!-- Somatic Status -->
      <div class="rec-section">
        <div class="section-label">Today's Vitals</div>
        <div class="somatic-grid">
          ${indicators.map(ind => `
            <div class="somatic-card">
              <span class="somatic-icon">${ind.icon}</span>
              <span class="somatic-label">${ind.label}</span>
              <div class="somatic-bar">
                <div class="somatic-fill" style="width:${ind.val * 20}%"></div>
              </div>
              <span class="somatic-val">${ind.val}/5</span>
            </div>
          `).join('')}
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

      <!-- Quick Actions / Recovery Tools -->
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
            <span class="rec-tool-sub">10 min</span>
          </button>
          <button class="rec-tool-btn" id="mind-btn">
            <span class="rec-tool-icon">🧘</span>
            <span class="rec-tool-label">Mindfulness</span>
            <span class="rec-tool-sub">2 min</span>
          </button>
        </div>
      </div>

      <!-- Spotify-style Brown Noise Player -->
      <div class="rec-section">
        <div class="section-label">Rest Audio</div>
        <div class="brown-noise-player card">
          <div class="player-left">
            <span class="player-icon">🌊</span>
            <div class="player-details">
              <span class="player-title">Deep Space Brown Noise</span>
              <span class="player-sub" id="noise-timer">${timerText}</span>
            </div>
          </div>
          <div class="player-center">
            <button class="player-play-btn ${isPlaying ? 'playing' : ''}" id="noise-play-btn">${playIcon}</button>
          </div>
          <div class="player-right">
            <span class="volume-icon">🔊</span>
            <input type="range" class="volume-slider" id="noise-volume" min="0" max="1" step="0.05" value="${volumeVal}" aria-label="Volume">
          </div>
        </div>
      </div>

      <!-- Recovery Tips -->
      <div class="rec-section">
        <div class="section-label">Recovery Insights</div>
        <div class="card" style="background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(8,145,178,0.04))">
          <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.7">
            ${_getRecoveryInsight(score, sleepDebt, answers)}
          </p>
        </div>
      </div>
    </div>
  `;
}

function _getTimerText() {
  const mins = Math.floor(_noiseSeconds / 60).toString().padStart(2, '0');
  const secs = (_noiseSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function _getRecoveryInsight(score, sleepDebt, answers) {
  if (score >= 80) return '✦ <strong>Excellent recovery.</strong> Your body is primed. This is the optimal window for a high-intensity session or progressive overload attempt.';
  if (sleepDebt.hours > 6) return '⚠️ <strong>Significant sleep debt detected.</strong> Prioritise 8–9h sleep tonight. Consider a deload session rather than peak training.';
  if ((answers.stress || 3) >= 4) return '🧠 <strong>Elevated stress detected.</strong> Box breathing and 10-min walk significantly reduce cortisol. Avoid caffeine after 2pm.';
  if ((answers.soreness || 3) >= 4) return '💊 <strong>High soreness.</strong> Active recovery recommended — light movement, stretching, and increased protein intake will accelerate repair.';
  return '📊 <strong>Stable recovery.</strong> Maintain your hydration, sleep consistency and stress management. Your trend is moving in the right direction.';
}

export function onEnter() {
  _wireEvents();
}

export function onLeave() {
  _stopBreathe();
  _stopNoise();
}

function _wireEvents() {
  document.getElementById('breathe-btn')?.addEventListener('click', _openBreathe);
  
  // Brown Noise triggers
  const playBtn = document.getElementById('noise-play-btn');
  playBtn?.addEventListener('click', _toggleNoise);
  
  document.getElementById('noise-volume')?.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    if (_noiseGain && _noiseCtx) {
      _noiseGain.gain.setValueAtTime(vol, _noiseCtx.currentTime);
    }
  });

  document.getElementById('walk-btn')?.addEventListener('click', () => {
    showToast('🚶 Walk reminder set — 10 min break incoming', 'mint');
  });

  document.getElementById('mind-btn')?.addEventListener('click', _openMindfulness);
}

// ── Box Breathing ──
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
    <div class="breathe-content">
      <p class="breathe-sub">4–4–4–4 pattern for nervous system regulation</p>
      <div class="breathe-ring-wrap">
        <div class="breathe-ring" id="breathe-ring" style="border-color:${ph.color}; box-shadow: 0 0 15px ${ph.color}30">
          <div class="breathe-ring-inner" id="breathe-ring-inner" style="background:${ph.color}15">
            <span class="breathe-phase" id="breathe-phase">${ph.label}</span>
            <span class="breathe-count" id="breathe-count">${ph.secs}</span>
          </div>
        </div>
      </div>
      <div class="breathe-phase-dots">
        ${PHASES.map((p, i) => `<div class="phase-dot ${i === _breathePhase ? 'active' : ''}" style="${i === _breathePhase ? `background:${p.color}; box-shadow: 0 0 8px ${p.color}` : ''}"></div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm btn-full" id="stop-breathe-btn" style="margin-top:20px">Stop & Close</button>
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

// ── Brown Noise (Spotify-style player) ──
function _toggleNoise() {
  const playBtn = document.getElementById('noise-play-btn');
  if (_noiseSource) {
    _stopNoise();
    if (playBtn) {
      playBtn.textContent = '▶';
      playBtn.classList.remove('playing');
    }
    showToast('🌊 Brown noise paused', 'default');
  } else {
    _startNoise();
    if (playBtn) {
      playBtn.textContent = '❚❚';
      playBtn.classList.add('playing');
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
  const timerEl = document.getElementById('noise-timer');
  _noiseTimerInterval = setInterval(() => {
    _noiseSeconds++;
    if (timerEl) timerEl.textContent = _getTimerText();
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

// ── Mindfulness ──
const MIND_PROMPTS = [
  'Notice 5 things you can see right now.',
  'Take 3 slow, deep breaths. Feel your feet on the ground.',
  'Name one thing you\'re grateful for today.',
  'Relax your jaw, shoulders, and hands — right now.',
  'You are not your thoughts. Observe them passing by.',
];

function _openMindfulness() {
  const prompt = MIND_PROMPTS[Math.floor(Math.random() * MIND_PROMPTS.length)];
  showModal({
    title: '2-Minute Reset',
    content: `
      <div style="text-align:center;padding:8px 0">
        <span style="font-size:48px;display:block;margin-bottom:12px">🧘</span>
        <div class="card" style="margin:16px 0;background:rgba(124,58,237,0.08);border-color:rgba(124,58,237,0.2);padding:16px;border-radius:var(--radius-lg)">
          <p style="font-size:var(--text-base);color:var(--text-primary);line-height:1.8;font-style:italic">"${prompt}"</p>
        </div>
        <button class="btn btn-primary btn-full" id="close-mind-btn">Done ✓</button>
      </div>
    `,
    className: 'mind-modal',
    onClose: () => {
      showToast('🧘 Reset complete', 'success');
    }
  });
  document.getElementById('close-mind-btn')?.addEventListener('click', () => {
    closeModal();
  });
}

