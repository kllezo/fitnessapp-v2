// ==========================================
// AURA V2 — Settings Page
// Route: /settings
// ==========================================

import { getState, setState, updateState, resetState } from '../../state/index.js';
import { navigate } from '../../router.js';
import { showToast, showModal, openBottomSheet, closeActiveBottomSheet } from '../../components/shared/ui.js';
import { themeManager, THEMES, THEME_ORDER } from '../../services/theme-engine.js';
import './settings.css';

export function render() {
  const state = getState();
  const ob = state.onboarding;
  const auth = state.auth;

  return `
    <div class="settings-page">
      <div class="page-header">
        <button class="icon-btn" id="back-btn" aria-label="Back">←</button>
        <h1 class="page-title">Settings</h1>
        <div style="width:36px"></div>
      </div>

      <!-- Account -->
      <div class="settings-section">
        <div class="settings-section-title">Account</div>
        <div class="settings-group card">
          ${_settingRow('profile-row', '👤', 'Edit Profile', auth?.profileName || 'Set name', 'nav')}
          ${_settingRow('username-row', '@', 'Username', `@${auth?.username || 'not set'}`, 'nav')}
          ${_settingRow('password-row', '🔒', 'Change Password', '••••••••', 'nav')}
        </div>
      </div>

      <!-- Training Preferences -->
      <div class="settings-section">
        <div class="settings-section-title">Training</div>
        <div class="settings-group card">
          ${_settingRow('goal-row', '🎯', 'Goal', (() => {
            const map = { build_muscle: 'Build Muscle', lose_fat: 'Lose Fat', maintain: 'Maintain', endurance: 'Endurance', flexibility: 'Flexibility' };
            if (Array.isArray(ob?.goal)) return ob.goal.map(g => map[g]).filter(Boolean).join(' + ') || 'Not set';
            return map[ob?.goal] || 'Not set';
          })(), 'nav')}
          ${_settingRow('mode-row', '🏋️', 'Workout Mode', ob?.workoutMode === 'gym' ? 'Gym' : ob?.workoutMode === 'home' ? 'Home' : 'Not set', 'nav')}
          ${_settingRow('days-row', '📅', 'Training Days', ob?.trainingDays ? `${ob.trainingDays} days/week` : 'Not set', 'nav')}
          ${_settingRow('split-row', '🔄', 'Split Preference', ob?.splitPreference?.replace('_', '/').toUpperCase() || 'Not set', 'nav')}
          ${_settingRow('regen-row', '✨', 'Regenerate Plan', 'Get a fresh workout plan', 'action')}
        </div>
      </div>

      <!-- Nutrition -->
      <div class="settings-section">
        <div class="settings-section-title">Nutrition</div>
        <div class="settings-group card">
          ${_settingRow('diet-row', '🥗', 'Diet Type', { veg: 'Vegetarian', egg: 'Eggitarian', nonveg: 'Non-Veg' }[ob?.dietType] || 'Not set', 'nav')}
          ${_settingRow('budget-row', '💰', 'Food Budget', { low: 'Budget (< ₹200)', medium: 'Moderate (₹200–500)', premium: 'Premium (₹500+)' }[ob?.budget] || 'Not set', 'nav')}
          ${_settingRow('reset-calories-row', '🔄', 'Reset Daily Macros', 'Clear today\'s food log', 'action')}
        </div>
      </div>

      <!-- Notifications -->
      <div class="settings-section">
        <div class="settings-section-title">Notifications</div>
        <div class="settings-group card">
          ${_toggleRow('notif-workout', '🏋️', 'Workout Reminders', state.settings?.notifWorkout !== false)}
          ${_toggleRow('notif-nutrition', '🥗', 'Nutrition Reminders', state.settings?.notifNutrition !== false)}
          ${_toggleRow('notif-partner', '🤝', 'Partner Activity', state.settings?.notifPartner !== false)}
          ${_toggleRow('notif-recovery', '💤', 'Recovery Prompts', state.settings?.notifRecovery !== false)}
        </div>
      </div>

      <!-- App -->
      <div class="settings-section">
        <div class="settings-section-title">App</div>
        <div class="settings-group card">
          ${_settingRow('export-row', '📤', 'Export Data', 'Download your fitness history', 'action')}
          ${_settingRow('redo-onboarding-row', '🔁', 'Redo Onboarding', 'Update your profile from scratch', 'action')}
          ${_settingRow('logout-row', '🚪', 'Logout', '', 'action')}
          ${_settingRow('delete-row', '⚠️', 'Delete Account', 'This cannot be undone', 'danger')}
        </div>
      </div>

      <!-- Appearance -->
      <div class="settings-section">
        <div class="settings-section-title">Appearance</div>
        <div class="settings-group card">
          <div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:12px;padding:14px 16px;">
            <div style="display:flex;align-items:center;gap:10px;width:100%;">
              <span class="setting-icon">🎨</span>
              <div class="setting-info">
                <span class="setting-label">App Theme</span>
                <span class="setting-value" id="current-theme-name">${THEMES[themeManager.currentTheme]?.name || 'Deep Indigo'}</span>
              </div>
            </div>
            <!-- Theme swatch grid -->
            <div style="display:flex;gap:8px;flex-wrap:wrap;width:100%;padding-left:36px;">
              ${THEME_ORDER.map(id => {
                const t = THEMES[id];
                const isActive = themeManager.currentTheme === id;
                return `
                  <button id="theme-swatch-${id}" data-theme="${id}" class="theme-swatch ${isActive ? 'active' : ''}" aria-label="${t.name}" title="${t.name}" style="
                    width:32px;height:32px;border-radius:50%;
                    background:linear-gradient(135deg, ${t.colors.primary}, ${t.colors.background});
                    border:2px solid ${isActive ? t.colors.primary : 'transparent'};
                    outline:${isActive ? `3px solid ${t.colors.primary}44` : 'none'};
                    cursor:pointer;padding:0;transition:transform 200ms ease,outline 200ms ease;
                  "></button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <p class="settings-version">AURA V2 · Adaptive Fitness OS</p>
    </div>
  `;
}

function _settingRow(id, icon, label, value, type) {
  return `
    <div class="setting-row ${type}" id="${id}">
      <span class="setting-icon">${icon}</span>
      <div class="setting-info">
        <span class="setting-label">${label}</span>
        ${value ? `<span class="setting-value">${value}</span>` : ''}
      </div>
      ${type !== 'danger' ? `<span class="setting-arrow">›</span>` : `<span class="setting-arrow danger-arrow">›</span>`}
    </div>
  `;
}

function _toggleRow(id, icon, label, checked) {
  return `
    <div class="setting-row toggle-row">
      <span class="setting-icon">${icon}</span>
      <span class="setting-label setting-label-full">${label}</span>
      <button class="toggle-btn ${checked ? 'on' : ''}" id="${id}" aria-checked="${checked}" role="switch">
        <div class="toggle-thumb"></div>
      </button>
    </div>
  `;
}

export function onEnter() {
  closeActiveBottomSheet(true);
  _wireEvents();
}

export function onLeave() {
  closeActiveBottomSheet(true);
}

function _wireEvents() {
  document.getElementById('back-btn')?.addEventListener('click', () => navigate('/home'));

  // Theme swatches
  document.querySelectorAll('.theme-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.theme;
      themeManager.setTheme(themeId, true);

      // Update active swatch states
      document.querySelectorAll('.theme-swatch').forEach(b => {
        const t = THEMES[b.dataset.theme];
        const isNowActive = b.dataset.theme === themeId;
        b.style.border = `2px solid ${isNowActive ? t.colors.primary : 'transparent'}`;
        b.style.outline = isNowActive ? `3px solid ${t.colors.primary}44` : 'none';
        b.style.transform = isNowActive ? 'scale(1.15)' : 'scale(1)';
        b.classList.toggle('active', isNowActive);
      });

      // Update label
      const label = document.getElementById('current-theme-name');
      if (label) label.textContent = THEMES[themeId]?.name || themeId;

      showToast(`Theme: ${THEMES[themeId]?.name} applied`, 'success');
    });
  });

  // Nav rows that open sub-sheets
  document.getElementById('profile-row')?.addEventListener('click', () => navigate('/profile'));
  document.getElementById('goal-row')?.addEventListener('click', () => _openGoalSheet());
  document.getElementById('mode-row')?.addEventListener('click', () => _openModeSheet());
  document.getElementById('days-row')?.addEventListener('click', () => _openDaysSheet());

  // Actions
  document.getElementById('regen-row')?.addEventListener('click', () => {
    import('../../services/workout-engine.js').then(({ generateWeeklyPlan }) => {
      generateWeeklyPlan(getState());
      showToast('Plan regenerated ✦', 'violet');
    });
  });

  document.getElementById('reset-calories-row')?.addEventListener('click', () => {
    const state = getState();
    const macros = state.nutrition;
    setState('nutrition.calories', { ...macros?.calories, consumed: 0 });
    setState('nutrition.protein', { ...macros?.protein, consumed: 0 });
    showToast('Daily macros reset ✓', 'success');
  });

  document.getElementById('export-row')?.addEventListener('click', _exportData);

  document.getElementById('redo-onboarding-row')?.addEventListener('click', () => {
    setState('onboarding.completed', false);
    setState('onboarding.currentStep', 0);
    navigate('/onboarding', true);
  });

  document.getElementById('logout-row')?.addEventListener('click', () => {
    setState('auth.isLoggedIn', false);
    navigate('/auth', true);
  });

  document.getElementById('delete-row')?.addEventListener('click', () => {
    showModal({
      title: 'Delete Account?',
      content: '<p style="color:var(--text-muted);font-size:var(--text-sm);line-height:1.6">All your data will be permanently erased. This cannot be undone.</p>',
      actions: [
        {
          label: 'Delete Everything',
          style: 'btn-primary',
          action: () => { resetState(); navigate('/auth', true); },
        },
        {
          label: 'Keep Account',
          style: 'btn-ghost',
        },
      ],
    });
  });

  // Toggles
  ['notif-workout', 'notif-nutrition', 'notif-partner', 'notif-recovery'].forEach(id => {
    const btn = document.getElementById(id);
    btn?.addEventListener('click', () => {
      const isOn = btn.classList.toggle('on');
      btn.setAttribute('aria-checked', isOn);
      const key = id.replace('notif-', '').replace('-', '');
      setState(`settings.notif${key.charAt(0).toUpperCase() + key.slice(1)}`, isOn);
    });
  });
}

// ── Goal Sheet ──
function _openGoalSheet() {
  const state = getState();
  const goals = [
    { id: 'build_muscle', label: '💪 Build Muscle' },
    { id: 'lose_fat', label: '🔥 Lose Fat' },
    { id: 'maintain', label: '⚖️ Maintain' },
    { id: 'endurance', label: '🏃 Endurance' },
    { id: 'flexibility', label: '🧘 Flexibility' },
  ];
  _openInlineSheet('Change Goal', goals.map(g => `
    <button class="setting-option-btn ${state.onboarding?.goal === g.id ? 'selected' : ''}"
      data-val="${g.id}" data-field="goal">${g.label}</button>
  `).join(''), 'onboarding.goal');
}

function _openModeSheet() {
  const state = getState();
  const modes = [{ id: 'gym', label: '🏋️ Gym' }, { id: 'home', label: '🏠 Home' }];
  _openInlineSheet('Workout Mode', modes.map(m => `
    <button class="setting-option-btn ${state.onboarding?.workoutMode === m.id ? 'selected' : ''}"
      data-val="${m.id}" data-field="workoutMode">${m.label}</button>
  `).join(''), 'onboarding.workoutMode');
}

function _openDaysSheet() {
  const state = getState();
  const days = [2, 3, 4, 5, 6];
  _openInlineSheet('Training Days/Week', days.map(d => `
    <button class="setting-option-btn ${state.onboarding?.trainingDays === d ? 'selected' : ''}"
      data-val="${d}" data-field="trainingDays">${d} days</button>
  `).join(''), 'onboarding.trainingDays');
}

function _openInlineSheet(title, optionsHtml, stateKey) {
  const content = `
    <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-bottom:16px">${title}</h3>
    <div class="setting-options-grid">${optionsHtml}</div>
    <button class="btn btn-ghost btn-sm btn-full" id="close-inline-sheet" style="margin-top:12px">Close</button>
  `;

  openBottomSheet({
    id: 'settings-inline',
    content: content
  });

  document.querySelectorAll('.setting-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const raw = btn.dataset.val;
      const val = isNaN(raw) ? raw : Number(raw);
      setState(stateKey, val);
      document.querySelectorAll('.setting-option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      showToast('Setting updated ✓', 'success');
      closeActiveBottomSheet();
    });
  });

  document.getElementById('close-inline-sheet')?.addEventListener('click', () => {
    closeActiveBottomSheet();
  });
}

function _exportData() {
  const state = getState();
  const exportData = {
    profile: state.auth,
    onboarding: state.onboarding,
    workoutHistory: state.workout?.history || [],
    personalRecords: state.workout?.prs || {},
    checkIns: state.checkIn?.history || [],
    exportDate: new Date().toISOString(),
  };
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aura-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported ✓', 'success');
}
