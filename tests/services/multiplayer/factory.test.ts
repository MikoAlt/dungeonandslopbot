import { describe, it, expect, beforeEach } from 'bun:test';
import { MultiplayerHandlerFactory } from '../../../src/services/multiplayer/factory.js';
import { SharedSessionHandler } from '../../../src/services/multiplayer/shared-session.js';
import { PersistentWorldHandler } from '../../../src/services/multiplayer/persistent-world.js';
import { AsyncHandler } from '../../../src/services/multiplayer/async.js';

describe('MultiplayerHandlerFactory', () => {
  let factory: MultiplayerHandlerFactory;

  beforeEach(() => {
    factory = new MultiplayerHandlerFactory();
  });

  describe('createHandler', () => {
    it('creates SharedSessionHandler for sharedSession mode', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-1',
        mode: 'sharedSession',
        dmUserId: 'dm-1',
      });

      expect(handler).toBeInstanceOf(SharedSessionHandler);
      expect(handler.getMode()).toBe('sharedSession');
    });

    it('creates PersistentWorldHandler for persistentWorld mode', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-2',
        mode: 'persistentWorld',
        players: ['p1', 'p2'],
      });

      expect(handler).toBeInstanceOf(PersistentWorldHandler);
      expect(handler.getMode()).toBe('persistentWorld');
    });

    it('creates AsyncHandler for async mode', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-3',
        mode: 'async',
        players: ['p1', 'p2'],
      });

      expect(handler).toBeInstanceOf(AsyncHandler);
      expect(handler.getMode()).toBe('async');
    });

    it('throws when sharedSession created without dmUserId', () => {
      expect(() =>
        factory.createHandler({
          campaignId: 'camp-1',
          mode: 'sharedSession',
          players: ['p1'],
        }),
      ).toThrow('dmUserId required for sharedSession mode');
    });

    it('returns same handler for same campaignId and mode', () => {
      const handler1 = factory.createHandler({
        campaignId: 'camp-same',
        mode: 'persistentWorld',
        players: ['p1'],
      });

      const handler2 = factory.createHandler({
        campaignId: 'camp-same',
        mode: 'persistentWorld',
        players: ['p1', 'p2'],
      });

      expect(handler1).toBe(handler2);
    });
  });

  describe('switchMode', () => {
    it('switches from sharedSession to persistentWorld', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-switch',
        mode: 'sharedSession',
        dmUserId: 'dm-1',
      });

      const newHandler = factory.switchMode('camp-switch', 'persistentWorld');

      expect(newHandler).not.toBe(handler);
      expect(newHandler.getMode()).toBe('persistentWorld');
    });

    it('switches from sharedSession to async', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-switch2',
        mode: 'sharedSession',
        dmUserId: 'dm-1',
      });

      const newHandler = factory.switchMode('camp-switch2', 'async');

      expect(newHandler.getMode()).toBe('async');
    });

    it('switches from persistentWorld to sharedSession', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-switch3',
        mode: 'persistentWorld',
        players: ['p1'],
      });

      const newHandler = factory.switchMode('camp-switch3', 'sharedSession');

      expect(newHandler.getMode()).toBe('sharedSession');
    });

    it('switches from persistentWorld to async', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-switch4',
        mode: 'persistentWorld',
        players: ['p1'],
      });

      const newHandler = factory.switchMode('camp-switch4', 'async');

      expect(newHandler.getMode()).toBe('async');
    });

    it('switches from async to sharedSession', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-switch5',
        mode: 'async',
        players: ['p1'],
      });

      const newHandler = factory.switchMode('camp-switch5', 'sharedSession');

      expect(newHandler.getMode()).toBe('sharedSession');
    });

    it('switches from async to persistentWorld', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-switch6',
        mode: 'async',
        players: ['p1'],
      });

      const newHandler = factory.switchMode('camp-switch6', 'persistentWorld');

      expect(newHandler.getMode()).toBe('persistentWorld');
    });

    it('throws when no handler exists for campaign', () => {
      expect(() => factory.switchMode('nonexistent', 'async')).toThrow(
        'No handler found for campaign nonexistent',
      );
    });

    it('returns same handler when switching to same mode', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-same-mode',
        mode: 'persistentWorld',
        players: ['p1'],
      });

      const newHandler = factory.switchMode('camp-same-mode', 'persistentWorld');

      expect(handler).toBe(newHandler);
    });
  });

  describe('getHandler', () => {
    it('returns handler for existing campaign', () => {
      const handler = factory.createHandler({
        campaignId: 'camp-get',
        mode: 'persistentWorld',
        players: ['p1'],
      });

      const retrieved = factory.getHandler('camp-get');

      expect(retrieved).toBe(handler);
    });

    it('returns undefined for non-existent campaign', () => {
      expect(factory.getHandler('nonexistent')).toBeUndefined();
    });
  });

  describe('removeHandler', () => {
    it('removes handler for campaign', () => {
      factory.createHandler({
        campaignId: 'camp-remove',
        mode: 'persistentWorld',
        players: ['p1'],
      });

      factory.removeHandler('camp-remove');

      expect(factory.getHandler('camp-remove')).toBeUndefined();
    });

    it('does nothing when removing non-existent handler', () => {
      expect(() => factory.removeHandler('nonexistent')).not.toThrow();
    });
  });
});
