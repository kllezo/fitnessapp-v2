// ==========================================
// AURA V2 — Socials Page
// Route: /socials (Partner | Friends | Find Partner)
// ==========================================

import { getState, setState, updateState } from '../../state/index.js';
import { showToast } from '../../components/shared/ui.js';
import { navigate } from '../../router.js';
import { generateMatchCandidate, generateConversationStarters } from '../../services/ai-engine.js';
import { getDisciplineScore } from '../../state/index.js';
import './socials.css';

let _activeTab = 'partner';
let _activeChatUser = null;

export function render() {
  return `
    <div class="socials-page">
      <div class="page-header">
        <h1 class="page-title">Squad</h1>
        <button class="icon-btn" id="profile-btn" aria-label="Profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </button>
      </div>

      <!-- Sub Tabs -->
      <div class="socials-tabs">
        <button class="socials-tab ${_activeTab === 'partner' ? 'active' : ''}" data-tab="partner">Partner</button>
        <button class="socials-tab ${_activeTab === 'friends' ? 'active' : ''}" data-tab="friends">Friends</button>
        <button class="socials-tab ${_activeTab === 'find' ? 'active' : ''}" data-tab="find">Find Partner</button>
      </div>

      <!-- Tab Content -->
      <div class="socials-content" id="socials-content">
        ${_renderTab(_activeTab)}
      </div>
    </div>

    <!-- Chat Overlay -->
    <div class="chat-overlay hidden" id="chat-overlay">
      <div id="chat-content"></div>
    </div>
  `;
}

function _renderTab(tab) {
  switch (tab) {
    case 'partner': return _renderPartnerTab();
    case 'friends': return _renderFriendsTab();
    case 'find': return _renderFindTab();
    default: return _renderPartnerTab();
  }
}

