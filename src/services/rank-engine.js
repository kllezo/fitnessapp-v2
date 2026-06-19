// ==========================================
// AURA V2 — Global Discipline Rank Engine
// ==========================================

import { getState, setState, updateState } from '../state/index.js';

// ── Rank Tiers Setup ──
export const RANK_TIERS = [
  { id: 'bronze_3', name: 'Bronze III', minScore: 0, maxScore: 100, class: 'bronze' },
  { id: 'bronze_2', name: 'Bronze II', minScore: 101, maxScore: 200, class: 'bronze' },
  { id: 'bronze_1', name: 'Bronze I', minScore: 201, maxScore: 300, class: 'bronze' },
  
  { id: 'silver_3', name: 'Silver III', minScore: 301, maxScore: 450, class: 'silver' },
  { id: 'silver_2', name: 'Silver II', minScore: 451, maxScore: 600, class: 'silver' },
  { id: 'silver_1', name: 'Silver I', minScore: 601, maxScore: 750, class: 'silver' },
  
  { id: 'gold_3', name: 'Gold III', minScore: 751, maxScore: 950, class: 'gold' },
  { id: 'gold_2', name: 'Gold II', minScore: 951, maxScore: 1150, class: 'gold' },
  { id: 'gold_1', name: 'Gold I', minScore: 1151, maxScore: 1350, class: 'gold' },
  
  { id: 'platinum_3', name: 'Platinum III', minScore: 1351, maxScore: 1600, class: 'platinum' },
  { id: 'platinum_2', name: 'Platinum II', minScore: 1601, maxScore: 1850, class: 'platinum' },
  { id: 'platinum_1', name: 'Platinum I', minScore: 1851, maxScore: 2100, class: 'platinum' },
  
  { id: 'mythic_3', name: 'Mythic III', minScore: 2101, maxScore: 2400, class: 'mythic' },
  { id: 'mythic_2', name: 'Mythic II', minScore: 2401, maxScore: 2700, class: 'mythic' },
  { id: 'mythic_1', name: 'Mythic I', minScore: 2701, maxScore: 3000, class: 'mythic' },
  
  // Limited Tiers
  { id: 'paragon', name: 'PARAGON', minScore: 3001, maxScore: 4000, limit: 1000, class: 'paragon' },
  { id: 'ascendant', name: 'ASCENDANT', minScore: 4001, maxScore: 5000, limit: 100, class: 'ascendant' },
  { id: 'phoenix', name: '🔥 PHOENIX', minScore: 5001, maxScore: 99999, limit: 10, class: 'phoenix' }
];

// ── Mock Initial Global Leaderboard ──
// Persist a base list of top 1000 scores to simulate limited tiers and challenger overtake logic
let _mockLeaderboard = [];

export function getMockLeaderboard() {
  if (_mockLeaderboard.length > 0) return _mockLeaderboard;

  const saved = localStorage.getItem('aura_mock_leaderboard');
  if (saved) {
    _mockLeaderboard = JSON.parse(saved);
    return _mockLeaderboard;
  }

  // Generate 1005 mock athletes
  const countries = ['USA', 'India', 'UK', 'Germany', 'Australia', 'Canada', 'Japan', 'France', 'Singapore', 'UAE'];
  const firstNames = ['Marcus', 'David', 'Alex', 'Sarah', 'Karan', 'Elena', 'Ryan', 'Kenji', 'Chloe', 'Amir', 'John', 'Vikram', 'Rhea', 'Liam', 'Zayn'];
  const lastNames = ['Iron', 'Steel', 'Grit', 'Pace', 'Lift', 'Run', 'Peak', 'Flex', 'Aura', 'Core', 'Vortex', 'Apex', 'Pulse'];

  const list = [];
  
  // Generate top 10 Phoenix users
  for (let i = 1; i <= 10; i++) {
    list.push({
      username: `athlete_px_${i}`,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      score: 5500 - (i * 45) + Math.round(Math.random() * 15),
      discipline: 98 - Math.round(i * 0.8),
      streak: 90 - (i * 4),
      country: countries[i % countries.length],
      rankId: 'phoenix'
    });
  }

  // Generate 90 Ascendants
  for (let i = 1; i <= 90; i++) {
    list.push({
      username: `athlete_asc_${i}`,
      name: `${firstNames[(i + 3) % firstNames.length]} ${lastNames[(i + 2) % lastNames.length]}`,
      score: 4950 - (i * 10) + Math.round(Math.random() * 8),
      discipline: 90 - Math.round(i * 0.1),
      streak: 50 - Math.round(i * 0.3),
      country: countries[(i + 2) % countries.length],
      rankId: 'ascendant'
    });
  }

  // Generate 900 Paragons
  for (let i = 1; i <= 900; i++) {
    list.push({
      username: `athlete_par_${i}`,
      name: `Athlete ${i + 100}`,
      score: 3950 - (i * 1) + Math.round(Math.random() * 2),
      discipline: 82 - Math.round(i * 0.01),
      streak: 25 - Math.round(i * 0.02),
      country: countries[i % countries.length],
      rankId: 'paragon'
    });
  }

  _mockLeaderboard = list.sort((a, b) => b.score - a.score);
  localStorage.setItem('aura_mock_leaderboard', JSON.stringify(_mockLeaderboard));
  return _mockLeaderboard;
}

