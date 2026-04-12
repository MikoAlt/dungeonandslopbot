import { describe, test, expect, beforeEach, afterEach, vi } from 'bun:test';
import { CommandQueue, type Command } from '../../src/services/queue.js';

function createCommand(id: string, shouldReject = false): Command {
  return {
    id,
    execute: shouldReject
      ? async () => {
          throw new Error(`Command ${id} failed`);
        }
      : async () => {
          return { id };
        },
  };
}

describe('CommandQueue', () => {
  let queue: CommandQueue;

  beforeEach(() => {
    queue = new CommandQueue();
  });

  afterEach(() => {
    queue.clear('user1');
    queue.clear('user2');
  });

  describe('enqueue/dequeue', () => {
    test('adds command to user queue', () => {
      queue.enqueue('user1', createCommand('cmd1'));
      expect(queue.size('user1')).toBe(1);
    });

    test('returns undefined for empty queue', () => {
      expect(queue.dequeue('user1')).toBeUndefined();
    });

    test('dequeues in FIFO order', async () => {
      queue.enqueue('user1', createCommand('cmd1'));
      queue.enqueue('user1', createCommand('cmd2'));
      queue.enqueue('user1', createCommand('cmd3'));

      const cmd1 = queue.dequeue('user1');
      const cmd2 = queue.dequeue('user1');
      const cmd3 = queue.dequeue('user1');

      expect(cmd1?.id).toBe('cmd1');
      expect(cmd2?.id).toBe('cmd2');
      expect(cmd3?.id).toBe('cmd3');
    });
  });

  describe('peek', () => {
    test('returns next command without removing', () => {
      queue.enqueue('user1', createCommand('cmd1'));
      queue.enqueue('user1', createCommand('cmd2'));

      const peeked = queue.peek('user1');
      expect(peeked?.id).toBe('cmd1');
      expect(queue.size('user1')).toBe(2);
    });

    test('returns undefined for empty queue', () => {
      expect(queue.peek('user1')).toBeUndefined();
    });
  });

  describe('size', () => {
    test('returns 0 for new user', () => {
      expect(queue.size('user1')).toBe(0);
    });

    test('returns correct count', () => {
      queue.enqueue('user1', createCommand('cmd1'));
      queue.enqueue('user1', createCommand('cmd2'));
      expect(queue.size('user1')).toBe(2);
    });
  });

  describe('clear', () => {
    test('removes all commands for user', () => {
      queue.enqueue('user1', createCommand('cmd1'));
      queue.enqueue('user1', createCommand('cmd2'));
      queue.clear('user1');
      expect(queue.size('user1')).toBe(0);
    });
  });

  describe('processQueue', () => {
    test('processes commands sequentially', async () => {
      const order: string[] = [];

      const cmd1: Command = {
        id: 'cmd1',
        execute: async () => {
          order.push('cmd1');
        },
      };
      const cmd2: Command = {
        id: 'cmd2',
        execute: async () => {
          order.push('cmd2');
        },
      };

      queue.enqueue('user1', cmd1);
      queue.enqueue('user1', cmd2);

      await queue.processQueue('user1');

      expect(order).toEqual(['cmd1', 'cmd2']);
    });

    test('continues to next command when one fails', async () => {
      const order: string[] = [];

      const cmd1: Command = {
        id: 'cmd1',
        execute: async () => {
          throw new Error('cmd1 failed');
        },
      };
      const cmd2: Command = {
        id: 'cmd2',
        execute: async () => {
          order.push('cmd2');
        },
      };

      queue.enqueue('user1', cmd1);
      queue.enqueue('user1', cmd2);

      await queue.processQueue('user1');

      expect(order).toEqual(['cmd2']);
    });

    test('processes different users concurrently', async () => {
      const user1Done = new Promise<void>((resolve) => {
        queue.on('complete', (userId) => {
          if (userId === 'user1') resolve();
        });
      });
      const user2Done = new Promise<void>((resolve) => {
        queue.on('complete', (userId) => {
          if (userId === 'user2') resolve();
        });
      });

      queue.enqueue('user1', createCommand('cmd1'));
      queue.enqueue('user2', createCommand('cmd2'));

      const [result1, result2] = await Promise.all([
        queue.processQueue('user1'),
        queue.processQueue('user2'),
      ]);

      await Promise.all([user1Done, user2Done]);
    });
  });

  describe('events', () => {
    test('emits start event', async () => {
      const startEvents: string[] = [];
      queue.on('start', (userId) => {
        startEvents.push(userId);
      });

      queue.enqueue('user1', createCommand('cmd1'));

      await queue.processQueue('user1');

      expect(startEvents).toEqual(['user1']);
    });

    test('emits complete event', async () => {
      const completeEvents: Array<{ userId: string; data?: unknown }> = [];
      queue.on('complete', (userId, data) => {
        completeEvents.push({ userId, data });
      });

      queue.enqueue('user1', createCommand('cmd1'));

      await queue.processQueue('user1');

      expect(completeEvents.length).toBe(1);
      expect(completeEvents[0].userId).toBe('user1');
    });

    test('emits error event on command failure', async () => {
      const errorEvents: Array<{ userId: string; data?: unknown }> = [];
      queue.on('error', (userId, data) => {
        errorEvents.push({ userId, data });
      });

      queue.enqueue('user1', createCommand('cmd1', true));

      await queue.processQueue('user1');

      expect(errorEvents.length).toBe(1);
      expect(errorEvents[0].userId).toBe('user1');
    });
  });
});
