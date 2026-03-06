export const MAX_PLAYERS = 6;
export const MAX_BOTS = 5;

export const STYLE_OPTIONS = ['Tight', 'Loose', 'Aggressive', 'Balanced'];
export const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
export const STACK_OPTIONS = [1000, 2000, 5000];
export const BLIND_OPTIONS = [
  { label: '5 / 10', small: 5, big: 10 },
  { label: '10 / 20', small: 10, big: 20 },
  { label: '25 / 50', small: 25, big: 50 }
];

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['s', 'h', 'd', 'c'];
const RANK_VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]));

const STYLE_PROFILE = {
  Tight: { foldBias: 0.12, callBias: -0.05, raiseBias: -0.03, bluff: 0.015 },
  Loose: { foldBias: -0.09, callBias: 0.12, raiseBias: -0.03, bluff: 0.05 },
  Aggressive: { foldBias: -0.06, callBias: -0.1, raiseBias: 0.16, bluff: 0.09 },
  Balanced: { foldBias: 0, callBias: 0, raiseBias: 0.03, bluff: 0.04 }
};

const DIFFICULTY_PROFILE = {
  Easy: { noise: 0.18, bluffScale: 1.25, sizingSkill: 0.35 },
  Medium: { noise: 0.1, bluffScale: 1, sizingSkill: 0.6 },
  Hard: { noise: 0.05, bluffScale: 0.85, sizingSkill: 0.85 }
};

export function createDefaultConfig() {
  return {
    numBots: 2,
    startingStack: 2000,
    smallBlind: 10,
    bigBlind: 20,
    autoRunBots: true,
    seed: 12345,
    bots: [
      { seat: 2, name: 'Bot 1', style: 'Balanced', difficulty: 'Medium' },
      { seat: 3, name: 'Bot 2', style: 'Aggressive', difficulty: 'Medium' }
    ]
  };
}

export function normalizeConfig(input) {
  const defaults = createDefaultConfig();
  const numBots = clampInt(input?.numBots ?? defaults.numBots, 1, MAX_BOTS);
  const startingStack = STACK_OPTIONS.includes(Number(input?.startingStack))
    ? Number(input.startingStack)
    : defaults.startingStack;

  const smallBlind = Number(input?.smallBlind);
  const bigBlind = Number(input?.bigBlind);
  const selectedBlind = BLIND_OPTIONS.find((blind) => blind.small === smallBlind && blind.big === bigBlind);

  const seed = Number.isFinite(Number(input?.seed)) ? Number(input.seed) : defaults.seed;

  const bots = [];
  for (let i = 0; i < numBots; i += 1) {
    const seat = i + 2;
    const candidate = input?.bots?.find((bot) => bot.seat === seat) || defaults.bots[i] || {};

    bots.push({
      seat,
      name: candidate.name || `Bot ${i + 1}`,
      style: STYLE_OPTIONS.includes(candidate.style) ? candidate.style : 'Balanced',
      difficulty: DIFFICULTY_OPTIONS.includes(candidate.difficulty) ? candidate.difficulty : 'Medium'
    });
  }

  return {
    numBots,
    startingStack,
    smallBlind: selectedBlind ? selectedBlind.small : defaults.smallBlind,
    bigBlind: selectedBlind ? selectedBlind.big : defaults.bigBlind,
    autoRunBots: input?.autoRunBots !== false,
    seed,
    bots
  };
}

export function createMatch(configInput) {
  const config = normalizeConfig(configInput);
  const players = [
    {
      id: 'hero',
      seat: 1,
      name: 'You',
      isHuman: true,
      style: 'Balanced',
      difficulty: 'Hard',
      stack: config.startingStack,
      folded: false,
      allIn: false,
      currentBet: 0,
      totalContribution: 0,
      holeCards: []
    },
    ...config.bots.map((bot) => ({
      id: `bot-${bot.seat}`,
      seat: bot.seat,
      name: bot.name,
      isHuman: false,
      style: bot.style,
      difficulty: bot.difficulty,
      stack: config.startingStack,
      folded: false,
      allIn: false,
      currentBet: 0,
      totalContribution: 0,
      holeCards: []
    }))
  ];

  const match = {
    config,
    autoRunBots: config.autoRunBots !== false,
    rngSeed: normalizeSeed(config.seed),
    matchId: Date.now(),
    handNumber: 0,
    dealerIndex: -1,
    sbIndex: -1,
    bbIndex: -1,
    actionIndex: -1,
    stage: 'idle',
    deck: [],
    communityCards: [],
    currentBet: 0,
    minRaise: config.bigBlind,
    pendingToAct: [],
    pot: 0,
    players,
    handComplete: false,
    matchComplete: false,
    winnerId: '',
    lastHandResult: null,
    actionLog: []
  };

  return startNewHand(match);
}

