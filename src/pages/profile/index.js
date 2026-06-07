// ==========================================
// AURA V2 — Profile Page
// Route: /profile
// ==========================================

import { getState, setState, updateState, getDisciplineScore } from '../../state/index.js';
import { showToast } from '../../components/shared/ui.js';
import { navigate } from '../../router.js';
import './profile.css';

let _editing = false;

export function render() {
  const state = getState();
  const auth = state.auth;
  const ob = state.onboarding;
  const discipline = getDisciplineScore(state);
  const streak = state.workout?.streakDays || 0;
  const workouts = state.workout?.history?.length || 0;
  const getGoalLabel = (gVal) => {
    const map = { build_muscle: 'Build Muscle 💪', lose_fat: 'Lose Fat 🔥', maintain: 'Maintain ⚖️', endurance: 'Endurance 🏃', flexibility: 'Flexibility 🧘' };
    if (Array.isArray(gVal)) return gVal.map(g => map[g]).filter(Boolean).join(' + ') || 'Training';
    return map[gVal] || 'Training';
  };
  const goalLabel = getGoalLabel(ob?.goal);

  return `
    <div class="profile-page">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">Profile</h1>
        <button class="btn btn-sm btn-secondary" id="settings-btn">⚙ Settings</button>
      </div>

      <!-- Avatar & Identity -->
      <div class="profile-hero">
        <div class="profile-avatar-wrap" id="avatar-wrap">
          ${auth?.avatar
            ? `<img src="${auth.avatar}" class="profile-avatar-img" alt="Avatar"/>`
            : `<div class="profile-avatar-placeholder">${(auth?.profileName?.[0] || 'A').toUpperCase()}</div>`
          }
          <button class="avatar-edit-btn" id="avatar-edit-btn">📷</button>
          <input type="file" id="avatar-input" accept="image/*" class="hidden" />
        </div>
        <div class="profile-identity">
          <h2 class="profile-name" id="profile-name-display">${auth?.profileName || 'Athlete'}</h2>
          <p class="profile-username">@${auth?.username || 'athlete'}</p>
          <p class="profile-bio" id="profile-bio-display">${auth?.bio || 'No bio yet — tap Edit to add one'}</p>
          <button class="btn btn-sm btn-secondary" id="edit-profile-btn" style="margin-top:8px">Edit Profile</button>
        </div>
      </div>

      <!-- Discipline Score -->
      <div class="profile-section">
        <div class="discipline-card card card-glow">
          <div class="discipline-header">
            <div>
              <p class="section-label">Discipline Score</p>
              <p class="discipline-score gradient-text">${discipline}</p>
              <p class="discipline-status">${discipline >= 80 ? '🔒 Locked In' : discipline >= 65 ? '💪 Consistent' : discipline >= 50 ? '📈 Building' : '🌱 Starting Out'}</p>
            </div>
            <div class="discipline-ring">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke="url(#discGrad)" stroke-width="6"
                  stroke-linecap="round" stroke-dasharray="201.1"
                  stroke-dashoffset="${201.1 - 201.1 * discipline / 100}"
                  transform="rotate(-90 40 40)"/>
                <defs><linearGradient id="discGrad"><stop stop-color="#a78bfa"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="profile-section">
        <div class="section-label">Consistency Stats</div>
        <div class="stat-grid stat-grid-3">
          <div class="stat-cell">
            <div class="stat-value" style="color:var(--aura-amber)">${streak}🔥</div>
            <div class="stat-label">Day Streak</div>
          </div>
          <div class="stat-cell">
            <div class="stat-value gradient-text">${workouts}</div>
            <div class="stat-label">Total Sessions</div>
          </div>
          <div class="stat-cell">
            <div class="stat-value gradient-text-mint">${state.workout?.prs ? Object.keys(state.workout.prs).length : 0}</div>
            <div class="stat-label">Personal Records</div>
          </div>
        </div>
      </div>

      <!-- Training Profile -->
      <div class="profile-section">
        <div class="section-label">Training Profile</div>
        <div class="profile-info-grid card">
          ${_infoRow('🎯', 'Goal', goalLabel)}
          ${_infoRow('🏋️', 'Mode', ob?.workoutMode === 'gym' ? 'Gym' : 'Home')}
          ${_infoRow('📅', 'Days/Week', `${ob?.trainingDays || '—'} days`)}
          ${_infoRow('⚡', 'Experience', ob?.experience || '—')}
          ${_infoRow('💪', 'Primary Focus', ob?.primaryMuscle || '—')}
          ${_infoRow('🍽️', 'Diet', ob?.dietType === 'veg' ? 'Vegetarian' : ob?.dietType === 'egg' ? 'Eggitarian' : 'Non-Veg')}
          ${ob?.weight ? _infoRow('⚖️', 'Body Stats', `${ob.weight}kg · ${ob.height}cm · Age ${ob.age}`) : ''}
        </div>
      </div>
    </div>

    <!-- Edit Profile Sheet -->
    <div class="bottom-sheet-overlay" id="edit-overlay"></div>
    <div class="bottom-sheet" id="edit-sheet">
      <div class="modal-handle"></div>
      <div id="edit-content"></div>
    </div>
  `;
}

