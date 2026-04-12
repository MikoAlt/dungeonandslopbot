import { describe, test, expect, beforeEach, vi } from 'bun:test';
import { Events, MessageFlags } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

vi.mock('../../src/db/prisma.js', () => ({
  prisma: {
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/generated/prisma/client.js', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    character: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    campaign: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    story: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    message: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createMany: vi.fn(),
    },
    embedding: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('Bot Integration', () => {
  describe('createInteractionHandler', () => {
    test('handler has correct event name', async () => {
      const { createInteractionHandler } = await import('../../src/events/interactionCreate.js');

      const mockRateLimiter = {
        consume: vi.fn().mockReturnValue(true),
      };

      const mockQueue = {
        enqueue: vi.fn(),
      };

      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const mockCommands = new Map();

      const mockContainer = {};

      const handler = createInteractionHandler(
        mockCommands,
        mockContainer as any,
        mockRateLimiter,
        mockQueue,
        mockLogger,
      );

      expect(handler.name).toBe(Events.InteractionCreate);
    });

    test('rate limited interaction is rejected', async () => {
      const { createInteractionHandler } = await import('../../src/events/interactionCreate.js');

      const mockRateLimiter = {
        consume: vi.fn().mockReturnValue(false),
      };

      const mockQueue = {
        enqueue: vi.fn(),
      };

      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const mockReply = vi.fn().mockResolvedValue(undefined);
      const mockInteraction = {
        isChatInputCommand: () => true,
        commandName: 'ping',
        user: { id: 'user123' },
        reply: mockReply,
        replied: false,
        deferred: false,
      } as unknown as ChatInputCommandInteraction;

      const mockCommands = new Map([['ping', { data: { name: 'ping' }, execute: vi.fn() }]]);

      const mockContainer = {};

      const handler = createInteractionHandler(
        mockCommands,
        mockContainer as any,
        mockRateLimiter,
        mockQueue,
        mockLogger,
      );

      await handler.execute(mockInteraction);

      expect(mockRateLimiter.consume).toHaveBeenCalledWith('user123', expect.any(String));
      expect(mockReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('rate limited'),
          flags: MessageFlags.Ephemeral,
        }),
      );
    });

    test('allowed interaction is enqueued', async () => {
      const { createInteractionHandler } = await import('../../src/events/interactionCreate.js');

      const mockRateLimiter = {
        consume: vi.fn().mockReturnValue(true),
      };

      const mockQueue = {
        enqueue: vi.fn(),
      };

      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const mockExecute = vi.fn().mockResolvedValue(undefined);
      const mockInteraction = {
        isChatInputCommand: () => true,
        commandName: 'ping',
        user: { id: 'user123' },
        replied: false,
        deferred: false,
      } as unknown as ChatInputCommandInteraction;

      const mockCommands = new Map([['ping', { data: { name: 'ping' }, execute: mockExecute }]]);

      const mockContainer = {};

      const handler = createInteractionHandler(
        mockCommands,
        mockContainer as any,
        mockRateLimiter,
        mockQueue,
        mockLogger,
      );

      await handler.execute(mockInteraction);

      expect(mockQueue.enqueue).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          id: expect.stringContaining('ping'),
          execute: expect.any(Function),
        }),
      );
    });
  });

  describe('createReadyHandler', () => {
    test('handler logs bot login', async () => {
      const { createReadyHandler } = await import('../../src/events/ready.js');

      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const mockSetCommands = vi.fn().mockResolvedValue([]);
      const mockClient = {
        user: { tag: 'TestBot#1234' },
        application: { commands: { set: mockSetCommands } },
      };

      const commands = new Map();
      const handler = createReadyHandler(commands, mockLogger);

      await handler.execute(mockClient);

      expect(mockLogger.info).toHaveBeenCalledWith('Bot', expect.stringContaining('TestBot#1234'));
    });

    test('handler registers slash commands', async () => {
      const { createReadyHandler } = await import('../../src/events/ready.js');

      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const mockSetCommands = vi.fn().mockResolvedValue([]);
      const mockClient = {
        user: { tag: 'TestBot#1234' },
        application: { commands: { set: mockSetCommands } },
      };

      const commands = new Map([
        ['ping', { data: { name: 'ping' } }],
        ['dice', { data: { name: 'dice' } }],
      ]);

      const handler = createReadyHandler(commands, mockLogger);

      await handler.execute(mockClient);

      expect(mockLogger.info).toHaveBeenCalledWith('Bot', expect.stringContaining('2'));
      expect(mockSetCommands).toHaveBeenCalled();
    });
  });

  describe('Graceful Shutdown', () => {
    test('shutdown handler cleans up resources', async () => {
      const { createShutdownHandler } = await import('../../src/events/error.js');

      const mockPrismaDisconnect = vi.fn().mockResolvedValue(undefined);
      const mockDestroy = vi.fn();
      const mockClient = {
        isReady: () => true,
        destroy: mockDestroy,
      };

      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const container = {
        prisma: { $disconnect: mockPrismaDisconnect },
      };

      const shutdownHandler = createShutdownHandler(mockClient, container, mockLogger);

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as () => never);

      await shutdownHandler();

      expect(mockDestroy).toHaveBeenCalled();
      expect(mockPrismaDisconnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Process', expect.stringContaining('complete'));

      exitSpy.mockRestore();
    });
  });
});