export function startNewHand(matchInput) {
  const state = clone(matchInput);

  if (state.matchComplete) {
    return state;
  }

  const active = activeIndexes(state.players);
  if (active.length <= 1) {
    state.matchComplete = true;
    state.winnerId = active[0] !== undefined ? state.players[active[0]].id : '';
    state.stage = 'match_over';
    return state;
  }

  resetPlayersForHand(state.players);

  state.handNumber += 1;
  state.communityCards = [];
  state.pot = 0;
  state.currentBet = 0;
  state.minRaise = state.config.bigBlind;
  state.pendingToAct = [];
  state.handComplete = false;
  state.lastHandResult = null;
  state.stage = 'preflop';
  state.actionLog = [`Hand #${state.handNumber} started.`];

  state.dealerIndex = nextActiveIndex(state.players, state.dealerIndex);

  if (active.length === 2) {
    state.sbIndex = state.dealerIndex;
    state.bbIndex = nextActiveIndex(state.players, state.sbIndex);
  } else {
    state.sbIndex = nextActiveIndex(state.players, state.dealerIndex);
    state.bbIndex = nextActiveIndex(state.players, state.sbIndex);
  }

  state.deck = shuffledDeck(state);

  dealHoleCards(state);
  postBlind(state, state.sbIndex, state.config.smallBlind, 'small blind');
  postBlind(state, state.bbIndex, state.config.bigBlind, 'big blind');

  state.currentBet = Math.max(...state.players.map((player) => player.currentBet));
  state.minRaise = state.config.bigBlind;

  const firstToAct = nextActiveIndex(state.players, state.bbIndex);
  state.pendingToAct = orderedCanActFrom(state.players, firstToAct);
  state.actionIndex = state.pendingToAct.length ? state.pendingToAct[0] : -1;

  return state.autoRunBots ? runBotsUntilHuman(state) : state;
}

export function getLegalActions(match, playerIndex = match.actionIndex) {
  if (!match || match.handComplete || match.matchComplete || playerIndex < 0) {
    return {
      available: [],
      toCall: 0,
      minBetTo: 0,
      maxBetTo: 0,
      minRaiseTo: 0,
      maxRaiseTo: 0
    };
  }

  const player = match.players[playerIndex];
  if (!player || player.folded || player.allIn || player.stack <= 0) {
    return {
      available: [],
      toCall: 0,
      minBetTo: 0,
      maxBetTo: 0,
      minRaiseTo: 0,
      maxRaiseTo: 0
    };
  }

  const toCall = Math.max(0, match.currentBet - player.currentBet);
  const maxTotal = player.currentBet + player.stack;

  const available = [];
  if (toCall > 0) {
    available.push('fold', 'call');
  } else {
    available.push('check');
  }

  if (match.currentBet === 0) {
    if (player.stack > 0) {
      available.push('bet');
    }
  } else if (maxTotal > match.currentBet) {
    available.push('raise');
  }

  if (player.stack > 0) {
    available.push('all-in');
  }

  const minBetTo = match.currentBet === 0 ? Math.min(maxTotal, match.config.bigBlind) : 0;
  const minRaiseTo = match.currentBet > 0 ? Math.min(maxTotal, match.currentBet + match.minRaise) : 0;

  return {
    available,
    toCall,
    minBetTo,
    maxBetTo: maxTotal,
    minRaiseTo,
    maxRaiseTo: maxTotal
  };
}

export function applyPlayerAction(matchInput, actionInput) {
  const state = clone(matchInput);

  if (state.matchComplete || state.handComplete) {
    return state;
  }

  const actorIndex = state.actionIndex;
  const actor = state.players[actorIndex];

  if (!actor || !actor.isHuman) {
    throw new Error('It is not the human player turn.');
  }

  const result = applyActionCore(state, actorIndex, actionInput);
  return result.autoRunBots ? runBotsUntilHuman(result) : result;
}

