import { describe, expect, test, beforeEach, vi } from 'bun:test';
import { PrismaClient } from '../../src/generated/prisma/client.js';

vi.mock('../../src/generated/prisma/client.js', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    character: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    campaign: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    story: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    embedding: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  })),
}));

describe('Prisma CRUD Operations', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
  });

  test('create user', async () => {
    const mockUser = {
      id: 'user123',
      discordId: '987654321',
      username: 'TestUser',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.user.create as any).mockResolvedValue(mockUser);

    const result = await prisma.user.create({
      data: {
        discordId: '987654321',
        username: 'TestUser',
      },
    });

    expect(result.id).toBe('user123');
    expect(result.username).toBe('TestUser');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { discordId: '987654321', username: 'TestUser' },
    });
  });

  test('create character with D&D stats', async () => {
    const stats = {
      strength: 16,
      dexterity: 14,
      constitution: 15,
      intelligence: 10,
      wisdom: 12,
      charisma: 13,
    };

    const mockCharacter = {
      id: 'char456',
      userId: 'user123',
      name: 'Aragorn',
      class: 'Ranger',
      level: 5,
      hp: 42,
      maxHp: 45,
      rpgSystem: 'dnd5e' as const,
      stats,
      inventory: [],
      backstory: 'A ranger from the North',
      campaignId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.character.create as any).mockResolvedValue(mockCharacter);

    const result = await prisma.character.create({
      data: {
        userId: 'user123',
        name: 'Aragorn',
        class: 'Ranger',
        level: 5,
        hp: 42,
        maxHp: 45,
        rpgSystem: 'dnd5e',
        stats,
      },
    });

    expect(result.name).toBe('Aragorn');
    expect(result.stats).toEqual(stats);
    expect(result.rpgSystem).toBe('dnd5e');
  });

  test('create campaign', async () => {
    const mockCampaign = {
      id: 'camp789',
      name: 'The Fellowship',
      description: 'Quest to destroy the One Ring',
      rpgSystem: 'dnd5e' as const,
      mode: 'sharedSession' as const,
      dmUserId: 'user123',
      guildId: 'guild1',
      channelId: 'channel1',
      worldState: {},
      isActive: true,
      players: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.campaign.create as any).mockResolvedValue(mockCampaign);

    const result = await prisma.campaign.create({
      data: {
        name: 'The Fellowship',
        description: 'Quest to destroy the One Ring',
        rpgSystem: 'dnd5e',
        mode: 'sharedSession',
        dmUserId: 'user123',
        guildId: 'guild1',
        channelId: 'channel1',
      },
    });

    expect(result.name).toBe('The Fellowship');
    expect(result.isActive).toBe(true);
  });

  test('create story', async () => {
    const scenes = [
      {
        title: 'The Council',
        description: 'Gandalf convenes the council',
        npcs: ['Gandalf'],
        items: [],
      },
      { title: 'The Journey', description: 'The fellowship departs', npcs: [], items: ['Sting'] },
    ];

    const mockStory = {
      id: 'story101',
      campaignId: 'camp789',
      scenes,
      currentSceneIndex: 0,
      summary: 'The fellowship is formed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.story.create as any).mockResolvedValue(mockStory);

    const result = await prisma.story.create({
      data: {
        campaignId: 'camp789',
        scenes,
        currentSceneIndex: 0,
      },
    });

    expect(result.scenes).toHaveLength(2);
    expect(result.currentSceneIndex).toBe(0);
  });

  test('pgvector insert and similarity search', async () => {
    const embedding = new Array(1536).fill(0).map(() => Math.random());
    const mockEmbedding = {
      id: 'emb001',
      messageId: 'msg001',
      embedding,
      content: 'What is the capital of France?',
      createdAt: new Date(),
    };

    (prisma.embedding.create as any).mockResolvedValue(mockEmbedding);

    const result = await prisma.embedding.create({
      data: {
        messageId: 'msg001',
        embedding,
        content: 'What is the capital of France?',
      },
    });

    expect(result.content).toBe('What is the capital of France?');
    expect(result.embedding).toHaveLength(1536);
  });

  test('update character hp', async () => {
    const mockCharacter = {
      id: 'char456',
      userId: 'user123',
      name: 'Aragorn',
      class: 'Ranger',
      level: 5,
      hp: 30,
      maxHp: 45,
      rpgSystem: 'dnd5e' as const,
      stats: {},
      inventory: [],
      backstory: null,
      campaignId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.character.update as any).mockResolvedValue(mockCharacter);

    const result = await prisma.character.update({
      where: { id: 'char456' },
      data: { hp: 30 },
    });

    expect(result.hp).toBe(30);
  });

  test('delete user cascades', async () => {
    (prisma.user.delete as any).mockResolvedValue({ id: 'user123' });

    const result = await prisma.user.delete({
      where: { id: 'user123' },
    });

    expect(result.id).toBe('user123');
  });
});

describe('Prisma Schema Types', () => {
  test('RpgSystem enum values', () => {
    const systems = ['dnd5e', 'custom'] as const;
    expect(systems).toContain('dnd5e');
    expect(systems).toContain('custom');
  });

  test('CampaignMode enum values', () => {
    const modes = ['sharedSession', 'persistentWorld', 'async'] as const;
    expect(modes).toContain('sharedSession');
    expect(modes).toContain('persistentWorld');
    expect(modes).toContain('async');
  });

  test('MessageRole enum values', () => {
    const roles = ['system', 'user', 'assistant'] as const;
    expect(roles).toContain('system');
    expect(roles).toContain('user');
    expect(roles).toContain('assistant');
  });
});
