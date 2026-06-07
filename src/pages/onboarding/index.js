// ==========================================
// AURA V2 — Onboarding Page (12 Steps)
// ==========================================

import { getState, updateState, setState, saveState } from '../../state/index.js';
import { navigate } from '../../router.js';
import { showToast } from '../../components/shared/ui.js';
import { generateWeeklyPlan } from '../../services/workout-engine.js';
import { calculateMacros } from '../../services/nutrition-engine.js';
import './onboarding.css';

let _step = 0;
const TOTAL_STEPS = 12;

const STEPS = [
  { id: 'personal', title: 'About You', subtitle: 'Let\'s personalise your experience' },
  { id: 'goals', title: 'Your Goal', subtitle: 'What are you training for?' },
  { id: 'experience', title: 'Your Level', subtitle: 'Where are you right now?' },
  { id: 'mode', title: 'Workout Mode', subtitle: 'Where do you train?' },
  { id: 'equipment', title: 'Your Equipment', subtitle: 'What do you have access to?' },
  { id: 'training_days', title: 'Training Days', subtitle: 'How many days per week?' },
  { id: 'split', title: 'Split Style', subtitle: 'How do you want to structure training?' },
  { id: 'diet', title: 'Diet & Nutrition', subtitle: 'Your food preferences' },
  { id: 'lifestyle', title: 'Lifestyle', subtitle: 'Budget & living situation' },
  { id: 'muscles', title: 'Muscle Focus', subtitle: 'What do you want to prioritise?' },
  { id: 'accountability', title: 'Accountability', subtitle: 'Do you want a training partner?' },
  { id: 'complete', title: 'You\'re all set', subtitle: 'AURA is ready for you' },
];

export function render() {
  return `
    <div class="ob-page" id="ob-page">
      <div class="ob-header">
        <div class="ob-progress-bar">
          <div class="ob-progress-fill" id="ob-progress-fill" style="width:0%"></div>
        </div>
        <div class="ob-step-label" id="ob-step-label">Step 1 of ${TOTAL_STEPS}</div>
      </div>

      <div class="ob-content" id="ob-content">
        ${_renderStep(_step)}
      </div>

      <div class="ob-footer">
        <button class="btn btn-ghost btn-sm" id="ob-back" style="display:none">← Back</button>
        <button class="btn btn-primary ob-next-btn" id="ob-next">
          ${_step === TOTAL_STEPS - 1 ? 'Start Training 🚀' : 'Continue →'}
        </button>
      </div>
    </div>
  `;
}

function _renderStep(step) {
  switch (step) {
    case 0: return _stepPersonal();
    case 1: return _stepGoals();
    case 2: return _stepExperience();
    case 3: return _stepMode();
    case 4: return _stepEquipment();
    case 5: return _stepTrainingDays();
    case 6: return _stepSplit();
    case 7: return _stepDiet();
    case 8: return _stepLifestyle();
    case 9: return _stepMuscles();
    case 10: return _stepAccountability();
    case 11: return _stepComplete();
    default: return _stepPersonal();
  }
}