export function applyBotAction(matchInput) {
  const state = clone(matchInput);

  if (state.matchComplete || state.handComplete || state.actionIndex < 0) {
    return state;
  }

  const actor = state.players[state.actionIndex];
  if (!actor || actor.isHuman || actor.folded || actor.allIn || actor.stack <= 0) {
    return state;
  }

  const action = decideBotAction(state, state.actionIndex);
  return applyActionCore(state, state.actionIndex, action);
}

export function computeSidePots(players) {
  const contributors = players
    .filter((player) => player.totalContribution > 0)
    .map((player) => ({
      id: player.id,
      seat: player.seat,
      folded: player.folded,
      amount: player.totalContribution
    }));

  if (!contributors.length) {
    return [];
  }

  const levels = [...new Set(contributors.map((player) => player.amount))].sort((a, b) => a - b);
  const pots = [];
  let previous = 0;

  levels.forEach((level) => {
    const involved = contributors.filter((player) => player.amount >= level);
    const amount = (level - previous) * involved.length;

    if (amount > 0) {
      pots.push({
        amount,
        contenders: involved.filter((player) => !player.folded).map((player) => player.id),
        involved: involved.map((player) => player.id)
      });
    }

    previous = level;
  });

  return pots;
}

export function advanceToNextHand(matchInput) {
  return startNewHand(matchInput);
}

export function resolveShowdownState(matchInput) {
  const state = clone(matchInput);
  resolveShowdown(state);
  return state;
}

function applyActionCore(state, actorIndex, actionInput) {
  const actor = state.players[actorIndex];
  if (!actor || actor.folded || actor.allIn || actor.stack <= 0) {
    throw new Error('Actor cannot act.');
  }

  const action = normalizeAction(actionInput);
  const legal = getLegalActions(state, actorIndex);

  validateAction(action, legal, state, actor);

  const previousBet = state.currentBet;
  const previousContribution = actor.currentBet;
  const toCall = legal.toCall;

  if (action.type === 'fold') {
    actor.folded = true;
    log(state, `${actor.name} folds.`);
    removePending(state, actorIndex);
  } else if (action.type === 'check') {
    log(state, `${actor.name} checks.`);
    removePending(state, actorIndex);
  } else if (action.type === 'call') {
    const paid = commitToBet(state, actorIndex, previousContribution + toCall);
    if (toCall > 0) {
      log(state, `${actor.name} calls ${paid}.`);
    } else {
      log(state, `${actor.name} checks.`);
    }
    removePending(state, actorIndex);
  } else if (action.type === 'bet') {
    const target = clampInt(action.amount ?? legal.minBetTo, legal.minBetTo, legal.maxBetTo);
    const paid = commitToBet(state, actorIndex, target);
    state.currentBet = actor.currentBet;
    state.minRaise = Math.max(state.config.bigBlind, state.currentBet);
    log(state, `${actor.name} bets to ${actor.currentBet} (${paid}).`);
    resetPendingAfterAggression(state, actorIndex);
  } else if (action.type === 'raise') {
    const minTo = legal.minRaiseTo || Math.min(legal.maxRaiseTo, state.currentBet + state.minRaise);
    const target = clampInt(action.amount ?? minTo, minTo, legal.maxRaiseTo);
    const paid = commitToBet(state, actorIndex, target);
    const raiseSize = actor.currentBet - previousBet;

    state.currentBet = Math.max(state.currentBet, actor.currentBet);

    if (raiseSize >= state.minRaise) {
      state.minRaise = raiseSize;
    }

    log(state, `${actor.name} raises to ${actor.currentBet} (${paid}).`);
    resetPendingAfterAggression(state, actorIndex);
  } else if (action.type === 'all-in') {
    const target = actor.currentBet + actor.stack;
    const paid = commitToBet(state, actorIndex, target);

    if (actor.currentBet > previousBet) {
      const raiseSize = actor.currentBet - previousBet;
      state.currentBet = actor.currentBet;
      if (raiseSize >= state.minRaise) {
        state.minRaise = raiseSize;
      }
      resetPendingAfterAggression(state, actorIndex);
      log(state, `${actor.name} moves all-in to ${actor.currentBet} (${paid}).`);
    } else {
      removePending(state, actorIndex);
      log(state, `${actor.name} is all-in for ${paid}.`);
    }
  }

  if (hasSingleContender(state)) {
    awardUncontestedPot(state);
    return state;
  }

  if (!state.pendingToAct.length) {
    advanceStreet(state);
    return state;
  }

  state.actionIndex = state.pendingToAct[0];
  return state;
}

