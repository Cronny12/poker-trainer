const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['s', 'h', 'd', 'c'];
const RANK_VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]));

const STRATEGY_PROFILES = {
  'tight-aggressive': { foldBelow: 45, raiseAbove: 70, allInAbove: 88, bluffChance: 0.03, raiseSizeBb: 3 },
  'loose-aggressive': { foldBelow: 28, raiseAbove: 60, allInAbove: 84, bluffChance: 0.12, raiseSizeBb: 4 },
  'calling-station': { foldBelow: 22, raiseAbove: 78, allInAbove: 92, bluffChance: 0.01, raiseSizeBb: 2 },
  nit: { foldBelow: 55, raiseAbove: 76, allInAbove: 90, bluffChance: 0.01, raiseSizeBb: 2 },
  'balanced-grinder': { foldBelow: 38, raiseAbove: 67, allInAbove: 88, bluffChance: 0.04, raiseSizeBb: 3 },
  maniac: { foldBelow: 18, raiseAbove: 52, allInAbove: 80, bluffChance: 0.16, raiseSizeBb: 5 },
  'tricky-trapper': { foldBelow: 35, raiseAbove: 69, allInAbove: 86, bluffChance: 0.08, raiseSizeBb: 3 },
  'gto-lite': { foldBelow: 40, raiseAbove: 66, allInAbove: 86, bluffChance: 0.06, raiseSizeBb: 3 },
  'passive-recreational': { foldBelow: 20, raiseAbove: 83, allInAbove: 94, bluffChance: 0.02, raiseSizeBb: 2 },
  'icm-aware': { foldBelow: 52, raiseAbove: 73, allInAbove: 90, bluffChance: 0.02, raiseSizeBb: 2 }
};

const DEFAULT_PROFILE = STRATEGY_PROFILES['balanced-grinder'];

export function createInitialGame(lineup) {
  const players = [
    {
      id: 'user',
      name: 'You',
      isUser: true,
      strategyId: 'human',
      strategyName: 'Human',
      stack: 2000
    },
    ...lineup
      .slice()
      .sort((a, b) => a.seat - b.seat)
      .map((bot) => ({
        id: `bot-${bot.seat}`,
        name: `Bot ${bot.seat}`,
        isUser: false,
        strategyId: bot.strategyId,
        strategyName: bot.strategyName,
        stack: 2000
      }))
  ];

  return {
    players,
    buttonIndex: -1,
    handNumber: 0,
    currentHand: null,
    recentHands: [],
    gameOver: false,
    userWon: false,
    resultSummary: ''
  };
}

