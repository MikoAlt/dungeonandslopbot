import { describe, expect, test, beforeEach, vi } from 'bun:test';
import { MessageRepository } from '../../../src/db/repositories/message.js';
import { PrismaClient } from '../../../src/generated/prisma/client.js';

vi.mock('../../../src/generated/prisma/client.js', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    message: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  })),
}));

describe('MessageRepository', () => {
  let prisma: PrismaClient;
  let repo: MessageRepository;

  const mockMessage = {
    id: 'msg1',
    campaignId: 'camp1',
    userId: 'user1',
    role: 'user' as const,
    content: 'Hello world',
    tokenCount: 5,
    metadata: {},
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    repo = new MessageRepository(prisma);
  });

  test('findById returns message by id', async () => {
    (prisma.message.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockMessage);

    const result = await repo.findById('msg1');

    expect(result).toEqual(mockMessage);
    expect(prisma.message.findUnique).toHaveBeenCalledWith({ where: { id: 'msg1' } });
  });

  test('findByCampaignId returns messages for a campaign', async () => {
    const messages = [mockMessage];
    (prisma.message.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(messages);

    const result = await repo.findByCampaignId('camp1', 50, 0);

    expect(result).toEqual(messages);
    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { campaignId: 'camp1' },
      orderBy: { createdAt: 'asc' },
      take: 50,
      skip: 0,
    });
  });

  test('findByCampaignId works without pagination', async () => {
    const messages = [mockMessage];
    (prisma.message.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(messages);

    const result = await repo.findByCampaignId('camp1');

    expect(result).toEqual(messages);
    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { campaignId: 'camp1' },
      orderBy: { createdAt: 'asc' },
      take: undefined,
      skip: undefined,
    });
  });

  test('createMessage stores a message', async () => {
    (prisma.message.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockMessage);

    const result = await repo.createMessage('camp1', 'user1', 'user', 'Hello world', 5);

    expect(result).toEqual(mockMessage);
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp1',
        userId: 'user1',
        role: 'user',
        content: 'Hello world',
        tokenCount: 5,
      },
    });
  });

  test('createMessage works with null userId', async () => {
    const systemMessage = { ...mockMessage, userId: null, role: 'system' as const };
    (prisma.message.create as ReturnType<typeof vi.fn>).mockResolvedValue(systemMessage);

    const result = await repo.createMessage('camp1', null, 'system', 'System message', 3);

    expect(result).toEqual(systemMessage);
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp1',
        userId: null,
        role: 'system',
        content: 'System message',
        tokenCount: 3,
      },
    });
  });

  test('deleteOldMessages prunes messages before a date', async () => {
    (prisma.message.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 5 });

    const beforeDate = new Date('2024-01-01');
    const result = await repo.deleteOldMessages('camp1', beforeDate);

    expect(result).toBe(5);
    expect(prisma.message.deleteMany).toHaveBeenCalledWith({
      where: {
        campaignId: 'camp1',
        createdAt: { lt: beforeDate },
      },
    });
  });
});