function runBotsUntilHuman(matchInput) {
  let state = clone(matchInput);
  let guard = 0;

  while (!state.handComplete && !state.matchComplete && state.actionIndex >= 0 && !state.players[state.actionIndex].isHuman) {
    const botIndex = state.actionIndex;
    const action = decideBotAction(state, botIndex);
    state = applyActionCore(state, botIndex, action);

    guard += 1;
    if (guard > 200) {
      throw new Error('Bot action loop exceeded safety threshold.');
    }
  }

  return state;
}

function decideBotAction(state, botIndex) {
  const bot = state.players[botIndex];
  const legal = getLegalActions(state, botIndex);

  const style = STYLE_PROFILE[bot.style] || STYLE_PROFILE.Balanced;
  const diff = DIFFICULTY_PROFILE[bot.difficulty] || DIFFICULTY_PROFILE.Medium;

  const rawStrength = estimateStrength(state, bot);
  const noisyStrength = clamp(rawStrength + randomRange(state, -diff.noise, diff.noise), 0, 1);
  const toCall = legal.toCall;
  const potOdds = toCall > 0 ? toCall / Math.max(1, state.pot + toCall) : 0;

  const bluffChance = style.bluff * diff.bluffScale;
  const bluffing = random(state) < bluffChance;

  const foldThreshold = clamp(0.42 + style.foldBias - diff.sizingSkill * 0.08, 0.2, 0.75);
  const raiseThreshold = clamp(0.7 - style.raiseBias - diff.sizingSkill * 0.1, 0.35, 0.9);
  const betThreshold = clamp(0.62 - style.raiseBias * 0.4, 0.35, 0.85);

  const aggressionFactor = clamp(0.45 + style.raiseBias + diff.sizingSkill * 0.35, 0.2, 0.95);

  if (toCall > 0 && legal.available.includes('fold')) {
    if (!bluffing && noisyStrength < foldThreshold && potOdds > noisyStrength + style.callBias + 0.08) {
      return { type: 'fold' };
    }

    if ((noisyStrength > raiseThreshold || bluffing) && legal.available.includes('raise')) {
      return {
        type: 'raise',
        amount: pickAggressiveAmount(state, legal, aggressionFactor)
      };
    }

    if (legal.available.includes('call')) {
      return { type: 'call' };
    }
  } else {
    if ((noisyStrength > betThreshold || bluffing) && (legal.available.includes('bet') || legal.available.includes('raise'))) {
      if (legal.available.includes('bet')) {
        return {
          type: 'bet',
          amount: pickAggressiveAmount(state, legal, aggressionFactor, true)
        };
      }

      return {
        type: 'raise',
        amount: pickAggressiveAmount(state, legal, aggressionFactor)
      };
    }

    if (legal.available.includes('check')) {
      return { type: 'check' };
    }
  }

  if (legal.available.includes('call')) {
    return { type: 'call' };
  }

  if (legal.available.includes('check')) {
    return { type: 'check' };
  }

  if (legal.available.includes('all-in')) {
    return { type: 'all-in' };
  }

  return { type: 'fold' };
}

function pickAggressiveAmount(state, legal, aggressionFactor, isBet = false) {
  const min = isBet ? legal.minBetTo : legal.minRaiseTo;
  const max = isBet ? legal.maxBetTo : legal.maxRaiseTo;

  if (!min || !max || min >= max) {
    return max || min || 0;
  }

  const potBase = Math.max(state.pot, state.config.bigBlind * 4);
  const targetByPot = isBet
    ? min + potBase * (0.25 + aggressionFactor * 0.8)
    : min + potBase * (0.2 + aggressionFactor * 0.6);

  const mixed = (targetByPot * 0.7) + (max * (0.3 * aggressionFactor));
  return clampInt(Math.round(mixed), min, max);
}

function estimateStrength(state, player) {
  if (state.stage === 'preflop') {
    return preflopStrength(player.holeCards);
  }

  const cards = [...player.holeCards, ...state.communityCards];
  const rank = evaluateSeven(cards);
  const rankStrength = rank.rank[0] / 8;
  const drawBonus = drawPotential(cards, state.communityCards.length);
  return clamp(rankStrength + drawBonus, 0, 1);
}

