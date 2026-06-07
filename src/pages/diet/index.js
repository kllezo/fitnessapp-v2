// ==========================================
// AURA V2 — Diet Page
// Route: /diet
// ==========================================

import { getState, updateState, setState } from '../../state/index.js';
import { showToast, showModal, closeModal } from '../../components/shared/ui.js';
import { getFilteredMeals, calculateMacros, getDailyMealPlan, calculateCustomMacros } from '../../services/nutrition-engine.js';
import './diet.css';

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

      <!-- Custom Food Logger Card -->
      <div class="diet-section">
        <div class="custom-food-card card card-glow" style="display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <p style="font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-primary);">🍳 Log Custom Meal</p>
              <p style="font-size:10px; color:var(--text-muted); margin-top:2px;">Track foods outside the catalog</p>
            </div>
            <button class="btn btn-sm btn-primary" id="custom-food-card-btn">Quick Log</button>
          </div>
        </div>
      </div>

      <!-- Today's Meals -->
      <div class="diet-section">
        <div class="section-label">Today's Protein-Scaled Plan</div>
        <div class="meals-list">
          ${_renderMealCard('🌅 Breakfast', plan.breakfast)}
          ${_renderMealCard('☀️ Lunch', plan.lunch)}
          ${_renderMealCard('🍿 Snacks', plan.snack)}
          ${_renderMealCard('🌙 Dinner', plan.dinner)}
          ${plan.preWorkout ? _renderMealCard('⚡ Pre Workout', plan.preWorkout) : ''}
        </div>
      </div>

      <!-- Browse All Meals -->
      <div class="diet-section">
        <div class="section-label">All Meals</div>
        <div class="all-meals-list" id="all-meals-list">
          ${getFilteredMeals(state).map((meal, i) => `
            <div class="meal-list-row" data-meal="${i}" id="meal-row-${i}">
              <span class="meal-emoji">${meal.emoji}</span>
              <div class="meal-row-info" style="cursor: pointer;" data-idx="${i}">
                <p class="meal-row-name">${meal.name}</p>
                <p class="meal-row-meta">${meal.protein}g protein · ${meal.calories} kcal</p>
              </div>
              <button class="btn btn-sm btn-secondary meal-log-btn" data-idx="${i}">Log</button>
            </div>
          `).join('')}
        </div>
      </div>
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
    <div class="today-meal-card card" data-meal-name="${meal.name}" style="cursor: pointer; margin-bottom: 10px;">
      <div class="today-meal-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">${meal.emoji}</span>
          <div>
            <p class="today-meal-time">${timeLabel}</p>
            <p class="today-meal-name">${meal.name}</p>
          </div>
        </div>
        <div class="today-meal-macros">
          <span class="pill pill-violet">${meal.protein}g Target</span>
        </div>
      </div>
      <p class="today-meal-meta">${meal.calories} kcal · ${meal.prepTime}</p>
    </div>
  `;
}

export function onEnter() {
  _wireEvents();
}

export function onLeave() {}

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

  // Custom logger triggers
  document.getElementById('custom-food-card-btn')?.addEventListener('click', _openLogSheet);

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

  // Browse meals info click
  document.querySelectorAll('.meal-row-info').forEach(row => {
    row.addEventListener('click', () => {
      const meals = getFilteredMeals(getState());
      const idx = Number(row.dataset.idx);
      const meal = meals[idx];
      if (meal) _openMealDetail(meal);
    });
  });

  // Meal detail card click
  document.querySelectorAll('.today-meal-card').forEach(card => {
    card.addEventListener('click', () => {
      const name = card.dataset.mealName;
      const state = getState();
      const meals = getFilteredMeals(state);
      
      // Check first in database
      let meal = meals.find(m => m.name === name);
      
      // If it is the default pre-workout
      if (!meal && (name === 'Peanut Butter Toast' || name === 'Whey Shake & Almonds')) {
        const plan = getDailyMealPlan(state);
        meal = plan.preWorkout;
      }
      
      if (meal) _openMealDetail(meal);
    });
  });
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

// ── Custom Food Logger Modal (Quantity & Units) ──
function _openLogSheet() {
  const content = `
    <div class="quick-log-form" style="display:flex; flex-direction:column; gap:12px;">
      <div class="field-group">
        <label class="field-label">Food name</label>
        <input class="input" id="food-input-name" placeholder="e.g. Rice, Chicken, Dal..." />
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        <div class="field-group">
          <label class="field-label">Quantity</label>
          <input class="input" id="food-input-qty" type="number" value="100" min="1" />
        </div>
        <div class="field-group">
          <label class="field-label">Unit</label>
          <input class="input" id="food-input-unit" placeholder="e.g. g, ml, cup, scoop..." value="g" />
        </div>
      </div>
      <div id="log-preview" class="log-preview hidden" style="margin-top:4px; padding:10px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);"></div>
      <div style="display:flex; gap:10px; margin-top:8px">
        <button class="btn btn-primary btn-full" id="log-submit-btn">Log Food ✓</button>
        <button class="btn btn-ghost btn-sm" id="log-close-btn">Cancel</button>
      </div>
    </div>
  `;

  showModal({
    title: 'Quick Log Food',
    content: content
  });

  const nameInput = document.getElementById('food-input-name');
  const qtyInput = document.getElementById('food-input-qty');
  const unitInput = document.getElementById('food-input-unit');
  const preview = document.getElementById('log-preview');

  setTimeout(() => nameInput?.focus(), 150);

  const updatePreview = () => {
    const name = nameInput?.value?.trim();
    const qty = parseFloat(qtyInput?.value) || 0;
    const unit = unitInput?.value?.trim();
    if (!name || name.length < 2 || qty <= 0) {
      preview?.classList.add('hidden');
      return;
    }
    const data = calculateCustomMacros(name, qty, unit);
    if (preview) {
      preview.classList.remove('hidden');
      preview.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:12px; align-items:center;">
          <span>${data.emoji} ${name} (${qty}${unit})</span>
          <span style="font-weight:var(--fw-bold); color:var(--aura-violet-light);">${data.protein}g protein · ${data.calories} kcal</span>
        </div>
        <p style="font-size:10px; color:var(--text-muted); margin:4px 0 0; font-style:italic;">*Approx. values based on common nutrition data</p>
      `;
    }
  };

  nameInput?.addEventListener('input', updatePreview);
  qtyInput?.addEventListener('input', updatePreview);
  unitInput?.addEventListener('input', updatePreview);

  document.getElementById('log-submit-btn')?.addEventListener('click', () => {
    const name = nameInput?.value?.trim();
    const qty = parseFloat(qtyInput?.value) || 0;
    const unit = unitInput?.value?.trim();

    if (!name) { showToast('Enter a food name', 'error'); return; }
    if (qty <= 0) { showToast('Enter a valid quantity', 'error'); return; }

    const data = calculateCustomMacros(name, qty, unit);
    const state = getState();
    const cal = state.nutrition?.calories || { consumed: 0, target: 2000 };
    const prot = state.nutrition?.protein || { consumed: 0, target: 150 };
    updateState('nutrition', {
      calories: { ...cal, consumed: cal.consumed + data.calories },
      protein: { ...prot, consumed: prot.consumed + data.protein },
    });
    showToast(`${data.emoji} ${name} logged! +${data.protein}g protein`, 'success');
    closeModal();
    _refreshMacros();
  });

  document.getElementById('log-close-btn')?.addEventListener('click', closeModal);
}

