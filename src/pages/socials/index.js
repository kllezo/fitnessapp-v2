// ==========================================
// AURA V2 — Socials Page
// Route: /socials (Partner | Friends | Find Partner)
// ==========================================

import { getState, setState, updateState } from '../../state/index.js';
import { showToast, showModal, closeModal } from '../../components/shared/ui.js';
import { navigate } from '../../router.js';
import { generateMatchCandidate } from '../../services/ai-engine.js';
import { getDisciplineScore } from '../../state/index.js';
import './socials.css';

let _activeTab = 'partner';
let _activeChatUser = null;

// Mock friends auto-initialization to ensure data richness
function _initFriendsIfEmpty() {
  const state = getState();
  let friends = state.auth?.friends || [];
  if (!friends.length) {
    friends = [
      {
        id: 'f1',
        name: 'Arjun K.',
        trainingStyle: 'Hypertrophy 🏋️',
        streakDays: 14,
        disciplineScore: 84,
        compatibility: 91,
        experience: 'experienced',
        country: 'India',
        language: 'Hindi',
        trainingDays: 5,
        wakeTime: '06:00',
        timezone: 'GMT+5:30',
        recentActivity: ['Completed leg day yesterday', 'Hit water target', 'Logged 120g protein']
      },
      {
        id: 'f2',
        name: 'Priya S.',
        trainingStyle: 'Fat Loss 🔥',
        streakDays: 8,
        disciplineScore: 76,
        compatibility: 87,
        experience: 'intermediate',
        country: 'India',
        language: 'English',
        trainingDays: 4,
        wakeTime: '07:30',
        timezone: 'GMT+5:30',
        recentActivity: ['Completed core cardio session', 'Logged breakfast recipe', 'Synced Apple Health']
      },
      {
        id: 'f3',
        name: 'Rohan M.',
        trainingStyle: 'Balance ⚖️',
        streakDays: 5,
        disciplineScore: 68,
        compatibility: 74,
        experience: 'beginner',
        country: 'India',
        language: 'Hindi',
        trainingDays: 3,
        wakeTime: '08:00',
        timezone: 'GMT+5:30',
        recentActivity: ['Completed 10-min Walk Reset', 'Practiced Box Breathing', 'Logged dinner']
      },
      {
        id: 'f4',
        name: 'Ananya T.',
        trainingStyle: 'Stamina 🏃',
        streakDays: 22,
        disciplineScore: 93,
        compatibility: 85,
        experience: 'experienced',
        country: 'Singapore',
        language: 'English',
        trainingDays: 6,
        wakeTime: '05:30',
        timezone: 'GMT+8:00',
        recentActivity: ['Ran 5k outdoor check-in', 'Hit 100% macros', 'Completed box breathing']
      }
    ];
    setState('auth.friends', friends);
  }
}

