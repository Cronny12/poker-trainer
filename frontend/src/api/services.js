import { apiRequest } from './client';

const DEMO_TOKEN = 'demo-local';
const DEMO_STATE_KEY = 'poker_trainer_demo_state';
const DAILY_CLAIM_CHIPS = 300;
const TEASER_BASE_CHIPS = 200;
const TEASER_STREAK_MULTIPLIER = 50;

const DEMO_STRATEGIES = [
  { id: 'tight-aggressive', name: 'Tight Aggressive', description: 'Disciplined ranges with pressure on late streets.', difficulty: 4 },
  { id: 'loose-aggressive', name: 'Loose Aggressive', description: 'Wide preflop ranges and frequent barrels.', difficulty: 5 },
  { id: 'calling-station', name: 'Calling Station', description: 'Calls often and rarely bluffs.', difficulty: 2 },
  { id: 'nit', name: 'Nit', description: 'Only enters with premium holdings.', difficulty: 3 },
  { id: 'balanced-grinder', name: 'Balanced Grinder', description: 'Steady, balanced, low-variance strategy.', difficulty: 3 },
  { id: 'maniac', name: 'Maniac', description: 'Over-aggressive, high-pressure style.', difficulty: 4 },
  { id: 'tricky-trapper', name: 'Tricky Trapper', description: 'Slowplays value and check-raises draws.', difficulty: 3 },
  { id: 'gto-lite', name: 'GTO Lite', description: 'Approximate equilibrium frequencies.', difficulty: 5 },
  { id: 'passive-recreational', name: 'Passive Recreational', description: 'Limp-heavy and call-first strategy.', difficulty: 1 },
  { id: 'icm-aware', name: 'ICM Aware', description: 'Conservative around stack-risk spots.', difficulty: 4 }
];

