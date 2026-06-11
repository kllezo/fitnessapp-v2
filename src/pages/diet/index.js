// ==========================================
// AURA V2 — Diet Page (Input Only)
// Route: /diet
// ==========================================

import { getState, updateState, setState } from '../../state/index.js';
import { showToast, showModal, closeModal } from '../../components/shared/ui.js';
import { getFilteredMeals, calculateMacros, getDailyMealPlan, calculateCustomMacros } from '../../services/nutrition-engine.js';
import './diet.css';

let _currentIntakeView = '7d';
let _currentProteinView = '7d';

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

      <!-- Macro Trackers (Intake Only) -->
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

      <!-- Calorie Intake Details Sheet -->
      <div class="bottom-sheet-overlay" id="intake-overlay"></div>
      <div class="bottom-sheet" id="intake-sheet" style="background:#11121A; border-top:1px solid #23253A; padding: 12px 20px 32px;">
        <div class="modal-handle"></div>
        <div id="intake-sheet-content"></div>
      </div>

      <!-- Protein Details Sheet -->
      <div class="bottom-sheet-overlay" id="protein-overlay"></div>
      <div class="bottom-sheet" id="protein-sheet" style="background:#11121A; border-top:1px solid #23253A; padding: 12px 20px 32px;">
        <div class="modal-handle"></div>
        <div id="protein-sheet-content"></div>
      </div>

    </div>
  `;
}

function _macroRing(label, consumed, target, unit, color, pct) {
  const r = 40, circ = 2 * Math.PI * r;
  const idAttr = label.toLowerCase() === 'calories' ? 'id="calories-ring-wrapper" style="cursor:pointer;"' : 'id="protein-ring-wrapper" style="cursor:pointer;"';
  return `
    <div class="macro-ring-card card" ${idAttr}>
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
  // Defensive: force-close any ghost sheets
  _forceCloseAllDietSheets();
  _wireEvents();
}

export function onLeave() {
  _closeIntakeSheet();
  _closeProteinSheet();
}

function _forceCloseAllDietSheets() {
  ['intake-overlay','protein-overlay'].forEach(id => {
    document.getElementById(id)?.classList.remove('open');
  });
  ['intake-sheet','protein-sheet'].forEach(id => {
    document.getElementById(id)?.classList.remove('open');
  });
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
      
      let meal = meals.find(m => m.name === name);
      
      if (!meal && (name === 'Peanut Butter Toast' || name === 'Whey Shake & Almonds')) {
        const plan = getDailyMealPlan(state);
        meal = plan.preWorkout;
      }
      
      if (meal) _openMealDetail(meal);
    });
  });

  // Rings click events
  document.getElementById('calories-ring-wrapper')?.addEventListener('click', _openIntakeSheet);
  document.getElementById('protein-ring-wrapper')?.addEventListener('click', _openProteinSheet);
  document.getElementById('intake-overlay')?.addEventListener('click', _closeIntakeSheet);
  document.getElementById('protein-overlay')?.addEventListener('click', _closeProteinSheet);
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
  // Only re-bind macro ring clicks (not all events — prevents stacked duplicate listeners)
  document.getElementById('calories-ring-wrapper')?.addEventListener('click', _openIntakeSheet);
  document.getElementById('protein-ring-wrapper')?.addEventListener('click', _openProteinSheet);
}

// ── Calorie Intake Analytics Bottom Sheet ──

function _openIntakeSheet() {
  const overlay = document.getElementById('intake-overlay');
  const sheet = document.getElementById('intake-sheet');
  const content = document.getElementById('intake-sheet-content');
  if (!overlay || !sheet || !content) return;

  content.innerHTML = _renderIntakeSheetContent(_currentIntakeView);
  overlay.classList.add('open');
  sheet.classList.add('open');

  _wireIntakeSheetEvents();
}

function _closeIntakeSheet() {
  const overlay = document.getElementById('intake-overlay');
  const sheet = document.getElementById('intake-sheet');
  if (overlay && sheet) {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
  }
}

