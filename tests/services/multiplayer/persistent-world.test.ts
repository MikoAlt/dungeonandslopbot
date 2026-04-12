import { describe, it, expect } from 'bun:test';
import { PersistentWorldHandler } from '../../../src/services/multiplayer/persistent-world.js';

describe('PersistentWorldHandler', () => {
  describe('getMode', () => {
    it('returns persistentWorld mode', () => {
      const handler = new PersistentWorldHandler({ campaignId: 'camp-1', players: [] });
      expect(handler.getMode()).toBe('persistentWorld');
    });
  });

  describe('getActivePlayers', () => {
    it('returns all players in the campaign', () => {
      const handler = new PersistentWorldHandler({
        campaignId: 'camp-1',
        players: ['player-1', 'player-2'],
      });

      expect(handler.getActivePlayers()).toEqual(['player-1', 'player-2']);
    });

    it('returns empty array when no players', () => {
      const handler = new PersistentWorldHandler({ campaignId: 'camp-1', players: [] });
      expect(handler.getActivePlayers()).toEqual([]);
    });
  });

  describe('isPlayerActive', () => {
    it('returns true for players in campaign', () => {
      const handler = new PersistentWorldHandler({
        campaignId: 'camp-1',
        players: ['player-1', 'player-2'],
      });

      expect(handler.isPlayerActive('player-1')).toBe(true);
      expect(handler.isPlayerActive('player-2')).toBe(true);
    });

    it('returns false for players not in campaign', () => {
      const handler = new PersistentWorldHandler({
        campaignId: 'camp-1',
        players: ['player-1'],
      });

      expect(handler.isPlayerActive('player-2')).toBe(false);
      expect(handler.isPlayerActive('unknown')).toBe(false);
    });
  });

  describe('addPlayer', () => {
    it('adds a player to the campaign', () => {
      const handler = new PersistentWorldHandler({ campaignId: 'camp-1', players: [] });

      handler.addPlayer('player-1');

      expect(handler.isPlayerActive('player-1')).toBe(true);
      expect(handler.getActivePlayers()).toContain('player-1');
    });

    it('allows adding multiple players', () => {
      const handler = new PersistentWorldHandler({ campaignId: 'camp-1', players: [] });

      handler.addPlayer('player-1');
      handler.addPlayer('player-2');

      expect(handler.getActivePlayers()).toHaveLength(2);
    });
  });

  describe('removePlayer', () => {
    it('removes a player from the campaign', () => {
      const handler = new PersistentWorldHandler({
        campaignId: 'camp-1',
        players: ['player-1', 'player-2'],
      });

      handler.removePlayer('player-1');

      expect(handler.isPlayerActive('player-1')).toBe(false);
      expect(handler.getActivePlayers()).not.toContain('player-1');
    });

    it('does nothing when removing non-existent player', () => {
      const handler = new PersistentWorldHandler({
        campaignId: 'camp-1',
        players: ['player-1'],
      });

      expect(() => handler.removePlayer('unknown')).not.toThrow();
      expect(handler.getActivePlayers()).toHaveLength(1);
    });
  });

  describe('updatePlayers', () => {
    it('replaces all players', () => {
      const handler = new PersistentWorldHandler({
        campaignId: 'camp-1',
        players: ['old-1', 'old-2'],
      });

      handler.updatePlayers(['new-1', 'new-2', 'new-3']);

      expect(handler.getActivePlayers()).toEqual(['new-1', 'new-2', 'new-3']);
    });

    it('can clear all players', () => {
      const handler = new PersistentWorldHandler({
        campaignId: 'camp-1',
        players: ['player-1'],
      });

      handler.updatePlayers([]);

      expect(handler.getActivePlayers()).toEqual([]);
    });
  });
});
