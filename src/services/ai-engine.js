// ==========================================
// AURA V2 — AI Engine (Insights)
// ==========================================

import { getState } from '../state/index.js';

// ── Readiness Engine ──
export function computeReadinessScore(answers) {
  // answers: { sleep, energy, soreness, stress, motivation } each 1-5
  if (!answers || !Object.keys(answers).length) return 65;

  const { sleep = 3, energy = 3, soreness = 3, stress = 3, motivation = 3 } = answers;

  // Weights
  const score =
    sleep * 20 +         // 0-100
    energy * 18 +
    (6 - soreness) * 16 + // inverted (low soreness = good)
    (6 - stress) * 14 +   // inverted (low stress = good)
    motivation * 12;

  const raw = Math.round(score / 5); // normalize ~35-100
  return Math.min(100, Math.max(35, raw));
}

// ── Weekly AI Coach Review ──
export function generateWeeklyReview(state = getState()) {
  const history = state.workout?.history || [];
  const checkIns = state.checkIn?.history || [];
  const last7 = history.filter(h => {
    const d = new Date(h.date);
    return (Date.now() - d.getTime()) < 7 * 86400000;
  });

  const loggedDays = last7.length;
  const avgReadiness = checkIns.length
    ? Math.round(checkIns.slice(-7).reduce((s, c) => s + (c.readinessScore || 65), 0) / Math.min(checkIns.length, 7))
    : 65;

  const stars = loggedDays >= 6 ? 5 : loggedDays >= 4 ? 4 : loggedDays >= 3 ? 3 : loggedDays >= 2 ? 2 : 1;

  const strengths = [];
  if (loggedDays >= 5) strengths.push({ icon: '🔥', text: 'Exceptional consistency this week' });
  if (avgReadiness >= 72) strengths.push({ icon: '⚡', text: 'Recovery quality is high' });
  if (loggedDays >= 3) strengths.push({ icon: '💪', text: 'Training momentum building' });
  if ((state.checkIn?.answers?.sleep || 3) >= 4) strengths.push({ icon: '😴', text: 'Sleep quality is solid' });

  const focusAreas = [];
  if (loggedDays < 3) focusAreas.push({ icon: '📅', text: 'Increase training frequency' });
  if (avgReadiness < 55) focusAreas.push({ icon: '🔋', text: 'Prioritise recovery windows' });
  if ((state.checkIn?.answers?.stress || 3) >= 4) focusAreas.push({ icon: '🧘', text: 'Manage stress levels' });
  if ((state.nutrition?.water?.consumed || 0) < (state.nutrition?.water?.target || 3) * 0.7) {
    focusAreas.push({ icon: '💧', text: 'Hydration below target' });
  }

  const messages = [
    `${stars >= 4 ? 'Elite' : stars >= 3 ? 'Solid' : 'Building'} week. ${loggedDays} session${loggedDays !== 1 ? 's' : ''} logged — keep the compound momentum.`,
    `Your readiness averaged ${avgReadiness} this week. ${avgReadiness >= 70 ? 'Your body is responding well.' : 'Focus on sleep and recovery.'}`,
    `${loggedDays >= 4 ? 'The discipline is real.' : 'Every session counts.'} ${stars >= 4 ? 'You\'re in your prime window.' : 'Build the foundation.'}`,
    `Week ${loggedDays >= 5 ? 'of a champion' : 'of progress'}. Readiness: ${avgReadiness}. ${stars >= 3 ? 'Stay locked in.' : 'Consistency is the only path.'}`,
    `${loggedDays} workout${loggedDays !== 1 ? 's' : ''} this week. ${stars >= 4 ? 'You earned the weekend.' : 'The gap between today and your goal closes with every rep.'}`,
  ];

  const msgIdx = (loggedDays * 3 + stars) % messages.length;

  return {
    stars,
    loggedDays,
    avgReadiness,
    strengths: strengths.slice(0, 2),
    focusAreas: focusAreas.slice(0, 2),
    message: messages[msgIdx],
    empty: loggedDays === 0,
  };
}

// ── Habit Pattern Detection ──
export function detectHabitPatterns(state = getState()) {
  const history = state.workout?.history || [];
  const checkIns = state.checkIn?.history || [];
  const last14 = history.filter(h => (Date.now() - new Date(h.date).getTime()) < 14 * 86400000);

  const patterns = [];

  // Training cadence
  const freq = last14.length;
  if (freq >= 10) patterns.push({ icon: '🔥', label: 'Elite Cadence', sub: `${freq} sessions / 14 days`, type: 'positive' });
  else if (freq >= 6) patterns.push({ icon: '💪', label: 'Steady Rhythm', sub: `${freq} sessions / 14 days`, type: 'positive' });
  else if (freq >= 3) patterns.push({ icon: '📈', label: 'Building Base', sub: `${freq} sessions / 14 days`, type: 'neutral' });
  else patterns.push({ icon: '⚠️', label: 'Gap Detected', sub: `Only ${freq} sessions`, type: 'warning' });

  // Sleep quality
  const recentSleep = checkIns.slice(-7).map(c => c.answers?.sleep || 3);
  const avgSleep = recentSleep.length ? recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length : 3;
  if (avgSleep >= 4) patterns.push({ icon: '😴', label: 'Quality Sleep', sub: `Avg ${avgSleep.toFixed(1)}/5 this week`, type: 'positive' });
  else if (avgSleep >= 3) patterns.push({ icon: '🌙', label: 'Moderate Sleep', sub: 'Room for improvement', type: 'neutral' });
  else patterns.push({ icon: '😵', label: 'Sleep Deficit', sub: 'Recovery compromised', type: 'warning' });

  // Hydration
  const waterConsumed = state.nutrition?.water?.consumed || 0;
  const waterTarget = state.nutrition?.water?.target || 3;
  if (waterConsumed >= waterTarget * 0.9) patterns.push({ icon: '💧', label: 'Hydration Mastery', sub: `${waterConsumed.toFixed(1)}L today`, type: 'positive' });
  else patterns.push({ icon: '🫗', label: 'Hydration Gap', sub: `${waterConsumed.toFixed(1)}L / ${waterTarget}L`, type: 'warning' });

  // Momentum
  const streak = state.workout?.streakDays || 0;
  if (streak >= 7) patterns.push({ icon: '⚡', label: 'On Fire', sub: `${streak} day streak`, type: 'positive' });
  else if (streak >= 3) patterns.push({ icon: '📈', label: 'Momentum Rising', sub: `${streak} day streak`, type: 'positive' });
  else patterns.push({ icon: '🎯', label: 'Build Streak', sub: 'Start your run', type: 'neutral' });

  return patterns.slice(0, 4);
}

