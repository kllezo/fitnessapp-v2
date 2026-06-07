// ==========================================
// AURA V2 — Socials Page
// Route: /socials (Partner | Friends | Find Partner)
// ==========================================

import { getState, setState, updateState, getDisciplineScore } from '../../state/index.js';
import { showToast, showModal, closeModal } from '../../components/shared/ui.js';
import { navigate } from '../../router.js';
import { generateMatchCandidate } from '../../services/ai-engine.js';
import './socials.css';

let _activeTab = 'partner';
let _activeChatUser = null;
let _activeGroupChatId = 'g1';

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

// Mock Custom Groups initialization
function _initGroupsIfEmpty() {
  const state = getState();
  let groups = state.socials?.groups || [];
  if (!groups.length) {
    groups = [
      {
        id: 'g1',
        name: 'Alpha Pack 🐺',
        members: [
          { id: 'me', name: 'You', workout: true, protein: true, water: true, sleep: 7.5, recovery: 82, discipline: 85 },
          { id: 'f1', name: 'Arjun K.', workout: true, protein: true, water: false, sleep: 6.2, recovery: 78, discipline: 84 },
          { id: 'f2', name: 'Priya S.', workout: true, protein: false, water: true, sleep: 8.0, recovery: 85, discipline: 76 },
          { id: 'f4', name: 'Ananya T.', workout: false, protein: true, water: true, sleep: 7.2, recovery: 74, discipline: 93 }
        ],
        messages: [
          { from: 'Arjun K.', text: "Who's hitting legs today? 🦵", time: '10:30' },
          { from: 'Priya S.', text: "Already done! Smashed it early morning ☀️", time: '11:15' },
          { from: 'Ananya T.', text: "Rest day for me, but protein goals are locked in! 🥩", time: '12:00' }
        ]
      }
    ];
    setState('socials.groups', groups);
  }
}