function _wireIntakeSheetEvents() {
  document.getElementById('intake-toggle-7d')?.addEventListener('click', () => {
    _currentIntakeView = '7d';
    const content = document.getElementById('intake-sheet-content');
    if (content) content.innerHTML = _renderIntakeSheetContent('7d');
    _wireIntakeSheetEvents();
  });
  document.getElementById('intake-toggle-30d')?.addEventListener('click', () => {
    _currentIntakeView = '30d';
    const content = document.getElementById('intake-sheet-content');
    if (content) content.innerHTML = _renderIntakeSheetContent('30d');
    _wireIntakeSheetEvents();
  });
  document.getElementById('intake-toggle-90d')?.addEventListener('click', () => {
    _currentIntakeView = '90d';
    const content = document.getElementById('intake-sheet-content');
    if (content) content.innerHTML = _renderIntakeSheetContent('90d');
    _wireIntakeSheetEvents();
  });

  // Goal selectors
  document.querySelectorAll('.diet-goal-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetGoal = btn.dataset.goal;
      _updateDietGoal(targetGoal);
      showToast(`Goal changed to ${btn.textContent.trim()}! Targets updated.`, 'success');
      
      // Refresh views
      const container = document.getElementById('page-content');
      if (container) {
        container.innerHTML = render();
        onEnter();
        _openIntakeSheet();
      }
    });
  });
}

function _updateDietGoal(targetGoal) {
  setState('onboarding.goal', targetGoal);
  setState('profile.goal', targetGoal);

  // Recalculate and update targets in state
  const newMacros = calculateMacros();
  setState('nutrition.calories.target', newMacros.calories);
  setState('nutrition.protein.target', newMacros.protein);
  setState('nutrition.water.target', newMacros.water);
  setState('profile.caloriesTarget', newMacros.calories);
  setState('profile.proteinTarget', newMacros.protein);
  setState('profile.waterTarget', newMacros.water);
}