// ── Meal Detail Modal ──
function _openMealDetail(meal) {
  const budget = getState().onboarding?.budget || 'medium';
  const cost = meal.cost?.[budget] || meal.cost?.medium || 50;
  
  const content = `
    <div style="text-align:center;margin-bottom:16px">
      <span style="font-size:48px">${meal.emoji}</span>
      <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-top:8px">${meal.name}</h3>
      <p style="color:var(--text-muted);font-size:var(--text-sm)">⏱ ${meal.prepTime}</p>
    </div>
    <div class="stat-grid stat-grid-3" style="margin-bottom:4px">
      <div class="stat-cell"><div class="stat-value" style="color:var(--aura-violet-light)">${meal.calories}</div><div class="stat-label">kcal</div></div>
      <div class="stat-cell"><div class="stat-value gradient-text-mint">${meal.protein}g</div><div class="stat-label">Protein</div></div>
      <div class="stat-cell"><div class="stat-value">${meal.carbs || 30}g</div><div class="stat-label">Carbs</div></div>
    </div>
    <p style="font-size:10px; color:var(--text-muted); text-align:center; margin:0 0 12px; font-style:italic;">*Approx. nutritional values</p>
    
    <div class="card" style="margin-bottom:12px; background:rgba(255,255,255,0.02)">
      <p class="section-label">📋 Ingredients</p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;margin-bottom:12px;">
        ${meal.ingredients || '150g raw materials, spices, water, tempering herbs.'}
      </p>
      <p class="section-label">🍳 Recipe Steps</p>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6">${meal.recipe}</p>
      <p style="font-size:10px; color:var(--text-muted); margin:10px 0 0; font-style:italic;">*Nutrition values are approximate. Actual values may vary by portion and preparation method.</p>
    </div>

    <div class="card" style="margin-bottom:12px; background:rgba(255,255,255,0.02)">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="section-label" style="margin-bottom:0;">Approx. Cost</span>
        <span style="font-weight:var(--fw-bold); color:var(--aura-amber-light);">₹${cost}</span>
      </div>
      <p style="font-size:10px; color:var(--text-muted); margin:4px 0 0; font-style:italic;">*Approx. market price</p>
    </div>

    <div class="card" style="margin-bottom:16px; background:rgba(255,255,255,0.02); text-align:center;">
      <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(meal.name + ' recipe step by step')}" target="_blank" style="color:var(--aura-violet-light); font-weight:var(--fw-semibold); text-decoration:none; font-size:var(--text-sm); display: inline-block;">
        🎥 Watch YouTube Recipe Tutorial →
      </a>
    </div>

    <button class="btn btn-primary btn-full" id="meal-detail-log">Log This Meal</button>
    <button class="btn btn-ghost btn-sm btn-full" id="meal-detail-close" style="margin-top:8px">Close</button>
  `;

  showModal({
    title: meal.name,
    content: content
  });

  document.getElementById('meal-detail-log')?.addEventListener('click', () => {
    const state = getState();
    const cal = state.nutrition?.calories || { consumed: 0, target: 2000 };
    const prot = state.nutrition?.protein || { consumed: 0, target: 150 };
    updateState('nutrition', {
      calories: { ...cal, consumed: cal.consumed + meal.calories },
      protein: { ...prot, consumed: prot.consumed + meal.protein },
    });
    showToast(`${meal.emoji} ${meal.name} logged!`, 'success');
    closeModal();
    _refreshMacros();
  });
  document.getElementById('meal-detail-close')?.addEventListener('click', closeModal);
}