// ── Calculate Rank Score from current State ──
export function calculateRankScore(state) {
  // Let's read simulated values if they are explicitly set for testing
  if (state.rank?.simulatedScore !== undefined && state.rank?.simulatedScore !== null) {
    return state.rank.simulatedScore;
  }

  const discipline = state.checkIn?.readinessScore || 65; // base discipline score from checks
  const streak = state.workout?.streakDays || 0;
  const totalWorkouts = state.workout?.history?.length || 0;

  // Meal trackers today
  const proteinConsumed = state.nutrition?.protein?.consumed || 0;
  const proteinTarget = state.nutrition?.protein?.target || 150;
  const proteinAdherence = proteinConsumed >= proteinTarget ? 15 : 0;

  const waterConsumed = state.nutrition?.water?.consumed || 0;
  const waterTarget = state.nutrition?.water?.target || 3.5;
  const waterAdherence = waterConsumed >= waterTarget ? 10 : 0;

  // Recovery trackers
  const readiness = state.checkIn?.readinessScore || 50;
  const sleepHrs = state.checkIn?.answers?.sleep ? (state.checkIn.answers.sleep * 2) : 7; // map scale 1-5 to approx hours
  const sleepConsistency = sleepHrs >= 7 ? 15 : 0;

  // Social accountability
  const hasPartner = state.auth?.partner ? 25 : 0;
  const squadSynced = state.socials?.notifications?.length === 0 ? 20 : 0; // simulated synchronization metrics

  // Penalties
  let missedWorkoutsPenalty = 0;
  let skippedCheckInPenalty = 0;
  // If it's late and checkin isn't done, add penalty
  if (!state.checkIn?.todayDone) {
    skippedCheckInPenalty = 15;
  }

  let baseScore = (discipline * 3) + (streak * 10) + (totalWorkouts * 20) + proteinAdherence + waterAdherence + sleepConsistency + hasPartner + squadSynced - skippedCheckInPenalty - missedWorkoutsPenalty;
  
  // Ensure score is not negative and make base onboarding score around 150
  return Math.max(0, Math.round(baseScore + 100));
}

// ── Determine Rank Tier from Score ──
export function getRankTierForScore(score) {
  // Limited tier validation requires comparing score against mock leaderboards
  const lb = getMockLeaderboard();

  // If score qualifies for Phoenix
  // Phoenix Limit: 10 users.
  // The user qualifies if score > lowest Phoenix score or if user holds slot
  const lowestPhoenix = lb[9]?.score || 5000;
  if (score >= lowestPhoenix && score >= 5001) {
    return RANK_TIERS.find(r => r.id === 'phoenix');
  }

  // Ascendant Limit: 100 users.
  // Lowest Ascendant score in global ranks
  const lowestAscendant = lb[99]?.score || 4000;
  if (score >= lowestAscendant && score >= 4001) {
    return RANK_TIERS.find(r => r.id === 'ascendant');
  }

  // Paragon Limit: 1000 users.
  const lowestParagon = lb[999]?.score || 3000;
  if (score >= lowestParagon && score >= 3001) {
    return RANK_TIERS.find(r => r.id === 'paragon');
  }

  // Check Open Tiers in reverse order
  for (let i = RANK_TIERS.length - 4; i >= 0; i--) {
    if (score >= RANK_TIERS[i].minScore) {
      return RANK_TIERS[i];
    }
  }

  return RANK_TIERS[0]; // Default Bronze III
}