function _renderIntakeSheetContent(view = '7d') {
  const state = getState();
  const macros = calculateMacros(state);
  const cal = state.nutrition?.calories || { consumed: 0, target: macros.calories };
  const calPct = Math.min(100, Math.round((cal.consumed / cal.target) * 100));
  const calRemaining = Math.max(0, cal.target - cal.consumed);

  const sevenActive = view === '7d' ? 'active' : '';
  const thirtyActive = view === '30d' ? 'active' : '';
  const ninetyActive = view === '90d' ? 'active' : '';

  // Calculation Transparency parameters
  const ob = state.onboarding || {};
  const weight = ob.weight || 75;
  const height = ob.height || 175;
  const age = ob.age || 25;
  const gender = ob.gender || 'male';
  const bodyFat = ob.bodyFatPct || 18;
  const activityLevel = ob.activityLevel || 'light';
  const goal = ob.goal || 'maintain';
  
  const bmi = +(weight / ((height / 100) ** 2)).toFixed(1);
  let bmr;
  if (gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }

  const multipliers = { sedentary: 1.2, light: 1.375, active: 1.55, very_active: 1.725 };
  const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.375));

  let goalAdj = 0;
  if (goal === 'build_muscle') goalAdj = 300;
  else if (goal === 'lose_fat') goalAdj = -400;
  else if (goal === 'aggressive_bulk') goalAdj = 500;
  else if (goal === 'recomposition') goalAdj = -150;
  else if (goal === 'endurance') goalAdj = 100;

  const finalTarget = tdee + goalAdj;

  // Render graph based on view
  let graphHtml = '';
  let highestConsumed = 2400;
  let weeklyAvg = 1850;

  if (view === '7d') {
    highestConsumed = Math.max(cal.consumed, 2200);
    const data = [1850, 1950, 1720, 2100, 2050, cal.consumed, 1900];
    weeklyAvg = Math.round(data.reduce((a, b) => a + b, 0) / 7);
    graphHtml = _drawIntakeSVG(data, ['M', 'T', 'W', 'T', 'F', 'S', 'S'], cal.target);
  } else if (view === '30d') {
    highestConsumed = 2300;
    const data = [1900, 1820, 2100, 2050, 1950, 2010, 2200, 1850, 1900, 2050];
    weeklyAvg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
    graphHtml = _drawIntakeSVG(data, ['W1', 'W2', 'W3', 'W4'], cal.target);
  } else {
    highestConsumed = 2450;
    const data = [1890, 1920, 1850, 2010, 1980, 2050, 2100, 1950, 1900];
    weeklyAvg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
    graphHtml = _drawIntakeSVG(data, ['M1', 'M2', 'M3'], cal.target);
  }

  const goalOptions = [
    { key: 'maintain', label: 'Maintenance' },
    { key: 'lose_fat', label: 'Cut' },
    { key: 'build_muscle', label: 'Lean Bulk' },
    { key: 'aggressive_bulk', label: 'Aggressive Bulk' },
    { key: 'recomposition', label: 'Recomposition' }
  ];

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h3 style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#FFFFFF; margin:0;">Calorie Intake</h3>
        <p style="font-size:11px; color:#8E93B8; margin:2px 0 0 0;">Intake target: <span style="font-weight:bold; color:#a78bfa;">${cal.target} kcal</span></p>
      </div>
      <div style="display:flex; background:rgba(255,255,255,0.04); padding:3px; border-radius:100px;">
        <button class="toggle-opt ${sevenActive}" id="intake-toggle-7d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '7d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '7d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">7d</button>
        <button class="toggle-opt ${thirtyActive}" id="intake-toggle-30d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '30d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '30d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">30d</button>
        <button class="toggle-opt ${ninetyActive}" id="intake-toggle-90d" style="border:none; background:transparent; padding:4px 12px; border-radius:100px; color:${view === '90d' ? '#FFFFFF' : '#8E93B8'}; background:${view === '90d' ? '#5B5CF6' : 'transparent'}; font-size:11px; font-weight:600; cursor:pointer;">90d</button>
      </div>
    </div>

    <!-- Header Stats -->
    <div class="card" style="background:rgba(255,255,255,0.02); padding:16px; margin-bottom:16px; border-radius:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:12px; color:#8E93B8;">Consumed Calories</span>
          <strong style="font-size:24px; color:#FFFFFF; display:block; margin-top:2px;">${cal.consumed} <span style="font-size:14px; font-weight:normal; color:#8E93B8;">kcal</span></strong>
        </div>
        <div style="text-align:right;">
          <span style="font-size:12px; color:#8E93B8;">Target Goal</span>
          <strong style="font-size:20px; color:#a78bfa; display:block; margin-top:2px;">${calPct}%</strong>
        </div>
      </div>
      <div style="width:100%; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden; margin-top:10px;">
        <div style="width:${calPct}%; height:100%; background:#a78bfa; border-radius:4px;"></div>
      </div>
      <div style="font-size:11px; color:#8E93B8; margin-top:10px;">
        ${calRemaining > 0 ? `🎯 ${calRemaining} kcal remaining today.` : '🏆 Daily calorie budget completed!'}
      </div>
    </div>

    <!-- Goal Selector -->
    <span class="section-label" style="display:block; margin-bottom:8px;">Diet Goal Mode</span>
    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
      ${goalOptions.map(opt => `
        <button class="btn btn-secondary diet-goal-opt ${goal === opt.key ? 'active' : ''}" 
          data-goal="${opt.key}" style="padding:10px; font-size:13px; text-align:left; display:flex; justify-content:space-between; align-items:center; background:${goal === opt.key ? 'rgba(91,92,246,0.12)' : ''}; border-color:${goal === opt.key ? '#5B5CF6' : ''};">
          <span>${opt.label}</span>
          ${goal === opt.key ? '<span style="color:#5B5CF6; font-weight:bold;">✓</span>' : ''}
        </button>
      `).join('')}
    </div>

    <!-- Calculations Transparency -->
    <span class="section-label" style="display:block; margin-bottom:8px;">Mifflin-St Jeor Calculation Transparency</span>
    <div style="display:flex; flex-direction:column; gap:12px; background:rgba(255,255,255,0.02); padding:16px; border-radius:8px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; font-size:12px;">
        <span style="color:#8E93B8;">Weight / Height</span>
        <strong style="color:#FFFFFF;">${weight} kg / ${height} cm</strong>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12px;">
        <span style="color:#8E93B8;">Age / Gender</span>
        <strong style="color:#FFFFFF;">${age} yrs / ${gender}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12px;">
        <span style="color:#8E93B8;">Body Fat % / BMI</span>
        <strong style="color:#FFFFFF;">${bodyFat}% / ${bmi}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12px;">
        <span style="color:#8E93B8;">Calculated BMR</span>
        <strong style="color:#FFFFFF;">${bmr} kcal</strong>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12px;">
        <span style="color:#8E93B8;">Activity Multiplier (TDEE)</span>
        <strong style="color:#FFFFFF;">${tdee} kcal (${activityLevel})</strong>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12px; padding-bottom:8px; border-bottom:1px dashed #23253A;">
        <span style="color:#8E93B8;">Goal Adjustment</span>
        <strong style="color:${goalAdj < 0 ? '#fda4af' : '#00E5A8'};">${goalAdj >= 0 ? '+' : ''}${goalAdj} kcal</strong>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span style="color:#FFFFFF; font-weight:bold;">Final Intake Target</span>
        <strong style="color:#a78bfa; font-size:16px;">${finalTarget} kcal</strong>
      </div>
    </div>

    <!-- Trend Graph -->
    <div class="card" style="background:#11121A; border:1px solid #23253A; padding:12px;">
      <p style="font-size:11px; color:#8E93B8; font-weight:var(--fw-bold); text-transform:uppercase; margin-bottom:8px;">Consumed Calorie Trends</p>
      ${graphHtml}
      <div style="display:flex; justify-content:space-around; font-size:9px; color:#8E93B8; margin-top:8px; border-top:1px dashed #23253A; padding-top:8px;">
        <div>Target Calories: <strong>${cal.target} kcal</strong></div>
        <div>Calories Consumed: <strong>${weeklyAvg} kcal</strong></div>
        <div>Adherence: <strong>${Math.round((weeklyAvg / cal.target) * 100)}%</strong></div>
      </div>
    </div>
  `;
}

function _drawIntakeSVG(data, labels, targetLineVal) {
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
    return `<circle cx="${x}" cy="${y}" r="3.5" fill="#a78bfa" />`;
  }).join('');

  const targetY = height - padding - ((targetLineVal - minVal) * (height - 2 * padding) / range);
  const targetLineHtml = targetLineVal > 0 ? `
    <line x1="${padding}" y1="${targetY}" x2="${width - padding}" y2="${targetY}" stroke="rgba(167, 139, 250, 0.4)" stroke-dasharray="3,3" stroke-width="1" />
    <text x="${width - padding}" y="${targetY - 2}" font-size="6.5" fill="#a78bfa" text-anchor="end">Goal: ${targetLineVal}</text>
  ` : '';

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:80px; overflow:visible;">
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.02)" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.06)" />
      
      ${targetLineHtml}
      <polyline fill="none" stroke="rgba(167, 139, 250, 0.7)" stroke-width="2" points="${points}" stroke-linecap="round" stroke-linejoin="round" />
      ${pointsHtml}
      
      ${labels.map((lbl, i) => {
        const x = padding + (i * (width - 2 * padding) / (labels.length - 1 || 1));
        return `<text x="${x}" y="${height - 2}" font-size="7.5" fill="#8E93B8" text-anchor="middle">${lbl}</text>`;
      }).join('')}
    </svg>
  `;
}

