// ==========================================
// AURA V2 — Rank Center Page
// Route: /rank-center
// ==========================================

import { getState, setState, updateState } from '../../state/index.js';
import { navigate } from '../../router.js';
import { showToast } from '../../components/shared/ui.js';
import { 
  getRankEmblemSVG, 
  refreshUserRank, 
  getMockLeaderboard, 
  simulateAdjustment, 
  simulateChallengerOvertake,
  RANK_TIERS
} from '../../services/rank-engine.js';
import './rank.css';

// Active leaderboard tab: 'global' | 'country' | 'friends' | 'squad' | 'partner'
let _activeTab = 'global';

export function render() {
  const state = getState();
  
  // Refresh user's rank status on page load
  const { score, tier, position, alertMessage, alertType } = refreshUserRank();
  const rankState = state.rank || {};
  const auth = state.auth || {};
  const currentRankName = rankState.currentRank || 'Bronze III';
  const rankId = rankState.rankId || 'bronze_3';
  
  // Find current tier details
  const tierIndex = RANK_TIERS.findIndex(t => t.id === rankId);
  const currentTier = RANK_TIERS[tierIndex] || RANK_TIERS[0];
  const prevTier = tierIndex > 0 ? RANK_TIERS[tierIndex - 1] : null;
  const nextTier = tierIndex < RANK_TIERS.length - 1 ? RANK_TIERS[tierIndex + 1] : null;

  // Calculate progress details
  const min = currentTier.minScore;
  const max = currentTier.maxScore;
  const range = max - min || 1;
  const scoreOffset = score - min;
  const progressPct = Math.min(100, Math.max(0, Math.round((scoreOffset / range) * 100)));
  const ptsRemaining = max - score + 1;

  // Render mock alerts if any promotion/demotion happened
  let alertBannerHtml = '';
  if (rankState.lastAlert) {
    const alert = rankState.lastAlert;
    // Only display if alert happened in the last 10 seconds to avoid stale banners
    if (Date.now() - alert.timestamp < 10000) {
      const bannerClass = alert.type === 'promotion' ? 'wr-positive' : 'wr-warning';
      alertBannerHtml = `
        <div class="card ${bannerClass}" style="padding: 12px; margin-bottom: 12px; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: space-between;">
          <span>${alert.message}</span>
          <button style="background: transparent; border: none; color: inherit; font-weight: bold; cursor: pointer;" id="dismiss-alert-btn">✕</button>
        </div>
      `;
    }
  }

  return `
    <div class="rank-center-page">
      <!-- Header -->
      <div class="rank-center-header">
        <button class="back-btn" id="rank-back-btn" aria-label="Back to Home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div class="rank-center-title-group">
          <span class="rank-center-subtitle">AURA hierarchy</span>
          <h1 class="rank-center-title">Rank Center</h1>
        </div>
      </div>

      ${alertBannerHtml}

      <!-- User Rank Hero Card -->
      <div class="rank-hero-card">
        <div class="rank-hero-layout">
          <div class="rank-hero-emblem-wrap">
            ${getRankEmblemSVG(rankId, 80)}
          </div>
          <div class="rank-hero-info">
            <span class="rank-hero-badge">
              ${currentTier.limit ? `LIMIT: ${currentTier.limit} GLOBALLY` : 'OPEN TIER'}
            </span>
            <h2 class="rank-hero-name">
              ${currentRankName}
            </h2>
            <div class="rank-hero-position">
              Global Rank <strong>#${rankState.globalRank.toLocaleString()}</strong>
            </div>
            ${rankState.activeTitle ? `<div style="font-size:10px; color:var(--aura-violet-light); font-weight:bold; margin-top:2px;">Title: ${rankState.activeTitle}</div>` : ''}
          </div>
        </div>

        <div class="rank-hero-stats">
          <div class="rank-hero-stat-item">
            <div class="rank-hero-stat-val">${state.checkIn?.readinessScore || 75}</div>
            <div class="rank-hero-stat-lbl">Discipline</div>
          </div>
          <div class="rank-hero-stat-item">
            <div class="rank-hero-stat-val">${score}</div>
            <div class="rank-hero-stat-lbl">Rank Score</div>
          </div>
          <div class="rank-hero-stat-item">
            <div class="rank-hero-stat-val">🔥 ${state.workout?.streakDays || 0}d</div>
            <div class="rank-hero-stat-lbl">Streak</div>
          </div>
        </div>
      </div>

      <!-- Progression Panel -->
      <div class="progression-panel">
        <div class="progression-flow">
          <div class="progression-step ${prevTier ? '' : 'disabled'}" style="opacity: ${prevTier ? '0.6' : '0.2'}">
            <span style="font-size:8px; color:var(--text-muted);">PREVIOUS</span>
            <span class="progression-step-name">${prevTier ? prevTier.name : 'None'}</span>
          </div>
          <div class="progression-arrow">→</div>
          <div class="progression-step active">
            <span style="font-size:8px; color:var(--aura-violet-light); font-weight:bold;">CURRENT</span>
            <span class="progression-step-name">${currentRankName}</span>
          </div>
          <div class="progression-arrow">→</div>
          <div class="progression-step" style="opacity: ${nextTier ? '0.8' : '0.2'}">
            <span style="font-size:8px; color:var(--text-muted);">NEXT</span>
            <span class="progression-step-name">${nextTier ? nextTier.name : 'Peak'}</span>
          </div>
        </div>

        ${nextTier ? `
          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="rank-progress-fill" style="width: 0%" data-width="${progressPct}"></div>
          </div>
          <div class="progression-details">
            <span>Progress: <strong>${progressPct}%</strong></span>
            <span class="points-remaining">${ptsRemaining} pts to promote</span>
          </div>
        ` : `
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: 100%; background: var(--grad-rose)"></div>
          </div>
          <div class="progression-details" style="justify-content: center;">
            <strong style="color:var(--aura-rose);">MAX LEVEL REACHED — LEADER OF THE HIERARCHY</strong>
          </div>
        `}
      </div>

      <!-- Leaderboards -->
      <div class="leaderboard-container">
        <div class="section-label">Fitness Hierarchy Board</div>
        
        <!-- Tabs -->
        <div class="tabs-row">
          <button class="tab-btn ${_activeTab === 'global' ? 'active' : ''}" data-tab="global">🌐 Global</button>
          <button class="tab-btn ${_activeTab === 'country' ? 'active' : ''}" data-tab="country">📍 Country</button>
          <button class="tab-btn ${_activeTab === 'friends' ? 'active' : ''}" data-tab="friends">👥 Friends</button>
          <button class="tab-btn ${_activeTab === 'squad' ? 'active' : ''}" data-tab="squad">🛡️ Squad</button>
          <button class="tab-btn ${_activeTab === 'partner' ? 'active' : ''}" data-tab="partner">🤝 Partner</button>
        </div>

        <!-- Leaderboard List View -->
        <div class="leaderboard-list">
          ${_renderLeaderboardRows(state, score)}
        </div>
      </div>

      <!-- Rewards Drawer -->
      <div class="rewards-section">
        <div class="section-label">Unlockable Identity Rewards</div>
        <p style="font-size:10px; color:var(--text-secondary); margin-top:2px;">Unlock luxury cosmetics by climbing the hierarchy. Select to activate.</p>
        
        <div class="rewards-grid">
          ${_renderRewardsList(rankState)}
        </div>
      </div>

      <!-- Performance Simulator (For Testing Promotions/Demotions) -->
      <div class="simulator-panel">
        <div class="section-label" style="color:var(--aura-rose);">⚠️ Performance Simulator (Test Rig)</div>
        <p style="font-size:10px; color:var(--text-secondary); margin-top:2px;">Simulate physical consistency logs to test promotions, demotions, and challenger overtake alerts instantly.</p>
        
        <div class="sim-actions-grid">
          <button class="btn-sim-add" id="sim-workout-btn">🏋️ Log Workouts (+250 Pts)</button>
          <button class="btn-sim-add" id="sim-adherence-btn">🥗 Perfect Nutrition (+75 Pts)</button>
          <button class="btn-sim-sub" id="sim-inactivity-btn">💤 Missed Workouts (-300 Pts)</button>
          <button class="btn-sim-full" id="sim-overtake-btn">🔥 Overtake Check (Phoenix Challenger Test)</button>
        </div>
      </div>
    </div>
  `;
}