// ── Determine User Global Rank & Update State ──
export function refreshUserRank() {
  const state = getState();
  const score = calculateRankScore(state);
  const tier = getRankTierForScore(score);

  // Compute exact position in leaderboard
  const lb = getMockLeaderboard();
  
  // Remove user's previous entries from leaderboards to avoid duplicates
  const cleanLb = lb.filter(item => item.username !== 'me' && item.username !== state.auth?.username);

  // Insert user's current record
  const userRecord = {
    username: state.auth?.username || 'me',
    name: state.auth?.profileName || 'Athlete',
    score: score,
    discipline: state.checkIn?.readinessScore || 75,
    streak: state.workout?.streakDays || 0,
    country: state.auth?.country || 'India',
    rankId: tier.id,
    isMe: true
  };

  cleanLb.push(userRecord);
  // Sort descending
  const sorted = cleanLb.sort((a, b) => b.score - a.score);
  
  // Find index
  const index = sorted.findIndex(item => item.isMe);
  const position = index + 1;

  // Save the updated leaderboard back
  _mockLeaderboard = sorted;
  localStorage.setItem('aura_mock_leaderboard', JSON.stringify(sorted));

  // Check if rank changed (to trigger promotion/demotion alerts)
  const prevRank = state.rank?.currentRank || 'Bronze III';
  const newRank = tier.name;

  let alertMessage = null;
  let alertType = null; // 'promotion' or 'demotion'

  if (state.rank?.currentRank && prevRank !== newRank) {
    const tierIdx = RANK_TIERS.findIndex(r => r.name === newRank);
    const prevIdx = RANK_TIERS.findIndex(r => r.name === prevRank);
    if (tierIdx > prevIdx) {
      alertType = 'promotion';
      alertMessage = `PROMOTED! You have ascended to ${newRank.toUpperCase()}! 🏆`;
      // Unlock titles or profile frames
      unlockRewards(tier);
    } else {
      alertType = 'demotion';
      alertMessage = `WARNING: Lowered activity has demoted you to ${newRank.toUpperCase()}. Rebuild your consistency. ⚠️`;
    }
  }

  updateState('rank', {
    rankScore: score,
    currentRank: newRank,
    rankId: tier.id,
    globalRank: position,
    lastAlert: alertMessage ? { message: alertMessage, type: alertType, timestamp: Date.now() } : null
  });

  return { score, tier, position, alertMessage, alertType };
}

// ── Unlock Rewards based on Rank Tier reached ──
function unlockRewards(tier) {
  const state = getState();
  const rewards = state.rank?.rewardsUnlocked || { frames: ['default'], emblems: [], themes: [], titles: ['Novice'] };
  
  let newlyUnlocked = [];

  const tierId = tier.id;
  if (tierId.startsWith('silver') && !rewards.titles.includes('Sentinel')) {
    rewards.titles.push('Sentinel');
    newlyUnlocked.push('Title: Sentinel');
  }
  if (tierId.startsWith('gold') && !rewards.frames.includes('gold_ring')) {
    rewards.frames.push('gold_ring');
    rewards.titles.push('Iron-Clad');
    newlyUnlocked.push('Title: Iron-Clad', 'Gold Frame');
  }
  if (tierId.startsWith('platinum') && !rewards.frames.includes('carbon_fiber')) {
    rewards.frames.push('carbon_fiber');
    rewards.titles.push('Unstoppable');
    newlyUnlocked.push('Title: Unstoppable', 'Carbon Fiber Frame');
  }
  if (tierId.startsWith('mythic') && !rewards.themes.includes('deep-blue-silver')) {
    rewards.titles.push('Mythic Vanguard');
    newlyUnlocked.push('Title: Mythic Vanguard');
  }
  if (tierId === 'paragon' && !rewards.frames.includes('paragon_halo')) {
    rewards.frames.push('paragon_halo');
    rewards.titles.push('Titan');
    newlyUnlocked.push('Title: Titan', 'Paragon Frame');
  }
  if (tierId === 'ascendant' && !rewards.titles.includes('Ascendant Master')) {
    rewards.titles.push('Ascendant Master');
    newlyUnlocked.push('Title: Ascendant Master');
  }
  if (tierId === 'phoenix' && !rewards.frames.includes('phoenix_flame')) {
    rewards.frames.push('phoenix_flame');
    rewards.titles.push('Phoenix Sovereign');
    newlyUnlocked.push('Title: Phoenix Sovereign', 'Phoenix Flame Frame');
  }

  if (newlyUnlocked.length > 0) {
    updateState('rank', { rewardsUnlocked: rewards });
  }
}