const DEMO_TEASERS = [
  { id: 't1', question: 'I speak without a mouth and hear without ears. What am I?', answer: 'echo', hint: 'You can hear me in a canyon.' },
  { id: 't2', question: 'What 5-letter word becomes shorter when you add two letters to it?', answer: 'short', hint: 'The answer is literal.' },
  { id: 't3', question: 'What has many keys but cannot open a single lock?', answer: 'piano', hint: 'Think music.' },
  { id: 't4', question: 'The more of this there is, the less you see. What is it?', answer: 'darkness', hint: 'Nighttime clue.' },
  { id: 't5', question: 'What goes up but never comes down?', answer: 'age', hint: 'Everyone has it.' }
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toEpochDay(isoDate) {
  return Math.floor(new Date(`${isoDate}T00:00:00Z`).getTime() / 86400000);
}

function isNetworkError(error) {
  const message = (error?.message || '').toLowerCase();
  return message.includes('failed to fetch') || message.includes('network error') || message.includes('networkerror');
}

function isDemoToken(token) {
  return token === DEMO_TOKEN;
}

function defaultDemoState() {
  return {
    user: {
      id: 'demo-user',
      username: 'demo_player',
      email: 'demo@local.app',
      displayName: 'Demo Player',
      bio: 'Practicing with local demo mode.'
    },
    chips: 1000,
    teaserStreak: 0,
    lastDailyClaimDate: null,
    lastCorrectTeaserDate: null,
    lastTeaserOutcomeDate: null,
    wins: 0,
    losses: 0,
    matchHistory: []
  };
}

function getDemoState() {
  const raw = localStorage.getItem(DEMO_STATE_KEY);
  if (!raw) {
    const initial = defaultDemoState();
    localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw);
    return { ...defaultDemoState(), ...parsed, user: { ...defaultDemoState().user, ...(parsed.user || {}) } };
  } catch {
    const initial = defaultDemoState();
    localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function saveDemoState(state) {
  localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
}

function toUserSummary(state) {
  return {
    id: state.user.id,
    username: state.user.username,
    email: state.user.email,
    displayName: state.user.displayName,
    bio: state.user.bio,
    chips: state.chips,
    teaserStreak: state.teaserStreak,
    wins: state.wins,
    losses: state.losses
  };
}

function teaserForToday() {
  const day = toEpochDay(todayIso());
  return DEMO_TEASERS[Math.floor(Math.abs(day % DEMO_TEASERS.length))];
}

function projectedTeaserReward(state) {
  const today = todayIso();
  const nextStreak = state.lastCorrectTeaserDate === isoMinusDays(today, 1) ? state.teaserStreak + 1 : 1;
  return TEASER_BASE_CHIPS + nextStreak * TEASER_STREAK_MULTIPLIER;
}

function isoMinusDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function findStrategyById(id) {
  return DEMO_STRATEGIES.find((strategy) => strategy.id === id) || DEMO_STRATEGIES[0];
}

function randomStrategy() {
  return DEMO_STRATEGIES[Math.floor(Math.random() * DEMO_STRATEGIES.length)];
}

function startDemoSession(nameHint = '') {
  const state = getDemoState();
  const normalized = (nameHint || '').trim();

  if (normalized) {
    state.user.displayName = normalized;
    if (state.user.username === 'demo_player') {
      state.user.username = normalized.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'demo_player';
    }
    saveDemoState(state);
  }

  return {
    token: DEMO_TOKEN,
    user: toUserSummary(state)
  };
}

function recordDemoMatchResult({ userWon, botStrategies }) {
  const state = getDemoState();
  const safeStrategies = Array.isArray(botStrategies) ? botStrategies : [];

  if (userWon) {
    state.wins += 1;
  } else {
    state.losses += 1;
  }

  const playedAt = new Date().toISOString();
  state.matchHistory.unshift({
    playedAt,
    userWon,
    botStrategies: safeStrategies
  });
  saveDemoState(state);

  return {
    userWon,
    summary: userWon
      ? 'You beat the bot table. No chips risked, stats updated.'
      : 'Bots won this round. No chips were deducted.',
    playedAt,
    botStrategies: safeStrategies,
    wins: state.wins,
    losses: state.losses
  };
}

export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  me: (token) => {
    if (isDemoToken(token)) {
      return Promise.resolve(toUserSummary(getDemoState()));
    }
    return apiRequest('/auth/me', { token });
  },
  loginDemo: (nameHint) => Promise.resolve(startDemoSession(nameHint || 'Guest'))
};

export const chipsApi = {
  balance: (token) => {
    if (isDemoToken(token)) {
      const state = getDemoState();
      return Promise.resolve({ chips: state.chips, teaserStreak: state.teaserStreak });
    }
    return apiRequest('/chips/balance', { token });
  },
  claimDaily: (token) => {
    if (isDemoToken(token)) {
      const state = getDemoState();
      const today = todayIso();

      if (state.lastDailyClaimDate === today) {
        return Promise.resolve({
          claimed: false,
          awarded: 0,
          chips: state.chips,
          message: 'Daily chips already claimed for today.'
        });
      }

      state.lastDailyClaimDate = today;
      state.chips += DAILY_CLAIM_CHIPS;
      saveDemoState(state);

      return Promise.resolve({
        claimed: true,
        awarded: DAILY_CLAIM_CHIPS,
        chips: state.chips,
        message: 'Daily chips claimed.'
      });
    }

    return apiRequest('/chips/daily-claim', { method: 'POST', token });
  }
};

export const teaserApi = {
  today: (token) => {
    if (isDemoToken(token)) {
      const state = getDemoState();
      const teaser = teaserForToday();
      const today = todayIso();
      const canSubmit = state.lastTeaserOutcomeDate !== today;

      return Promise.resolve({
        id: teaser.id,
        question: teaser.question,
        hint: teaser.hint,
        canSubmit,
        currentStreak: state.teaserStreak,
        projectedReward: canSubmit ? projectedTeaserReward(state) : 0
      });
    }

    return apiRequest('/brain-teaser/today', { token });
  },
  submit: (token, answer) => {
    if (isDemoToken(token)) {
      const state = getDemoState();
      const today = todayIso();

      if (state.lastTeaserOutcomeDate === today) {
        return Promise.resolve({
          correct: false,
          awarded: 0,
          streak: state.teaserStreak,
          chips: state.chips,
          message: "You already submitted today's brain teaser."
        });
      }

      const teaser = teaserForToday();
      const correct = teaser.answer.toLowerCase() === String(answer || '').trim().toLowerCase();
      state.lastTeaserOutcomeDate = today;

      if (!correct) {
        state.teaserStreak = 0;
        saveDemoState(state);
        return Promise.resolve({
          correct: false,
          awarded: 0,
          streak: state.teaserStreak,
          chips: state.chips,
          message: 'Incorrect answer. Streak reset.'
        });
      }

      if (state.lastCorrectTeaserDate === isoMinusDays(today, 1)) {
        state.teaserStreak += 1;
      } else {
        state.teaserStreak = 1;
      }

      state.lastCorrectTeaserDate = today;
      const awarded = TEASER_BASE_CHIPS + state.teaserStreak * TEASER_STREAK_MULTIPLIER;
      state.chips += awarded;
      saveDemoState(state);

      return Promise.resolve({
        correct: true,
        awarded,
        streak: state.teaserStreak,
        chips: state.chips,
        message: 'Correct. Streak reward applied.'
      });
    }

    return apiRequest('/brain-teaser/submit', { method: 'POST', token, body: { answer } });
  }
};

export const matchApi = {
  strategies: async () => {
    try {
      return await apiRequest('/match/strategies');
    } catch (error) {
      if (isNetworkError(error)) {
        return DEMO_STRATEGIES;
      }
      throw error;
    }
  },
  start: (token, payload) => {
    if (isDemoToken(token)) {
      const assignments = payload?.botAssignments || [];
      const seatMap = new Map();

      assignments.forEach((assignment) => {
        seatMap.set(assignment.seat, findStrategyById(assignment.strategyId));
      });

      for (let seat = 2; seat <= 9; seat += 1) {
        if (!seatMap.has(seat)) {
          seatMap.set(seat, payload?.randomizeUnassigned === false ? findStrategyById('balanced-grinder') : randomStrategy());
        }
      }

      const lineup = Array.from(seatMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map((entry) => entry[1]);

      const botStrategies = lineup.map((strategy) => strategy.name);
      const avgDifficulty = lineup.reduce((sum, strategy) => sum + strategy.difficulty, 0) / lineup.length;
      const userWinChance = Math.max(0.2, Math.min(0.8, 0.58 - (avgDifficulty - 3.0) * 0.07));
      const userWon = Math.random() < userWinChance;

      return Promise.resolve(recordDemoMatchResult({ userWon, botStrategies }));
    }

    return apiRequest('/match/start', { method: 'POST', token, body: payload });
  },
  recordResult: (token, payload) => {
    if (isDemoToken(token)) {
      return Promise.resolve(
        recordDemoMatchResult({
          userWon: Boolean(payload?.userWon),
          botStrategies: payload?.botStrategies || []
        })
      );
    }
    return apiRequest('/match/record', { method: 'POST', token, body: payload });
  },
  history: (token) => {
    if (isDemoToken(token)) {
      return Promise.resolve(getDemoState().matchHistory);
    }
    return apiRequest('/match/history', { token });
  }
};

export const profileApi = {
  get: (token) => {
    if (isDemoToken(token)) {
      const state = getDemoState();
      return Promise.resolve({
        username: state.user.username,
        email: state.user.email,
        displayName: state.user.displayName,
        bio: state.user.bio,
        chips: state.chips,
        teaserStreak: state.teaserStreak,
        wins: state.wins,
        losses: state.losses
      });
    }
    return apiRequest('/profile', { token });
  },
  update: (token, payload) => {
    if (isDemoToken(token)) {
      const state = getDemoState();
      state.user.displayName = (payload?.displayName || state.user.displayName).trim();
      state.user.bio = (payload?.bio || '').trim();
      saveDemoState(state);

      return Promise.resolve({
        username: state.user.username,
        email: state.user.email,
        displayName: state.user.displayName,
        bio: state.user.bio,
        chips: state.chips,
        teaserStreak: state.teaserStreak,
        wins: state.wins,
        losses: state.losses
      });
    }

    return apiRequest('/profile', { method: 'PUT', token, body: payload });
  }
};