function preflopStrength(cards) {
  if (!cards || cards.length < 2) {
    return 0.3;
  }

  const a = RANK_VALUE[cards[0][0]];
  const b = RANK_VALUE[cards[1][0]];
  const suited = cards[0][1] === cards[1][1];
  const high = Math.max(a, b);
  const low = Math.min(a, b);

  let score = (high + low) / 30;

  if (a === b) {
    score += 0.28 + high / 35;
  }

  if (suited) {
    score += 0.07;
  }

  const gap = Math.abs(a - b);
  if (gap <= 1) {
    score += 0.05;
  } else if (gap >= 4) {
    score -= 0.06;
  }

  if (high >= 12) {
    score += 0.07;
  }

  return clamp(score, 0.05, 0.98);
}

function drawPotential(cards, boardCount) {
  if (boardCount < 3) {
    return 0;
  }

  const suitCounts = {};
  cards.forEach((card) => {
    suitCounts[card[1]] = (suitCounts[card[1]] || 0) + 1;
  });

  const hasFlushDraw = Object.values(suitCounts).some((count) => count === 4);
  const straightDraw = hasStraightDraw(cards);

  let bonus = 0;
  if (hasFlushDraw) {
    bonus += 0.16;
  }
  if (straightDraw === 'open') {
    bonus += 0.12;
  } else if (straightDraw === 'gutshot') {
    bonus += 0.06;
  }

  return bonus;
}

function hasStraightDraw(cards) {
  const values = [...new Set(cards.map((card) => RANK_VALUE[card[0]]))].sort((a, b) => a - b);
  if (values.includes(14)) {
    values.unshift(1);
  }

  let open = false;
  let gutshot = false;

  for (let start = 0; start < values.length; start += 1) {
    const window = values.slice(start, start + 4);
    if (window.length < 4) {
      continue;
    }
    const span = window[window.length - 1] - window[0];

    if (span === 3) {
      open = true;
    } else if (span === 4) {
      gutshot = true;
    }
  }

  if (open) {
    return 'open';
  }
  if (gutshot) {
    return 'gutshot';
  }
  return 'none';
}

function advanceStreet(state) {
  if (state.handComplete) {
    return;
  }

  if (hasSingleContender(state)) {
    awardUncontestedPot(state);
    return;
  }

  resetStreetBets(state.players);
  state.currentBet = 0;
  state.minRaise = state.config.bigBlind;

  if (state.stage === 'preflop') {
    state.stage = 'flop';
    state.communityCards.push(drawCard(state), drawCard(state), drawCard(state));
    log(state, `Flop: ${state.communityCards.map(formatCard).join(' ')}`);
  } else if (state.stage === 'flop') {
    state.stage = 'turn';
    state.communityCards.push(drawCard(state));
    log(state, `Turn: ${formatCard(state.communityCards[3])}`);
  } else if (state.stage === 'turn') {
    state.stage = 'river';
    state.communityCards.push(drawCard(state));
    log(state, `River: ${formatCard(state.communityCards[4])}`);
  } else if (state.stage === 'river') {
    state.stage = 'showdown';
    resolveShowdown(state);
    return;
  }

  const firstToAct = nextActiveIndex(state.players, state.dealerIndex);
  state.pendingToAct = orderedCanActFrom(state.players, firstToAct);

  if (!state.pendingToAct.length) {
    if (state.stage === 'river') {
      state.stage = 'showdown';
      resolveShowdown(state);
    } else {
      advanceStreet(state);
    }
    return;
  }

  state.actionIndex = state.pendingToAct[0];
}