// ── Render Leaderboard Rows dynamically ──
function _renderLeaderboardRows(state, userScore) {
  const lb = getMockLeaderboard();
  
  if (_activeTab === 'global') {
    // Show top 25 global athletes + the user's close neighbors if they are lower
    const displayList = lb.slice(0, 25);
    const userIndex = lb.findIndex(item => item.username === 'me' || item.username === state.auth?.username);
    
    // If user is lower than top 25, append them and their neighbors
    if (userIndex >= 25) {
      displayList.push({ divider: true });
      const neighbors = lb.slice(userIndex - 2, userIndex + 3);
      neighbors.forEach(n => displayList.push(n));
    }

    return _generateRowsHtml(displayList, lb);
  }

  if (_activeTab === 'country') {
    // Filter by user's country
    const country = state.auth?.country || 'India';
    const filtered = lb.filter(item => item.country.toLowerCase() === country.toLowerCase() || item.username === 'me' || item.username === state.auth?.username);
    return _generateRowsHtml(filtered.slice(0, 25), lb);
  }

  if (_activeTab === 'friends') {
    // Build friends list
    const friends = state.auth?.friends || [];
    const friendsList = friends.map((f, i) => ({
      username: f.username || `friend_${i}`,
      name: f.name || `Friend ${i + 1}`,
      score: 1200 + (i * 315) - (i * i * 40),
      discipline: 80 - (i * 4),
      streak: 12 - i,
      country: state.auth?.country || 'India',
      rankId: getRankTierForScore(1200 + (i * 315) - (i * i * 40)).id
    }));

    // Add user
    friendsList.push({
      username: state.auth?.username || 'me',
      name: state.auth?.profileName || 'Athlete',
      score: userScore,
      discipline: state.checkIn?.readinessScore || 75,
      streak: state.workout?.streakDays || 0,
      country: state.auth?.country || 'India',
      rankId: state.rank?.rankId || 'bronze_3',
      isMe: true
    });

    const sortedFriends = friendsList.sort((a, b) => b.score - a.score);
    return _generateRowsHtml(sortedFriends, sortedFriends);
  }

  if (_activeTab === 'squad') {
    // Build mock squad list
    const squadList = [
      { username: 'captain_bold', name: 'Alpha Captain', score: 3200, discipline: 91, streak: 28, country: 'USA', rankId: 'paragon' },
      { username: 'diet_ninja', name: 'Macro Warrior', score: 2850, discipline: 86, streak: 15, country: 'India', rankId: 'mythic_2' },
      { username: 'recovery_guru', name: 'Recovery Zen', score: 2150, discipline: 89, streak: 8, country: 'Germany', rankId: 'mythic_3' },
      {
        username: state.auth?.username || 'me',
        name: state.auth?.profileName || 'Athlete',
        score: userScore,
        discipline: state.checkIn?.readinessScore || 75,
        streak: state.workout?.streakDays || 0,
        country: state.auth?.country || 'India',
        rankId: state.rank?.rankId || 'bronze_3',
        isMe: true
      }
    ];

    const sortedSquad = squadList.sort((a, b) => b.score - a.score);
    return _generateRowsHtml(sortedSquad, sortedSquad);
  }

  if (_activeTab === 'partner') {
    // Comparison Me vs Partner
    const partnerName = state.auth?.partner || 'Gym Partner';
    const partnerList = [
      { username: 'partner', name: partnerName, score: Math.round(userScore * 1.05 + 120), discipline: 84, streak: 12, country: 'India', rankId: getRankTierForScore(userScore * 1.05 + 120).id },
      {
        username: state.auth?.username || 'me',
        name: state.auth?.profileName || 'Athlete',
        score: userScore,
        discipline: state.checkIn?.readinessScore || 75,
        streak: state.workout?.streakDays || 0,
        country: state.auth?.country || 'India',
        rankId: state.rank?.rankId || 'bronze_3',
        isMe: true
      }
    ];

    const sortedPartner = partnerList.sort((a, b) => b.score - a.score);
    return _generateRowsHtml(sortedPartner, sortedPartner);
  }

  return `<div style="padding:20px; text-align:center; color:var(--text-muted);">No records found</div>`;
}