// ── Protein Details Bottom Sheet (Shared helper logic) ──

function _openProteinSheet() {
  const overlay = document.getElementById('protein-overlay');
  const sheet = document.getElementById('protein-sheet');
  const content = document.getElementById('protein-sheet-content');
  if (!overlay || !sheet || !content) return;

  content.innerHTML = _renderProteinSheetContent(_currentProteinView);
  overlay.classList.add('open');
  sheet.classList.add('open');

  _wireProteinSheetEvents();
}

function _closeProteinSheet() {
  const overlay = document.getElementById('protein-overlay');
  const sheet = document.getElementById('protein-sheet');
  if (overlay && sheet) {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
  }
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
    return `<circle cx="${x}" cy="${y}" r="3.5" fill="#10b981" />`;
  }).join('');

  const targetY = height - padding - ((targetLineVal - minVal) * (height - 2 * padding) / range);
  const targetLineHtml = targetLineVal > 0 ? `
    <line x1="${padding}" y1="${targetY}" x2="${width - padding}" y2="${targetY}" stroke="rgba(16, 185, 129, 0.4)" stroke-dasharray="3,3" stroke-width="1" />
    <text x="${width - padding}" y="${targetY - 2}" font-size="6.5" fill="#10b981" text-anchor="end">Goal: ${targetLineVal}g</text>
  ` : '';

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:80px; overflow:visible;">
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.02)" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.06)" />
      
      ${targetLineHtml}
      <polyline fill="none" stroke="rgba(16, 185, 129, 0.7)" stroke-width="2" points="${points}" stroke-linecap="round" stroke-linejoin="round" />
      ${pointsHtml}
      
      ${labels.map((lbl, i) => {
        const x = padding + (i * (width - 2 * padding) / (labels.length - 1 || 1));
        return `<text x="${x}" y="${height - 2}" font-size="7.5" fill="#8E93B8" text-anchor="middle">${lbl}</text>`;
      }).join('')}
    </svg>
  `;
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