function resolveShowdown(state) {
  const contenders = state.players.filter((player) => !player.folded && player.totalContribution > 0);
  const rankings = new Map();

  contenders.forEach((player) => {
    rankings.set(player.id, evaluateSeven([...player.holeCards, ...state.communityCards]));
  });

  const pots = computeSidePots(state.players);
  const payouts = Object.fromEntries(state.players.map((player) => [player.id, 0]));
  const potsResolved = [];

  pots.forEach((pot, index) => {
    const eligible = pot.contenders.filter((id) => rankings.has(id));

    if (!eligible.length) {
      return;
    }

    let bestRank = null;
    let winners = [];

    eligible.forEach((id) => {
      const rank = rankings.get(id);
      if (!bestRank || compareRank(rank.rank, bestRank.rank) > 0) {
        bestRank = rank;
        winners = [id];
      } else if (compareRank(rank.rank, bestRank.rank) === 0) {
        winners.push(id);
      }
    });

    const orderedWinners = winners
      .map((id) => state.players.find((player) => player.id === id))
      .filter(Boolean)
      .sort((a, b) => a.seat - b.seat)
      .map((player) => player.id);

    const share = Math.floor(pot.amount / orderedWinners.length);
    let remainder = pot.amount - share * orderedWinners.length;

    orderedWinners.forEach((id) => {
      payouts[id] += share;
      if (remainder > 0) {
        payouts[id] += 1;
        remainder -= 1;
      }
    });

    potsResolved.push({
      index: index + 1,
      amount: pot.amount,
      winners: orderedWinners,
      handName: bestRank.name
    });
  });

  state.players.forEach((player) => {
    player.stack += payouts[player.id] || 0;
  });

  state.handComplete = true;
  state.stage = 'showdown';
  state.pendingToAct = [];
  state.actionIndex = -1;

  const topPot = potsResolved[0];
  const winnerIds = topPot ? topPot.winners : [];

  if (potsResolved.length) {
    potsResolved.forEach((pot) => {
      const names = pot.winners
        .map((id) => state.players.find((player) => player.id === id)?.name || id)
        .join(', ');
      log(state, `Pot ${pot.index} (${pot.amount}) won by ${names} with ${pot.handName}.`);
    });
  } else {
    log(state, 'Showdown ended without eligible pots.');
  }

  state.lastHandResult = {
    type: 'showdown',
    pots: potsResolved,
    winnerIds,
    rankings: Object.fromEntries([...rankings.entries()].map(([id, rank]) => [id, rank.name]))
  };

  finalizeMatchIfNeeded(state);
}

function awardUncontestedPot(state) {
  const winner = state.players.find((player) => !player.folded && player.totalContribution >= 0 && (player.stack > 0 || player.currentBet > 0 || player.totalContribution > 0));

  if (!winner) {
    state.handComplete = true;
    state.stage = 'showdown';
    state.pendingToAct = [];
    state.actionIndex = -1;
    finalizeMatchIfNeeded(state);
    return;
  }

  winner.stack += state.pot;
  state.handComplete = true;
  state.stage = 'showdown';
  state.pendingToAct = [];
  state.actionIndex = -1;

  state.lastHandResult = {
    type: 'uncontested',
    winnerIds: [winner.id],
    pots: [{ index: 1, amount: state.pot, winners: [winner.id], handName: 'Uncontested' }]
  };

  log(state, `${winner.name} wins ${state.pot} uncontested.`);
  finalizeMatchIfNeeded(state);
}

function finalizeMatchIfNeeded(state) {
  const alive = activeIndexes(state.players);
  if (alive.length <= 1) {
    state.matchComplete = true;
    state.winnerId = alive.length ? state.players[alive[0]].id : '';
    state.stage = 'match_over';
  }
}

function commitToBet(state, playerIndex, targetTotal) {
  const player = state.players[playerIndex];
  const cappedTarget = Math.max(player.currentBet, Math.min(player.currentBet + player.stack, targetTotal));
  const delta = cappedTarget - player.currentBet;

  if (delta <= 0) {
    return 0;
  }

  player.stack -= delta;
  player.currentBet += delta;
  player.totalContribution += delta;
  state.pot += delta;

  if (player.stack === 0) {
    player.allIn = true;
  }

  return delta;
}

function postBlind(state, playerIndex, blindAmount, label) {
  const player = state.players[playerIndex];
  if (!player || player.stack <= 0) {
    return;
  }

  const paid = commitToBet(state, playerIndex, player.currentBet + blindAmount);
  log(state, `${player.name} posts ${label} ${paid}.`);
}

function resetPlayersForHand(players) {
  players.forEach((player) => {
    player.folded = false;
    player.allIn = false;
    player.currentBet = 0;
    player.totalContribution = 0;
    player.holeCards = [];
  });
}

function resetStreetBets(players) {
  players.forEach((player) => {
    player.currentBet = 0;
  });
}

