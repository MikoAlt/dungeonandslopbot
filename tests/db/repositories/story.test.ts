import { describe, expect, test, beforeEach, vi } from 'bun:test';
import { StoryRepository } from '../../../src/db/repositories/story.js';
import { PrismaClient } from '../../../src/generated/prisma/client.js';

vi.mock('../../../src/generated/prisma/client.js', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    story: {
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

describe('StoryRepository', () => {
  let prisma: PrismaClient;
  let repo: StoryRepository;

  const mockStory = {
    id: 'story1',
    campaignId: 'camp1',
    scenes: [{ id: 'scene1', description: 'The council convenes' }],
    currentSceneIndex: 0,
    summary: 'The fellowship is formed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    repo = new StoryRepository(prisma);
  });

  test('findById returns story by id', async () => {
    (prisma.story.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockStory);

    const result = await repo.findById('story1');

    expect(result).toEqual(mockStory);
    expect(prisma.story.findUnique).toHaveBeenCalledWith({ where: { id: 'story1' } });
  });

  test('findByCampaignId returns story for a campaign', async () => {
    (prisma.story.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockStory]);

    const result = await repo.findByCampaignId('camp1');

    expect(result).toEqual(mockStory);
    expect(prisma.story.findMany).toHaveBeenCalledWith({
      where: { campaignId: 'camp1' },
      take: 1,
    });
  });

  test('findByCampaignId returns null when no story found', async () => {
    (prisma.story.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await repo.findByCampaignId('nonexistent');

    expect(result).toBeNull();
  });

  test('addScene appends a scene to story', async () => {
    const newScene = { id: 'scene2', description: 'The journey begins' };
    (prisma.story.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockStory]);
    const updated = { ...mockStory, scenes: [...(mockStory.scenes as unknown[]), newScene] };
    (prisma.story.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.addScene('camp1', newScene);

    expect(result).toEqual(updated);
    expect(prisma.story.update).toHaveBeenCalledWith({
      where: { id: 'story1' },
      data: { scenes: [...(mockStory.scenes as unknown[]), newScene] },
    });
  });

  test('addScene throws when story not found', async () => {
    (prisma.story.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    expect(repo.addScene('nonexistent', {})).rejects.toThrow(
      'Story for campaign nonexistent not found',
    );
  });

  test('updateSummary updates story summary', async () => {
    (prisma.story.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockStory]);
    const updated = { ...mockStory, summary: 'Updated summary' };
    (prisma.story.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const result = await repo.updateSummary('camp1', 'Updated summary');

    expect(result).toEqual(updated);
    expect(prisma.story.update).toHaveBeenCalledWith({
      where: { id: 'story1' },
      data: { summary: 'Updated summary' },
    });
  });

  test('updateSummary throws when story not found', async () => {
    (prisma.story.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    expect(repo.updateSummary('nonexistent', 'summary')).rejects.toThrow(
      'Story for campaign nonexistent not found',
    );
  });

  test('getCurrentScene returns scene at currentSceneIndex', async () => {
    (prisma.story.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockStory]);

    const result = await repo.getCurrentScene('camp1');

    expect(result).toEqual({ id: 'scene1', description: 'The council convenes' });
  });

  test('getCurrentScene returns null when no story found', async () => {
    (prisma.story.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await repo.getCurrentScene('nonexistent');

    expect(result).toBeNull();
  });

  test('getCurrentScene returns null when index out of bounds', async () => {
    const storyWithEmptyScenes = { ...mockStory, scenes: [], currentSceneIndex: 0 };
    (prisma.story.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([storyWithEmptyScenes]);

    const result = await repo.getCurrentScene('camp1');

    expect(result).toBeNull();
  });
});