export function render() {
  _initFriendsIfEmpty();
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
  const friends = state.auth?.friends || [];
  
  if (!partner) {
    return `
      <div class="socials-section">
        <div class="no-partner-card card text-center">
          <span style="font-size:48px;display:block;margin-bottom:12px">🤝</span>
          <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-bottom:6px">No Partner Yet</h3>
          <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:16px;line-height:1.6">Find an accountability partner matched to your goals, schedule, and lifestyle.</p>
          <button class="btn btn-primary btn-full" id="go-find-btn" style="margin-bottom:16px">Find My Match (Strangers) →</button>
          
          ${friends.length ? `
            <div style="border-top:1px solid var(--border-subtle);padding-top:16px;margin-top:8px;text-align:left">
              <p class="section-label" style="margin-bottom:10px;text-align:center">Or Invite from Squad Friends</p>
              <div class="friends-invite-list" style="display:flex;flex-direction:column;gap:8px">
                ${friends.map(f => `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border-card);border-radius:var(--radius-md)">
                    <span style="font-size:var(--text-sm);font-weight:var(--fw-medium);color:var(--text-secondary)">${f.name} (${f.trainingStyle.split(' ')[0]})</span>
                    <button class="btn btn-xs btn-accent invite-friend-partner-btn" data-friend-id="${f.id}" style="padding:4px 10px">Invite</button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  const myDiscipline = getDisciplineScore(state);

  // Generate comparison stats
  const workoutsMe = state.workout?.history?.filter(w => (Date.now() - new Date(w.date).getTime()) < 7 * 86400000).length || 2;
  const workoutsPartner = Math.min(6, workoutsMe + (partner.id === 'f4' ? 2 : partner.id === 'f1' ? 1 : 0));
  
  const proteinMe = state.nutrition?.protein?.target ? Math.round((state.nutrition?.protein?.consumed / state.nutrition?.protein?.target) * 100) : 60;
  const proteinPartner = Math.min(100, Math.round(proteinMe * 0.95 + (Math.random() * 20 - 10)));
  
  const waterMe = state.nutrition?.water?.target ? Math.round((state.nutrition?.water?.consumed / state.nutrition?.water?.target) * 100) : 75;
  const waterPartner = partner.id === 'f4' ? 100 : Math.min(100, Math.round(waterMe * 1.05));

  const sleepMe = 7.2;
  const sleepPartner = partner.id === 'f2' ? 6.5 : partner.id === 'f4' ? 8.2 : 7.5;

  const recMe = 78;
  const recPartner = partner.disciplineScore ? Math.min(100, partner.disciplineScore + 5) : 80;

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
            <div class="stat-value gradient-text-mint">${myDiscipline}</div>
            <div class="stat-label">Your Score</div>
          </div>
        </div>
      </div>

      <!-- Quick Accountability Actions -->
      <div class="quick-actions-card card">
        <p class="section-label" style="margin-bottom:8px">Quick Actions</p>
        <div class="quick-actions-grid">
          <button class="btn btn-xs btn-secondary quick-action-btn" data-action="workout">🏋️ Remind Workout</button>
          <button class="btn btn-xs btn-secondary quick-action-btn" data-action="water">💧 Remind Water</button>
          <button class="btn btn-xs btn-secondary quick-action-btn" data-action="protein">🍗 Remind Protein</button>
          <button class="btn btn-xs btn-secondary quick-action-btn" data-action="motivation">🔥 Send Motivation</button>
          <button class="btn btn-xs btn-secondary quick-action-btn" data-action="hi">👋 Quick Hi</button>
          <button class="btn btn-xs btn-secondary quick-action-btn" data-action="checkin">🎯 Check In</button>
        </div>
      </div>

      <!-- You vs Partner Dashboard -->
      <div class="comparison-card card">
        <p class="section-label" style="margin-bottom:12px">You vs Partner Metrics</p>
        <div class="comparison-grid">
          ${_renderComparisonRow('Weekly Workouts', workoutsMe, workoutsPartner, '🏋️', ' sessions')}
          ${_renderComparisonRow('Protein Intake Target', proteinMe, proteinPartner, '🍗', '%')}
          ${_renderComparisonRow('Water Target Consumed', waterMe, waterPartner, '💧', '%')}
          ${_renderComparisonRow('Avg Sleep Duration', sleepMe, sleepPartner, '😴', 'h')}
          ${_renderComparisonRow('Recovery Readiness', recMe, recPartner, '🎯', '%')}
          ${_renderComparisonRow('Discipline Rating', myDiscipline, partner.disciplineScore || 65, '🏆', '')}
          ${_renderComparisonRow('Current Workout Streak', state.workout?.streakDays || 0, partner.streakDays, '🔥', 'd')}
        </div>
      </div>

      <!-- End Partnership -->
      <button class="btn btn-ghost btn-sm" id="end-partner-btn" style="margin-top:8px;width:100%;color:var(--aura-rose-light)">
        End Partnership
      </button>
    </div>
  `;
}

function _renderComparisonRow(label, valMe, valPartner, icon, unit) {
  const maxVal = Math.max(valMe, valPartner, 1);
  const pctMe = Math.round((valMe / maxVal) * 100);
  const pctPartner = Math.round((valPartner / maxVal) * 100);
  
  return `
    <div class="comp-row">
      <div class="comp-header">
        <span class="comp-icon">${icon}</span>
        <span class="comp-label">${label}</span>
      </div>
      <div class="comp-bars">
        <div class="comp-bar-wrapper">
          <span class="comp-bar-name">You: ${valMe}${unit}</span>
          <div class="comp-bar-bg">
            <div class="comp-bar-fill me-bar" style="width:${pctMe}%"></div>
          </div>
        </div>
        <div class="comp-bar-wrapper">
          <span class="comp-bar-name">Partner: ${valPartner}${unit}</span>
          <div class="comp-bar-bg">
            <div class="comp-bar-fill partner-bar" style="width:${pctPartner}%"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function _renderFriendsTab() {
  const state = getState();
  const friends = state.auth?.friends || [];
  const myScore = getDisciplineScore(state);
  
  // Create clickable leaderboard sorted by discipline
  const leaderboard = [...friends, { name: 'You', id: 'me', disciplineScore: myScore }]
    .sort((a, b) => b.disciplineScore - a.disciplineScore);

  // Compute DM Conversations
  const chatMessages = state.socials?.chatMessages || {};
  const partner = state.auth?.partner;
  const allUsers = [...friends];
  if (partner && !friends.some(f => f.id === partner.id)) {
    allUsers.push(partner);
  }
  
  const recentChats = [];
  for (const user of allUsers) {
    const msgs = chatMessages[user.id] || [];
    if (msgs.length > 0) {
      const lastMsg = msgs[msgs.length - 1];
      recentChats.push({
        user,
        lastMessage: lastMsg.text,
        lastTime: lastMsg.time
      });
    }
  }

  return `
    <div class="socials-section">
      <button class="btn btn-secondary btn-full" id="add-friend-btn" style="margin-bottom:16px">
        👤 Add Friend
      </button>

      <!-- Leaderboard -->
      <div class="section-label">Interactive Leaderboard</div>
      <div class="leaderboard-card card" style="margin-bottom:16px">
        ${leaderboard.map((f, i) => `
          <div class="leaderboard-row clickable-lb-row ${f.id === 'me' ? 'you' : ''}" data-friend-id="${f.id}">
            <span class="lb-rank">${i + 1}</span>
            <span class="lb-name">${f.name}</span>
            <div class="lb-bar-wrap">
              <div class="lb-bar" style="width:${f.disciplineScore || 60}%;background:${f.id === 'me' ? 'var(--grad-violet)' : `linear-gradient(90deg,hsl(${200 + i * 30},70%,55%),hsl(${230 + i * 30},70%,45%))`}"></div>
            </div>
            <span class="lb-score">${f.disciplineScore || 60}</span>
          </div>
        `).join('')}
      </div>

      <!-- Friends List -->
      <div class="section-label">Squad Friends</div>
      <div class="friends-list" style="margin-bottom:16px">
        ${friends.map(f => `
          <div class="friend-row" data-friend-id="${f.id}">
            <div class="friend-header-row" style="display:flex;align-items:center;width:100%;gap:12px">
              <div class="friend-avatar">${f.name?.[0] || 'F'}</div>
              <div class="friend-info" style="flex:1">
                <p class="friend-name">${f.name}</p>
                <p class="friend-meta">${f.trainingStyle || 'Training'} · ${f.streakDays || 0}d streak</p>
              </div>
            </div>
            <div class="friend-actions">
              <button class="btn btn-xs btn-primary friend-chat-btn" data-friend-id="${f.id}">💬 Chat</button>
              <button class="btn btn-xs btn-secondary friend-profile-btn" data-friend-id="${f.id}">👤 Profile</button>
              ${(!partner || partner.id !== f.id) ? `
                <button class="btn btn-xs btn-accent friend-invite-btn" data-friend-id="${f.id}">🤝 Invite</button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Message Center -->
      <div class="section-label">Direct Messages</div>
      <div class="conversations-list">
        ${recentChats.length ? recentChats.map(c => `
          <div class="conversation-row clickable-chat-row" data-user-id="${c.user.id}">
            <div class="friend-avatar">${c.user.name[0]}</div>
            <div class="conv-details">
              <div class="conv-header">
                <span class="conv-name">${c.user.name}</span>
                <span class="conv-time">${c.lastTime}</span>
              </div>
              <p class="conv-message">${c.lastMessage}</p>
            </div>
          </div>
        `).join('') : `
          <div class="card text-center" style="padding:16px">
            <p style="color:var(--text-muted);font-size:var(--text-sm)">No active chats. Start one by clicking Chat on a friend!</p>
          </div>
        `}
      </div>
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
          <p class="section-label" style="margin-bottom:10px">Matchmaking Filters</p>
          <div class="pref-grid">
            <div class="pref-row">
              <label class="field-label">Age Range</label>
              <select class="input" id="pref-age">
                <option value="any">Any Age</option>
                <option value="same">Same Range (±3 yrs)</option>
              </select>
            </div>
            <div class="pref-row">
              <label class="field-label">Gender Preference</label>
              <select class="input" id="pref-gender">
                <option value="any">Any Gender</option>
                <option value="same">Same Gender</option>
              </select>
            </div>
            <div class="pref-row">
              <label class="field-label">Primary Goal Match</label>
              <select class="input" id="pref-goal">
                <option value="same">Same Goal</option>
                <option value="any">Any Goal</option>
              </select>
            </div>
            <div class="pref-row">
              <label class="field-label">Experience Level</label>
              <select class="input" id="pref-experience">
                <option value="same">Same Level</option>
                <option value="any">Any Level</option>
              </select>
            </div>
            <div class="pref-row">
              <label class="field-label">Country Preference</label>
              <select class="input" id="pref-country">
                <option value="same">Same Country</option>
                <option value="any">Any Country</option>
              </select>
            </div>
            <div class="pref-row">
              <label class="field-label">Language</label>
              <select class="input" id="pref-language">
                <option value="any">Any Language</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
            <div class="pref-row">
              <label class="field-label">Frequency Target</label>
              <select class="input" id="pref-frequency">
                <option value="same">Same days/wk</option>
                <option value="any">Any Frequency</option>
              </select>
            </div>
            <div class="pref-row">
              <label class="field-label">Wake Time Group</label>
              <select class="input" id="pref-wake-time">
                <option value="any">Any Time</option>
                <option value="early">Early Bird (before 7am)</option>
                <option value="late">Night Owl (after 9am)</option>
              </select>
            </div>
            <div class="pref-row">
              <label class="field-label">Time Zone</label>
              <select class="input" id="pref-timezone">
                <option value="same">Same Zone</option>
                <option value="any">Any timezone</option>
              </select>
            </div>
            <div class="pref-row">
              <label class="field-label">Discipline Score</label>
              <select class="input" id="pref-discipline">
                <option value="high">High Only (80+)</option>
                <option value="medium">Medium + (50+)</option>
                <option value="any">Any discipline</option>
              </select>
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-full" id="start-match-btn" style="margin-top:20px">Find My Accountability Partner →</button>
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
  // Sub tabs switching
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

  // Quick Action DMs
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      _sendQuickAction(action);
    });
  });

  // Invite Friend as Partner (Directly from Partner tab)
  document.querySelectorAll('.invite-friend-partner-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.friendId;
      _inviteFriendAsPartner(id);
    });
  });

  // Friends tab triggers
  document.getElementById('add-friend-btn')?.addEventListener('click', () => {
    const name = prompt('Enter friend\'s name or username:');
    if (!name?.trim()) return;
    const state = getState();
    const friends = [...(state.auth?.friends || [])];
    const newFriend = {
      id: Date.now().toString(),
      name: name.trim(),
      trainingStyle: 'Hypertrophy 🏋️',
      streakDays: Math.floor(Math.random() * 20),
      disciplineScore: 50 + Math.floor(Math.random() * 40),
      compatibility: 70 + Math.floor(Math.random() * 25),
      experience: 'experienced',
      country: 'India',
      language: 'English',
      trainingDays: 4,
      wakeTime: '06:30',
      timezone: 'GMT+5:30',
      recentActivity: [
        'Logged a hypertrophy session yesterday',
        'Hit 100% hydration target',
        'Did Box Breathing reset'
      ]
    };
    friends.push(newFriend);
    setState('auth.friends', friends);
    showToast(`${name} added to your squad ✓`, 'success');
    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab('friends');
    _wireContentEvents();
  });

  // Chat button in friends list
  document.querySelectorAll('.friend-chat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.friendId;
      const friend = getState().auth?.friends?.find(f => f.id === id);
      if (friend) _openChat(friend);
    });
  });

  // Profile button in friends list
  document.querySelectorAll('.friend-profile-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.friendId;
      const friend = getState().auth?.friends?.find(f => f.id === id);
      if (friend) _openFriendProfile(friend);
    });
  });

  // Invite button in friends list
  document.querySelectorAll('.friend-invite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.friendId;
      _inviteFriendAsPartner(id);
    });
  });

  // Interactive Leaderboard clicks
  document.querySelectorAll('.clickable-lb-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.friendId;
      if (id === 'me') {
        navigate('/profile');
      } else {
        const friend = getState().auth?.friends?.find(f => f.id === id);
        if (friend) _openFriendProfile(friend);
      }
    });
  });

  // Message Center conversations clicks
  document.querySelectorAll('.clickable-chat-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.userId;
      const state = getState();
      const friend = state.auth?.friends?.find(f => f.id === id) || (state.auth?.partner?.id === id ? state.auth?.partner : null);
      if (friend) _openChat(friend);
    });
  });

  // Find tab triggers
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
    showToast('Match passed. Finding another...', 'default');
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