function dealHoleCards(state) {
  const active = activeIndexes(state.players);

  for (let round = 0; round < 2; round += 1) {
    active.forEach((index) => {
      state.players[index].holeCards.push(drawCard(state));
    });
  }
}

function drawCard(state) {
  if (!state.deck.length) {
    throw new Error('Deck exhausted unexpectedly.');
  }
  return state.deck.pop();
}

function shuffledDeck(state) {
  const deck = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push(`${rank}${suit}`);
    });
  });

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random(state) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function hasSingleContender(state) {
  const alive = state.players.filter((player) => !player.folded && (player.stack > 0 || player.currentBet > 0 || player.totalContribution > 0));
  return alive.length <= 1;
}

function validateAction(action, legal, state, player) {
  if (!action?.type) {
    throw new Error('Action requires a type.');
  }

  if (!legal.available.includes(action.type)) {
    throw new Error(`Illegal action: ${action.type}`);
  }

  if (action.type === 'check' && legal.toCall > 0) {
    throw new Error('Cannot check when facing a bet.');
  }

  if (action.type === 'bet') {
    if (state.currentBet !== 0) {
      throw new Error('Bet is only legal when no previous bet exists.');
    }

    if (typeof action.amount !== 'number') {
      throw new Error('Bet action requires an amount.');
    }

    if (action.amount < legal.minBetTo) {
      throw new Error(`Bet amount must be at least ${legal.minBetTo}.`);
    }

    if (action.amount > legal.maxBetTo) {
      throw new Error(`Bet amount exceeds stack (${legal.maxBetTo}).`);
    }
  }

  if (action.type === 'raise') {
    if (state.currentBet === 0) {
      throw new Error('Cannot raise when no bet has been made.');
    }

    if (typeof action.amount !== 'number') {
      throw new Error('Raise action requires an amount.');
    }

    if (action.amount <= state.currentBet) {
      throw new Error('Raise amount must exceed current bet.');
    }

    const max = player.currentBet + player.stack;
    if (action.amount > max) {
      throw new Error('Raise amount exceeds stack.');
    }

    const minRaiseTo = legal.minRaiseTo || state.currentBet + state.minRaise;
    const isAllIn = action.amount >= max;
    if (action.amount < minRaiseTo && !isAllIn) {
      throw new Error(`Raise amount must be at least ${minRaiseTo} unless all-in.`);
    }
  }
}

function normalizeAction(actionInput) {
  if (!actionInput || typeof actionInput !== 'object') {
    return { type: '' };
  }

  return {
    type: actionInput.type,
    amount: actionInput.amount !== undefined ? Number(actionInput.amount) : undefined
  };
}

function orderedCanActFrom(players, startIndex) {
  return orderedFrom(players.length, startIndex).filter((index) => canAct(players[index]));
}

function resetPendingAfterAggression(state, aggressorIndex) {
  const start = (aggressorIndex + 1) % state.players.length;
  state.pendingToAct = orderedCanActFrom(state.players, start).filter((index) => index !== aggressorIndex);
  state.actionIndex = state.pendingToAct.length ? state.pendingToAct[0] : -1;
}

function removePending(state, playerIndex) {
  state.pendingToAct = state.pendingToAct.filter((index) => index !== playerIndex);
  state.actionIndex = state.pendingToAct.length ? state.pendingToAct[0] : -1;
}

function canAct(player) {
  return Boolean(player && !player.folded && !player.allIn && player.stack > 0);
}

function activeIndexes(players) {
  return players
    .map((player, index) => ({ player, index }))
    .filter((entry) => entry.player.stack > 0)
    .map((entry) => entry.index);
}

function nextActiveIndex(players, previousIndex) {
  const length = players.length;
  if (!length) {
    return -1;
  }

  for (let offset = 1; offset <= length; offset += 1) {
    const index = (previousIndex + offset + length) % length;
    if (players[index].stack > 0) {
      return index;
    }
  }

  return -1;
}

function orderedFrom(length, start) {
  const order = [];
  for (let offset = 0; offset < length; offset += 1) {
    order.push((start + offset + length) % length);
  }
  return order;
}

function random(state) {
  const next = nextSeed(state.rngSeed);
  state.rngSeed = next.seed;
  return next.value;
}

function randomRange(state, min, max) {
  return min + (max - min) * random(state);
}

function nextSeed(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { seed: t, value };
}

