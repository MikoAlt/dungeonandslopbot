import type { Story, Scene } from '../types/story.js';
import { StorySchema, SceneSchema } from '../types/story.js';
import { NotFoundError, ValidationError } from '../errors.js';

export interface StoryRepository {
  create(data: unknown): Promise<Story>;
  findById(id: string): Promise<Story | null>;
  findByCampaignId(campaignId: string): Promise<Story | null>;
  update(id: string, data: unknown): Promise<Story>;
  addScene(campaignId: string, scene: unknown): Promise<Story>;
  updateSummary(campaignId: string, summary: string): Promise<Story>;
  getCurrentScene(campaignId: string): Promise<Scene | null>;
}

export interface CreateStoryData {
  campaignId: string;
}

export interface AdvanceSceneData {
  description: string;
  npcInteractions?: string[];
  playerActions?: string[];
  outcome?: string;
}

export class StoryService {
  constructor(private readonly repo: StoryRepository) {}

  async createStory(data: CreateStoryData): Promise<Story> {
    const storyData = {
      id: crypto.randomUUID(),
      campaignId: data.campaignId,
      scenes: [],
      currentSceneIndex: 0,
      summary: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validation = StorySchema.safeParse(storyData);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join('.'),
        })),
      );
    }

    return this.repo.create(validation.data);
  }

  async getStory(id: string): Promise<Story> {
    const story = await this.repo.findById(id);
    if (!story) {
      throw new NotFoundError('Story', id);
    }
    return story;
  }

  async getStoryByCampaignId(campaignId: string): Promise<Story> {
    const story = await this.repo.findByCampaignId(campaignId);
    if (!story) {
      throw new NotFoundError('Story', campaignId);
    }
    return story;
  }

  async advanceScene(campaignId: string, data: AdvanceSceneData): Promise<Story> {
    const story = await this.repo.findByCampaignId(campaignId);
    if (!story) {
      throw new NotFoundError('Story', campaignId);
    }

    const sceneData = {
      id: crypto.randomUUID(),
      description: data.description,
      npcInteractions: data.npcInteractions ?? [],
      playerActions: data.playerActions ?? [],
      outcome: data.outcome,
      timestamp: new Date(),
    };

    const sceneValidation = SceneSchema.safeParse(sceneData);
    if (!sceneValidation.success) {
      throw new ValidationError(
        sceneValidation.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join('.'),
        })),
      );
    }

    const updated = await this.repo.addScene(campaignId, sceneValidation.data);

    // Advance currentSceneIndex to point to the new scene
    const newSceneIndex = updated.scenes.length - 1;
    return this.repo.update(updated.id, { currentSceneIndex: newSceneIndex });
  }

  async getCurrentScene(campaignId: string): Promise<Scene> {
    const scene = await this.repo.getCurrentScene(campaignId);
    if (!scene) {
      throw new NotFoundError('Scene', `campaign:${campaignId}`);
    }
    return scene;
  }

  async summarizeStory(campaignId: string): Promise<string> {
    const story = await this.repo.findByCampaignId(campaignId);
    if (!story) {
      throw new NotFoundError('Story', campaignId);
    }

    // Placeholder: concatenate scene descriptions
    // Actual LLM summarization will be implemented in T14
    const summary = (story.scenes as Scene[])
      .map((scene: Scene, index: number) => `Scene ${index + 1}: ${scene.description}`)
      .join('\n');

    await this.repo.updateSummary(campaignId, summary);
    return summary;
  }

  async rollbackScene(campaignId: string, sceneCount: number = 1): Promise<Story> {
    const story = await this.repo.findByCampaignId(campaignId);
    if (!story) {
      throw new NotFoundError('Story', campaignId);
    }

    const newIndex = Math.max(0, story.currentSceneIndex - sceneCount);
    return this.repo.update(story.id, { currentSceneIndex: newIndex });
  }
}
