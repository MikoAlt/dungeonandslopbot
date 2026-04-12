import { describe, it, expect } from 'bun:test';
import { AsyncHandler } from '../../../src/services/multiplayer/async.js';

describe('AsyncHandler', () => {
  describe('getMode', () => {
    it('returns async mode', () => {
      const handler = new AsyncHandler(['player-1']);
      expect(handler.getMode()).toBe('async');
    });
  });

  describe('getActivePlayers', () => {
    it('returns players from constructor', () => {
      const handler = new AsyncHandler(['player-1', 'player-2']);
      expect(handler.getActivePlayers()).toEqual(['player-1', 'player-2']);
    });

    it('returns empty array with no players', () => {
      const handler = new AsyncHandler();
      expect(handler.getActivePlayers()).toEqual([]);
    });
  });

  describe('isPlayerActive', () => {
    it('returns true for players in session', () => {
      const handler = new AsyncHandler(['player-1', 'player-2']);
      expect(handler.isPlayerActive('player-1')).toBe(true);
      expect(handler.isPlayerActive('player-2')).toBe(true);
    });

    it('returns false for players not in session', () => {
      const handler = new AsyncHandler(['player-1']);
      expect(handler.isPlayerActive('player-2')).toBe(false);
    });
  });

  describe('addPlayer', () => {
    it('adds a player to the session', () => {
      const handler = new AsyncHandler(['player-1']);
      handler.addPlayer('player-2');

      expect(handler.isPlayerActive('player-2')).toBe(true);
    });
  });

  describe('removePlayer', () => {
    it('removes a player from the session', () => {
      const handler = new AsyncHandler(['player-1', 'player-2']);
      handler.removePlayer('player-1');

      expect(handler.isPlayerActive('player-1')).toBe(false);
    });
  });

  describe('queueAction', () => {
    it('queues an action for a player', () => {
      const handler = new AsyncHandler(['player-1']);
      const action = handler.queueAction('player-1', 'Attack the dragon');

      expect(action.id).toBeDefined();
      expect(action.userId).toBe('player-1');
      expect(action.action).toBe('Attack the dragon');
      expect(action.timestamp).toBeInstanceOf(Date);
    });

    it('throws when non-player tries to queue action', () => {
      const handler = new AsyncHandler(['player-1']);

      expect(() => handler.queueAction('unknown', 'Some action')).toThrow(
        'User unknown is not a player in this async session',
      );
    });

    it('adds to the queue', () => {
      const handler = new AsyncHandler(['player-1']);
      handler.queueAction('player-1', 'Action 1');
      handler.queueAction('player-1', 'Action 2');

      const queued = handler.getQueuedActions();
      expect(queued).toHaveLength(2);
    });
  });

  describe('getQueuedActions', () => {
    it('returns all queued actions', () => {
      const handler = new AsyncHandler(['player-1', 'player-2']);
      handler.queueAction('player-1', 'First action');
      handler.queueAction('player-2', 'Second action');

      const queued = handler.getQueuedActions();

      expect(queued).toHaveLength(2);
      expect(queued[0]!.action).toBe('First action');
      expect(queued[1]!.action).toBe('Second action');
    });

    it('returns empty array when queue is empty', () => {
      const handler = new AsyncHandler(['player-1']);
      expect(handler.getQueuedActions()).toEqual([]);
    });

    it('returns a copy of the queue', () => {
      const handler = new AsyncHandler(['player-1']);
      handler.queueAction('player-1', 'Action');

      const queued = handler.getQueuedActions();
      queued.push({ id: 'fake', userId: 'hacker', action: 'hacked', timestamp: new Date() });

      expect(handler.getQueuedActions()).toHaveLength(1);
    });
  });

  describe('resolveActions', () => {
    it('resolves all queued actions', () => {
      const handler = new AsyncHandler(['player-1', 'player-2']);
      handler.queueAction('player-1', 'Action 1');
      handler.queueAction('player-2', 'Action 2');

      const result = handler.resolveActions();

      expect(result.actions).toHaveLength(2);
      expect(result.summary).toBe('Resolved 2 action(s)');
    });

    it('does not clear the queue (caller should call clearQueue)', () => {
      const handler = new AsyncHandler(['player-1']);
      handler.queueAction('player-1', 'Action');

      handler.resolveActions();

      expect(handler.getQueuedActions()).toHaveLength(1);
    });

    it('returns empty result when queue is empty', () => {
      const handler = new AsyncHandler(['player-1']);
      const result = handler.resolveActions();

      expect(result.actions).toHaveLength(0);
      expect(result.summary).toBe('Resolved 0 action(s)');
    });
  });

  describe('clearQueue', () => {
    it('clears all queued actions', () => {
      const handler = new AsyncHandler(['player-1']);
      handler.queueAction('player-1', 'Action');

      handler.clearQueue();

      expect(handler.getQueuedActions()).toHaveLength(0);
    });

    it('works on empty queue without error', () => {
      const handler = new AsyncHandler(['player-1']);
      expect(() => handler.clearQueue()).not.toThrow();
    });
  });

  describe('full workflow', () => {
    it('handles queue, resolve, clear cycle', () => {
      const handler = new AsyncHandler(['player-1', 'player-2', 'player-3']);

      handler.queueAction('player-1', 'Cast fireball');
      handler.queueAction('player-2', 'Move to cover');
      handler.queueAction('player-3', 'Attack');

      expect(handler.getQueuedActions()).toHaveLength(3);

      const result = handler.resolveActions();
      expect(result.actions).toHaveLength(3);

      handler.clearQueue();
      expect(handler.getQueuedActions()).toHaveLength(0);
    });
  });
});