function normalizeSeed(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return Math.max(1, Math.floor(numeric)) | 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampInt(value, min, max) {
  return Math.floor(clamp(Number(value), min, max));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function log(state, line) {
  state.actionLog.push(line);
  if (state.actionLog.length > 200) {
    state.actionLog = state.actionLog.slice(-200);
  }
}

export function formatCard(card) {
  const rank = card[0] === 'T' ? '10' : card[0];
  const suitMap = { s: '♠', h: '♥', d: '♦', c: '♣' };
  return `${rank}${suitMap[card[1]] || card[1]}`;
}

export function evaluateSeven(cards) {
  const values = cards.map((card) => RANK_VALUE[card[0]]).sort((a, b) => b - a);

  const valueCounts = new Map();
  values.forEach((value) => {
    valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
  });

  const suitToValues = new Map();
  cards.forEach((card) => {
    const suit = card[1];
    const value = RANK_VALUE[card[0]];
    suitToValues.set(suit, [...(suitToValues.get(suit) || []), value]);
  });

  let flushValues = null;
  for (const suitedValues of suitToValues.values()) {
    if (suitedValues.length >= 5) {
      flushValues = suitedValues.sort((a, b) => b - a);
      break;
    }
  }

  if (flushValues) {
    const straightFlushHigh = straightHigh(flushValues);
    if (straightFlushHigh) {
      return { rank: [8, straightFlushHigh], name: 'Straight Flush' };
    }
  }

  const groups = [...valueCounts.entries()].sort((a, b) => {
    if (b[1] === a[1]) {
      return b[0] - a[0];
    }
    return b[1] - a[1];
  });

  const four = groups.find((entry) => entry[1] === 4);
  if (four) {
    const kicker = groups.find((entry) => entry[0] !== four[0])[0];
    return { rank: [7, four[0], kicker], name: 'Four of a Kind' };
  }

  const trips = groups.filter((entry) => entry[1] >= 3).map((entry) => entry[0]);
  const pairs = groups.filter((entry) => entry[1] >= 2).map((entry) => entry[0]);

  if (trips.length >= 1 && (pairs.length >= 2 || trips.length >= 2)) {
    const topTrip = trips[0];
    const remaining = pairs.filter((value) => value !== topTrip);
    const pairValue = remaining[0] || trips[1];
    return { rank: [6, topTrip, pairValue], name: 'Full House' };
  }

  if (flushValues) {
    return { rank: [5, ...flushValues.slice(0, 5)], name: 'Flush' };
  }

  const straight = straightHigh(values);
  if (straight) {
    return { rank: [4, straight], name: 'Straight' };
  }

  if (trips.length >= 1) {
    const trip = trips[0];
    const kickers = groups.filter((entry) => entry[0] !== trip).slice(0, 2).map((entry) => entry[0]);
    return { rank: [3, trip, ...kickers], name: 'Three of a Kind' };
  }

  const topPairs = pairs.slice(0, 2);
  if (topPairs.length >= 2) {
    const kicker = groups.filter((entry) => !topPairs.includes(entry[0]))[0][0];
    return { rank: [2, topPairs[0], topPairs[1], kicker], name: 'Two Pair' };
  }

  if (pairs.length === 1) {
    const pair = pairs[0];
    const kickers = groups.filter((entry) => entry[0] !== pair).slice(0, 3).map((entry) => entry[0]);
    return { rank: [1, pair, ...kickers], name: 'Pair' };
  }

  return { rank: [0, ...values.slice(0, 5)], name: 'High Card' };
}

export function compareRank(first, second) {
  const size = Math.max(first.length, second.length);

  for (let i = 0; i < size; i += 1) {
    const left = first[i] || 0;
    const right = second[i] || 0;

    if (left > right) {
      return 1;
    }
    if (left < right) {
      return -1;
    }
  }

  return 0;
}

function straightHigh(valuesInput) {
  const unique = [...new Set(valuesInput)].sort((a, b) => a - b);

  if (unique.includes(14)) {
    unique.unshift(1);
  }

  let run = 1;
  let best = 0;

  for (let i = 1; i < unique.length; i += 1) {
    if (unique[i] === unique[i - 1] + 1) {
      run += 1;
      if (run >= 5) {
        best = unique[i];
      }
    } else if (unique[i] !== unique[i - 1]) {
      run = 1;
    }
  }

  return best;
}