function _inviteFriendAsPartner(friendId) {
  const state = getState();
  const friend = state.auth?.friends?.find(f => f.id === friendId);
  if (!friend) return;
  
  if (state.auth?.partner) {
    showToast('End existing partnership first', 'error');
    return;
  }
  
  showToast(`Accountability invitation sent to ${friend.name}...`, 'violet');
  
  setTimeout(() => {
    setState('auth.partner', friend);
    setState('auth.matchState', 'matched');
    showToast(`🤝 ${friend.name} accepted your invitation!`, 'success');
    
    // Auto post chat message
    const msgs = [...(state.socials?.chatMessages?.[friend.id] || [])];
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    msgs.push({ from: 'them', text: "Hey! Excited to partner up! Let's crush our goals! 💪", time });
    
    const chatMsgs = { ...(state.socials?.chatMessages || {}), [friend.id]: msgs };
    setState('socials.chatMessages', chatMsgs);
    
    _activeTab = 'partner';
    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab('partner');
    _wireContentEvents();
    
    document.querySelectorAll('.socials-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'partner'));
  }, 1800);
}

function _sendQuickAction(actionType) {
  const partner = getState().auth?.partner;
  if (!partner) return;

  const messages = {
    workout: "Hey! Don't forget to log your workout today! 🏋️",
    water: "Friendly reminder to keep hydrated! Drink some water 💧",
    protein: "Did you hit your protein goals yet today? 🍗",
    motivation: "Keep pushing! You've got this! 🔥",
    hi: "Hey! Just wanted to say hi! 👋",
    checkin: "How's your recovery feeling today? 🎯"
  };

  const text = messages[actionType];
  const state = getState();
  const msgs = [...(state.socials?.chatMessages?.[partner.id] || [])];
  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  msgs.push({ from: 'me', text, time });

  const chatMsgs = { ...(state.socials?.chatMessages || {}), [partner.id]: msgs };
  setState('socials.chatMessages', chatMsgs);

  showToast('Accountability ping sent!', 'success');
}

function _openFriendProfile(user) {
  const compat = user.compatibility || (75 + Math.floor(Math.random() * 20));
  const disc = user.disciplineScore || 60;
  const streak = user.streakDays || 0;
  const freq = user.trainingDays || 4;
  const sleep = user.wakeTime || '07:00';
  const tz = user.timezone || 'GMT+5:30';
  const country = user.country || 'India';
  const recentAct = user.recentActivity || ['Logged a workout yesterday', 'Synced active recovery data'];
  
  showModal({
    title: `Profile: ${user.name}`,
    content: `
      <div class="friend-profile-modal">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          <div class="partner-avatar" style="width:64px;height:64px;font-size:24px;background:var(--grad-violet);display:flex;align-items:center;justify-content:center;color:#fff;border-radius:50%">${user.name[0]}</div>
          <div>
            <h4 style="font-size:var(--text-lg);font-weight:var(--fw-bold);color:var(--text-primary);margin-bottom:4px">${user.name}</h4>
            <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:6px">${country} · ${user.trainingStyle || 'Training'}</p>
            <div style="display:flex;gap:6px">
              <span class="pill pill-violet" style="font-size:10px">${compat}% Match</span>
              <span class="pill pill-mint" style="font-size:10px">${streak}d streak</span>
            </div>
          </div>
        </div>
        
        <!-- Metrics -->
        <div class="stat-grid stat-grid-3" style="margin-bottom:20px;border:1px solid var(--border-card);border-radius:var(--radius-lg);padding:12px;background:rgba(255,255,255,0.01)">
          <div class="stat-cell" style="text-align:center">
            <div class="stat-value" style="font-size:18px;font-weight:bold;color:var(--aura-violet-light)">${disc}</div>
            <div class="stat-label" style="font-size:10px;color:var(--text-muted);margin-top:2px">Discipline</div>
          </div>
          <div class="stat-cell" style="text-align:center">
            <div class="stat-value" style="font-size:18px;font-weight:bold">${freq}d/wk</div>
            <div class="stat-label" style="font-size:10px;color:var(--text-muted);margin-top:2px">Frequency</div>
          </div>
          <div class="stat-cell" style="text-align:center">
            <div class="stat-value" style="font-size:14px;font-weight:bold;margin-top:2px">${sleep}</div>
            <div class="stat-label" style="font-size:10px;color:var(--text-muted);margin-top:2px">${tz}</div>
          </div>
        </div>
        
        <!-- Recent Activity -->
        <div style="margin-bottom:20px">
          <p class="section-label" style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted)">Recent Activity</p>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
            ${recentAct.map(a => `
              <div class="activity-row" style="display:flex;gap:8px;font-size:var(--text-sm);color:var(--text-secondary);align-items:center">
                <span style="color:var(--aura-violet-light)">✦</span>
                <span>${a}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Actions -->
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary btn-full" id="profile-modal-chat-btn">💬 Send Message</button>
          ${(!getState().auth?.partner || getState().auth?.partner?.id !== user.id) ? `
            <button class="btn btn-secondary btn-full" id="profile-modal-invite-btn">🤝 Invite Partner</button>
          ` : ''}
        </div>
      </div>
    `,
    onClose: () => {}
  });
  
  document.getElementById('profile-modal-chat-btn')?.addEventListener('click', () => {
    closeModal();
    _openChat(user);
  });
  
  document.getElementById('profile-modal-invite-btn')?.addEventListener('click', () => {
    closeModal();
    _inviteFriendAsPartner(user.id);
  });
}

function _startMatching() {
  const filters = {
    age: document.getElementById('pref-age')?.value,
    gender: document.getElementById('pref-gender')?.value,
    goal: document.getElementById('pref-goal')?.value,
    experience: document.getElementById('pref-experience')?.value,
    country: document.getElementById('pref-country')?.value,
    language: document.getElementById('pref-language')?.value,
    frequency: document.getElementById('pref-frequency')?.value,
    wakeTime: document.getElementById('pref-wake-time')?.value,
    timezone: document.getElementById('pref-timezone')?.value,
    discipline: document.getElementById('pref-discipline')?.value,
  };

  setState('auth.matchState', 'searching');
  setState('auth.matchSearchStart', Date.now());
  const content = document.getElementById('socials-content');
  if (content) content.innerHTML = _renderTab('find');
  _wireContentEvents();

  let progress = 0;
  const interval = setInterval(() => {
    progress += 4;
    const fill = document.getElementById('match-progress-fill');
    if (fill) fill.style.width = `${Math.min(progress, 95)}%`;
    if (progress >= 95) clearInterval(interval);
  }, 200);

  setTimeout(() => {
    clearInterval(interval);
    const candidate = generateMatchCandidate(getState(), filters);
    setState('auth.matchState', 'found');
    setState('auth.matchCandidate', candidate);
    const c = document.getElementById('socials-content');
    if (c) c.innerHTML = _renderTab('find');
    _wireContentEvents();
    showToast('Compatible match found! ✦', 'violet');
  }, 4800); // Polished matching speed: 4.8 seconds
}

function _checkResumeSearch() {
  const state = getState();
  if (state.auth?.matchState === 'searching') {
    const start = state.auth?.matchSearchStart || 0;
    const elapsed = Date.now() - start;
    if (elapsed >= 4800) {
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
      <div class="chat-user-info clickable-chat-header" id="chat-header-user" style="cursor:pointer">
        <div class="partner-avatar" style="width:32px;height:32px;font-size:13px;background:var(--grad-violet);display:flex;align-items:center;justify-content:center;color:#fff;border-radius:50%">${user.name?.[0]}</div>
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
    // Refresh tab on chat close to update conversation times
    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab(_activeTab);
    _wireContentEvents();
  });

  // Clicking username inside chats triggers the profile modal!
  document.getElementById('chat-header-user')?.addEventListener('click', () => {
    _openFriendProfile(user);
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