function _stepPersonal() {
  const s = getState().onboarding;
  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[0].title}</h2>
      <p class="ob-subtitle">${STEPS[0].subtitle}</p>
      <div class="ob-fields">
        <div class="ob-field-row">
          <div class="ob-field">
            <label class="field-label">Age</label>
            <input class="input" id="ob-age" type="number" placeholder="25" min="14" max="80" value="${s.age || ''}" />
          </div>
          <div class="ob-field">
            <label class="field-label">Gender</label>
            <select class="input" id="ob-gender">
              <option value="">Select</option>
              <option value="male" ${s.gender === 'male' ? 'selected' : ''}>Male</option>
              <option value="female" ${s.gender === 'female' ? 'selected' : ''}>Female</option>
              <option value="other" ${s.gender === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </div>
        <div class="ob-field-row">
          <div class="ob-field">
            <label class="field-label">Weight (kg)</label>
            <input class="input" id="ob-weight" type="number" placeholder="70" min="30" max="200" value="${s.weight || ''}" />
          </div>
          <div class="ob-field">
            <label class="field-label">Height (cm)</label>
            <input class="input" id="ob-height" type="number" placeholder="175" min="100" max="250" value="${s.height || ''}" />
          </div>
        </div>
        <div class="ob-field">
          <label class="field-label">Activity Level</label>
          <select class="input" id="ob-activity">
            <option value="">Select level</option>
            <option value="sedentary" ${s.activityLevel === 'sedentary' ? 'selected' : ''}>Sedentary (desk job)</option>
            <option value="light" ${s.activityLevel === 'light' ? 'selected' : ''}>Lightly active (some walking)</option>
            <option value="active" ${s.activityLevel === 'active' ? 'selected' : ''}>Active (regular exercise)</option>
            <option value="very_active" ${s.activityLevel === 'very_active' ? 'selected' : ''}>Very active (athlete / field work)</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

function _stepGoals() {
  const s = getState().onboarding;
  const currentGoals = Array.isArray(s.goal) ? s.goal : (s.goal ? [s.goal] : []);
  const goals = [
    { id: 'build_muscle', emoji: '💪', label: 'Build Muscle', sub: 'Strength & size' },
    { id: 'lose_fat', emoji: '🔥', label: 'Lose Fat', sub: 'Cut & lean out' },
    { id: 'maintain', emoji: '⚖️', label: 'Maintain', sub: 'Stay consistent' },
    { id: 'endurance', emoji: '🏃', label: 'Endurance', sub: 'Stamina & cardio' },
    { id: 'flexibility', emoji: '🧘', label: 'Flexibility', sub: 'Mobility & recovery' },
  ];
  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[1].title}</h2>
      <p class="ob-subtitle">${STEPS[1].subtitle}</p>
      <p class="ob-hint">Select all that apply</p>
      <div class="selector-grid selector-grid-2" id="goals-grid">
        ${goals.map(g => `
          <button class="selector-card ob-multi-select ${currentGoals.includes(g.id) ? 'selected' : ''}"
            data-field="goal" data-val="${g.id}">
            <span class="card-emoji">${g.emoji}</span>
            <span class="card-label">${g.label}</span>
            <span class="card-sub">${g.sub}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function _stepExperience() {
  const s = getState().onboarding;
  const opts = [
    { id: 'beginner', emoji: '🌱', label: 'Beginner', sub: 'Under 6 months training' },
    { id: 'returning', emoji: '↩️', label: 'Returning', sub: 'Coming back after a break' },
    { id: 'experienced', emoji: '⚡', label: 'Experienced', sub: '2+ years consistent training' },
  ];
  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[2].title}</h2>
      <p class="ob-subtitle">${STEPS[2].subtitle}</p>
      <div class="selector-grid" id="exp-grid">
        ${opts.map(o => `
          <button class="selector-card ob-select ${s.experience === o.id ? 'selected' : ''}"
            data-field="experience" data-val="${o.id}">
            <span class="card-emoji">${o.emoji}</span>
            <span class="card-label">${o.label}</span>
            <span class="card-sub">${o.sub}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function _stepMode() {
  const s = getState().onboarding;
  const modes = [
    { id: 'gym', emoji: '🏋️', label: 'Gym', sub: 'Full equipment access' },
    { id: 'home', emoji: '🏠', label: 'Home', sub: 'Bodyweight & minimal gear' },
  ];
  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[3].title}</h2>
      <p class="ob-subtitle">${STEPS[3].subtitle}</p>
      <div class="selector-grid selector-grid-2" id="mode-grid">
        ${modes.map(m => `
          <button class="selector-card ob-select ${s.workoutMode === m.id ? 'selected' : ''}"
            data-field="workoutMode" data-val="${m.id}" style="padding:24px 16px">
            <span class="card-emoji" style="font-size:40px">${m.emoji}</span>
            <span class="card-label">${m.label}</span>
            <span class="card-sub">${m.sub}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function _stepEquipment() {
  const s = getState().onboarding;
  const eq = s.equipment || [];
  const opts = [
    { id: 'full_gym', emoji: '🏢', label: 'Full Gym' },
    { id: 'dumbbells', emoji: '🏋️', label: 'Dumbbells' },
    { id: 'barbell', emoji: '⚖️', label: 'Barbell' },
    { id: 'bench', emoji: '🪑', label: 'Bench' },
    { id: 'cable_machine', emoji: '🔩', label: 'Cable Machine' },
    { id: 'smith_machine', emoji: '🔧', label: 'Smith Machine' },
    { id: 'pullup_bar', emoji: '⬆️', label: 'Pullup Bar' },
    { id: 'resistance_bands', emoji: '🔗', label: 'Resistance Bands' },
    { id: 'kettlebells', emoji: '⚫', label: 'Kettlebells' },
    { id: 'yoga_mat', emoji: '🟩', label: 'Yoga Mat' },
    { id: 'cardio_machines', emoji: '🏃', label: 'Cardio Machines' },
    { id: 'bodyweight', emoji: '🤸', label: 'Bodyweight Only' },
  ];

  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[4].title}</h2>
      <p class="ob-subtitle">${STEPS[4].subtitle}</p>
      <p class="ob-hint">Select all that apply</p>
      <div class="selector-grid selector-grid-3" id="eq-grid">
        ${opts.map(o => `
          <button class="selector-card ob-multi-select ${eq.includes(o.id) ? 'selected' : ''}"
            data-field="equipment" data-val="${o.id}">
            <span class="card-emoji">${o.emoji}</span>
            <span class="card-label">${o.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function _stepTrainingDays() {
  const s = getState().onboarding;
  const days = [2, 3, 4, 5, 6, 7];
  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[5].title}</h2>
      <p class="ob-subtitle">${STEPS[5].subtitle}</p>
      <div class="selector-grid selector-grid-3" id="days-grid">
        ${days.map(d => `
          <button class="selector-card ob-select ${s.trainingDays === d ? 'selected' : ''}"
            data-field="trainingDays" data-val="${d}">
            <span class="card-emoji" style="font-size:32px;font-weight:800;color:var(--text-primary)">${d}</span>
            <span class="card-label">day${d > 1 ? 's' : ''}/wk</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function _stepSplit() {
  const s = getState().onboarding;
  const splits = [
    { id: 'ppl', emoji: '🔄', label: 'Push/Pull/Legs', sub: 'Classic 6-day structure' },
    { id: 'upper_lower', emoji: '↕️', label: 'Upper/Lower', sub: '4-day balanced split' },
    { id: 'full_body', emoji: '🌐', label: 'Full Body', sub: '3-day all-round' },
    { id: 'bro_split', emoji: '💪', label: 'Bro Split', sub: 'One muscle per day' },
  ];
  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[6].title}</h2>
      <p class="ob-subtitle">${STEPS[6].subtitle}</p>
      <div class="selector-grid selector-grid-2" id="split-grid">
        ${splits.map(sp => `
          <button class="selector-card ob-select ${s.splitPreference === sp.id ? 'selected' : ''}"
            data-field="splitPreference" data-val="${sp.id}">
            <span class="card-emoji">${sp.emoji}</span>
            <span class="card-label">${sp.label}</span>
            <span class="card-sub">${sp.sub}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function _stepDiet() {
  const s = getState().onboarding;
  const diets = [
    { id: 'veg', emoji: '🥦', label: 'Vegetarian', sub: 'Plant-based, no meat/eggs' },
    { id: 'egg', emoji: '🥚', label: 'Eggitarian', sub: 'Veg + eggs allowed' },
    { id: 'nonveg', emoji: '🍗', label: 'Non-Veg', sub: 'All proteins included' },
  ];
  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[7].title}</h2>
      <p class="ob-subtitle">${STEPS[7].subtitle}</p>
      <div class="selector-grid" id="diet-grid">
        ${diets.map(d => `
          <button class="selector-card ob-select ${s.dietType === d.id ? 'selected' : ''}"
            data-field="dietType" data-val="${d.id}">
            <span class="card-emoji">${d.emoji}</span>
            <span class="card-label">${d.label}</span>
            <span class="card-sub">${d.sub}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function _stepLifestyle() {
  const s = getState().onboarding;
  const budgets = [
    { id: 'low', emoji: '💰', label: 'Budget', sub: 'Under ₹200/day' },
    { id: 'medium', emoji: '💵', label: 'Moderate', sub: '₹200–500/day' },
    { id: 'premium', emoji: '💎', label: 'Premium', sub: '₹500+/day' },
  ];
  const stays = [
    { id: 'hostel', emoji: '🏠', label: 'Hostel/PG', sub: 'Shared kitchen/mess' },
    { id: 'home', emoji: '🏡', label: 'Family Home', sub: 'Full kitchen access' },
    { id: 'alone', emoji: '🛋️', label: 'Living Alone', sub: 'Solo cooking' },
  ];
  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[8].title}</h2>
      <p class="ob-subtitle">${STEPS[8].subtitle}</p>
      <p class="ob-section-label">Daily food budget</p>
      <div class="selector-grid selector-grid-3" id="budget-grid">
        ${budgets.map(b => `
          <button class="selector-card ob-select ${s.budget === b.id ? 'selected' : ''}"
            data-field="budget" data-val="${b.id}">
            <span class="card-emoji">${b.emoji}</span>
            <span class="card-label">${b.label}</span>
            <span class="card-sub">${b.sub}</span>
          </button>
        `).join('')}
      </div>
      <p class="ob-section-label" style="margin-top:16px">Living situation</p>
      <div class="selector-grid selector-grid-3" id="stay-grid">
        ${stays.map(st => `
          <button class="selector-card ob-select ${s.stayType === st.id ? 'selected' : ''}"
            data-field="stayType" data-val="${st.id}">
            <span class="card-emoji">${st.emoji}</span>
            <span class="card-label">${st.label}</span>
            <span class="card-sub">${st.sub}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function _stepMuscles() {
  const s = getState().onboarding;
  const muscles = [
    { id: 'chest', emoji: '💪', label: 'Chest' },
    { id: 'back', emoji: '🦅', label: 'Back' },
    { id: 'shoulders', emoji: '🔱', label: 'Shoulders' },
    { id: 'arms', emoji: '💪', label: 'Arms' },
    { id: 'legs', emoji: '🦵', label: 'Legs' },
    { id: 'core', emoji: '⚡', label: 'Core' },
    { id: 'abs', emoji: '🍫', label: 'Abs' },
    { id: 'forearms', emoji: '✊', label: 'Forearms' },
    { id: 'glutes', emoji: '🍑', label: 'Glutes' },
    { id: 'calves', emoji: '🦵', label: 'Calves' },
    { id: 'full_body', emoji: '🌐', label: 'Full Body' },
  ];
  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[9].title}</h2>
      <p class="ob-subtitle">${STEPS[9].subtitle}</p>
      <p class="ob-section-label">Primary focus</p>
      <div class="selector-grid selector-grid-3" id="primary-grid">
        ${muscles.map(m => `
          <button class="selector-card ob-select ${s.primaryMuscle === m.id ? 'selected' : ''}"
            data-field="primaryMuscle" data-val="${m.id}">
            <span class="card-emoji">${m.emoji}</span>
            <span class="card-label">${m.label}</span>
          </button>
        `).join('')}
      </div>
      <p class="ob-section-label" style="margin-top:16px">Secondary focus</p>
      <div class="selector-grid selector-grid-3" id="secondary-grid">
        ${muscles.map(m => `
          <button class="selector-card ob-select ${s.secondaryMuscle === m.id ? 'selected' : ''}"
            data-field="secondaryMuscle" data-val="${m.id}">
            <span class="card-emoji">${m.emoji}</span>
            <span class="card-label">${m.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function _stepAccountability() {
  const s = getState().onboarding;
  const opts = [
    { id: true, emoji: '🤝', label: 'Yes, match me', sub: 'Find a training partner' },
    { id: false, emoji: '🎯', label: 'Solo for now', sub: 'I train alone' },
  ];
  return `
    <div class="ob-step anim-fade-in">
      <h2 class="ob-title">${STEPS[10].title}</h2>
      <p class="ob-subtitle">${STEPS[10].subtitle}</p>
      <div class="selector-grid selector-grid-2" id="acc-grid">
        ${opts.map(o => `
          <button class="selector-card ob-select ${s.wantsPartner === o.id ? 'selected' : ''}"
            data-field="wantsPartner" data-val="${o.id}">
            <span class="card-emoji" style="font-size:36px">${o.emoji}</span>
            <span class="card-label">${o.label}</span>
            <span class="card-sub">${o.sub}</span>
          </button>
        `).join('')}
      </div>
      <div class="card" style="margin-top:16px;background:rgba(124,58,237,0.08);border-color:rgba(124,58,237,0.2)">
        <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6">
          ✦ AURA matches you with someone on a similar transformation path — same goals, similar schedule, compatible lifestyle.
        </p>
      </div>
    </div>
  `;
}

function _stepComplete() {
  const s = getState().onboarding;
  const macros = calculateMacros(getState());
  return `
    <div class="ob-step ob-complete anim-scale-in">
      <div class="complete-emblem">
        <div class="complete-ring"></div>
        <span class="complete-icon">✦</span>
      </div>
      <h2 class="ob-title">AURA is ready</h2>
      <p class="ob-subtitle">Your personalised fitness OS is built</p>

      <div class="complete-stats">
        <div class="complete-stat">
          <span class="complete-stat-val">${macros.calories}</span>
          <span class="complete-stat-label">Daily Calories</span>
        </div>
        <div class="complete-stat">
          <span class="complete-stat-val">${macros.protein}g</span>
          <span class="complete-stat-label">Protein Target</span>
        </div>
        <div class="complete-stat">
          <span class="complete-stat-val">${macros.water}L</span>
          <span class="complete-stat-label">Daily Water</span>
        </div>
      </div>

      <div class="complete-items">
        <div class="complete-item">✓ Personalised workout split generated</div>
        <div class="complete-item">✓ Nutrition targets calculated</div>
        <div class="complete-item">✓ AI coaching system ready</div>
        ${s.wantsPartner ? '<div class="complete-item">✓ Accountability matching enabled</div>' : ''}
      </div>
    </div>
  `;
}

export function onEnter() {
  _step = getState().onboarding?.currentStep || 0;
  _updateProgress();
  _wireEvents();
}

export function onLeave() {}

function _updateProgress() {
  const fill = document.getElementById('ob-progress-fill');
  const label = document.getElementById('ob-step-label');
  if (fill) fill.style.width = `${((_step) / TOTAL_STEPS) * 100}%`;
  if (label) label.textContent = `Step ${_step + 1} of ${TOTAL_STEPS}`;

  const backBtn = document.getElementById('ob-back');
  const nextBtn = document.getElementById('ob-next');
  if (backBtn) backBtn.style.display = _step > 0 ? 'flex' : 'none';
  if (nextBtn) nextBtn.textContent = _step === TOTAL_STEPS - 1 ? 'Start Training 🚀' : 'Continue →';
}

function _goToStep(step) {
  _step = Math.min(Math.max(0, step), TOTAL_STEPS - 1);
  const content = document.getElementById('ob-content');
  if (content) {
    content.style.opacity = '0';
    content.style.transform = 'translateX(12px)';
    setTimeout(() => {
      content.innerHTML = _renderStep(_step);
      content.style.transition = 'all 220ms var(--ease-out)';
      content.style.opacity = '1';
      content.style.transform = 'translateX(0)';
      _wireEvents();
      _updateProgress();
      setState('onboarding.currentStep', _step);
    }, 150);
  }
}

function _wireEvents() {
  // Single-select cards
  document.querySelectorAll('.ob-select').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      const val = btn.dataset.val;
      const parsedVal = val === 'true' ? true : val === 'false' ? false : isNaN(val) ? val : Number(val);

      // Deselect siblings in same grid
      btn.closest('.selector-grid')?.querySelectorAll('.ob-select').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      setState(`onboarding.${field}`, parsedVal);

      // Auto-advance if single-select step
      const autoAdvanceSteps = [2, 3, 5, 6, 7, 10];
      if (autoAdvanceSteps.includes(_step)) {
        setTimeout(() => {
          _goToStep(_step + 1);
        }, 300);
      }
    });
  });

  // Multi-select cards (goals, equipment)
  document.querySelectorAll('.ob-multi-select').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      const field = btn.dataset.field;
      const grid = btn.closest('.selector-grid');
      const vals = [...grid.querySelectorAll('.ob-multi-select.selected')].map(b => b.dataset.val);
      setState(`onboarding.${field}`, vals);
    });
  });

  // Navigation
  document.getElementById('ob-next')?.addEventListener('click', _handleNext);
  document.getElementById('ob-back')?.addEventListener('click', () => _goToStep(_step - 1));
}

function _handleNext() {
  const state = getState();

  // Validate key steps
  if (_step === 0) {
    const age = document.getElementById('ob-age')?.value;
    const weight = document.getElementById('ob-weight')?.value;
    const height = document.getElementById('ob-height')?.value;
    const gender = document.getElementById('ob-gender')?.value;
    const activity = document.getElementById('ob-activity')?.value;

    if (!age || !weight || !height || !gender || !activity) {
      showToast('Please fill all fields', 'error');
      return;
    }
    updateState('onboarding', {
      age: Number(age), weight: Number(weight), height: Number(height), gender, activityLevel: activity
    });
  }

  if (_step === TOTAL_STEPS - 1) {
    _completeOnboarding();
    return;
  }

  _goToStep(_step + 1);
}

function _completeOnboarding() {
  const btn = document.getElementById('ob-next');
  if (btn) { btn.textContent = 'Setting up...'; btn.disabled = true; }

  // Generate initial plan
  const state = getState();
  generateWeeklyPlan(state);

  // Calculate macros and save to nutrition state
  const macros = calculateMacros(state);
  updateState('nutrition', {
    calories: { target: macros.calories, consumed: 0 },
    protein: { target: macros.protein, consumed: 0 },
    water: { target: macros.water, consumed: 0 },
  });

  setState('onboarding.completed', true);
  saveState();

  setTimeout(() => navigate('/home', true), 600);
}