export function render() {
  _initFriendsIfEmpty();
  _initGroupsIfEmpty();
  const state = getState();

  // Top header icons: [ + Add Friend ] [ Inbox ]
  return `
    <div class="socials-page">
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h1 class="page-title">Squad</h1>
        <div style="display:flex; gap:8px;">
          <button class="icon-btn" id="add-friend-header-btn" aria-label="Add Friend" style="background:var(--bg-card); border:1px solid var(--border-card); border-radius:var(--radius-md); width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-secondary);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </button>
          <button class="icon-btn" id="inbox-header-btn" aria-label="Inbox" style="background:var(--bg-card); border:1px solid var(--border-card); border-radius:var(--radius-md); width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-secondary); position:relative;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            ${(state.socials?.notifications?.length || 0) > 0 ? '<span class="notif-dot" style="position:absolute; top:6px; right:6px; width:6px; height:6px; background:var(--aura-rose); border-radius:50%"></span>' : ''}
          </button>
        </div>
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
        <div class="no-partner-card card text-center" style="padding:24px;">
          <span style="font-size:48px;display:block;margin-bottom:12px">🤝</span>
          <h3 style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;margin-bottom:6px">No Partner Yet</h3>
          <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:16px;line-height:1.6">Find an accountability partner matched to your goals, schedule, and lifestyle.</p>
          <button class="btn btn-primary btn-full" id="go-find-btn" style="margin-bottom:16px">Find My Match →</button>
          
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
      <div class="partner-card card card-glow" style="padding:16px;">
        <div class="partner-header">
          <div class="partner-avatar">${partner.name?.[0] || 'P'}</div>
          <div class="partner-info">
            <h3 class="partner-name username-clickable" data-user-id="${partner.id}" style="cursor:pointer; display:inline-block;">${partner.name}</h3>
            <p class="partner-meta">${partner.city || 'India'}, ${partner.country || 'India'}</p>
            <div style="display:flex; gap:6px;">
              <span class="pill pill-violet">${partner.compatibility || 85}% Match</span>
              <span class="pill pill-mint">${partner.streakDays || 5}d streak</span>
            </div>
          </div>
          <button class="btn btn-sm btn-primary" id="chat-partner-btn">Chat</button>
        </div>

        <!-- Shared Stats -->
        <div class="stat-grid stat-grid-3" style="margin-top:14px">
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

      <!-- Partner Action Cards (2x2 grid replacing generic actions) -->
      <div class="partner-actions-section" style="margin-top:4px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          
          <div class="card partner-action-card" id="partner-card-action-profile" style="cursor:pointer; display:flex; flex-direction:column; gap:6px; padding:12px; background:var(--bg-card); border:1.5px solid var(--border-card); border-radius:var(--radius-xl); transition:all var(--dur-fast) ease;">
            <span style="font-size:24px;">👤</span>
            <strong style="font-size:12px; color:var(--text-primary);">Inspect Partner</strong>
            <span style="font-size:10px; color:var(--text-muted); line-height:1.3;">View streaks, targets, splits and compatibility levels.</span>
          </div>

          <div class="card partner-action-card" id="partner-card-action-train" style="cursor:pointer; display:flex; flex-direction:column; gap:6px; padding:12px; background:var(--bg-card); border:1.5px solid var(--border-card); border-radius:var(--radius-xl); transition:all var(--dur-fast) ease;">
            <span style="font-size:24px;">🏋️</span>
            <strong style="font-size:12px; color:var(--text-primary);">Workout Sync</strong>
            <span style="font-size:10px; color:var(--text-muted); line-height:1.3;">Compare workouts, completed volumes and exercises.</span>
          </div>

          <div class="card partner-action-card" id="partner-card-action-diet" style="cursor:pointer; display:flex; flex-direction:column; gap:6px; padding:12px; background:var(--bg-card); border:1.5px solid var(--border-card); border-radius:var(--radius-xl); transition:all var(--dur-fast) ease;">
            <span style="font-size:24px;">🥗</span>
            <strong style="font-size:12px; color:var(--text-primary);">Macro Co-Pilot</strong>
            <span style="font-size:10px; color:var(--text-muted); line-height:1.3;">Track calorie counts and protein targets.</span>
          </div>

          <div class="card partner-action-card" id="partner-card-action-chat" style="cursor:pointer; display:flex; flex-direction:column; gap:6px; padding:12px; background:var(--bg-card); border:1.5px solid var(--border-card); border-radius:var(--radius-xl); transition:all var(--dur-fast) ease;">
            <span style="font-size:24px;">💬</span>
            <strong style="font-size:12px; color:var(--text-primary);">Inbox Portal</strong>
            <span style="font-size:10px; color:var(--text-muted); line-height:1.3;">Open direct chat logs and quick ping alerts.</span>
          </div>

        </div>
      </div>

      <!-- You vs Partner Dashboard -->
      <div class="comparison-card card" style="margin-top:4px;">
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
  const myDiscipline = getDisciplineScore(state);
  
  // Sort friends + me for Universal Leaderboard
  const universalLeaderboard = [
    { id: 'me', name: 'You (Me)', discipline: myDiscipline, isMe: true },
    ...friends.map(f => ({ id: f.id, name: f.name, discipline: f.disciplineScore || 65, isMe: false }))
  ].sort((a, b) => b.discipline - a.discipline);

  const groups = state.socials?.groups || [];

  const universalLeaderboardHtml = universalLeaderboard.map((m, i) => `
    <div class="leaderboard-row ${m.isMe ? 'you' : ''}" style="display:flex; align-items:center; gap:8px; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.02)">
      <span class="lb-rank" style="font-family:var(--font-display); font-weight:bold; color:var(--text-muted); width:20px;">${i + 1}</span>
      <span class="lb-name username-clickable" data-user-id="${m.id}" style="flex:1; cursor:pointer; font-weight:bold; color:${m.isMe ? 'var(--aura-violet-light)' : 'var(--text-primary)'};">${m.name}</span>
      <div class="lb-bar-wrap" style="flex:2; height:6px; background:rgba(255,255,255,0.04); border-radius:var(--radius-full); overflow:hidden; position:relative; max-width:140px;">
        <div class="lb-bar" style="height:100%; width:${m.discipline}%; background:${m.isMe ? 'var(--grad-violet)' : `linear-gradient(90deg,hsl(${200 + i * 30},70%,55%),hsl(${230 + i * 30},70%,45%))`}"></div>
      </div>
      <span class="lb-score" style="font-family:var(--font-display); font-weight:bold; color:var(--text-secondary); width:28px; text-align:right;">${m.discipline}</span>
    </div>
  `).join('');

  const groupsCardsHtml = groups.map(g => {
    const sortedMembers = [...g.members].sort((a, b) => b.discipline - a.discipline);
    const myRankIdx = sortedMembers.findIndex(m => m.id === 'me' || m.id === 'You');
    const myRank = myRankIdx !== -1 ? myRankIdx + 1 : '—';
    const totalScore = g.members.reduce((sum, m) => sum + m.discipline, 0);
    const avgScore = Math.round(totalScore / g.members.length);
    
    return `
      <div class="group-card card card-glow clickable-group-card" data-group-id="${g.id}" style="cursor:pointer; display:flex; flex-direction:column; gap:8px; padding:16px; border:1.5px solid var(--border-card); background:rgba(255,255,255,0.01); margin-top:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-primary); margin:0;">${g.name}</h3>
          <span style="font-size:10px; color:var(--text-muted);">${g.members.length} Members</span>
        </div>
        <div style="display:flex; gap:16px; margin-top:4px;">
          <div style="flex:1;">
            <span style="font-size:9px; color:var(--text-muted); display:block; text-transform:uppercase;">Your Rank</span>
            <strong style="font-size:15px; color:var(--aura-violet-light);">${myRank === 1 ? '🥇 1st' : myRank === 2 ? '🥈 2nd' : myRank === 3 ? '🥉 3rd' : `${myRank}th`}</strong>
          </div>
          <div style="flex:1;">
            <span style="font-size:9px; color:var(--text-muted); display:block; text-transform:uppercase;">Avg. Score</span>
            <strong style="font-size:15px; color:var(--aura-amber-light);">${avgScore} Disc</strong>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="socials-section">
      <!-- Universal Leaderboard Section -->
      <div class="section-label" style="display:flex; justify-content:space-between; align-items:center;">
        <span>Universal Leaderboard</span>
        <span style="font-size:10px; color:var(--text-muted); font-weight:normal;">Ranked by Discipline</span>
      </div>
      <div class="leaderboard-card card" style="margin-bottom:16px; padding:6px 0;">
        ${universalLeaderboardHtml}
      </div>

      <!-- Custom Groups Section -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span class="section-label" style="margin-bottom:0;">My Groups</span>
        <button class="btn btn-xs btn-secondary" id="create-group-btn" style="padding:4px 10px;">+ Create Group</button>
      </div>
      
      <div class="groups-grid" style="display:flex; flex-direction:column; gap:10px;">
        ${groupsCardsHtml || `
          <div class="card text-center" style="padding:20px;">
            <p style="color:var(--text-muted); font-size:11px;">Create a group to compete with squad friends</p>
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
      <div class="find-hero card" style="padding:16px;">
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
        <button class="btn btn-primary btn-full" id="start-match-btn" style="margin-top:20px">Find My Match</button>
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
      <div class="match-card card card-glow" style="padding:16px;">
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
  const bottomNav = document.getElementById('bottom-nav-mount');
  if (bottomNav) bottomNav.style.display = 'block';
  const pageContent = document.getElementById('page-content');
  if (pageContent) pageContent.style.overflow = 'auto';
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

  // Top right header buttons
  document.getElementById('add-friend-header-btn')?.addEventListener('click', _openAddFriendModal);
  document.getElementById('inbox-header-btn')?.addEventListener('click', _openInboxModal);

  _wireContentEvents();
}

function _wireContentEvents() {
  // Partner tab actions
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

  // Partner Action Cards Clicks
  const partner = getState().auth?.partner;
  document.getElementById('partner-card-action-profile')?.addEventListener('click', () => {
    if (partner) _openFriendProfile(partner);
  });
  document.getElementById('partner-card-action-train')?.addEventListener('click', () => {
    showToast('Viewing Sync Workouts 🏋️', 'violet');
    navigate('/train');
  });
  document.getElementById('partner-card-action-diet')?.addEventListener('click', () => {
    showToast('Viewing Sync Nutrition 🥗', 'violet');
    navigate('/diet');
  });
  document.getElementById('partner-card-action-chat')?.addEventListener('click', () => {
    if (partner) _openChat(partner);
  });

  // Friends tab triggers
  document.getElementById('create-group-btn')?.addEventListener('click', _openCreateGroupModal);

  // Group cards clicks
  document.querySelectorAll('.clickable-group-card').forEach(card => {
    card.addEventListener('click', () => {
      const gId = card.dataset.groupId;
      _openGroupDetailModal(gId);
    });
  });

  // Username click routing anywhere in tab content
  document.querySelectorAll('.username-clickable').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const uId = el.dataset.userId;
      const uname = el.dataset.username;
      const state = getState();
      let friendObj = null;

      if (uId) {
        if (uId === 'me' || uId === 'You') {
          navigate('/profile');
          return;
        }
        friendObj = state.auth?.friends?.find(f => f.id === uId);
      } else if (uname) {
        if (uname === 'You' || uname === 'me' || uname === 'You (Me)') {
          navigate('/profile');
          return;
        }
        friendObj = state.auth?.friends?.find(f => f.name === uname);
      }

      if (friendObj) {
        _openFriendProfile(friendObj);
      }
    });
  });

  // Invite Friend as Partner
  document.querySelectorAll('.invite-friend-partner-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.friendId;
      _inviteFriendAsPartner(id);
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

function _openAddFriendModal() {
  const content = `
    <div class="add-friend-form" style="display:flex; flex-direction:column; gap:12px;">
      <div class="field-group">
        <label class="field-label">Search by Username</label>
        <div style="display:flex; gap:8px;">
          <input class="input" id="search-friend-username" placeholder="e.g. arjun_fit, priya_99..." style="flex:1; font-size:12px;" />
          <button class="btn btn-secondary" id="search-friend-btn" style="padding:0 16px;">Search</button>
        </div>
      </div>
      
      <!-- User Preview Box -->
      <div id="friend-search-preview" class="friend-search-preview" style="min-height:80px; display:flex; align-items:center; justify-content:center; border:1.5px dashed var(--border-card); border-radius:var(--radius-lg); padding:12px; background:rgba(255,255,255,0.01);">
        <p style="color:var(--text-muted); font-size:12px; text-align:center; margin:0;">Enter username above and tap Search</p>
      </div>

      <div style="display:flex; gap:10px; margin-top:8px;">
        <button class="btn btn-primary btn-full disabled" id="send-request-btn" disabled>Send Request</button>
        <button class="btn btn-ghost btn-sm" id="cancel-add-friend-btn">Cancel</button>
      </div>
    </div>
  `;

  showModal({
    title: 'Add Friend',
    content: content
  });

  const searchInput = document.getElementById('search-friend-username');
  const searchBtn = document.getElementById('search-friend-btn');
  const previewDiv = document.getElementById('friend-search-preview');
  const sendRequestBtn = document.getElementById('send-request-btn');
  const cancelBtn = document.getElementById('cancel-add-friend-btn');

  let foundUser = null;

  searchBtn?.addEventListener('click', () => {
    const username = searchInput?.value?.trim().toLowerCase();
    if (!username) {
      showToast('Please enter a username', 'error');
      return;
    }

    const usersDatabase = [
      { username: 'vikram_s', name: 'Vikram Singh', style: 'Strength 🏋️', streak: 12, discipline: 88 },
      { username: 'kavita_r', name: 'Kavita Rao', style: 'Yoga/Endurance 🧘', streak: 19, discipline: 91 },
      { username: 'mohit_d', name: 'Mohit Dev', style: 'Bodyweight 🤸', streak: 4, discipline: 62 },
      { username: 'tanvi_k', name: 'Tanvi Kapoor', style: 'Cardio/PPL ⚡', streak: 7, discipline: 74 }
    ];

    foundUser = usersDatabase.find(u => u.username === username || username.includes(u.username) || u.username.includes(username));

    if (foundUser) {
      previewDiv.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; width:100%;">
          <div class="partner-avatar" style="width:40px; height:40px; font-size:16px; background:var(--grad-violet); display:flex; align-items:center; justify-content:center; color:#fff; border-radius:50%">
            ${foundUser.name[0]}
          </div>
          <div style="flex:1; text-align:left;">
            <p style="font-size:13px; font-weight:700; color:var(--text-primary); margin:0;">${foundUser.name}</p>
            <p style="font-size:11px; color:var(--text-muted); margin:2px 0 0 0;">@${foundUser.username} · ${foundUser.style}</p>
          </div>
          <div style="text-align:right;">
            <span class="pill pill-violet" style="font-size:10px;">${foundUser.discipline} Disc.</span>
          </div>
        </div>
      `;
      sendRequestBtn.classList.remove('disabled');
      sendRequestBtn.removeAttribute('disabled');
    } else {
      const cleanUsername = username.replace(/[^a-z0-9]/g, '');
      const seedName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1, 6);
      foundUser = {
        username: cleanUsername || 'athlete_x',
        name: `${seedName || 'Athlete'} Patel`,
        style: 'General Fitness ⚡',
        streak: Math.floor(Math.random() * 10) + 1,
        discipline: 60 + Math.floor(Math.random() * 30)
      };

      previewDiv.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; width:100%;">
          <div class="partner-avatar" style="width:40px; height:40px; font-size:16px; background:var(--grad-violet); display:flex; align-items:center; justify-content:center; color:#fff; border-radius:50%">
            ${foundUser.name[0]}
          </div>
          <div style="flex:1; text-align:left;">
            <p style="font-size:13px; font-weight:700; color:var(--text-primary); margin:0;">${foundUser.name}</p>
            <p style="font-size:11px; color:var(--text-muted); margin:2px 0 0 0;">@${foundUser.username} · ${foundUser.style}</p>
          </div>
          <div style="text-align:right;">
            <span class="pill pill-violet" style="font-size:10px;">${foundUser.discipline} Disc.</span>
          </div>
        </div>
      `;
      sendRequestBtn.classList.remove('disabled');
      sendRequestBtn.removeAttribute('disabled');
    }
  });

  sendRequestBtn?.addEventListener('click', () => {
    if (!foundUser) return;
    
    const state = getState();
    const friends = [...(state.auth?.friends || [])];
    if (friends.some(f => f.name === foundUser.name)) {
      showToast(`${foundUser.name} is already in your Squad!`, 'error');
      closeModal();
      return;
    }

    const newFriend = {
      id: Date.now().toString(),
      name: foundUser.name,
      trainingStyle: foundUser.style,
      streakDays: foundUser.streak,
      disciplineScore: foundUser.discipline,
      compatibility: 75 + Math.floor(Math.random() * 20),
      experience: 'intermediate',
      country: 'India',
      language: 'English',
      trainingDays: 4,
      wakeTime: '07:00',
      timezone: 'GMT+5:30',
      recentActivity: ['Joined Squad', 'Ready to train!']
    };

    friends.push(newFriend);
    setState('auth.friends', friends);
    showToast(`Friend request sent! ${foundUser.name} accepted and joined your Squad ✓`, 'success');
    closeModal();

    const content = document.getElementById('socials-content');
    if (content && _activeTab === 'friends') content.innerHTML = _renderTab('friends');
    _wireContentEvents();
  });

  cancelBtn?.addEventListener('click', closeModal);
}

function _openCreateGroupModal() {
  const state = getState();
  const friends = state.auth?.friends || [];

  const content = `
    <div class="create-group-form" style="display:flex; flex-direction:column; gap:12px;">
      <div class="field-group">
        <label class="field-label">Group Name</label>
        <input class="input" id="group-name-input" placeholder="e.g. Core Crusaders, Beast Crew..." style="font-size:12px;" />
      </div>

      <div class="field-group">
        <label class="field-label">Invite Friends</label>
        <div style="display:flex; flex-direction:column; gap:8px; margin-top:6px; max-height:150px; overflow-y:auto; padding:6px; border:1px solid var(--border-card); border-radius:var(--radius-md);">
          ${friends.length ? friends.map(f => `
            <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-secondary); cursor:pointer;">
              <input type="checkbox" class="group-invite-check" value="${f.id}" data-name="${f.name}" data-score="${f.disciplineScore}" style="accent-color:var(--aura-violet);" />
              <span>${f.name} (Discipline: ${f.disciplineScore})</span>
            </label>
          `).join('') : '<p style="font-size:11px; color:var(--text-muted); text-align:center; margin:10px 0;">No friends in Squad yet. Add friends first!</p>'}
        </div>
      </div>

      <div style="display:flex; gap:10px; margin-top:8px;">
        <button class="btn btn-primary btn-full" id="group-submit-btn">Create Group</button>
        <button class="btn btn-ghost btn-sm" id="group-cancel-btn">Cancel</button>
      </div>
    </div>
  `;

  showModal({
    title: 'Create Custom Group',
    content: content
  });

  document.getElementById('group-submit-btn')?.addEventListener('click', () => {
    const name = document.getElementById('group-name-input')?.value?.trim();
    if (!name) {
      showToast('Please enter a group name', 'error');
      return;
    }

    const checked = document.querySelectorAll('.group-invite-check:checked');
    const selectedMembers = [{ id: 'me', name: 'You', workout: true, protein: true, water: true, sleep: 7.5, recovery: 82, discipline: getDisciplineScore() }];

    checked.forEach(chk => {
      const fId = chk.value;
      const fName = chk.dataset.name;
      const fScore = Number(chk.dataset.score);
      selectedMembers.push({
        id: fId,
        name: fName,
        workout: Math.random() > 0.3,
        protein: Math.random() > 0.4,
        water: Math.random() > 0.25,
        sleep: Number((6.0 + Math.random() * 2.5).toFixed(1)),
        recovery: 65 + Math.floor(Math.random() * 30),
        discipline: fScore
      });
    });

    const newGroup = {
      id: 'g_' + Date.now(),
      name: name,
      members: selectedMembers,
      messages: [
        { from: 'System', text: `Group "${name}" created. Invites accepted!`, time: 'Now' }
      ]
    };

    const state = getState();
    const groups = [...(state.socials?.groups || []), newGroup];
    setState('socials.groups', groups);
    _activeGroupChatId = newGroup.id;

    showToast(`Custom Group "${name}" created successfully!`, 'success');
    closeModal();

    const contentEl = document.getElementById('socials-content');
    if (contentEl && _activeTab === 'friends') contentEl.innerHTML = _renderTab('friends');
    _wireContentEvents();
  });

  document.getElementById('group-cancel-btn')?.addEventListener('click', closeModal);
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
          <div style="text-align:left;">
            <h4 style="font-size:var(--text-lg);font-weight:var(--fw-bold);color:var(--text-primary);margin-bottom:4px;margin-top:0;">${user.name}</h4>
            <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0 0 6px 0;">${country} · ${user.trainingStyle || 'Training'}</p>
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
        <div style="margin-bottom:20px; text-align:left;">
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
  }, 4800);
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

  const pageContent = document.getElementById('page-content');
  const bottomNav = document.getElementById('bottom-nav-mount');

  if (pageContent) {
    pageContent.style.overflow = 'hidden';
    pageContent.scrollTop = 0;
  }
  if (bottomNav) {
    bottomNav.style.display = 'none';
  }

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
    if (pageContent) pageContent.style.overflow = 'auto';
    if (bottomNav) bottomNav.style.display = 'block';

    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab(_activeTab);
    _wireContentEvents();
  });

  document.getElementById('chat-header-user')?.addEventListener('click', () => {
    _openFriendProfile(user);
  });

  document.getElementById('send-chat-btn')?.addEventListener('click', _sendMessage);
  document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') _sendMessage();
  });
}

const MEMBER_MOCK_DATA = {
  'me': {
    discipline: [80, 82, 85, 85, 83, 85, 85],
    workouts: [1, 0, 1, 1, 0, 1, 0],
    recovery: [75, 78, 80, 82, 81, 82, 82],
    protein: [120, 100, 130, 125, 90, 130, 110]
  },
  'f1': {
    discipline: [85, 84, 84, 86, 85, 84, 84],
    workouts: [1, 1, 0, 1, 0, 1, 0],
    recovery: [80, 79, 78, 81, 80, 78, 78],
    protein: [130, 120, 95, 130, 100, 120, 110]
  },
  'f2': {
    discipline: [70, 72, 75, 76, 75, 76, 76],
    workouts: [0, 1, 0, 1, 0, 1, 1],
    recovery: [82, 84, 85, 83, 86, 85, 85],
    protein: [80, 110, 85, 115, 90, 120, 115]
  },
  'f4': {
    discipline: [90, 92, 93, 91, 94, 93, 93],
    workouts: [1, 1, 1, 0, 1, 1, 0],
    recovery: [70, 72, 74, 75, 73, 74, 74],
    protein: [140, 135, 145, 110, 135, 140, 100]
  }
};

function _renderGroupSVGChart(metricKey, title, group) {
  const colors = ['#a78bfa', '#34d399', '#f43f5e', '#fbbf24', '#60a5fa'];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const width = 280;
  const height = 80;
  const padding = 15;
  
  let linesHtml = '';
  let legendHtml = '';
  
  group.members.forEach((m, idx) => {
    const mColor = colors[idx % colors.length];
    const mData = MEMBER_MOCK_DATA[m.id] || MEMBER_MOCK_DATA['me'];
    const values = mData[metricKey] || [70, 75, 80, 82, 80, 85, 85];
    
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;
    
    const points = values.map((val, i) => {
      const x = padding + (i * (width - 2 * padding) / 6);
      const y = height - padding - ((val - minVal) * (height - 2 * padding) / range);
      return `${x},${y}`;
    }).join(' ');
    
    linesHtml += `
      <polyline fill="none" stroke="${mColor}" stroke-width="2" points="${points}" stroke-linecap="round" stroke-linejoin="round" />
      ${values.map((val, i) => {
        const x = padding + (i * (width - 2 * padding) / 6);
        const y = height - padding - ((val - minVal) * (height - 2 * padding) / range);
        return `<circle cx="${x}" cy="${y}" r="2.5" fill="${mColor}" />`;
      }).join('')}
    `;
    
    legendHtml += `
      <div style="display:flex; align-items:center; gap:4px; font-size:9px;">
        <span style="width:7px; height:7px; background:${mColor}; border-radius:50%; display:inline-block;"></span>
        <span style="color:var(--text-secondary);">${m.name}</span>
      </div>
    `;
  });
  
  return `
    <div class="card" style="padding:10px; display:flex; flex-direction:column; gap:6px;">
      <span style="font-size:10.5px; font-weight:700; color:var(--text-primary);">${title}</span>
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:80px; overflow:visible;">
        <!-- Grid Lines -->
        <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2" />
        <line x1="${padding}" y1="${height / 2}" x2="${width - padding}" y2="${height / 2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2" />
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.06)" />
        
        <!-- Polylines -->
        ${linesHtml}
        
        <!-- X-Axis Labels -->
        ${days.map((day, i) => {
          const x = padding + (i * (width - 2 * padding) / 6);
          return `<text x="${x}" y="${height - 2}" font-size="7" fill="var(--text-muted)" text-anchor="middle">${day}</text>`;
        }).join('')}
      </svg>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:2px;">
        ${legendHtml}
      </div>
    </div>
  `;
}

function _openGroupDetailModal(groupId) {
  const state = getState();
  const groups = state.socials?.groups || [];
  const group = groups.find(g => g.id === groupId) || groups[0];
  if (!group) return;

  _activeGroupChatId = group.id;

  const sortedMembers = [...group.members].sort((a, b) => b.discipline - a.discipline);
  const myRankIdx = sortedMembers.findIndex(m => m.id === 'me' || m.id === 'You');
  const myRank = myRankIdx !== -1 ? myRankIdx + 1 : '—';
  const totalScore = group.members.reduce((sum, m) => sum + m.discipline, 0);
  const avgScore = Math.round(totalScore / group.members.length);

  const openGroupChatBtnHtml = `
    <div class="card" id="group-open-chat-btn" style="cursor:pointer; padding:16px; margin-bottom:12px; border:1.5px solid rgba(167,139,250,0.25); background:rgba(167,139,250,0.04); display:flex; flex-direction:column; gap:8px; transition:all 0.2s ease;" onmouseenter="this.style.borderColor='rgba(167,139,250,0.5)'" onmouseleave="this.style.borderColor='rgba(167,139,250,0.25)'">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:22px;">💬</span>
        <div style="flex:1;">
          <strong style="font-size:13px; color:var(--text-primary); display:block;">Group Chat</strong>
          <span style="font-size:11px; color:var(--text-muted);">Open group conversation with all members</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; justify-content:flex-end;">
        <span style="font-size:11px; color:var(--aura-violet-light); font-weight:700;">Open Group Chat →</span>
      </div>
    </div>
  `;

  const tableHtml = `
    <div class="group-table-container" style="margin-bottom:16px; margin-top:8px;">
      <table class="group-table" style="width:100%; font-size:11px; border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid var(--border-subtle); color:var(--text-muted); font-size:10px; text-transform:uppercase;">
            <th style="text-align:left; padding:6px 4px;">Friend</th>
            <th style="text-align:center; padding:6px 4px;">Work</th>
            <th style="text-align:center; padding:6px 4px;">Prot</th>
            <th style="text-align:center; padding:6px 4px;">Watr</th>
            <th style="text-align:center; padding:6px 4px;">Sleep</th>
            <th style="text-align:center; padding:6px 4px;">Recv</th>
            <th style="text-align:center; padding:6px 4px;">Disc</th>
          </tr>
        </thead>
        <tbody>
          ${group.members.map(m => `
            <tr style="border-bottom:1px dashed rgba(255,255,255,0.03);">
              <td class="username-clickable" data-username="${m.name}" style="padding:8px 4px; font-weight:bold; color:var(--text-primary); cursor:pointer; text-align:left;">${m.name}</td>
              <td style="text-align:center; padding:8px 4px; color:${m.workout ? 'var(--aura-mint-light)' : 'var(--aura-rose-light)'};">${m.workout ? '✓' : '✗'}</td>
              <td style="text-align:center; padding:8px 4px; color:${m.protein ? 'var(--aura-mint-light)' : 'var(--aura-rose-light)'};">${m.protein ? '✓' : '✗'}</td>
              <td style="text-align:center; padding:8px 4px; color:${m.water ? 'var(--aura-mint-light)' : 'var(--aura-rose-light)'};">${m.water ? '✓' : '✗'}</td>
              <td style="text-align:center; padding:8px 4px; color:var(--text-secondary);">${m.sleep}h</td>
              <td style="text-align:center; padding:8px 4px; color:var(--aura-violet-light); font-weight:bold;">${m.recovery}%</td>
              <td style="text-align:center; padding:8px 4px; color:var(--aura-amber-light); font-weight:bold;">${m.discipline}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const chartsHtml = `
    <div style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">
      ${_renderGroupSVGChart('discipline', 'Discipline Trend (Score)', group)}
      ${_renderGroupSVGChart('workouts', 'Workouts Completed (Sessions)', group)}
      ${_renderGroupSVGChart('recovery', 'Recovery Readiness (%)', group)}
      ${_renderGroupSVGChart('protein', 'Protein Intake Logged (g)', group)}
    </div>
  `;

  const modalContentHtml = `
    <div class="group-detail-modal-body" style="max-height:72vh; overflow-y:auto; padding-right:4px;">
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:12px;">
        <div class="card" style="padding:10px; text-align:center;">
          <span style="font-size:9px; color:var(--text-muted); display:block; text-transform:uppercase; letter-spacing:0.4px;">Your Rank</span>
          <strong style="font-size:16px; color:var(--aura-violet-light); display:block; margin-top:4px;">${myRank === 1 ? '🥇 1st' : myRank === 2 ? '🥈 2nd' : myRank === 3 ? '🥉 3rd' : `${myRank}th`}</strong>
        </div>
        <div class="card" style="padding:10px; text-align:center;">
          <span style="font-size:9px; color:var(--text-muted); display:block; text-transform:uppercase; letter-spacing:0.4px;">Group Avg</span>
          <strong style="font-size:16px; color:var(--aura-amber-light); display:block; margin-top:4px;">${avgScore} Disc</strong>
        </div>
        <div class="card" id="group-header-chat-btn" style="padding:10px; text-align:center; cursor:pointer; border-color:rgba(0,214,143,0.35); background:rgba(0,214,143,0.08); transition:all 0.2s ease;" onmouseenter="this.style.borderColor='rgba(0,214,143,0.65)'" onmouseleave="this.style.borderColor='rgba(0,214,143,0.35)'">
          <span style="font-size:16px; display:block;">💬</span>
          <strong style="font-size:13px; color:#00D68F; display:block; margin-top:2px;">Chat</strong>
        </div>
      </div>

      <span class="section-label" style="display:block; margin-bottom:8px;">Squad Matrix</span>
      ${tableHtml}

      <span class="section-label" style="margin-top:12px; display:block;">Weekly Trends</span>
      ${chartsHtml}

      <button class="btn btn-ghost btn-sm btn-full" id="close-group-details-btn" style="margin-top:12px;">Close Details</button>
    </div>
  `;

  showModal({
    title: group.name,
    content: modalContentHtml
  });

  document.getElementById('close-group-details-btn')?.addEventListener('click', closeModal);
  document.getElementById('group-header-chat-btn')?.addEventListener('click', () => {
    closeModal();
    _openGroupChatFullscreen(group.id);
  });

  // Wire username click inside detail sheet
  document.querySelectorAll('.modal-sheet .username-clickable').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const uname = el.dataset.username;
      const state = getState();
      const friendObj = state.auth?.friends?.find(f => f.name === uname);
      if (friendObj) {
        closeModal();
        setTimeout(() => _openFriendProfile(friendObj), 200);
      }
    });
  });
}

function _openGroupChatFullscreen(groupId) {
  const state = getState();
  const groups = state.socials?.groups || [];
  const group = groups.find(g => g.id === groupId) || groups[0];
  if (!group) return;

  _activeGroupChatId = group.id;

  const overlay = document.getElementById('chat-overlay');
  const content = document.getElementById('chat-content');
  if (!overlay || !content) return;

  const pageContent = document.getElementById('page-content');
  const bottomNav = document.getElementById('bottom-nav-mount');

  if (pageContent) {
    pageContent.style.overflow = 'hidden';
    pageContent.scrollTop = 0;
  }
  if (bottomNav) {
    bottomNav.style.display = 'none';
  }

  const msgs = group.messages || [];

  content.innerHTML = `
    <div class="chat-header">
      <button class="icon-btn" id="close-group-chat-btn">←</button>
      <div class="chat-user-info" style="cursor:pointer">
        <div class="partner-avatar" style="width:32px;height:32px;font-size:13px;background:var(--grad-blue);display:flex;align-items:center;justify-content:center;color:#fff;border-radius:50%">${group.name?.[0]}</div>
        <span class="chat-user-name">${group.name}</span>
      </div>
    </div>
    <div class="chat-messages" id="group-fullscreen-messages">
      ${!msgs.length ? `<div class="chat-empty">No messages yet. Say hi! 👋</div>` :
        msgs.map(m => `
          <div class="group-chat-msg-row ${m.from === 'You' ? 'mine' : 'theirs'}">
            <span class="group-chat-msg-sender username-clickable" data-username="${m.from}" style="cursor:pointer; color:var(--aura-violet-light); font-weight:var(--fw-bold);">${m.from}</span>
            <div class="group-chat-msg-bubble">${m.text}</div>
            <span class="group-chat-msg-time">${m.time}</span>
          </div>
        `).join('')
      }
    </div>
    <div class="chat-input-bar">
      <input class="input" id="group-fullscreen-input" placeholder="Message group..." />
      <button class="btn btn-primary btn-sm" id="send-group-fullscreen-btn">Send</button>
    </div>
  `;

  overlay.classList.remove('hidden');

  document.getElementById('close-group-chat-btn')?.addEventListener('click', () => {
    overlay.classList.add('hidden');
    if (pageContent) pageContent.style.overflow = 'auto';
    if (bottomNav) bottomNav.style.display = 'block';

    const content = document.getElementById('socials-content');
    if (content) content.innerHTML = _renderTab(_activeTab);
    _wireContentEvents();
  });

  // Wire username click inside fullscreen chat
  document.getElementById('group-fullscreen-messages')?.addEventListener('click', (e) => {
    const usernameSpan = e.target.closest('.group-chat-msg-sender');
    if (usernameSpan) {
      const username = usernameSpan.dataset.username;
      if (username && username !== 'You' && username !== 'System') {
        const userObj = state.auth?.friends?.find(f => f.name === username);
        if (userObj) {
          overlay.classList.add('hidden');
          if (pageContent) pageContent.style.overflow = 'auto';
          if (bottomNav) bottomNav.style.display = 'block';
          _openFriendProfile(userObj);
        } else {
          showToast(`Profile of ${username} is not accessible`, 'default');
        }
      }
    }
  });

  const sendBtn = document.getElementById('send-group-fullscreen-btn');
  const inputEl = document.getElementById('group-fullscreen-input');

  const sendMessage = () => {
    const text = inputEl?.value?.trim();
    if (!text) return;

    const state = getState();
    const groups = [...(state.socials?.groups || [])];
    const groupIdx = groups.findIndex(g => g.id === _activeGroupChatId);
    if (groupIdx === -1) return;

    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    groups[groupIdx].messages.push({
      from: 'You',
      text: text,
      time: time
    });

    setState('socials.groups', groups);

    if (inputEl) inputEl.value = '';

    const container = document.getElementById('group-fullscreen-messages');
    if (container) {
      container.innerHTML += `
        <div class="group-chat-msg-row mine">
          <span class="group-chat-msg-sender">You</span>
          <div class="group-chat-msg-bubble">${text}</div>
          <span class="group-chat-msg-time">${time}</span>
        </div>
      `;
      container.scrollTop = container.scrollHeight;
    }
  };

  sendBtn?.addEventListener('click', sendMessage);
  inputEl?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });
}

function _openInboxModal() {
  const state = getState();
  const friends = state.auth?.friends || [];
  const groups = state.socials?.groups || [];
  const partner = state.auth?.partner;
  
  const chatMessages = state.socials?.chatMessages || {};
  
  let dmsHtml = '';
  friends.forEach(f => {
    const msgs = chatMessages[f.id] || [];
    const lastMsg = msgs.length ? msgs[msgs.length - 1].text : 'Start a direct message conversation...';
    const lastTime = msgs.length ? msgs[msgs.length - 1].time : '';
    dmsHtml += `
      <div class="inbox-row card clickable-inbox-row" data-type="dm" data-id="${f.id}" style="cursor:pointer; display:flex; align-items:center; gap:12px; padding:12px; margin-bottom:8px;">
        <div class="partner-avatar" style="width:36px; height:36px; font-size:14px; background:var(--grad-violet); display:flex; align-items:center; justify-content:center; color:#fff; border-radius:50%">${f.name[0]}</div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:baseline;">
            <strong style="font-size:13px; color:var(--text-primary);">${f.name}</strong>
            <span style="font-size:9px; color:var(--text-muted);">${lastTime}</span>
          </div>
          <p style="font-size:11px; color:var(--text-muted); margin:2px 0 0 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${lastMsg}</p>
        </div>
      </div>
    `;
  });

  let groupsHtml = '';
  groups.forEach(g => {
    const lastMsg = g.messages.length ? g.messages[g.messages.length - 1] : null;
    const lastMsgText = lastMsg ? `${lastMsg.from}: ${lastMsg.text}` : 'No messages yet';
    const lastTime = lastMsg ? lastMsg.time : '';
    groupsHtml += `
      <div class="inbox-row card clickable-inbox-row" data-type="group" data-id="${g.id}" style="cursor:pointer; display:flex; align-items:center; gap:12px; padding:12px; margin-bottom:8px;">
        <div class="partner-avatar" style="width:36px; height:36px; font-size:14px; background:var(--grad-blue); display:flex; align-items:center; justify-content:center; color:#fff; border-radius:50%">${g.name[0]}</div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:baseline;">
            <strong style="font-size:13px; color:var(--text-primary);">${g.name}</strong>
            <span style="font-size:9px; color:var(--text-muted);">${lastTime}</span>
          </div>
          <p style="font-size:11px; color:var(--text-muted); margin:2px 0 0 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${lastMsgText}</p>
        </div>
      </div>
    `;
  });

  let partnerHtml = '';
  if (partner) {
    const msgs = chatMessages[partner.id] || [];
    const lastMsg = msgs.length ? msgs[msgs.length - 1].text : 'Chat with your partner...';
    const lastTime = msgs.length ? msgs[msgs.length - 1].time : '';
    partnerHtml = `
      <div class="inbox-row card clickable-inbox-row" data-type="partner" data-id="${partner.id}" style="cursor:pointer; display:flex; align-items:center; gap:12px; padding:12px; margin-bottom:8px; border-color:var(--aura-violet);">
        <div class="partner-avatar" style="width:36px; height:36px; font-size:14px; background:var(--grad-violet); display:flex; align-items:center; justify-content:center; color:#fff; border-radius:50%">${partner.name[0]}</div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:baseline;">
            <strong style="font-size:13px; color:var(--text-primary);">${partner.name} (Partner 🤝)</strong>
            <span style="font-size:9px; color:var(--text-muted);">${lastTime}</span>
          </div>
          <p style="font-size:11px; color:var(--text-muted); margin:2px 0 0 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${lastMsg}</p>
        </div>
      </div>
    `;
  }

  const content = `
    <div class="inbox-modal-content" style="max-height:60vh; overflow-y:auto; padding-right:4px;">
      ${partnerHtml ? `
        <span class="section-label" style="margin-top:0;">Partner Chat</span>
        ${partnerHtml}
      ` : ''}
      
      <span class="section-label" style="${partnerHtml ? 'margin-top:12px;' : 'margin-top:0;'}">Group Chats</span>
      ${groupsHtml || '<p style="font-size:11px; color:var(--text-muted); padding:10px 0;">No active group chats.</p>'}
      
      <span class="section-label" style="margin-top:12px;">Direct Messages</span>
      ${dmsHtml || '<p style="font-size:11px; color:var(--text-muted); padding:10px 0;">No active direct messages.</p>'}
      
      <button class="btn btn-ghost btn-sm btn-full" id="close-inbox-btn" style="margin-top:16px;">Close Inbox</button>
    </div>
  `;

  showModal({
    title: 'Inbox / Messages',
    content: content
  });

  document.getElementById('close-inbox-btn')?.addEventListener('click', closeModal);

  // Wire inbox list clicks
  document.querySelectorAll('.clickable-inbox-row').forEach(row => {
    row.addEventListener('click', () => {
      const type = row.dataset.type;
      const id = row.dataset.id;
      closeModal();
      
      setTimeout(() => {
        if (type === 'group') {
          _openGroupChatFullscreen(id);
        } else if (type === 'dm' || type === 'partner') {
          const userObj = (type === 'partner') ? partner : friends.find(f => f.id === id);
          if (userObj) {
            _openChat(userObj);
          }
        }
      }, 100);
    });
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

function _sendGroupMessage() {
  const input = document.getElementById('group-chat-input');
  const text = input?.value?.trim();
  if (!text) return;

  const state = getState();
  const groups = [...(state.socials?.groups || [])];
  const groupIdx = groups.findIndex(g => g.id === _activeGroupChatId);
  if (groupIdx === -1) return;

  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  groups[groupIdx].messages.push({
    from: 'You',
    text: text,
    time: time
  });

  setState('socials.groups', groups);

  if (input) input.value = '';

  const container = document.getElementById('group-chat-messages');
  if (container) {
    container.innerHTML += `
      <div class="group-chat-msg-row mine">
        <span class="group-chat-msg-sender">You</span>
        <div class="group-chat-msg-bubble">${text}</div>
        <span class="group-chat-msg-time">${time}</span>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  }
}