function _generateRowsHtml(list, masterList) {
  if (list.length === 0) {
    return `<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">No members registered</div>`;
  }

  return list.map((item) => {
    if (item.divider) {
      return `<div style="text-align:center; padding:6px; font-size:10px; color:var(--text-muted); background:var(--bg-translucent-xs); border-top:1px dashed var(--border-card);">... matching global brackets ...</div>`;
    }

    const isMe = item.isMe || item.username === 'me' || item.username === getState().auth?.username;
    
    // Find absolute rank index in master leaderboard
    const absoluteIndex = masterList.findIndex(x => x.username === item.username);
    const displayRank = absoluteIndex >= 0 ? absoluteIndex + 1 : '-';

    const rankTierObj = RANK_TIERS.find(t => t.id === item.rankId) || RANK_TIERS[0];
    const initial = (item.name || item.username || 'A').charAt(0).toUpperCase();

    return `
      <div class="leaderboard-row ${isMe ? 'me' : ''}">
        <div class="leaderboard-rank">#${displayRank}</div>
        <div class="leaderboard-avatar-wrap">
          ${initial}
        </div>
        <div class="leaderboard-userinfo">
          <span class="leaderboard-name">${item.name || item.username}</span>
          <span class="leaderboard-meta">${rankTierObj.name} · ${item.country}</span>
        </div>
        <div class="leaderboard-score-group">
          <span class="leaderboard-score">${item.score.toLocaleString()}</span>
          <span class="leaderboard-streak">🔥 ${item.streak}d</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── Render Unlockable Rewards list ──
function _renderRewardsList(rankState) {
  const rewards = rankState.rewardsUnlocked || { frames: ['default'], emblems: [], themes: [], titles: ['Novice'] };
  
  const frameOptions = [
    { id: 'default', name: 'Standard Shield', desc: 'Sleek luxury outline', req: 'Bronze III' },
    { id: 'gold_ring', name: 'Gold Bezel', desc: 'Polished 24k gold halo', req: 'Gold III' },
    { id: 'carbon_fiber', name: 'Carbon Fiber', desc: 'Tactical matte weave ring', req: 'Platinum III' },
    { id: 'paragon_halo', name: 'Paragon Halo', desc: 'Amber violet energy ring', req: 'Paragon' },
    { id: 'phoenix_flame', name: 'Phoenix Flame', desc: 'Animated solar blaze crown', req: 'Phoenix' }
  ];

  const titleOptions = [
    { id: 'Novice', name: 'Novice', req: 'Bronze III' },
    { id: 'Sentinel', name: 'Sentinel', req: 'Silver III' },
    { id: 'Iron-Clad', name: 'Iron-Clad', req: 'Gold III' },
    { id: 'Unstoppable', name: 'Unstoppable', req: 'Platinum III' },
    { id: 'Titan', name: 'Titan', req: 'Paragon' },
    { id: 'Phoenix Sovereign', name: 'Phoenix Sovereign', req: 'Phoenix' }
  ];

  // Map active values
  const activeFrame = rankState.activeFrame || 'default';
  const activeTitle = rankState.activeTitle || 'Novice';

  let itemsHtml = '';

  // Render Frames
  frameOptions.forEach(f => {
    const isUnlocked = rewards.frames.includes(f.id) || f.id === 'default';
    const isActive = activeFrame === f.id;
    itemsHtml += `
      <div class="reward-card ${isUnlocked ? '' : 'locked'} ${isActive ? 'active' : ''}" 
           data-type="frame" data-id="${f.id}" data-unlocked="${isUnlocked}">
        ${isUnlocked ? '<span class="reward-badge-unlocked">UNLOCKED</span>' : ''}
        <span style="font-size: 20px;">🖼️</span>
        <div class="reward-card-title">${f.name}</div>
        <div class="reward-card-desc">${isUnlocked ? f.desc : `Requires: ${f.req}`}</div>
      </div>
    `;
  });

  // Render Titles
  titleOptions.forEach(t => {
    const isUnlocked = rewards.titles.includes(t.id) || t.id === 'Novice';
    const isActive = activeTitle === t.id;
    itemsHtml += `
      <div class="reward-card ${isUnlocked ? '' : 'locked'} ${isActive ? 'active' : ''}" 
           data-type="title" data-id="${t.id}" data-unlocked="${isUnlocked}">
        ${isUnlocked ? '<span class="reward-badge-unlocked">UNLOCKED</span>' : ''}
        <span style="font-size: 16px; font-weight:bold; color:var(--text-accent);">[${t.name}]</span>
        <div class="reward-card-title">Title: ${t.name}</div>
        <div class="reward-card-desc">${isUnlocked ? 'Unlocked' : `Requires: ${t.req}`}</div>
      </div>
    `;
  });

  return itemsHtml;
}

export function onEnter() {
  _wireEvents();

  // Smooth bar animation trigger
  setTimeout(() => {
    const bar = document.getElementById('rank-progress-fill');
    if (bar && bar.dataset.width) {
      bar.style.width = `${bar.dataset.width}%`;
    }
  }, 100);
}

export function onLeave() {
  // Reset alert states so they don't block
  updateState('rank', { lastAlert: null });
}

function _wireEvents() {
  // Back Navigation
  document.getElementById('rank-back-btn')?.addEventListener('click', () => navigate('/home'));

  // Dismiss alert
  document.getElementById('dismiss-alert-btn')?.addEventListener('click', () => {
    updateState('rank', { lastAlert: null });
    _triggerReRender();
  });

  // Leaderboard Tab clicks
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeTab = btn.dataset.tab;
      _triggerReRender();
    });
  });

  // Reward Card activation clicks
  document.querySelectorAll('.reward-card').forEach(card => {
    card.addEventListener('click', () => {
      const unlocked = card.dataset.unlocked === 'true';
      if (!unlocked) {
        showToast('This reward is currently locked.', 'error');
        return;
      }

      const type = card.dataset.type;
      const id = card.dataset.id;

      if (type === 'frame') {
        updateState('rank', { activeFrame: id });
        showToast(`Profile frame updated to: ${id.replace('_', ' ')} ✓`, 'success');
      } else if (type === 'title') {
        updateState('rank', { activeTitle: id });
        showToast(`Title active: ${id} ✓`, 'success');
      }

      _triggerReRender();
    });
  });

  // Simulator Triggers
  document.getElementById('sim-workout-btn')?.addEventListener('click', () => {
    simulateAdjustment(250);
    showToast('Logged high-intensity workout split! +250 Pts', 'violet');
    _triggerReRender();
  });

  document.getElementById('sim-adherence-btn')?.addEventListener('click', () => {
    simulateAdjustment(75);
    showToast('Adherence checked: Protein & Hydration targets met! +75 Pts', 'success');
    _triggerReRender();
  });

  document.getElementById('sim-inactivity-btn')?.addEventListener('click', () => {
    simulateAdjustment(-300);
    showToast('Inactivity warning! Penalties applied: -300 Pts', 'error');
    _triggerReRender();
  });

  document.getElementById('sim-overtake-btn')?.addEventListener('click', () => {
    const result = simulateChallengerOvertake();
    if (result) {
      showToast('Global ranks updated. Challenger overtake checked.', 'violet');
    } else {
      showToast('You must ascend to the top 10 Phoenix bracket to test overtake logic.', 'error');
    }
    _triggerReRender();
  });
}

function _triggerReRender() {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = render();
    onEnter();
  }
}