function _renderPartnerTab() {
  const state = getState();
  const partner = state.auth?.partner;
  if (!partner) {
    return `
      <div class="socials-section">
        <div class="no-partner-card card text-center">
          <span style="font-size:48px;display:block;margin-bottom:12px">🤝</span>
          <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-bottom:6px">No Partner Yet</h3>
          <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:16px;line-height:1.6">Find an accountability partner matched to your goals, schedule, and lifestyle.</p>
          <button class="btn btn-primary btn-full" id="go-find-btn">Find My Match →</button>
        </div>
      </div>
    `;
  }

  const starters = generateConversationStarters(state);
  const myDiscipline = getDisciplineScore(state);

  return `
    <div class="socials-section">
      <!-- Partner Card -->
      <div class="partner-card card card-glow">
        <div class="partner-header">
          <div class="partner-avatar">${partner.name?.[0] || 'P'}</div>
          <div class="partner-info">
            <h3 class="partner-name">${partner.name}</h3>
            <p class="partner-meta">${partner.city}, ${partner.country}</p>
            <span class="pill pill-violet">${partner.compatibility}% Match</span>
          </div>
          <button class="btn btn-sm btn-primary" id="chat-partner-btn">Chat</button>
        </div>

        <!-- Shared Stats -->
        <div class="stat-grid stat-grid-3" style="margin-top:12px">
          <div class="stat-cell">
            <div class="stat-value">${partner.streakDays}</div>
            <div class="stat-label">Their Streak</div>
          </div>
          <div class="stat-cell">
            <div class="stat-value gradient-text">${partner.disciplineScore}</div>
            <div class="stat-label">Discipline</div>
          </div>
          <div class="stat-cell">
            <div class="stat-value gradient-text-mint">${Math.min(myDiscipline, partner.disciplineScore + 5)}</div>
            <div class="stat-label">Your Score</div>
          </div>
        </div>

        <!-- Conversation Starters -->
        ${starters.length ? `
          <div class="starters-section">
            <p class="section-label">Conversation Starters</p>
            <div class="starters-list">
              ${starters.map((s, i) => `
                <button class="starter-pill" data-msg="${s}" data-idx="${i}">${s}</button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- End Partnership -->
      <button class="btn btn-ghost btn-sm" id="end-partner-btn" style="margin-top:8px;width:100%;color:var(--aura-rose-light)">
        End Partnership
      </button>
    </div>
  `;
}

function _renderFriendsTab() {
  const state = getState();
  const friends = state.auth?.friends || [];
  const myScore = getDisciplineScore(state);

  return `
    <div class="socials-section">
      <button class="btn btn-secondary btn-full" id="add-friend-btn" style="margin-bottom:16px">
        👤 Add Friend
      </button>

      ${friends.length ? `
        <!-- Leaderboard -->
        <div class="section-label">Leaderboard</div>
        <div class="leaderboard-card card" style="margin-bottom:16px">
          <div class="leaderboard-row you">
            <span class="lb-rank">You</span>
            <span class="lb-name">${state.auth?.username || 'You'}</span>
            <div class="lb-bar-wrap">
              <div class="lb-bar" style="width:${myScore}%;background:var(--grad-violet)"></div>
            </div>
            <span class="lb-score">${myScore}</span>
          </div>
          ${friends.map((f, i) => `
            <div class="leaderboard-row">
              <span class="lb-rank">${i + 1}</span>
              <span class="lb-name">${f.name}</span>
              <div class="lb-bar-wrap">
                <div class="lb-bar" style="width:${f.disciplineScore || 60}%;background:linear-gradient(90deg,hsl(${200 + i * 30},70%,55%),hsl(${230 + i * 30},70%,45%))"></div>
              </div>
              <span class="lb-score">${f.disciplineScore || 60}</span>
            </div>
          `).join('')}
        </div>

        <!-- Friends List -->
        <div class="section-label">Your Friends</div>
        <div class="friends-list">
          ${friends.map(f => `
            <div class="friend-row" data-friend-id="${f.id}">
              <div class="friend-avatar">${f.name?.[0] || 'F'}</div>
              <div class="friend-info">
                <p class="friend-name">${f.name}</p>
                <p class="friend-meta">${f.trainingStyle || 'Training'} · ${f.streakDays || 0} day streak</p>
              </div>
              <button class="btn btn-sm btn-secondary friend-chat-btn" data-friend-id="${f.id}">Chat</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <!-- Demo leaderboard -->
        <div class="section-label">Leaderboard Preview</div>
        <div class="leaderboard-card card" style="margin-bottom:16px">
          <div class="leaderboard-row you">
            <span class="lb-rank">You</span>
            <span class="lb-name">${state.auth?.username || 'You'}</span>
            <div class="lb-bar-wrap"><div class="lb-bar" style="width:${myScore}%;background:var(--grad-violet)"></div></div>
            <span class="lb-score">${myScore}</span>
          </div>
          ${[{n:'Arjun K.',s:82},{n:'Priya S.',s:74},{n:'Rohan M.',s:61}].map((f, i) => `
            <div class="leaderboard-row">
              <span class="lb-rank">${i + 1}</span>
              <span class="lb-name">${f.n}</span>
              <div class="lb-bar-wrap"><div class="lb-bar" style="width:${f.s}%;background:linear-gradient(90deg,hsl(${200+i*30},70%,55%),hsl(${230+i*30},70%,45%))"></div></div>
              <span class="lb-score">${f.s}</span>
            </div>
          `).join('')}
        </div>
        <div class="card text-center" style="padding:20px">
          <p style="color:var(--text-muted);font-size:var(--text-sm)">Add friends to see their real stats here</p>
        </div>
      `}
    </div>
  `;
}

function _renderFindTab() {
  const state = getState();
  const matchState = state.auth?.matchState || 'idle';
  const partner = state.auth?.partner;

  if (partner) {
    return `<div class="socials-section">
      <div class="card card-mint text-center" style="padding:24px">
        <span style="font-size:40px;display:block;margin-bottom:12px">✅</span>
        <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-bottom:8px">Active Partnership</h3>
        <p style="color:var(--text-muted);font-size:var(--text-sm)">You're already matched with ${partner.name}. View your partner on the Partner tab.</p>
        <button class="btn btn-secondary btn-sm" style="margin-top:16px" id="view-partner-btn">View Partner →</button>
      </div>
    </div>`;
  }

  if (matchState === 'idle') {
    return `<div class="socials-section">
      <div class="find-hero card">
        <span style="font-size:48px;display:block;text-align:center;margin-bottom:12px">🔍</span>
        <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;text-align:center;margin-bottom:8px">Find Your Match</h3>
        <p style="color:var(--text-muted);font-size:var(--text-sm);text-align:center;line-height:1.6;margin-bottom:20px">AURA analyses your goals, schedule, discipline, and lifestyle to find someone truly compatible.</p>
        <div class="match-prefs">
          <div class="pref-row">
            <label class="field-label">Location Preference</label>
            <select class="input" id="pref-location">
              <option value="any">Anywhere in India</option>
              <option value="city">Same City</option>
              <option value="state">Same State</option>
            </select>
          </div>
          <div class="pref-row">
            <label class="field-label">Training Preference Match</label>
            <select class="input" id="pref-training">
              <option value="any">Any style</option>
              <option value="same">Same as mine</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary btn-full" id="start-match-btn" style="margin-top:16px">Find My Accountability Partner →</button>
      </div>
    </div>`;
  }

  if (matchState === 'searching') {
    return `<div class="socials-section">
      <div class="card text-center" style="padding:32px 20px">
        <div class="match-spinner"></div>
        <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin:16px 0 8px">Analysing Compatibility</h3>
        <p style="color:var(--text-muted);font-size:var(--text-sm);line-height:1.6">Comparing goals, schedules, discipline patterns, and lifestyle compatibility across our network...</p>
        <div class="match-progress-bar" style="margin-top:20px">
          <div class="match-progress-fill" id="match-progress-fill"></div>
        </div>
        <button class="btn btn-ghost btn-sm" id="cancel-match-btn" style="margin-top:16px">Cancel</button>
      </div>
    </div>`;
  }

  if (matchState === 'found') {
    const candidate = state.auth?.matchCandidate;
    if (!candidate) return '';
    return `<div class="socials-section">
      <div class="section-label">Your Match</div>
      <div class="match-card card card-glow">
        <div class="match-card-header">
          <div class="partner-avatar" style="width:56px;height:56px;font-size:22px">${candidate.name?.[0]}</div>
          <div>
            <h3 class="partner-name">${candidate.name}</h3>
            <p class="partner-meta">${candidate.city} · ${candidate.trainingStyle}</p>
            <div style="display:flex;gap:6px;margin-top:4px">
              <span class="pill pill-violet">${candidate.compatibility}% Match</span>
              <span class="pill pill-amber">${candidate.streakDays}d streak</span>
            </div>
          </div>
        </div>
        <div class="stat-grid stat-grid-3" style="margin-top:12px">
          <div class="stat-cell"><div class="stat-value">${candidate.streakDays}</div><div class="stat-label">Streak</div></div>
          <div class="stat-cell"><div class="stat-value gradient-text">${candidate.disciplineScore}</div><div class="stat-label">Discipline</div></div>
          <div class="stat-cell"><div class="stat-value">${candidate.experience}</div><div class="stat-label">Level</div></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn btn-primary btn-full" id="accept-match-btn">Accept Partner ✓</button>
          <button class="btn btn-ghost btn-sm" id="decline-match-btn">Pass</button>
        </div>
      </div>
    </div>`;
  }

  return '';
}

export function onEnter() {
  _wireEvents();
  _checkResumeSearch();
}

export function onLeave() {
  document.getElementById('chat-overlay')?.classList.add('hidden');
}

function _wireEvents() {
  // Sub tabs
  document.querySelectorAll('.socials-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _activeTab = tab.dataset.tab;
      document.querySelectorAll('.socials-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById('socials-content');
      if (content) content.innerHTML = _renderTab(_activeTab);
      _wireContentEvents();
    });
  });

  document.getElementById('profile-btn')?.addEventListener('click', () => navigate('/profile'));
  _wireContentEvents();
}

function _wireContentEvents() {
  // Partner tab
  document.getElementById('go-find-btn')?.addEventListener('click', () => {
    _activeTab = 'find';
    document.querySelectorAll('.socials-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'find'));
    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab('find');
    _wireContentEvents();
  });

  document.getElementById('chat-partner-btn')?.addEventListener('click', () => {
    const partner = getState().auth?.partner;
    if (partner) _openChat(partner);
  });

  document.getElementById('end-partner-btn')?.addEventListener('click', () => {
    setState('auth.partner', null);
    setState('auth.matchState', 'idle');
    showToast('Partnership ended', 'default');
    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab('partner');
    _wireContentEvents();
  });

  // Conversation starters
  document.querySelectorAll('.starter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const partner = getState().auth?.partner;
      if (partner) _openChat(partner, pill.dataset.msg);
    });
  });

  // Friends tab
  document.getElementById('add-friend-btn')?.addEventListener('click', () => {
    const name = prompt('Enter friend\'s name or username:');
    if (!name?.trim()) return;
    const state = getState();
    const friends = [...(state.auth?.friends || [])];
    const newFriend = {
      id: Date.now().toString(),
      name: name.trim(),
      trainingStyle: 'Training',
      streakDays: Math.floor(Math.random() * 20),
      disciplineScore: 50 + Math.floor(Math.random() * 40),
    };
    friends.push(newFriend);
    setState('auth.friends', friends);
    showToast(`${name} added to your squad ✓`, 'success');
    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab('friends');
    _wireContentEvents();
  });

  document.querySelectorAll('.friend-chat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.friendId;
      const friend = getState().auth?.friends?.find(f => f.id === id);
      if (friend) _openChat(friend);
    });
  });

  // Find tab
  document.getElementById('start-match-btn')?.addEventListener('click', _startMatching);
  document.getElementById('cancel-match-btn')?.addEventListener('click', () => {
    setState('auth.matchState', 'idle');
    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab('find');
    _wireContentEvents();
  });
  document.getElementById('accept-match-btn')?.addEventListener('click', _acceptMatch);
  document.getElementById('decline-match-btn')?.addEventListener('click', () => {
    setState('auth.matchState', 'idle');
    setState('auth.matchCandidate', null);
    showToast('Match passed. We\'ll find another...', 'default');
    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab('find');
    _wireContentEvents();
  });
  document.getElementById('view-partner-btn')?.addEventListener('click', () => {
    _activeTab = 'partner';
    document.querySelectorAll('.socials-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'partner'));
    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab('partner');
    _wireContentEvents();
  });
}

function _startMatching() {
  setState('auth.matchState', 'searching');
  setState('auth.matchSearchStart', Date.now());
  const content = document.getElementById('socials-content');
  if (content) content.innerHTML = _renderTab('find');
  _wireContentEvents();

  // Animate progress bar
  let progress = 0;
  const interval = setInterval(() => {
    progress += 2;
    const fill = document.getElementById('match-progress-fill');
    if (fill) fill.style.width = `${Math.min(progress, 95)}%`;
    if (progress >= 95) clearInterval(interval);
  }, 300);

  // After 15s simulate finding match
  setTimeout(() => {
    clearInterval(interval);
    const candidate = generateMatchCandidate(getState());
    setState('auth.matchState', 'found');
    setState('auth.matchCandidate', candidate);
    const c = document.getElementById('socials-content');
    if (c) c.innerHTML = _renderTab('find');
    _wireContentEvents();
    showToast('Match found! ✦', 'violet');
  }, 15000);
}

function _checkResumeSearch() {
  const state = getState();
  if (state.auth?.matchState === 'searching') {
    const start = state.auth?.matchSearchStart || 0;
    const elapsed = Date.now() - start;
    if (elapsed >= 15000) {
      const candidate = generateMatchCandidate(state);
      setState('auth.matchState', 'found');
      setState('auth.matchCandidate', candidate);
      const content = document.getElementById('socials-content');
      if (content && _activeTab === 'find') content.innerHTML = _renderTab('find');
      _wireContentEvents();
    }
  }
}

function _acceptMatch() {
  const candidate = getState().auth?.matchCandidate;
  if (!candidate) return;
  setState('auth.partner', candidate);
  setState('auth.matchState', 'matched');
  setState('auth.matchCandidate', null);
  showToast(`🤝 Matched with ${candidate.name}!`, 'violet');
  _activeTab = 'partner';
  document.querySelectorAll('.socials-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'partner'));
  const content = document.getElementById('socials-content');
  if (content) content.innerHTML = _renderTab('partner');
  _wireContentEvents();
}

function _openChat(user, prefill = '') {
  _activeChatUser = user;
  const overlay = document.getElementById('chat-overlay');
  const content = document.getElementById('chat-content');
  if (!overlay || !content) return;

  const state = getState();
  const msgs = state.socials?.chatMessages?.[user.id] || [];

  content.innerHTML = `
    <div class="chat-header">
      <button class="icon-btn" id="close-chat-btn">←</button>
      <div class="chat-user-info">
        <div class="partner-avatar" style="width:32px;height:32px;font-size:13px">${user.name?.[0]}</div>
        <span class="chat-user-name">${user.name}</span>
      </div>
    </div>
    <div class="chat-messages" id="chat-messages">
      ${!msgs.length ? `<div class="chat-empty">Start the conversation! 👋</div>` :
        msgs.map(m => `
          <div class="chat-msg ${m.from === 'me' ? 'mine' : 'theirs'}">
            <div class="chat-bubble">${m.text}</div>
            <span class="chat-time">${m.time}</span>
          </div>
        `).join('')
      }
    </div>
    <div class="chat-input-bar">
      <input class="input" id="chat-input" placeholder="Message..." value="${prefill}" />
      <button class="btn btn-primary btn-sm" id="send-chat-btn">Send</button>
    </div>
  `;

  overlay.classList.remove('hidden');
  if (prefill) document.getElementById('chat-input')?.focus();

  document.getElementById('close-chat-btn')?.addEventListener('click', () => {
    overlay.classList.add('hidden');
    _activeChatUser = null;
  });

  document.getElementById('send-chat-btn')?.addEventListener('click', _sendMessage);
  document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') _sendMessage();
  });
}

function _sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input?.value?.trim();
  if (!text || !_activeChatUser) return;

  const state = getState();
  const msgs = [...(state.socials?.chatMessages?.[_activeChatUser.id] || [])];
  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  msgs.push({ from: 'me', text, time });

  const chatMsgs = { ...(state.socials?.chatMessages || {}), [_activeChatUser.id]: msgs };
  setState('socials.chatMessages', chatMsgs);

  if (input) input.value = '';

  const container = document.getElementById('chat-messages');
  if (container) {
    container.innerHTML += `
      <div class="chat-msg mine">
        <div class="chat-bubble">${text}</div>
        <span class="chat-time">${time}</span>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  }
}
