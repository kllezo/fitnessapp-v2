// ==========================================
// AURA V2 — Recovery Page
// Route: /recovery
// ==========================================

import { getState, setState } from '../../state/index.js';
import { showToast } from '../../components/shared/ui.js';
import { calculateRecoveryScore, calculateRecoveryStreak, calculateSleepDebt, getReadinessTrend } from '../../services/ai-engine.js';
import './recovery.css';

let _breatheInterval = null;
let _breathePhase = 0; // 0=inhale 1=hold 2=exhale 3=hold
let _noiseCtx = null;
let _noiseSource = null;

export function render() {
  const state = getState();
  const { score, label, color } = calculateRecoveryScore(state);
  const recStreak = calculateRecoveryStreak(state);
  const sleepDebt = calculateSleepDebt(state);
  const trend = getReadinessTrend(state);
  const answers = state.checkIn?.answers || {};

  const indicators = [
    { key: 'sleep', label: 'Sleep', val: answers.sleep || 0, icon: '😴' },
    { key: 'energy', label: 'Energy', val: answers.energy || 0, icon: '⚡' },
    { key: 'soreness', label: 'Soreness', val: 6 - (answers.soreness || 3), icon: '💊' },
    { key: 'stress', label: 'Stress', val: 6 - (answers.stress || 3), icon: '🧠' },
    { key: 'motivation', label: 'Motivation', val: answers.motivation || 0, icon: '🎯' },
  ];

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
        <div class="section-label">Today's Status</div>
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

      <!-- Quick Actions -->
      <div class="rec-section">
        <div class="section-label">Recovery Tools</div>
        <div class="rec-tools-grid">
          <button class="rec-tool-btn" id="breathe-btn">
            <span class="rec-tool-icon">🫁</span>
            <span class="rec-tool-label">Box Breathing</span>
            <span class="rec-tool-sub">4-4-4-4</span>
          </button>
          <button class="rec-tool-btn" id="noise-btn">
            <span class="rec-tool-icon">🌊</span>
            <span class="rec-tool-label">Brown Noise</span>
            <span class="rec-tool-sub" id="noise-status">Tap to start</span>
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

    <!-- Box Breathing Sheet -->
    <div class="bottom-sheet-overlay" id="breathe-overlay"></div>
    <div class="bottom-sheet" id="breathe-sheet">
      <div class="modal-handle"></div>
      <div id="breathe-content"></div>
    </div>

    <!-- Mindfulness Sheet -->
    <div class="bottom-sheet-overlay" id="mind-overlay"></div>
    <div class="bottom-sheet" id="mind-sheet">
      <div class="modal-handle"></div>
      <div id="mind-content"></div>
    </div>
  `;
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
  document.getElementById('breathe-overlay')?.classList.remove('open');
  document.getElementById('breathe-sheet')?.classList.remove('open');
  document.getElementById('mind-overlay')?.classList.remove('open');
  document.getElementById('mind-sheet')?.classList.remove('open');
}

function _wireEvents() {
  document.getElementById('breathe-btn')?.addEventListener('click', _openBreathe);
  document.getElementById('breathe-overlay')?.addEventListener('click', () => {
    _stopBreathe();
    document.getElementById('breathe-overlay')?.classList.remove('open');
    document.getElementById('breathe-sheet')?.classList.remove('open');
  });

  document.getElementById('noise-btn')?.addEventListener('click', _toggleNoise);

  document.getElementById('walk-btn')?.addEventListener('click', () => {
    showToast('🚶 Walk reminder set — 10 min break incoming', 'mint');
  });

  document.getElementById('mind-btn')?.addEventListener('click', _openMindfulness);
  document.getElementById('mind-overlay')?.addEventListener('click', () => {
    document.getElementById('mind-overlay')?.classList.remove('open');
    document.getElementById('mind-sheet')?.classList.remove('open');
  });
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
  document.getElementById('breathe-overlay')?.classList.add('open');
  document.getElementById('breathe-sheet')?.classList.add('open');
  _renderBreatheContent();
  _startBreathe();
}

function _renderBreatheContent() {
  const content = document.getElementById('breathe-content');
  if (!content) return;
  const ph = PHASES[_breathePhase];
  content.innerHTML = `
    <div class="breathe-content">
      <h3 class="breathe-title">Box Breathing</h3>
      <p class="breathe-sub">4–4–4–4 pattern</p>
      <div class="breathe-ring-wrap">
        <div class="breathe-ring" id="breathe-ring" style="border-color:${ph.color}">
          <div class="breathe-ring-inner" id="breathe-ring-inner" style="background:${ph.color}20">
            <span class="breathe-phase" id="breathe-phase">${ph.label}</span>
            <span class="breathe-count" id="breathe-count">${ph.secs}</span>
          </div>
        </div>
      </div>
      <div class="breathe-phase-dots">
        ${PHASES.map((p, i) => `<div class="phase-dot ${i === _breathePhase ? 'active' : ''}" style="${i === _breathePhase ? `background:${p.color}` : ''}"></div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm btn-full" id="stop-breathe-btn" style="margin-top:16px">Stop</button>
    </div>
  `;
  document.getElementById('stop-breathe-btn')?.addEventListener('click', () => {
    _stopBreathe();
    document.getElementById('breathe-overlay')?.classList.remove('open');
    document.getElementById('breathe-sheet')?.classList.remove('open');
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
      _renderBreatheContent();
      document.getElementById('stop-breathe-btn')?.addEventListener('click', () => {
        _stopBreathe();
        document.getElementById('breathe-overlay')?.classList.remove('open');
        document.getElementById('breathe-sheet')?.classList.remove('open');
      });
    }
  }, 1000);
}

function _stopBreathe() {
  if (_breatheInterval) { clearInterval(_breatheInterval); _breatheInterval = null; }
}

// ── Brown Noise ──
function _toggleNoise() {
  if (_noiseSource) {
    _stopNoise();
    const statusEl = document.getElementById('noise-status');
    if (statusEl) statusEl.textContent = 'Tap to start';
    document.getElementById('noise-btn')?.classList.remove('active');
  } else {
    _startNoise();
    const statusEl = document.getElementById('noise-status');
    if (statusEl) statusEl.textContent = 'Playing...';
    document.getElementById('noise-btn')?.classList.add('active');
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
    const gainNode = _noiseCtx.createGain();
    gainNode.gain.value = 0.4;
    _noiseSource.connect(gainNode);
    gainNode.connect(_noiseCtx.destination);
    _noiseSource.start();
    showToast('🌊 Brown noise started', 'violet');
  } catch (e) {
    showToast('Audio not available', 'error');
  }
}

function _stopNoise() {
  if (_noiseSource) {
    try { _noiseSource.stop(); } catch (e) {}
    _noiseSource = null;
  }
  if (_noiseCtx) {
    try { _noiseCtx.close(); } catch (e) {}
    _noiseCtx = null;
  }
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
  document.getElementById('mind-overlay')?.classList.add('open');
  document.getElementById('mind-sheet')?.classList.add('open');
  const content = document.getElementById('mind-content');
  const prompt = MIND_PROMPTS[Math.floor(Math.random() * MIND_PROMPTS.length)];
  if (content) {
    content.innerHTML = `
      <div style="text-align:center;padding:8px 0">
        <span style="font-size:48px">🧘</span>
        <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin:12px 0 8px">2-Minute Reset</h3>
        <div class="card" style="margin:16px 0;background:rgba(124,58,237,0.08);border-color:rgba(124,58,237,0.2)">
          <p style="font-size:var(--text-base);color:var(--text-primary);line-height:1.8;font-style:italic">"${prompt}"</p>
        </div>
        <button class="btn btn-primary btn-full" id="close-mind-btn">Done ✓</button>
      </div>
    `;
    document.getElementById('close-mind-btn')?.addEventListener('click', () => {
      document.getElementById('mind-overlay')?.classList.remove('open');
      document.getElementById('mind-sheet')?.classList.remove('open');
      showToast('🧘 Reset complete', 'success');
    });
  }
}