// ── Trigger Manual Simulator Adjustment ──
export function simulateAdjustment(offsetPoints) {
  const state = getState();
  const currentScore = state.rank?.rankScore || calculateRankScore(state);
  const newScore = Math.max(0, currentScore + offsetPoints);
  
  // Set simulated override in state
  setState('rank.simulatedScore', newScore);
  
  return refreshUserRank();
}

// ── Overtake Simulator (Challenger Overtake Check) ──
// Simulates a third party pushing their score high and knocking the user down
export function simulateChallengerOvertake() {
  const state = getState();
  const score = state.rank?.rankScore || 150;
  const lb = getMockLeaderboard();

  // If user is inside Phoenix (top 10), we can create a challenger score that exceeds user's score,
  // pushing user out of the top 10.
  // Find user rank
  const userIdx = lb.findIndex(item => item.username === 'me' || item.username === state.auth?.username);
  if (userIdx >= 0 && userIdx < 10) {
    // User is Phoenix. Let's create a challenger who has score equal to user's score + 50 points
    const userScore = lb[userIdx].score;
    // Bump up users below/challengers
    for (let i = userIdx + 1; i < 11; i++) {
      if (lb[i]) {
        lb[i].score = userScore + (11 - i) * 20;
        lb[i].username = `challenger_${i}`;
        lb[i].name = `Challenger #${i}`;
        lb[i].streak += 5;
      }
    }
    // Re-sort
    _mockLeaderboard = lb.sort((a, b) => b.score - a.score);
    localStorage.setItem('aura_mock_leaderboard', JSON.stringify(_mockLeaderboard));
    
    return refreshUserRank();
  }
  return null;
}

