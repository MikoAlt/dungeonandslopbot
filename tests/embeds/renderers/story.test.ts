import { describe, test, expect } from 'bun:test';
import {
  renderScene,
  renderStorySummary,
  renderNarrativeResponse,
} from '../../../src/embeds/renderers/story.js';
import { Colors } from '../../../src/embeds/themes.js';
import type { Story, Scene } from '../../../src/types/story.js';

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene-1',
    description: 'A dark forest stretches before you.',
    npcInteractions: ['The old hermit speaks', 'A wolf growls'],
    playerActions: ['Draw sword', 'Cast light spell'],
    outcome: 'The wolf flees into the darkness.',
    timestamp: new Date(),
    ...overrides,
  };
}

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    campaignId: '00000000-0000-0000-0000-000000000099',
    scenes: [makeScene()],
    currentSceneIndex: 0,
    summary: 'The party entered the forest.',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('renderScene', () => {
  test('renders scene with all fields', () => {
    const scene = makeScene();
    const embed = renderScene(scene);
    const data = embed.data;

    expect(data.title).toBe('Scene scene-1');
    expect(data.color).toBe(Colors.STORY);
    expect(data.description).toContain('A dark forest');

    const fields = data.fields ?? [];
    const npcField = fields.find((f) => f.name === 'NPC Interactions');
    expect(npcField).toBeDefined();
    expect(npcField!.value).toContain('The old hermit speaks');

    const actionField = fields.find((f) => f.name === 'Player Actions');
    expect(actionField).toBeDefined();
    expect(actionField!.value).toContain('Draw sword');

    const outcomeField = fields.find((f) => f.name === 'Outcome');
    expect(outcomeField).toBeDefined();
    expect(outcomeField!.value).toContain('wolf flees');
  });

  test('renders scene without optional fields', () => {
    const scene: Scene = {
      id: 'scene-2',
      description: 'An empty room.',
      npcInteractions: [],
      playerActions: [],
      timestamp: new Date(),
    };
    const embed = renderScene(scene);
    const fields = embed.data.fields ?? [];
    expect(fields.find((f) => f.name === 'NPC Interactions')).toBeUndefined();
    expect(fields.find((f) => f.name === 'Player Actions')).toBeUndefined();
    expect(fields.find((f) => f.name === 'Outcome')).toBeUndefined();
  });

  test('truncates long description', () => {
    const scene = makeScene({ description: 'A'.repeat(5000) });
    const embed = renderScene(scene);
    expect((embed.data.description ?? '').length).toBeLessThanOrEqual(4096);
  });
});

describe('renderStorySummary', () => {
  test('renders story summary with scenes', () => {
    const story = makeStory();
    const embeds = renderStorySummary(story);

    expect(embeds.length).toBeGreaterThanOrEqual(1);
    expect(embeds[0].data.color).toBe(Colors.STORY);

    const allFields = embeds.flatMap((e) => e.data.fields ?? []);
    const sceneField = allFields.find((f) => f.name === 'Scene scene-1');
    expect(sceneField).toBeDefined();
    expect(sceneField!.value).toContain('A dark forest');
  });

  test('renders summary description', () => {
    const story = makeStory({ summary: 'The party entered the forest.' });
    const embeds = renderStorySummary(story);
    expect(embeds[0].data.description).toContain('The party entered the forest.');
  });

  test('uses EmbedPaginator for many scenes', () => {
    const scenes = Array.from(
      { length: 30 },
      (_, i): Scene => ({
        id: `scene-${i}`,
        description: `Scene ${i} description with some content to fill space.`,
        npcInteractions: [],
        playerActions: [],
        timestamp: new Date(),
      }),
    );
    const story = makeStory({ scenes });
    const embeds = renderStorySummary(story);
    expect(embeds.length).toBeGreaterThanOrEqual(1);
    const allFields = embeds.flatMap((e) => e.data.fields ?? []);
    expect(allFields.length).toBe(30);
  });

  test('footer contains campaign ID', () => {
    const story = makeStory();
    const embeds = renderStorySummary(story);
    const last = embeds[embeds.length - 1];
    expect(last.data.footer?.text).toContain(story.campaignId);
  });
});

describe('renderNarrativeResponse', () => {
  test('renders narrative response as description', () => {
    const response = 'The dragon swoops down from the mountain.';
    const embeds = renderNarrativeResponse(response);

    expect(embeds.length).toBe(1);
    expect(embeds[0].data.title).toBe('Narrative');
    expect(embeds[0].data.color).toBe(Colors.STORY);
    expect(embeds[0].data.description).toBe(response);
  });

  test('uses EmbedPaginator for long narrative', () => {
    const response = 'A'.repeat(8000);
    const embeds = renderNarrativeResponse(response);
    expect(embeds.length).toBeGreaterThan(1);
    const totalDesc = embeds.map((e) => e.data.description ?? '').join('');
    expect(totalDesc.length).toBe(8000);
  });
});