export function startNextHand(game) {
  if (!game || game.gameOver) {
    return game;
  }

  const players = game.players.map((player) => ({ ...player }));
  const active = activeIndexes(players);
  const user = players.find((player) => player.isUser);

  if (!user || user.stack <= 0) {
    return {
      ...game,
      players,
      gameOver: true,
      userWon: false,
      resultSummary: 'You busted from the table.'
    };
  }

  if (active.length <= 1) {
    return {
      ...game,
      players,
      gameOver: true,
      userWon: true,
      resultSummary: 'You won the table.'
    };
  }

  const nextHandNumber = game.handNumber + 1;
  const buttonIndex = nextActiveIndex(players, game.buttonIndex + 1);
  const smallBlindIndex = nextActiveIndex(players, buttonIndex + 1);
  const bigBlindIndex = nextActiveIndex(players, smallBlindIndex + 1);
  const { smallBlind, bigBlind } = blindLevel(nextHandNumber);

  const deck = shuffle(makeDeck());
  const holeCards = {};
  activeIndexes(players).forEach((index) => {
    holeCards[players[index].id] = [deck.pop(), deck.pop()];
  });
  const board = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];

  const contributions = Object.fromEntries(players.map((player) => [player.id, 0]));
  const folded = Object.fromEntries(players.map((player) => [player.id, false]));
  const allIn = Object.fromEntries(players.map((player) => [player.id, false]));
  const actionLog = [];
  const holeStrength = Object.fromEntries(
    players
      .filter((player) => !player.isUser && player.stack > 0)
      .map((player) => [player.id, estimateHoleStrength(holeCards[player.id] || [])])
  );

  let highestBet = 0;
  let pot = 0;

  const commit = (player, amount) => {
    const alreadyCommitted = contributions[player.id];
    const available = Math.max(0, player.stack - alreadyCommitted);
    const paid = Math.min(available, Math.max(0, amount));

    if (paid <= 0) {
      return 0;
    }

    contributions[player.id] += paid;
    pot += paid;

    if (contributions[player.id] >= player.stack) {
      allIn[player.id] = true;
    }

    if (contributions[player.id] > highestBet) {
      highestBet = contributions[player.id];
    }

    return paid;
  };

  const sbPlayer = players[smallBlindIndex];
  const bbPlayer = players[bigBlindIndex];

  const sbPaid = commit(sbPlayer, smallBlind);
  const bbPaid = commit(bbPlayer, bigBlind);

  actionLog.push(`${sbPlayer.name} posts small blind ${sbPaid}.`);
  actionLog.push(`${bbPlayer.name} posts big blind ${bbPaid}.`);

  const order = [];
  let cursorIndex = nextActiveIndex(players, bigBlindIndex + 1);

  while (!order.includes(cursorIndex)) {
    order.push(cursorIndex);
    cursorIndex = nextActiveIndex(players, cursorIndex + 1);
  }

  let hand = {
    handNumber: nextHandNumber,
    smallBlind,
    bigBlind,
    buttonIndex,
    smallBlindIndex,
    bigBlindIndex,
    board,
    holeCards,
    holeStrength,
    contributions,
    folded,
    allIn,
    highestBet,
    pot,
    actionOrder: order,
    actionCursor: 0,
    actionLog,
    awaitingUserAction: false,
    userToCall: 0,
    minRaiseTo: highestBet + bigBlind,
    resolved: false,
    winnerId: '',
    winnerName: '',
    winningHand: ''
  };

  const progressed = runUntilUserOrResolve({
    ...game,
    players,
    handNumber: nextHandNumber,
    buttonIndex,
    currentHand: hand
  });

  return progressed;
}

export function applyUserAction(game, action) {
  if (!game || !game.currentHand || !game.currentHand.awaitingUserAction || game.gameOver) {
    return game;
  }

  const players = game.players.map((player) => ({ ...player }));
  const hand = cloneHand(game.currentHand);
  const userIndex = players.findIndex((player) => player.isUser);
  const user = players[userIndex];

  if (userIndex < 0 || hand.resolved || hand.folded[user.id] || hand.allIn[user.id]) {
    return game;
  }

  const toCall = Math.max(0, hand.highestBet - hand.contributions[user.id]);
  const commit = createCommitter(hand, user);

  if (action === 'fold') {
    hand.folded[user.id] = true;
    hand.actionLog.push('You fold.');
  } else if (action === 'call') {
    if (toCall <= 0) {
      hand.actionLog.push('You check.');
    } else {
      const paid = commit(toCall);
      hand.actionLog.push(`You call ${paid}.`);
    }
  } else if (action === 'raise') {
    const previousHighestBet = hand.highestBet;
    const target = Math.max(hand.minRaiseTo, hand.highestBet + hand.bigBlind * 2);
    const needed = Math.max(0, target - hand.contributions[user.id]);
    const paid = commit(needed);
    const newTotal = hand.contributions[user.id];

    if (newTotal > previousHighestBet) {
      hand.highestBet = newTotal;
      hand.minRaiseTo = hand.highestBet + hand.bigBlind;
      hand.actionLog.push(`You raise to ${newTotal}.`);
    } else if (paid > 0) {
      hand.actionLog.push(`You call ${paid}.`);
    } else {
      hand.actionLog.push('You check.');
    }
  } else if (action === 'all-in') {
    const previousHighestBet = hand.highestBet;
    const needed = Math.max(0, user.stack - hand.contributions[user.id]);
    const paid = commit(needed);
    const newTotal = hand.contributions[user.id];

    if (newTotal > previousHighestBet) {
      hand.highestBet = newTotal;
      hand.minRaiseTo = hand.highestBet + hand.bigBlind;
    }

    hand.actionLog.push(`You move all-in for ${paid}.`);
  }

  hand.awaitingUserAction = false;
  hand.actionCursor += 1;

  return runUntilUserOrResolve({
    ...game,
    players,
    currentHand: hand
  });
}