function _infoRow(icon, label, value) {
  if (!value || value === '—') return '';
  return `
    <div class="profile-info-row">
      <span class="info-icon">${icon}</span>
      <span class="info-label">${label}</span>
      <span class="info-value">${value}</span>
    </div>
  `;
}

export function onEnter() {
  _wireEvents();
}

export function onLeave() {
  document.getElementById('edit-overlay')?.classList.remove('open');
  document.getElementById('edit-sheet')?.classList.remove('open');
}

function _wireEvents() {
  document.getElementById('settings-btn')?.addEventListener('click', () => navigate('/settings'));
  document.getElementById('edit-profile-btn')?.addEventListener('click', _openEditSheet);
  document.getElementById('edit-overlay')?.addEventListener('click', _closeEditSheet);

  // Avatar upload
  document.getElementById('avatar-edit-btn')?.addEventListener('click', () => {
    document.getElementById('avatar-input')?.click();
  });
  document.getElementById('avatar-input')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setState('auth.avatar', ev.target.result);
      showToast('Profile photo updated ✓', 'success');
      const wrap = document.getElementById('avatar-wrap');
      if (wrap) {
        const img = wrap.querySelector('.profile-avatar-img');
        const placeholder = wrap.querySelector('.profile-avatar-placeholder');
        if (img) img.src = ev.target.result;
        else if (placeholder) {
          placeholder.outerHTML = `<img src="${ev.target.result}" class="profile-avatar-img" alt="Avatar"/>`;
        }
      }
    };
    reader.readAsDataURL(file);
  });
}

function _openEditSheet() {
  const state = getState();
  const auth = state.auth;
  const content = document.getElementById('edit-content');
  if (!content) return;

  content.innerHTML = `
    <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-bottom:16px">Edit Profile</h3>
    <div class="edit-fields">
      <div class="field-group">
        <label class="field-label">Full Name</label>
        <input class="input" id="edit-name" value="${auth?.profileName || ''}" />
      </div>
      <div class="field-group">
        <label class="field-label">Username</label>
        <div style="position:relative">
          <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-muted)">@</span>
          <input class="input" id="edit-username" style="padding-left:28px" value="${auth?.username || ''}" />
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Bio</label>
        <textarea class="input" id="edit-bio" rows="3" placeholder="Tell your story...">${auth?.bio || ''}</textarea>
      </div>
      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Country</label>
          <input class="input" id="edit-country" value="${auth?.country || ''}" placeholder="India" />
        </div>
        <div class="field-group">
          <label class="field-label">City</label>
          <input class="input" id="edit-city" value="${auth?.city || ''}" placeholder="Mumbai" />
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn btn-primary btn-full" id="save-profile-btn">Save Changes</button>
      <button class="btn btn-ghost btn-sm" id="cancel-edit-btn">Cancel</button>
    </div>
  `;

  document.getElementById('edit-overlay')?.classList.add('open');
  document.getElementById('edit-sheet')?.classList.add('open');

  document.getElementById('save-profile-btn')?.addEventListener('click', () => {
    const name = document.getElementById('edit-name')?.value?.trim();
    const username = document.getElementById('edit-username')?.value?.trim();
    const bio = document.getElementById('edit-bio')?.value?.trim();
    const country = document.getElementById('edit-country')?.value?.trim();
    const city = document.getElementById('edit-city')?.value?.trim();

    if (!name || !username) { showToast('Name and username required', 'error'); return; }

    updateState('auth', { profileName: name, username, bio, country, city });
    showToast('Profile updated ✓', 'success');
    _closeEditSheet();

    // Update display
    const nameEl = document.getElementById('profile-name-display');
    const bioEl = document.getElementById('profile-bio-display');
    if (nameEl) nameEl.textContent = name;
    if (bioEl) bioEl.textContent = bio || 'No bio yet';
  });

  document.getElementById('cancel-edit-btn')?.addEventListener('click', _closeEditSheet);
}

function _closeEditSheet() {
  document.getElementById('edit-overlay')?.classList.remove('open');
  document.getElementById('edit-sheet')?.classList.remove('open');
}
