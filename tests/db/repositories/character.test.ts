import { describe, expect, test, beforeEach, vi } from 'bun:test';
import { CharacterRepository } from '../../../src/db/repositories/character.js';
import { PrismaClient } from '../../../src/generated/prisma/client.js';

vi.mock('../../../src/generated/prisma/client.js', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    character: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  })),
}));

describe('CharacterRepository', () => {
  let prisma: PrismaClient;
  let repo: CharacterRepository;

  const mockCharacter = {
    id: 'char1',
    userId: 'user1',
    name: 'Aragorn',
    class: 'Ranger',
    level: 5,
    hp: 42,
    maxHp: 45,
    rpgSystem: 'dnd5e' as const,
    stats: {
      str: 16,
      dex: 14,
      con: 15,
      int: 10,
      wis: 12,
      cha: 13,
      ac: 16,
      speed: 30,
      hitDice: '1d10',
    },
    inventory: [],
    backstory: 'A ranger from the North',
    campaignId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    repo = new CharacterRepository(prisma);
  });

  test('findById returns character by id', async () => {
    (prisma.character.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockCharacter);

    const result = await repo.findById('char1');

    expect(result).toEqual(mockCharacter);
    expect(prisma.character.findUnique).toHaveBeenCalledWith({ where: { id: 'char1' } });
  });

  test('findByUserId returns characters for a user', async () => {
    const characters = [mockCharacter];
    (prisma.character.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(characters);

    const result = await repo.findByUserId('user1');

    expect(result).toEqual(characters);
    expect(prisma.character.findMany).toHaveBeenCalledWith({ where: { userId: 'user1' } });
  });

  test('findByCampaignId returns characters in a campaign', async () => {
    const characters = [mockCharacter];
    (prisma.character.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(characters);

    const result = await repo.findByCampaignId('camp1');

    expect(result).toEqual(characters);
    expect(prisma.character.findMany).toHaveBeenCalledWith({ where: { campaignId: 'camp1' } });
  });

  test('updateStats updates character stats', async () => {
    const updated = { ...mockCharacter, stats: { str: 18 } };
    (prisma.character.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.updateStats('char1', { str: 18 });

    expect(result).toEqual(updated);
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char1' },
      data: { stats: { str: 18 } },
    });
  });

  test('updateInventory updates character inventory', async () => {
    const updated = { ...mockCharacter, inventory: [{ name: 'Sword', quantity: 1 }] };
    (prisma.character.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.updateInventory('char1', [{ name: 'Sword', quantity: 1 }]);

    expect(result).toEqual(updated);
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char1' },
      data: { inventory: [{ name: 'Sword', quantity: 1 }] },
    });
  });

  test('updateHp updates hp only', async () => {
    const updated = { ...mockCharacter, hp: 30 };
    (prisma.character.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.updateHp('char1', 30);

    expect(result).toEqual(updated);
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char1' },
      data: { hp: 30 },
    });
  });

  test('updateHp updates hp and maxHp', async () => {
    const updated = { ...mockCharacter, hp: 30, maxHp: 50 };
    (prisma.character.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.updateHp('char1', 30, 50);

    expect(result).toEqual(updated);
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char1' },
      data: { hp: 30, maxHp: 50 },
    });
  });

  test('levelUp increments level and updates stats', async () => {
    const updated = { ...mockCharacter, level: 6, stats: { str: 18 } };
    (prisma.character.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.levelUp('char1', 6, { str: 18 });

    expect(result).toEqual(updated);
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char1' },
      data: { level: 6, stats: { str: 18 } },
    });
  });

  test('create delegates to prisma.character.create', async () => {
    (prisma.character.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCharacter);

    const result = await repo.create({
      userId: 'user1',
      name: 'Aragorn',
      class: 'Ranger',
      hp: 42,
      maxHp: 45,
      rpgSystem: 'dnd5e',
    });

    expect(result).toEqual(mockCharacter);
    expect(prisma.character.create).toHaveBeenCalled();
  });

  test('delete delegates to prisma.character.delete', async () => {
    (prisma.character.delete as ReturnType<typeof vi.fn>).mockResolvedValue(mockCharacter);

    const result = await repo.delete('char1');

    expect(result).toEqual(mockCharacter);
    expect(prisma.character.delete).toHaveBeenCalledWith({ where: { id: 'char1' } });
  });
});
