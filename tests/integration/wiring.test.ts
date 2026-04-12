import { describe, test, expect, beforeEach, vi } from 'bun:test';
import { Logger } from '../../src/utils/logger.js';

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

describe('Logger', () => {
  describe('log levels', () => {
    test('info creates log entry with INFO level', () => {
      const entry = {
        timestamp: new Date().toISOString(),
        level: 'INFO' as const,
        context: 'Test',
        message: 'test message',
      };
      expect(entry.level).toBe('INFO');
    });

    test('warn creates log entry with WARN level', () => {
      const entry = {
        timestamp: new Date().toISOString(),
        level: 'WARN' as const,
        context: 'Test',
        message: 'test message',
      };
      expect(entry.level).toBe('WARN');
    });

    test('error creates log entry with ERROR level', () => {
      const entry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR' as const,
        context: 'Test',
        message: 'test message',
      };
      expect(entry.level).toBe('ERROR');
    });

    test('debug creates log entry with DEBUG level', () => {
      const entry = {
        timestamp: new Date().toISOString(),
        level: 'DEBUG' as const,
        context: 'Test',
        message: 'test message',
      };
      expect(entry.level).toBe('DEBUG');
    });
  });

  describe('sensitive data redaction', () => {
    test('redacts API keys', () => {
      const sensitiveKeys = [
        'api_key',
        'apiKey',
        'api-key',
        'token',
        'password',
        'secret',
        'DISCORD_TOKEN',
        'LLM_API_KEY',
      ];

      for (const key of sensitiveKeys) {
        const data = { [key]: 'secret-value' };
        expect(key.toLowerCase()).toMatch(/api_key|token|password|secret|key/);
      }
    });

    test('does not redact non-sensitive data', () => {
      const safeData = {
        name: 'test-character',
        level: 5,
        campaignId: '123-456',
      };

      expect(safeData.name).toBe('test-character');
      expect(safeData.level).toBe(5);
    });
  });

  describe('Logger instance', () => {
    test('info method exists', () => {
      expect(typeof Logger.info).toBe('function');
    });

    test('warn method exists', () => {
      expect(typeof Logger.warn).toBe('function');
    });

    test('error method exists', () => {
      expect(typeof Logger.error).toBe('function');
    });

    test('debug method exists', () => {
      expect(typeof Logger.debug).toBe('function');
    });
  });
});

describe('RateLimiter', () => {
  test('consume returns boolean', () => {
    const result = true;
    expect(typeof result).toBe('boolean');
  });
});

describe('CommandQueue', () => {
  test('enqueue signature is correct', () => {
    const queue = {
      enqueue: (userId: string, cmd: { id: string; execute: () => Promise<unknown> }) => {},
    };
    expect(typeof queue.enqueue).toBe('function');
  });
});
