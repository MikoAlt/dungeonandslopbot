import { describe, it, expect, beforeEach } from 'bun:test';
import { SharedSessionHandler } from '../../../src/services/multiplayer/shared-session.js';

describe('SharedSessionHandler', () => {
  let handler: SharedSessionHandler;

  beforeEach(() => {
    handler = new SharedSessionHandler({ campaignId: 'camp-1', dmUserId: 'dm-1' });
  });

  describe('getMode', () => {
    it('returns sharedSession mode', () => {
      expect(handler.getMode()).toBe('sharedSession');
    });
  });

  describe('getActivePlayers / isPlayerActive before session start', () => {
    it('returns empty array before session starts', () => {
      expect(handler.getActivePlayers()).toEqual([]);
    });

    it('returns false for isPlayerActive before session starts', () => {
      expect(handler.isPlayerActive('player-1')).toBe(false);
    });
  });

  describe('startSession', () => {
    it('initializes turn order with players', () => {
      const state = handler.startSession('dm-1', ['player-1', 'player-2', 'player-3']);

      expect(state.currentTurn).toBe(1);
      expect(state.turnOrder).toEqual(['player-1', 'player-2', 'player-3']);
      expect(state.currentPlayer).toBe('player-1');
    });

    it('throws when starting with no players', () => {
      expect(() => handler.startSession('dm-1', [])).toThrow(
        'Cannot start session with no players',
      );
    });

    it('updates getActivePlayers after start', () => {
      handler.startSession('dm-1', ['player-1', 'player-2']);

      expect(handler.getActivePlayers()).toEqual(['player-1', 'player-2']);
    });

    it('updates isPlayerActive after start', () => {
      handler.startSession('dm-1', ['player-1', 'player-2']);

      expect(handler.isPlayerActive('player-1')).toBe(true);
      expect(handler.isPlayerActive('player-2')).toBe(true);
      expect(handler.isPlayerActive('player-3')).toBe(false);
    });
  });

  describe('submitAction', () => {
    it('submits action for current player', () => {
      handler.startSession('dm-1', ['player-1', 'player-2']);

      handler.submitAction('player-1', 'Attack the goblin');

      const pending = handler.getPendingActions(1);
      expect(pending).toHaveLength(1);
      expect(pending[0]!.userId).toBe('player-1');
      expect(pending[0]!.action).toBe('Attack the goblin');
    });

    it('throws when session not started', () => {
      expect(() => handler.submitAction('player-1', 'Some action')).toThrow('Session not started');
    });

    it('throws when not current player tries to act', () => {
      handler.startSession('dm-1', ['player-1', 'player-2']);

      expect(() => handler.submitAction('player-2', 'Not my turn')).toThrow("Not player-2's turn");
    });
  });

  describe('advanceTurn', () => {
    it('advances to next player in turn order', () => {
      handler.startSession('dm-1', ['player-1', 'player-2']);

      const state = handler.advanceTurn();

      expect(state.currentTurn).toBe(1);
      expect(state.currentPlayer).toBe('player-2');
    });

    it('wraps around to first player after last', () => {
      handler.startSession('dm-1', ['player-1', 'player-2']);

      handler.advanceTurn();
      const state = handler.advanceTurn();

      expect(state.currentPlayer).toBe('player-1');
    });

    it('increments turn number when wrapping', () => {
      handler.startSession('dm-1', ['player-1', 'player-2']);

      handler.advanceTurn();
      const state = handler.advanceTurn();

      expect(state.currentTurn).toBe(2);
    });

    it('clears pending actions for the round when turn wraps', () => {
      handler.startSession('dm-1', ['player-1', 'player-2']);

      handler.submitAction('player-1', 'Action 1');
      handler.advanceTurn();
      handler.submitAction('player-2', 'Action 2');
      handler.advanceTurn();

      const pendingTurn1 = handler.getPendingActions(1);
      const pendingTurn2 = handler.getPendingActions(2);

      expect(pendingTurn1).toHaveLength(0);
      expect(pendingTurn2).toHaveLength(0);
    });
  });

  describe('getCurrentTurn', () => {
    it('returns current turn state', () => {
      handler.startSession('dm-1', ['player-1', 'player-2', 'player-3']);

      const state = handler.getCurrentTurn();

      expect(state.currentTurn).toBe(1);
      expect(state.currentPlayer).toBe('player-1');
      expect(state.turnOrder).toEqual(['player-1', 'player-2', 'player-3']);
    });

    it('throws when session not started', () => {
      expect(() => handler.getCurrentTurn()).toThrow('Session not started');
    });

    it('returns a copy, not the original', () => {
      handler.startSession('dm-1', ['player-1', 'player-2']);

      const state = handler.getCurrentTurn();
      state.currentTurn = 999;

      const current = handler.getCurrentTurn();
      expect(current.currentTurn).toBe(1);
    });
  });

  describe('multi-turn progression', () => {
    it('handles full turn cycle', () => {
      handler.startSession('dm-1', ['p1', 'p2', 'p3']);

      expect(handler.getCurrentTurn().currentPlayer).toBe('p1');

      handler.submitAction('p1', 'p1 action');
      handler.advanceTurn();
      expect(handler.getCurrentTurn().currentPlayer).toBe('p2');

      handler.submitAction('p2', 'p2 action');
      handler.advanceTurn();
      expect(handler.getCurrentTurn().currentPlayer).toBe('p3');

      handler.submitAction('p3', 'p3 action');
      handler.advanceTurn();
      expect(handler.getCurrentTurn().currentPlayer).toBe('p1');
      expect(handler.getCurrentTurn().currentTurn).toBe(2);
    });
  });
});
