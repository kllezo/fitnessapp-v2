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
export function generateMatchCandidate(state = getState(), filters = {}) {
  const ob = state.onboarding || {};
  const names = ['Arjun K.', 'Priya S.', 'Rohan M.', 'Ananya T.', 'Karthik V.', 'Divya R.', 'Vivek N.', 'Sneha P.'];
  const cities = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'];
  const countries = ['India', 'United Kingdom', 'United States', 'Singapore', 'Canada'];
  const languages = ['English', 'Hindi', 'Tamil', 'Bengali', 'Marathi'];
  
  const nameIdx = Math.floor(Math.random() * names.length);
  const cityIdx = Math.floor(Math.random() * cities.length);
  
  // Base attributes
  let candAge = ob.age ? ob.age + (Math.floor(Math.random() * 7) - 3) : 25;
  if (candAge < 16) candAge = 18;
  
  let candGender = ob.gender || 'male';
  if (filters.gender === 'any' || !filters.gender) {
    candGender = Math.random() > 0.5 ? 'male' : 'female';
  }
  
  let candGoal = Array.isArray(ob.goal) ? ob.goal[0] : (ob.goal || 'build_muscle');
  if (filters.goal === 'any') {
    const goals = ['build_muscle', 'lose_fat', 'maintain', 'endurance', 'flexibility'];
    candGoal = goals[Math.floor(Math.random() * goals.length)];
  }
  
  let candExperience = ob.experience || 'intermediate';
  if (filters.experience === 'any') {
    const levels = ['beginner', 'returning', 'experienced'];
    candExperience = levels[Math.floor(Math.random() * levels.length)];
  }
  
  let candCountry = 'India';
  if (filters.country === 'any') {
    candCountry = countries[Math.floor(Math.random() * countries.length)];
  }
  
  let candLanguage = 'English';
  if (filters.language && filters.language !== 'any') {
    candLanguage = filters.language;
  } else {
    candLanguage = languages[Math.floor(Math.random() * languages.length)];
  }
  
  let candFrequency = ob.trainingDays || 4;
  if (filters.frequency === 'any') {
    candFrequency = 2 + Math.floor(Math.random() * 5);
  }
  
  let candWakeTime = ob.wakeTime || '07:00';
  if (filters.wakeTime === 'early') candWakeTime = '05:30';
  else if (filters.wakeTime === 'late') candWakeTime = '09:30';
  
  let candTimezone = 'GMT+5:30';
  if (filters.timezone === 'any') {
    const zones = ['GMT+5:30', 'GMT-5:00', 'GMT+0:00', 'GMT+8:00'];
    candTimezone = zones[Math.floor(Math.random() * zones.length)];
  }
  
  let candDiscipline = 60 + Math.floor(Math.random() * 35);
  if (filters.discipline === 'high') {
    candDiscipline = 80 + Math.floor(Math.random() * 18);
  } else if (filters.discipline === 'medium') {
    candDiscipline = 55 + Math.floor(Math.random() * 25);
  }

  // Calculate compatibility score based on filters matching
  let matches = 0;
  let totalFilters = 0;
  
  if (filters.gender && filters.gender !== 'any') { totalFilters++; if (candGender === ob.gender) matches++; }
  if (filters.goal && filters.goal !== 'any') { totalFilters++; if (candGoal === (Array.isArray(ob.goal) ? ob.goal[0] : ob.goal)) matches++; }
  if (filters.experience && filters.experience !== 'any') { totalFilters++; if (candExperience === ob.experience) matches++; }
  if (filters.country && filters.country !== 'any') { totalFilters++; if (candCountry === 'India') matches++; }
  if (filters.frequency && filters.frequency !== 'any') { totalFilters++; if (candFrequency === ob.trainingDays) matches++; }
  if (filters.timezone && filters.timezone !== 'any') { totalFilters++; if (candTimezone === 'GMT+5:30') matches++; }
  if (filters.discipline && filters.discipline !== 'any') {
    totalFilters++;
    if (filters.discipline === 'high' && candDiscipline >= 80) matches++;
    else if (filters.discipline === 'medium' && candDiscipline >= 50) matches++;
  }
  
  let compatibility = 70 + Math.floor(Math.random() * 15);
  if (totalFilters > 0) {
    const ratio = matches / totalFilters;
    compatibility = Math.round(75 + ratio * 23);
  }
  compatibility = Math.min(100, Math.max(65, compatibility));
  
  const streak = 5 + Math.floor(Math.random() * 30);
  const stylesMap = {
    build_muscle: 'Hypertrophy 🏋️',
    lose_fat: 'Fat Loss 🔥',
    maintain: 'Balance ⚖️',
    endurance: 'Stamina 🏃',
    flexibility: 'Mobility 🧘'
  };
  
  return {
    id: Date.now().toString(),
    name: names[nameIdx],
    age: candAge,
    gender: candGender,
    city: candCountry === 'India' ? cities[cityIdx] : 'Metro Area',
    country: candCountry,
    language: candLanguage,
    trainingStyle: stylesMap[candGoal] || 'All-round ⚡',
    trainingDays: candFrequency,
    wakeTime: candWakeTime,
    timezone: candTimezone,
    goal: candGoal,
    compatibility: compatibility,
    streakDays: streak,
    disciplineScore: candDiscipline,
    experience: candExperience,
    recentActivity: [
      `Logged a ${stylesMap[candGoal]?.split(' ')[0] || 'Training'} session yesterday`,
      `Completed day ${streak} streak check-in`,
      `Reached hydration target (${(2.5 + Math.random()).toFixed(1)}L)`
    ]
  };
}
