import { describe, expect, it } from 'vitest';
import {
  computeSidePots,
  createDefaultConfig,
  createMatch,
  getLegalActions,
  resolveShowdownState
} from './engine';

describe('engine correctness', () => {
  it('computes side pots correctly for uneven all-ins', () => {
    const pots = computeSidePots([
      { id: 'p1', seat: 1, folded: false, totalContribution: 100 },
      { id: 'p2', seat: 2, folded: false, totalContribution: 300 },
      { id: 'p3', seat: 3, folded: false, totalContribution: 500 }
    ]);

    expect(pots).toHaveLength(3);
    expect(pots[0]).toMatchObject({ amount: 300, contenders: ['p1', 'p2', 'p3'] });
    expect(pots[1]).toMatchObject({ amount: 400, contenders: ['p2', 'p3'] });
    expect(pots[2]).toMatchObject({ amount: 200, contenders: ['p3'] });
  });

  it('splits showdown pot on tied board correctly', () => {
    const game = createMatch(createDefaultConfig());

    game.players = [
      {
        id: 'hero',
        seat: 1,
        name: 'You',
        isHuman: true,
        style: 'Balanced',
        difficulty: 'Hard',
        stack: 800,
        folded: false,
        allIn: false,
        currentBet: 0,
        totalContribution: 200,
        holeCards: ['2c', '3d']
      },
      {
        id: 'bot-2',
        seat: 2,
        name: 'Bot 1',
        isHuman: false,
        style: 'Balanced',
        difficulty: 'Medium',
        stack: 800,
        folded: false,
        allIn: false,
        currentBet: 0,
        totalContribution: 200,
        holeCards: ['4c', '5d']
      },
      {
        id: 'bot-3',
        seat: 3,
        name: 'Bot 2',
        isHuman: false,
        style: 'Balanced',
        difficulty: 'Medium',
        stack: 1000,
        folded: true,
        allIn: false,
        currentBet: 0,
        totalContribution: 0,
        holeCards: ['Ah', 'Ad']
      }
    ];

    game.communityCards = ['As', 'Kd', 'Qh', 'Jc', 'Tc'];
    game.pot = 400;
    game.stage = 'river';
    game.handComplete = false;
    game.matchComplete = false;
    game.actionLog = [];

    const resolved = resolveShowdownState(game);

    const hero = resolved.players.find((player) => player.id === 'hero');
    const bot = resolved.players.find((player) => player.id === 'bot-2');

    expect(hero.stack).toBe(1000);
    expect(bot.stack).toBe(1000);
    expect(resolved.lastHandResult.pots[0].winners).toEqual(['hero', 'bot-2']);
  });

  it('returns legal actions that prevent invalid check facing a bet', () => {
    const game = createMatch(createDefaultConfig());

    game.handComplete = false;
    game.matchComplete = false;
    game.actionIndex = 0;
    game.currentBet = 40;
    game.minRaise = 20;
    game.players[0].currentBet = 10;
    game.players[0].stack = 150;
    game.players[0].folded = false;
    game.players[0].allIn = false;

    const legal = getLegalActions(game, 0);

    expect(legal.toCall).toBe(30);
    expect(legal.available).toContain('fold');
    expect(legal.available).toContain('call');
    expect(legal.available).toContain('raise');
    expect(legal.available).not.toContain('check');
  });
});
