// ==========================================
// AURA V2 — Diet Page
// Route: /diet
// ==========================================

import { getState, updateState, setState } from '../../state/index.js';
import { showToast } from '../../components/shared/ui.js';
import { getFilteredMeals, calculateMacros, getDailyMealPlan, quickLogFood } from '../../services/nutrition-engine.js';
import './diet.css';

let _activeMealSheet = null;

export function render() {
  const state = getState();
  const nutrition = state.nutrition;
  const macros = calculateMacros(state);
  const cal = nutrition?.calories || { target: macros.calories, consumed: 0 };
  const prot = nutrition?.protein || { target: macros.protein, consumed: 0 };
  const water = nutrition?.water || { target: macros.water, consumed: 0 };

  const calPct = Math.min(100, Math.round((cal.consumed / cal.target) * 100));
  const protPct = Math.min(100, Math.round((prot.consumed / prot.target) * 100));
  const waterPct = Math.min(100, Math.round((water.consumed / water.target) * 100));

  const plan = getDailyMealPlan(state);

  return `
    <div class="diet-page">
      <div class="page-header">
        <h1 class="page-title">Diet</h1>
        <button class="icon-btn" id="log-food-btn" aria-label="Log Food">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <!-- Macro Trackers -->
      <div class="diet-section">
        <div class="macro-grid">
          ${_macroRing('Calories', cal.consumed, cal.target, 'kcal', '#a78bfa', calPct)}
          ${_macroRing('Protein', prot.consumed, prot.target, 'g', '#10b981', protPct)}
        </div>
      </div>

      <!-- Hydration Tracker -->
      <div class="diet-section">
        <div class="hydration-card card">
          <div class="hydration-header">
            <div>
              <p class="hydration-title">💧 Hydration</p>
              <p class="hydration-sub">${water.consumed.toFixed(1)}L / ${water.target}L</p>
            </div>
            <span class="pill ${waterPct >= 90 ? 'pill-mint' : 'pill-muted'}">${waterPct}%</span>
          </div>
          <div class="progress-bar" style="margin:10px 0">
            <div class="progress-fill" style="width:${waterPct}%;background:${waterPct >= 90 ? 'var(--grad-mint)' : 'var(--grad-violet)'}"></div>
          </div>
          <div class="water-btns">
            <button class="water-btn" data-add="0.25">+250ml</button>
            <button class="water-btn" data-add="0.5">+500ml</button>
            <button class="water-btn" data-add="1.0">+1L</button>
            <button class="water-btn water-reset" id="water-reset">Reset</button>
          </div>
        </div>
      </div>

      <!-- Today's Meals -->
      <div class="diet-section">
        <div class="section-label">Today's Meal Plan</div>
        <div class="meals-list">
          ${_renderMealCard('🌅 Breakfast', plan.breakfast)}
          ${_renderMealCard('☀️ Lunch', plan.lunch)}
          ${_renderMealCard('🌙 Dinner', plan.dinner)}
          ${_renderMealCard('🍎 Snack', plan.snack)}
        </div>
      </div>

      <!-- Browse All Meals -->
      <div class="diet-section">
        <div class="section-label">All Meals</div>
        <div class="all-meals-list" id="all-meals-list">
          ${getFilteredMeals(state).map((meal, i) => `
            <div class="meal-list-row" data-meal="${i}" id="meal-row-${i}">
              <span class="meal-emoji">${meal.emoji}</span>
              <div class="meal-row-info">
                <p class="meal-row-name">${meal.name}</p>
                <p class="meal-row-meta">${meal.protein}g protein · ${meal.calories} kcal</p>
              </div>
              <button class="btn btn-sm btn-secondary meal-log-btn" data-idx="${i}">Log</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Quick Log Sheet -->
    <div class="bottom-sheet-overlay" id="log-overlay"></div>
    <div class="bottom-sheet" id="log-sheet">
      <div class="modal-handle"></div>
      <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-bottom:16px">Quick Log Food</h3>
      <div class="field-group">
        <label class="field-label">Food name</label>
        <input class="input" id="food-input" placeholder="e.g. eggs, chicken, paneer, dal..." />
      </div>
      <p class="log-hint">Recognised: eggs, chicken, paneer, dal, rice, oats, milk, whey, roti, tuna, peanut, curd, soy, fish, banana</p>
      <div id="log-preview" class="log-preview hidden"></div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-primary btn-full" id="log-submit-btn">Log Food</button>
        <button class="btn btn-ghost btn-sm" id="log-close-btn">Cancel</button>
      </div>
    </div>

    <!-- Meal Detail Sheet -->
    <div class="bottom-sheet-overlay" id="meal-detail-overlay"></div>
    <div class="bottom-sheet" id="meal-detail-sheet">
      <div class="modal-handle"></div>
      <div id="meal-detail-content"></div>
    </div>
  `;
}

function _macroRing(label, consumed, target, unit, color, pct) {
  const r = 40, circ = 2 * Math.PI * r;
  return `
    <div class="macro-ring-card card">
      <div class="macro-ring-visual">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="7"/>
          <circle cx="48" cy="48" r="${r}" fill="none" stroke="${color}" stroke-width="7"
            stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ - circ * pct / 100}"
            transform="rotate(-90 48 48)" opacity="0.9"/>
        </svg>
        <div class="macro-ring-center">
          <span class="macro-val">${consumed}</span>
          <span class="macro-unit">${unit}</span>
        </div>
      </div>
      <p class="macro-label">${label}</p>
      <p class="macro-target">/ ${target}${unit}</p>
      <div class="progress-bar" style="margin-top:8px">
        <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>
  `;
}

function _renderMealCard(timeLabel, meal) {
  if (!meal) return '';
  return `
    <div class="today-meal-card card" data-meal-name="${meal.name}">
      <div class="today-meal-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">${meal.emoji}</span>
          <div>
            <p class="today-meal-time">${timeLabel}</p>
            <p class="today-meal-name">${meal.name}</p>
          </div>
        </div>
        <div class="today-meal-macros">
          <span class="pill pill-violet">${meal.protein}g</span>
        </div>
      </div>
      <p class="today-meal-meta">${meal.calories} kcal · ${meal.prepTime}</p>
    </div>
  `;
}

export function onEnter() {
  _wireEvents();
}

export function onLeave() {
  _closeLogSheet();
  _closeMealDetail();
}

function _wireEvents() {
  // Water buttons
  document.querySelectorAll('.water-btn[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const add = parseFloat(btn.dataset.add);
      const state = getState();
      const w = state.nutrition?.water || { consumed: 0, target: 3.5 };
      const newConsumed = Math.min(w.target, +(w.consumed + add).toFixed(2));
      setState('nutrition.water', { ...w, consumed: newConsumed });
      if (newConsumed >= w.target) showToast('Hydration goal reached! 💧', 'success');
      else showToast(`+${add * 1000}ml added`, 'violet');
      _refreshWater();
    });
  });

  document.getElementById('water-reset')?.addEventListener('click', () => {
    const state = getState();
    setState('nutrition.water', { ...state.nutrition.water, consumed: 0 });
    _refreshWater();
  });

  // Log food
  document.getElementById('log-food-btn')?.addEventListener('click', _openLogSheet);
  document.getElementById('log-overlay')?.addEventListener('click', _closeLogSheet);
  document.getElementById('log-close-btn')?.addEventListener('click', _closeLogSheet);

  document.getElementById('food-input')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.length < 2) { document.getElementById('log-preview')?.classList.add('hidden'); return; }
    const data = quickLogFood(val);
    const preview = document.getElementById('log-preview');
    if (preview) {
      preview.classList.remove('hidden');
      preview.innerHTML = `<div class="log-preview-row">
        <span>${data.emoji} ${val}</span>
        <span>${data.protein}g protein · ${data.calories} kcal</span>
      </div>`;
    }
  });

  document.getElementById('log-submit-btn')?.addEventListener('click', () => {
    const val = document.getElementById('food-input')?.value?.trim();
    if (!val) { showToast('Enter a food name', 'error'); return; }
    const data = quickLogFood(val);
    const state = getState();
    const cal = state.nutrition?.calories || { consumed: 0, target: 2000 };
    const prot = state.nutrition?.protein || { consumed: 0, target: 150 };
    updateState('nutrition', {
      calories: { ...cal, consumed: cal.consumed + data.calories },
      protein: { ...prot, consumed: prot.consumed + data.protein },
    });
    showToast(`${data.emoji} ${val} logged! +${data.protein}g protein`, 'success');
    _closeLogSheet();
    _refreshMacros();
  });

  // Meal log buttons
  document.querySelectorAll('.meal-log-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const meals = getFilteredMeals(getState());
      const idx = Number(btn.dataset.idx);
      const meal = meals[idx];
      if (!meal) return;
      const state = getState();
      const cal = state.nutrition?.calories || { consumed: 0, target: 2000 };
      const prot = state.nutrition?.protein || { consumed: 0, target: 150 };
      updateState('nutrition', {
        calories: { ...cal, consumed: cal.consumed + meal.calories },
        protein: { ...prot, consumed: prot.consumed + meal.protein },
      });
      showToast(`${meal.emoji} ${meal.name} logged!`, 'success');
      _refreshMacros();
    });
  });

  // Meal detail sheet
  document.querySelectorAll('.today-meal-card').forEach(card => {
    card.addEventListener('click', () => {
      const name = card.dataset.mealName;
      const meals = getFilteredMeals(getState());
      const meal = meals.find(m => m.name === name);
      if (meal) _openMealDetail(meal);
    });
  });

  document.getElementById('meal-detail-overlay')?.addEventListener('click', _closeMealDetail);
}

function _refreshWater() {
  const state = getState();
  const water = state.nutrition?.water || { consumed: 0, target: 3.5 };
  const pct = Math.min(100, Math.round((water.consumed / water.target) * 100));
  const subEl = document.querySelector('.hydration-sub');
  const pillEl = document.querySelector('.hydration-card .pill');
  const fillEl = document.querySelector('.hydration-card .progress-fill');
  if (subEl) subEl.textContent = `${water.consumed.toFixed(1)}L / ${water.target}L`;
  if (pillEl) pillEl.textContent = `${pct}%`;
  if (fillEl) fillEl.style.width = `${pct}%`;
}

function _refreshMacros() {
  const state = getState();
  const macros = calculateMacros(state);
  const cal = state.nutrition?.calories || { consumed: 0, target: macros.calories };
  const prot = state.nutrition?.protein || { consumed: 0, target: macros.protein };
  const calPct = Math.min(100, Math.round((cal.consumed / cal.target) * 100));
  const protPct = Math.min(100, Math.round((prot.consumed / prot.target) * 100));
  const macroGrid = document.querySelector('.macro-grid');
  if (macroGrid) {
    macroGrid.innerHTML = _macroRing('Calories', cal.consumed, cal.target, 'kcal', '#a78bfa', calPct) +
      _macroRing('Protein', prot.consumed, prot.target, 'g', '#10b981', protPct);
  }
}

function _openLogSheet() {
  document.getElementById('log-overlay')?.classList.add('open');
  document.getElementById('log-sheet')?.classList.add('open');
  setTimeout(() => document.getElementById('food-input')?.focus(), 300);
}

function _closeLogSheet() {
  document.getElementById('log-overlay')?.classList.remove('open');
  document.getElementById('log-sheet')?.classList.remove('open');
}

function _openMealDetail(meal) {
  const overlay = document.getElementById('meal-detail-overlay');
  const sheet = document.getElementById('meal-detail-sheet');
  const content = document.getElementById('meal-detail-content');
  if (!overlay || !sheet || !content) return;
  overlay.classList.add('open');
  sheet.classList.add('open');
  content.innerHTML = `
    <div style="text-align:center;margin-bottom:16px">
      <span style="font-size:48px">${meal.emoji}</span>
      <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-top:8px">${meal.name}</h3>
      <p style="color:var(--text-muted);font-size:var(--text-sm)">${meal.prepTime}</p>
    </div>
    <div class="stat-grid stat-grid-3" style="margin-bottom:16px">
      <div class="stat-cell"><div class="stat-value" style="color:var(--aura-violet-light)">${meal.calories}</div><div class="stat-label">kcal</div></div>
      <div class="stat-cell"><div class="stat-value gradient-text-mint">${meal.protein}g</div><div class="stat-label">Protein</div></div>
      <div class="stat-cell"><div class="stat-value">${meal.carbs}g</div><div class="stat-label">Carbs</div></div>
    </div>
    <div class="card" style="margin-bottom:12px">
      <p class="section-label">Recipe</p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.7">${meal.recipe}</p>
    </div>
    <button class="btn btn-primary btn-full" id="meal-detail-log">Log This Meal</button>
    <button class="btn btn-ghost btn-sm btn-full" id="meal-detail-close" style="margin-top:8px">Close</button>
  `;
  document.getElementById('meal-detail-log')?.addEventListener('click', () => {
    const state = getState();
    const cal = state.nutrition?.calories || { consumed: 0, target: 2000 };
    const prot = state.nutrition?.protein || { consumed: 0, target: 150 };
    updateState('nutrition', {
      calories: { ...cal, consumed: cal.consumed + meal.calories },
      protein: { ...prot, consumed: prot.consumed + meal.protein },
    });
    showToast(`${meal.emoji} ${meal.name} logged!`, 'success');
    _closeMealDetail();
    _refreshMacros();
  });
  document.getElementById('meal-detail-close')?.addEventListener('click', _closeMealDetail);
}

function _closeMealDetail() {
  document.getElementById('meal-detail-overlay')?.classList.remove('open');
  document.getElementById('meal-detail-sheet')?.classList.remove('open');
}