function runUntilUserOrResolve(game) {
  const players = game.players;
  const hand = cloneHand(game.currentHand);

  while (hand.actionCursor < hand.actionOrder.length) {
    const playerIndex = hand.actionOrder[hand.actionCursor];
    const player = players[playerIndex];

    if (!player || player.stack <= 0) {
      hand.actionCursor += 1;
      continue;
    }

    if (hand.folded[player.id] || hand.allIn[player.id]) {
      hand.actionCursor += 1;
      continue;
    }

    const toCall = Math.max(0, hand.highestBet - hand.contributions[player.id]);

    if (player.isUser) {
      hand.awaitingUserAction = true;
      hand.userToCall = toCall;
      hand.minRaiseTo = Math.max(hand.minRaiseTo, hand.highestBet + hand.bigBlind);
      return {
        ...game,
        currentHand: hand
      };
    }

    runBotAction(player, hand, toCall);
    hand.actionCursor += 1;
  }

  return resolveCurrentHand({
    ...game,
    currentHand: hand
  });
}

function runBotAction(player, hand, toCall) {
  const profile = STRATEGY_PROFILES[player.strategyId] || DEFAULT_PROFILE;
  const strength = hand.holeStrength[player.id] || 45;
  const commit = createCommitter(hand, player);

  if (toCall > 0 && strength < profile.foldBelow && Math.random() > profile.bluffChance) {
    hand.folded[player.id] = true;
    hand.actionLog.push(`${player.name} folds.`);
    return;
  }

  const hasRaiseRoom = player.stack - hand.contributions[player.id] > toCall + hand.bigBlind;

  if ((strength >= profile.allInAbove && Math.random() < 0.65) || (player.stack <= hand.bigBlind * 8 && strength > 62)) {
    const previousHighestBet = hand.highestBet;
    const paid = commit(player.stack - hand.contributions[player.id]);
    if (hand.contributions[player.id] > previousHighestBet) {
      hand.highestBet = hand.contributions[player.id];
      hand.minRaiseTo = hand.highestBet + hand.bigBlind;
    }
    hand.actionLog.push(`${player.name} shoves all-in (${paid}).`);
    return;
  }

  if (strength >= profile.raiseAbove && hasRaiseRoom) {
    const previousHighestBet = hand.highestBet;
    const raiseTarget = Math.max(hand.highestBet + hand.bigBlind, hand.highestBet + hand.bigBlind * profile.raiseSizeBb);
    const needed = Math.max(0, raiseTarget - hand.contributions[player.id]);
    const paid = commit(needed);

    if (hand.contributions[player.id] > previousHighestBet) {
      hand.highestBet = hand.contributions[player.id];
      hand.minRaiseTo = hand.highestBet + hand.bigBlind;
      hand.actionLog.push(`${player.name} raises to ${hand.contributions[player.id]}.`);
      return;
    }

    if (paid > 0) {
      hand.actionLog.push(`${player.name} calls ${paid}.`);
    } else {
      hand.actionLog.push(`${player.name} checks.`);
    }
    return;
  }

  if (toCall <= 0) {
    hand.actionLog.push(`${player.name} checks.`);
    return;
  }

  const paid = commit(toCall);

  if (paid <= 0) {
    hand.folded[player.id] = true;
    hand.actionLog.push(`${player.name} folds.`);
    return;
  }

  hand.actionLog.push(`${player.name} calls ${paid}.`);
}