// ── High-Fidelity SVG Renderings for Rank Emblems ──
// Premium, masculine, metallic style, theme-aware luxury design
export function getRankEmblemSVG(rankId, size = 64) {
  let mainColor1 = 'var(--text-secondary)';
  let mainColor2 = 'var(--text-muted)';
  let borderGrad1 = '#888';
  let borderGrad2 = '#333';
  let innerGlow = 'rgba(255,255,255,0.05)';
  let centerSymbol = '';
  
  const rankClass = rankId ? rankId.split('_')[0] : 'bronze';

  // 1. Theme-aware metallic customization based on class
  switch (rankClass) {
    case 'bronze':
      // Brushed Bronze/Copper
      mainColor1 = '#CD7F32';
      mainColor2 = '#8B4513';
      borderGrad1 = '#B87333';
      borderGrad2 = '#5C2E0B';
      innerGlow = 'rgba(205, 127, 50, 0.15)';
      centerSymbol = `
        <!-- Bronze Chevron Chevron Chevron -->
        <path d="M30 46 L50 34 L70 46" stroke="url(#metalBronze)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        ${rankId.endsWith('2') || rankId.endsWith('1') ? '<path d="M30 54 L50 42 L70 54" stroke="url(#metalBronze)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />' : ''}
        ${rankId.endsWith('1') ? '<path d="M30 62 L50 50 L70 62" stroke="url(#metalBronze)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />' : ''}
      `;
      break;
    case 'silver':
      // Polished Chrome/Silver
      mainColor1 = '#E5E4E2';
      mainColor2 = '#999999';
      borderGrad1 = '#F5F5F5';
      borderGrad2 = '#555555';
      innerGlow = 'rgba(229, 228, 226, 0.15)';
      centerSymbol = `
        <!-- Silver Shield Grid Chevron -->
        <path d="M30 40 L50 28 L70 40" stroke="url(#metalSilver)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M30 48 L50 36 L70 48" stroke="url(#metalSilver)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        ${rankId.endsWith('2') || rankId.endsWith('1') ? '<path d="M30 56 L50 44 L70 56" stroke="url(#metalSilver)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />' : ''}
        ${rankId.endsWith('1') ? '<path d="M30 64 L50 52 L70 64" stroke="url(#metalSilver)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />' : ''}
      `;
      break;
    case 'gold':
      // 24k Gold
      mainColor1 = '#FFD700';
      mainColor2 = '#DAA520';
      borderGrad1 = '#FFE4B5';
      borderGrad2 = '#8B6508';
      innerGlow = 'rgba(255, 215, 0, 0.2)';
      centerSymbol = `
        <!-- Gold Wings / Diamond Center -->
        <polygon points="50,26 62,38 50,50 38,38" fill="url(#metalGold)" opacity="0.9"/>
        <path d="M28 48 L50 38 L72 48" stroke="url(#metalGold)" stroke-width="6" fill="none" stroke-linecap="round" />
        ${rankId.endsWith('2') || rankId.endsWith('1') ? '<path d="M28 56 L50 46 L72 56" stroke="url(#metalGold)" stroke-width="6" fill="none" stroke-linecap="round" />' : ''}
        ${rankId.endsWith('1') ? '<path d="M28 64 L50 54 L72 64" stroke="url(#metalGold)" stroke-width="6" fill="none" stroke-linecap="round" />' : ''}
      `;
      break;
    case 'platinum':
      // White Platinum
      mainColor1 = '#FFF';
      mainColor2 = '#B0C4DE';
      borderGrad1 = '#E5E4E2';
      borderGrad2 = '#4682B4';
      innerGlow = 'rgba(255, 255, 255, 0.25)';
      centerSymbol = `
        <!-- Platinum Star Badge -->
        <polygon points="50,22 55,37 70,37 58,46 62,60 50,51 38,60 42,46 30,37 45,37" fill="url(#metalPlatinum)" stroke="url(#metalPlatinumDark)" stroke-width="2"/>
        <path d="M26 62 L50 52 L74 62" stroke="url(#metalPlatinum)" stroke-width="5" fill="none" stroke-linecap="round" />
        ${rankId.endsWith('2') || rankId.endsWith('1') ? '<path d="M26 68 L50 58 L74 68" stroke="url(#metalPlatinum)" stroke-width="5" fill="none" stroke-linecap="round" />' : ''}
      `;
      break;
    case 'mythic':
      // Obsidian Dark Violet Neon
      mainColor1 = '#8A2BE2';
      mainColor2 = '#4B0082';
      borderGrad1 = '#DA70D6';
      borderGrad2 = '#190033';
      innerGlow = 'rgba(138, 43, 226, 0.3)';
      centerSymbol = `
        <!-- Mythic Crown / Hexagon -->
        <polygon points="50,20 68,32 68,54 50,66 32,54 32,32" fill="none" stroke="url(#metalMythic)" stroke-width="4"/>
        <path d="M40 38 L50 32 L60 38 L50 48 Z" fill="url(#metalMythic)" opacity="0.85"/>
        <circle cx="50" cy="58" r="4" fill="#DA70D6" />
      `;
      break;
    case 'paragon':
      // Carbon / Amber Gold luxury watch bezel
      mainColor1 = '#F59E0B';
      mainColor2 = '#B45309';
      borderGrad1 = '#FCD34D';
      borderGrad2 = '#000000';
      innerGlow = 'rgba(245, 158, 11, 0.4)';
      centerSymbol = `
        <!-- Paragon Tactical Target Bezel -->
        <circle cx="50" cy="50" r="18" fill="none" stroke="url(#metalParagon)" stroke-width="4" stroke-dasharray="10 3 5 3"/>
        <line x1="50" y1="26" x2="50" y2="74" stroke="url(#metalParagon)" stroke-width="2" opacity="0.4"/>
        <line x1="26" y1="50" x2="74" y2="50" stroke="url(#metalParagon)" stroke-width="2" opacity="0.4"/>
        <circle cx="50" cy="50" r="5" fill="url(#metalParagon)" />
      `;
      break;
    case 'ascendant':
      // Cobalt / Electric Mint Bezel
      mainColor1 = '#00E5A8';
      mainColor2 = '#0891B2';
      borderGrad1 = '#67E8F9';
      borderGrad2 = '#001A14';
      innerGlow = 'rgba(0, 229, 168, 0.4)';
      centerSymbol = `
        <!-- Ascendant Tri-Star Insignia -->
        <polygon points="50,22 59,38 77,38 62,49 68,66 50,56 32,66 38,49 23,38 41,38" fill="none" stroke="url(#metalAscendant)" stroke-width="4"/>
        <circle cx="50" cy="46" r="8" fill="url(#metalAscendant)" opacity="0.9"/>
      `;
      break;
    case 'phoenix':
      // Liquid Metal fire-red/orange radiant phoenix
      mainColor1 = '#FF4500';
      mainColor2 = '#8B0000';
      borderGrad1 = '#FFD700';
      borderGrad2 = '#1A0000';
      innerGlow = 'rgba(255, 69, 0, 0.45)';
      centerSymbol = `
        <!-- Phoenix Fire Wings -->
        <path d="M50 25 C45 35, 25 35, 20 50 C28 48, 38 45, 50 55 C62 45, 72 48, 80 50 C75 35, 55 35, 50 25 Z" fill="url(#metalPhoenix)" opacity="0.9"/>
        <circle cx="50" cy="53" r="5" fill="#FFD700" />
        <path d="M35 60 L50 72 L65 60" stroke="#FF4500" stroke-width="3" fill="none" stroke-linecap="round" />
      `;
      break;
    default:
      centerSymbol = `<circle cx="50" cy="50" r="15" fill="var(--text-secondary)" />`;
  }

  // Generate complete SVG code
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-emblem-svg rank-emblem-${rankClass}">
      <defs>
        <!-- Gradients -->
        <linearGradient id="metalBronze" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#EAA863"/>
          <stop offset="50%" stop-color="#CD7F32"/>
          <stop offset="100%" stop-color="#5C2E0B"/>
        </linearGradient>
        <linearGradient id="metalSilver" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="35%" stop-color="#D3D3D3"/>
          <stop offset="65%" stop-color="#808080"/>
          <stop offset="100%" stop-color="#C0C0C0"/>
        </linearGradient>
        <linearGradient id="metalGold" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFF3A8"/>
          <stop offset="45%" stop-color="#FFD700"/>
          <stop offset="75%" stop-color="#DAA520"/>
          <stop offset="100%" stop-color="#8B6508"/>
        </linearGradient>
        <linearGradient id="metalPlatinum" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="40%" stop-color="#E5E4E2"/>
          <stop offset="80%" stop-color="#B0C4DE"/>
          <stop offset="100%" stop-color="#708090"/>
        </linearGradient>
        <linearGradient id="metalPlatinumDark" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#708090"/>
          <stop offset="100%" stop-color="#1A2A3A"/>
        </linearGradient>
        <linearGradient id="metalMythic" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#DA70D6"/>
          <stop offset="40%" stop-color="#8A2BE2"/>
          <stop offset="75%" stop-color="#4B0082"/>
          <stop offset="100%" stop-color="#190033"/>
        </linearGradient>
        <linearGradient id="metalParagon" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFE0B2"/>
          <stop offset="50%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#3E2723"/>
        </linearGradient>
        <linearGradient id="metalAscendant" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#E0F7FA"/>
          <stop offset="50%" stop-color="#00E5A8"/>
          <stop offset="100%" stop-color="#006064"/>
        </linearGradient>
        <linearGradient id="metalPhoenix" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFD700"/>
          <stop offset="30%" stop-color="#FF8C00"/>
          <stop offset="70%" stop-color="#FF4500"/>
          <stop offset="100%" stop-color="#8B0000"/>
        </linearGradient>
        
        <linearGradient id="borderGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${borderGrad1}"/>
          <stop offset="100%" stop-color="${borderGrad2}"/>
        </linearGradient>
        
        <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Background Shield Outline -->
      <polygon points="50,5 92,25 92,60 50,95 8,60 8,25" fill="${innerGlow}" stroke="url(#borderGrad)" stroke-width="4" filter="url(#glow)"/>
      <polygon points="50,8 88,27 88,58 50,90 12,58 12,27" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>

      <!-- Center emblem symbols -->
      ${centerSymbol}

      <!-- Clean outer accent lines -->
      <path d="M50 12 L84 29" stroke="rgba(255,255,255,0.15)" stroke-linecap="round"/>
      <path d="M50 12 L16 29" stroke="rgba(255,255,255,0.15)" stroke-linecap="round"/>
    </svg>
  `;
}