// ── Recovery Intelligence ──
export function calculateRecoveryScore(state = getState()) {
  const checkIns = state.checkIn?.history || [];
  const today = state.checkIn?.answers || {};

  const last7 = checkIns.slice(-7);
  if (!last7.length) return { score: 65, label: 'Stable', color: 'violet' };

  const avgReadiness = last7.reduce((s, c) => s + (c.readinessScore || 65), 0) / last7.length;

  const sleepBonus = ((today.sleep || 3) - 3) * 8;
  const sorenessBonus = (3 - (today.soreness || 3)) * 6;

  const score = Math.min(100, Math.max(0, Math.round(avgReadiness + sleepBonus + sorenessBonus)));

  const label = score >= 75 ? 'Recovered' : score >= 50 ? 'Stable' : 'Depleted';
  const color = score >= 75 ? 'mint' : score >= 50 ? 'violet' : 'rose';

  return { score, label, color };
}

export function calculateRecoveryStreak(state = getState()) {
  const checkIns = [...(state.checkIn?.history || [])].reverse();
  let streak = 0;
  for (const c of checkIns) {
    if ((c.readinessScore || 0) >= 60) streak++;
    else break;
  }
  return streak;
}

export function calculateSleepDebt(state = getState()) {
  const checkIns = state.checkIn?.history || [];
  const last7 = checkIns.slice(-7);

  const sleepMap = [0, 4.5, 5.5, 6.5, 7.5, 8.5];
  let totalDebt = 0;
  const target = 8;

  for (const c of last7) {
    const hours = sleepMap[c.answers?.sleep || 3] || 6.5;
    totalDebt += Math.max(0, target - hours);
  }

  const status = totalDebt < 3 ? 'Low' : totalDebt < 8 ? 'Moderate' : 'Critical';
  return { hours: +totalDebt.toFixed(1), status };
}

export function getReadinessTrend(state = getState()) {
  const checkIns = state.checkIn?.history || [];
  const today = new Date().toISOString().split('T')[0];

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const match = checkIns.find(c => c.date === d);
    return {
      day: ['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(d).getDay()],
      value: match?.readinessScore || 0,
      isToday: d === today,
    };
  }).reverse();

  return days;
}

// ── PR Feed ──
export function extractPRFeed(state = getState()) {
  const prs = state.workout?.prs || {};
  return Object.entries(prs)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
}

// ── Conversation Starters ──
export function generateConversationStarters(state = getState()) {
  const partner = state.auth?.partner;
  if (!partner) return [];

  const readiness = state.checkIn?.readinessScore || 65;
  const streak = state.workout?.streakDays || 0;
  const ob = state.onboarding;
  const goal = ob?.goal?.replace('_', ' ') || 'training';

  const starters = [
    `${partner.name}, just finished my session — ${readiness >= 70 ? 'feeling strong 💪' : 'grinding through 🔥'}`,
    `How was your ${goal} session today, ${partner.name}?`,
    `${streak} day streak for me — what's yours at right now?`,
    `Quick check-in: did you hit your protein target today?`,
    `${partner.name} — recovery day or training day for you?`,
    `Let's see who logs their workout first this week 🏆`,
  ];

  const idx = ((streak * 2 + Math.round(readiness / 10)) % starters.length);
  return [starters[idx], starters[(idx + 1) % starters.length], starters[(idx + 2) % starters.length]];
}

// ── Accountability Engine ──
export function generateMatchCandidate(state = getState()) {
  const ob = state.onboarding;
  const names = ['Arjun K.', 'Priya S.', 'Rohan M.', 'Ananya T.', 'Karthik V.', 'Divya R.', 'Vivek N.', 'Sneha P.'];
  const cities = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'];
  const styles = ['Strength', 'Hypertrophy', 'Fat Loss', 'Endurance', 'Calisthenics'];

  const nameIdx = Math.floor(Math.random() * names.length);
  const cityIdx = Math.floor(Math.random() * cities.length);
  const styleIdx = Math.floor(Math.random() * styles.length);
  const score = 75 + Math.floor(Math.random() * 22);
  const streak = 5 + Math.floor(Math.random() * 30);

  return {
    id: Date.now().toString(),
    name: names[nameIdx],
    city: cities[cityIdx],
    country: 'India',
    trainingStyle: styles[styleIdx],
    goal: ob?.goal || 'build_muscle',
    compatibility: score,
    streakDays: streak,
    disciplineScore: 60 + Math.floor(Math.random() * 35),
    experience: ob?.experience || 'returning',
    ambition: ob?.ambitionLevel || 'serious',
  };
}