function resolveCurrentHand(game) {
  const players = game.players.map((player) => ({ ...player }));
  const hand = cloneHand(game.currentHand);

  hand.awaitingUserAction = false;
  hand.resolved = true;

  const contenders = players.filter((player) => !hand.folded[player.id] && hand.contributions[player.id] > 0 && player.stack > 0);

  let winner = contenders[0];
  let winnerRank = null;

  if (contenders.length > 1) {
    contenders.forEach((player) => {
      const rank = evaluateSeven([...hand.holeCards[player.id], ...hand.board]);
      if (!winnerRank || compareRank(rank.rank, winnerRank.rank) > 0) {
        winner = player;
        winnerRank = rank;
      }
    });
  }

  players.forEach((player) => {
    player.stack = Math.max(0, player.stack - hand.contributions[player.id]);
  });

  if (winner) {
    const winnerIndex = players.findIndex((player) => player.id === winner.id);
    players[winnerIndex].stack += hand.pot;
    hand.winnerId = winner.id;
    hand.winnerName = winner.name;
    hand.winningHand = winnerRank ? winnerRank.name : 'Uncontested Pot';
    hand.actionLog.push(`${winner.name} wins ${hand.pot} (${hand.winningHand}).`);
  }

  const userPlayer = players.find((player) => player.isUser);
  const stillIn = players.filter((player) => player.stack > 0);

  const recentHands = [
    {
      handNumber: hand.handNumber,
      winnerName: hand.winnerName,
      winningHand: hand.winningHand,
      pot: hand.pot,
      summary: hand.actionLog[hand.actionLog.length - 1]
    },
    ...game.recentHands
  ].slice(0, 10);

  if (!userPlayer || userPlayer.stack <= 0) {
    return {
      ...game,
      players,
      currentHand: hand,
      recentHands,
      gameOver: true,
      userWon: false,
      resultSummary: 'You busted. Match recorded as a loss.'
    };
  }

  if (stillIn.length === 1 && stillIn[0].isUser) {
    return {
      ...game,
      players,
      currentHand: hand,
      recentHands,
      gameOver: true,
      userWon: true,
      resultSummary: 'You won the table. Match recorded as a win.'
    };
  }

  return {
    ...game,
    players,
    currentHand: hand,
    recentHands
  };
}

function createCommitter(hand, player) {
  return (amount) => {
    const alreadyCommitted = hand.contributions[player.id];
    const available = Math.max(0, player.stack - alreadyCommitted);
    const paid = Math.min(available, Math.max(0, amount));

    if (paid <= 0) {
      return 0;
    }

    hand.contributions[player.id] += paid;
    hand.pot += paid;

    if (hand.contributions[player.id] >= player.stack) {
      hand.allIn[player.id] = true;
    }

    if (hand.contributions[player.id] > hand.highestBet) {
      hand.highestBet = hand.contributions[player.id];
    }

    return paid;
  };
}

function activeIndexes(players) {
  return players
    .map((player, index) => ({ player, index }))
    .filter((entry) => entry.player.stack > 0)
    .map((entry) => entry.index);
}

function nextActiveIndex(players, startIndex) {
  const total = players.length;
  for (let offset = 0; offset < total; offset += 1) {
    const index = (startIndex + offset + total) % total;
    if (players[index].stack > 0) {
      return index;
    }
  }
  return -1;
}

function blindLevel(handNumber) {
  const level = Math.floor((handNumber - 1) / 5);
  const smallBlind = Math.min(320, 20 * 2 ** level);
  return {
    smallBlind,
    bigBlind: smallBlind * 2
  };
}

function makeDeck() {
  const deck = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push(`${rank}${suit}`);
    });
  });
  return deck;
}

function shuffle(deck) {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function estimateHoleStrength(cards) {
  if (!cards || cards.length < 2) {
    return 40;
  }

  const first = RANK_VALUE[cards[0][0]];
  const second = RANK_VALUE[cards[1][0]];
  const pairBonus = first === second ? 32 : 0;
  const suitedBonus = cards[0][1] === cards[1][1] ? 5 : 0;
  const highCardScore = Math.max(first, second) * 4 + Math.min(first, second);
  const gapPenalty = Math.max(0, Math.abs(first - second) - 1) * 2;

  return Math.max(1, Math.min(99, highCardScore + pairBonus + suitedBonus - gapPenalty));
}

function evaluateSeven(cards) {
  const values = cards.map((card) => RANK_VALUE[card[0]]).sort((a, b) => b - a);
  const suits = cards.map((card) => card[1]);

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
  for (const [suit, suitedValues] of suitToValues.entries()) {
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

function straightHigh(values) {
  const unique = [...new Set(values)].sort((a, b) => a - b);

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

function compareRank(first, second) {
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

function cloneHand(hand) {
  return {
    ...hand,
    contributions: { ...hand.contributions },
    folded: { ...hand.folded },
    allIn: { ...hand.allIn },
    holeCards: { ...hand.holeCards },
    holeStrength: { ...hand.holeStrength },
    actionOrder: [...hand.actionOrder],
    actionLog: [...hand.actionLog],
    board: [...hand.board]
  };
}

export function formatCard(card) {
  const rankMap = { T: '10' };
  const suitMap = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const rank = rankMap[card[0]] || card[0];
  const suit = suitMap[card[1]] || card[1];
  return `${rank}${suit}`;
}
