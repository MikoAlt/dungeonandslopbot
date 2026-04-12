import { describe, it, expect, beforeEach } from 'bun:test';
import { StoryService, type StoryRepository } from '../../src/services/story.js';
import type { Story, Scene } from '../../src/types/story.js';
import { NotFoundError, ValidationError } from '../../src/errors.js';

function createMockScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene-1',
    description: 'A dark tavern',
    npcInteractions: [],
    playerActions: [],
    outcome: undefined,
    timestamp: new Date(),
    ...overrides,
  };
}

const CAMPAIGN_ID = '00000000-0000-0000-0000-000000000001';

function createMockStory(overrides: Partial<Story> = {}): Story {
  return {
    id: '00000000-0000-0000-0000-000000000100',
    campaignId: CAMPAIGN_ID,
    scenes: [],
    currentSceneIndex: 0,
    summary: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockRepository(): StoryRepository {
  const stories = new Map<string, Story>();

  return {
    async create(data) {
      const story = data as Story;
      stories.set(story.id, story);
      return story;
    },
    async findById(id) {
      return stories.get(id) ?? null;
    },
    async findByCampaignId(campaignId) {
      for (const story of stories.values()) {
        if (story.campaignId === campaignId) {
          return story;
        }
      }
      return null;
    },
    async update(id, data) {
      const existing = stories.get(id);
      if (!existing) throw new Error('Not found');
      const updated = { ...existing, ...data, updatedAt: new Date() } as Story;
      stories.set(id, updated);
      return updated;
    },
    async addScene(campaignId, scene) {
      const story = await this.findByCampaignId(campaignId);
      if (!story) throw new Error(`Story for campaign ${campaignId} not found`);
      const scenes = [...(story.scenes as Scene[]), scene as Scene];
      const updated = { ...story, scenes, updatedAt: new Date() } as Story;
      stories.set(story.id, updated);
      return updated;
    },
    async updateSummary(campaignId, summary) {
      const story = await this.findByCampaignId(campaignId);
      if (!story) throw new Error(`Story for campaign ${campaignId} not found`);
      const updated = { ...story, summary, updatedAt: new Date() } as Story;
      stories.set(story.id, updated);
      return updated;
    },
    async getCurrentScene(campaignId) {
      const story = await this.findByCampaignId(campaignId);
      if (!story) return null;
      const scenes = story.scenes as Scene[];
      const index = story.currentSceneIndex;
      if (index < 0 || index >= scenes.length) return null;
      return scenes[index] ?? null;
    },
  };
}

describe('StoryService', () => {
  let service: StoryService;
  let repo: StoryRepository;

  beforeEach(() => {
    repo = createMockRepository();
    service = new StoryService(repo);
  });

  describe('createStory', () => {
    it('creates a story for a campaign', async () => {
      const story = await service.createStory({ campaignId: CAMPAIGN_ID });
      expect(story.campaignId).toBe(CAMPAIGN_ID);
      expect(story.scenes).toEqual([]);
      expect(story.currentSceneIndex).toBe(0);
      expect(story.summary).toBeUndefined();
    });

    it('creates a story with a valid UUID id', async () => {
      const story = await service.createStory({ campaignId: CAMPAIGN_ID });
      expect(story.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('getStory', () => {
    it('returns a story by id', async () => {
      const created = await service.createStory({ campaignId: CAMPAIGN_ID });
      const found = await service.getStory(created.id);
      expect(found.id).toBe(created.id);
      expect(found.campaignId).toBe(CAMPAIGN_ID);
    });

    it('throws NotFoundError for non-existent story', async () => {
      await expect(service.getStory('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getStoryByCampaignId', () => {
    it('returns a story by campaign id', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });
      const found = await service.getStoryByCampaignId(CAMPAIGN_ID);
      expect(found.campaignId).toBe(CAMPAIGN_ID);
    });

    it('throws NotFoundError for non-existent campaign story', async () => {
      await expect(service.getStoryByCampaignId('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('advanceScene', () => {
    it('adds a scene and advances currentSceneIndex', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });

      const updated = await service.advanceScene(CAMPAIGN_ID, {
        description: 'The hero enters the tavern',
        npcInteractions: ['Bartender greets'],
        playerActions: ['Order a drink'],
        outcome: 'Got information',
      });

      expect(updated.scenes.length).toBe(1);
      expect(updated.currentSceneIndex).toBe(0);
      const scene = updated.scenes[0] as Scene;
      expect(scene.description).toBe('The hero enters the tavern');
      expect(scene.npcInteractions).toEqual(['Bartender greets']);
      expect(scene.playerActions).toEqual(['Order a drink']);
      expect(scene.outcome).toBe('Got information');
    });

    it('advances scene index correctly for multiple scenes', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });

      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene 1' });
      const updated = await service.advanceScene(CAMPAIGN_ID, { description: 'Scene 2' });

      expect(updated.scenes.length).toBe(2);
      expect(updated.currentSceneIndex).toBe(1);
    });

    it('uses defaults for optional fields', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });

      const updated = await service.advanceScene(CAMPAIGN_ID, {
        description: 'A simple scene',
      });

      const scene = updated.scenes[0] as Scene;
      expect(scene.npcInteractions).toEqual([]);
      expect(scene.playerActions).toEqual([]);
      expect(scene.outcome).toBeUndefined();
    });

    it('throws NotFoundError for non-existent campaign', async () => {
      await expect(service.advanceScene('nonexistent', { description: 'Scene' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws ValidationError for invalid scene data', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });

      await expect(
        service.advanceScene(CAMPAIGN_ID, { description: 123 } as unknown as {
          description: string;
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCurrentScene', () => {
    it('returns the current scene', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });
      await service.advanceScene(CAMPAIGN_ID, {
        description: 'Current scene',
        npcInteractions: ['NPC talks'],
      });

      const scene = await service.getCurrentScene(CAMPAIGN_ID);
      expect(scene.description).toBe('Current scene');
      expect(scene.npcInteractions).toEqual(['NPC talks']);
    });

    it('throws NotFoundError when no current scene exists', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });

      await expect(service.getCurrentScene(CAMPAIGN_ID)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError for non-existent campaign', async () => {
      await expect(service.getCurrentScene('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('summarizeStory', () => {
    it('concatenates scene descriptions as placeholder summary', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });
      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene one description' });
      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene two description' });

      const summary = await service.summarizeStory(CAMPAIGN_ID);
      expect(summary).toContain('Scene 1: Scene one description');
      expect(summary).toContain('Scene 2: Scene two description');
    });

    it('returns empty string for story with no scenes', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });

      const summary = await service.summarizeStory(CAMPAIGN_ID);
      expect(summary).toBe('');
    });

    it('throws NotFoundError for non-existent campaign', async () => {
      await expect(service.summarizeStory('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('rollbackScene', () => {
    it('rolls back current scene index by 1', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });
      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene 1' });
      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene 2' });
      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene 3' });

      const rolled = await service.rollbackScene(CAMPAIGN_ID);
      expect(rolled.currentSceneIndex).toBe(1);
    });

    it('rolls back by multiple scenes', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });
      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene 1' });
      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene 2' });
      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene 3' });

      const rolled = await service.rollbackScene(CAMPAIGN_ID, 2);
      expect(rolled.currentSceneIndex).toBe(0);
    });

    it('clamps scene index to 0 when rolling back too far', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });
      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene 1' });

      const rolled = await service.rollbackScene(CAMPAIGN_ID, 5);
      expect(rolled.currentSceneIndex).toBe(0);
    });

    it('clamps to 0 when rolling back from index 0', async () => {
      await service.createStory({ campaignId: CAMPAIGN_ID });
      await service.advanceScene(CAMPAIGN_ID, { description: 'Scene 1' });

      const rolled = await service.rollbackScene(CAMPAIGN_ID, 1);
      expect(rolled.currentSceneIndex).toBe(0);
    });

    it('throws NotFoundError for non-existent campaign', async () => {
      await expect(service.rollbackScene('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});
