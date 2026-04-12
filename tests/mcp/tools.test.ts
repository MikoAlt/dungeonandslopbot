import { describe, test, expect } from 'bun:test';
import {
  characterCreateHandler,
  characterGetHandler,
  characterListHandler,
  characterUpdateHandler,
  campaignCreateHandler,
  campaignGetHandler,
  campaignListHandler,
  campaignUpdateWorldStateHandler,
  storyAdvanceHandler,
  storyGetHandler,
  diceRollHandler,
  campaignResourceHandler,
  characterResourceHandler,
  storyResourceHandler,
  worldStateResourceHandler,
  errorResponse,
} from '../../src/mcp/handlers';
import {
  CharacterCreateInputSchema,
  CharacterGetInputSchema,
  CharacterListInputSchema,
  CharacterUpdateInputSchema,
  CampaignCreateInputSchema,
  CampaignGetInputSchema,
  CampaignListInputSchema,
  CampaignUpdateWorldStateInputSchema,
  StoryAdvanceInputSchema,
  StoryGetInputSchema,
  DiceRollInputSchema,
} from '../../src/mcp/types';

function parseJson(text: string): unknown {
  return JSON.parse(text);
}

describe('Tool Handlers - Valid Inputs', () => {
  test('character_create returns success with character data', async () => {
    const result = await characterCreateHandler({
      name: 'Aragorn',
      class: 'Ranger',
      rpgSystem: 'dnd5e',
    });
    expect(result.content[0].type).toBe('text');
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect(data.message).toBe('character_create not yet connected');
    expect(data.data).toEqual({
      name: 'Aragorn',
      class: 'Ranger',
      rpgSystem: 'dnd5e',
      backstory: null,
    });
  });

  test('character_create with backstory returns success', async () => {
    const result = await characterCreateHandler({
      name: 'Gandalf',
      class: 'Wizard',
      rpgSystem: 'dnd5e',
      backstory: 'A wizard from Valinor',
    });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).backstory).toBe('A wizard from Valinor');
  });

  test('character_get returns success with id', async () => {
    const result = await characterGetHandler({ id: 'char_123' });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).id).toBe('char_123');
  });

  test('character_list returns success with userId', async () => {
    const result = await characterListHandler({ userId: 'user_1' });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).userId).toBe('user_1');
    expect((data.data as Record<string, unknown>).campaignId).toBeNull();
  });

  test('character_list with campaignId returns success', async () => {
    const result = await characterListHandler({ userId: 'user_1', campaignId: 'camp_1' });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).campaignId).toBe('camp_1');
  });

  test('character_update returns success with id and updates', async () => {
    const result = await characterUpdateHandler({
      id: 'char_1',
      updates: { hp: 10, level: 2 },
    });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).id).toBe('char_1');
  });

  test('campaign_create returns success with campaign data', async () => {
    const result = await campaignCreateHandler({
      name: 'Lost Mine of Phandelver',
      rpgSystem: 'dnd5e',
      mode: 'sharedSession',
    });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).name).toBe('Lost Mine of Phandelver');
    expect((data.data as Record<string, unknown>).description).toBeNull();
  });

  test('campaign_create with description returns success', async () => {
    const result = await campaignCreateHandler({
      name: 'Test Campaign',
      rpgSystem: 'custom',
      mode: 'persistentWorld',
      description: 'A custom campaign',
    });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).description).toBe('A custom campaign');
  });

  test('campaign_get returns success with id', async () => {
    const result = await campaignGetHandler({ id: 'camp_1' });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).id).toBe('camp_1');
  });

  test('campaign_list returns success with guildId', async () => {
    const result = await campaignListHandler({ guildId: 'guild_1' });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).guildId).toBe('guild_1');
  });

  test('campaign_update_world_state returns success', async () => {
    const result = await campaignUpdateWorldStateHandler({
      id: 'camp_1',
      worldState: { weather: 'rainy', day: 5 },
    });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).id).toBe('camp_1');
  });

  test('story_advance returns success with campaignId and action', async () => {
    const result = await storyAdvanceHandler({
      campaignId: 'camp_1',
      action: 'The hero attacks the dragon',
    });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).campaignId).toBe('camp_1');
    expect((data.data as Record<string, unknown>).action).toBe('The hero attacks the dragon');
  });

  test('story_get returns success with campaignId', async () => {
    const result = await storyGetHandler({ campaignId: 'camp_1' });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).campaignId).toBe('camp_1');
  });

  test('dice_roll returns success with notation', async () => {
    const result = await diceRollHandler({ notation: '2d20+5' });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).notation).toBe('2d20+5');
    expect((data.data as Record<string, unknown>).modifier).toBeNull();
  });

  test('dice_roll with modifier returns success', async () => {
    const result = await diceRollHandler({ notation: '1d20', modifier: 10 });
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).modifier).toBe(10);
  });
});

describe('Zod Schema Validation - Invalid Inputs', () => {
  test('CharacterCreateInputSchema rejects missing name', () => {
    const result = CharacterCreateInputSchema.safeParse({
      class: 'Wizard',
      rpgSystem: 'dnd5e',
    });
    expect(result.success).toBe(false);
  });

  test('CharacterCreateInputSchema rejects invalid rpgSystem', () => {
    const result = CharacterCreateInputSchema.safeParse({
      name: 'Gandalf',
      class: 'Wizard',
      rpgSystem: 'pathfinder',
    });
    expect(result.success).toBe(false);
  });

  test('CharacterGetInputSchema rejects missing id', () => {
    const result = CharacterGetInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('CharacterListInputSchema rejects missing userId', () => {
    const result = CharacterListInputSchema.safeParse({ campaignId: 'camp_1' });
    expect(result.success).toBe(false);
  });

  test('CharacterUpdateInputSchema rejects missing id', () => {
    const result = CharacterUpdateInputSchema.safeParse({ updates: { hp: 10 } });
    expect(result.success).toBe(false);
  });

  test('CharacterUpdateInputSchema rejects missing updates', () => {
    const result = CharacterUpdateInputSchema.safeParse({ id: 'char_1' });
    expect(result.success).toBe(false);
  });

  test('CampaignCreateInputSchema rejects missing name', () => {
    const result = CampaignCreateInputSchema.safeParse({
      rpgSystem: 'dnd5e',
      mode: 'sharedSession',
    });
    expect(result.success).toBe(false);
  });

  test('CampaignCreateInputSchema rejects invalid mode', () => {
    const result = CampaignCreateInputSchema.safeParse({
      name: 'Test',
      rpgSystem: 'dnd5e',
      mode: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  test('CampaignGetInputSchema rejects missing id', () => {
    const result = CampaignGetInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('CampaignListInputSchema rejects missing guildId', () => {
    const result = CampaignListInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('CampaignUpdateWorldStateInputSchema rejects missing id', () => {
    const result = CampaignUpdateWorldStateInputSchema.safeParse({
      worldState: { day: 1 },
    });
    expect(result.success).toBe(false);
  });

  test('CampaignUpdateWorldStateInputSchema rejects missing worldState', () => {
    const result = CampaignUpdateWorldStateInputSchema.safeParse({ id: 'camp_1' });
    expect(result.success).toBe(false);
  });

  test('StoryAdvanceInputSchema rejects missing campaignId', () => {
    const result = StoryAdvanceInputSchema.safeParse({ action: 'attack' });
    expect(result.success).toBe(false);
  });

  test('StoryAdvanceInputSchema rejects missing action', () => {
    const result = StoryAdvanceInputSchema.safeParse({ campaignId: 'camp_1' });
    expect(result.success).toBe(false);
  });

  test('StoryGetInputSchema rejects missing campaignId', () => {
    const result = StoryGetInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('DiceRollInputSchema rejects missing notation', () => {
    const result = DiceRollInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('DiceRollInputSchema rejects non-string notation', () => {
    const result = DiceRollInputSchema.safeParse({ notation: 123 });
    expect(result.success).toBe(false);
  });
});

describe('Zod Schema Validation - Valid Inputs', () => {
  test('CharacterCreateInputSchema accepts valid input', () => {
    const result = CharacterCreateInputSchema.safeParse({
      name: 'Aragorn',
      class: 'Ranger',
      rpgSystem: 'dnd5e',
    });
    expect(result.success).toBe(true);
  });

  test('CharacterCreateInputSchema accepts optional backstory', () => {
    const result = CharacterCreateInputSchema.safeParse({
      name: 'Gandalf',
      class: 'Wizard',
      rpgSystem: 'custom',
      backstory: 'A wizard',
    });
    expect(result.success).toBe(true);
  });

  test('CharacterListInputSchema accepts userId only', () => {
    const result = CharacterListInputSchema.safeParse({ userId: 'user_1' });
    expect(result.success).toBe(true);
  });

  test('CharacterListInputSchema accepts userId and campaignId', () => {
    const result = CharacterListInputSchema.safeParse({ userId: 'user_1', campaignId: 'camp_1' });
    expect(result.success).toBe(true);
  });

  test('CharacterUpdateInputSchema accepts id and updates', () => {
    const result = CharacterUpdateInputSchema.safeParse({
      id: 'char_1',
      updates: { hp: 10 },
    });
    expect(result.success).toBe(true);
  });

  test('CampaignCreateInputSchema accepts all modes', () => {
    const modes = ['sharedSession', 'persistentWorld', 'async'];
    for (const mode of modes) {
      const result = CampaignCreateInputSchema.safeParse({
        name: 'Test',
        rpgSystem: 'dnd5e',
        mode,
      });
      expect(result.success).toBe(true);
    }
  });

  test('CampaignCreateInputSchema accepts optional description', () => {
    const result = CampaignCreateInputSchema.safeParse({
      name: 'Test',
      rpgSystem: 'dnd5e',
      mode: 'sharedSession',
      description: 'A campaign',
    });
    expect(result.success).toBe(true);
  });

  test('CampaignUpdateWorldStateInputSchema accepts valid input', () => {
    const result = CampaignUpdateWorldStateInputSchema.safeParse({
      id: 'camp_1',
      worldState: { weather: 'sunny' },
    });
    expect(result.success).toBe(true);
  });

  test('DiceRollInputSchema accepts notation without modifier', () => {
    const result = DiceRollInputSchema.safeParse({ notation: '2d6' });
    expect(result.success).toBe(true);
  });

  test('DiceRollInputSchema accepts notation with modifier', () => {
    const result = DiceRollInputSchema.safeParse({ notation: '1d20', modifier: 5 });
    expect(result.success).toBe(true);
  });
});

describe('Resource Handlers', () => {
  test('campaign resource returns data for given id', async () => {
    const uri = new URL('dungeon://campaigns/camp_123');
    const result = await campaignResourceHandler(uri);
    expect(result.contents[0].mimeType).toBe('application/json');
    expect(result.contents[0].uri).toBe('dungeon://campaigns/camp_123');
    const data = parseJson(result.contents[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect(data.id).toBe('camp_123');
  });

  test('character resource returns data for given id', async () => {
    const uri = new URL('dungeon://characters/char_456');
    const result = await characterResourceHandler(uri);
    expect(result.contents[0].mimeType).toBe('application/json');
    expect(result.contents[0].uri).toBe('dungeon://characters/char_456');
    const data = parseJson(result.contents[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect(data.id).toBe('char_456');
  });

  test('story resource returns data for given id', async () => {
    const uri = new URL('dungeon://stories/story_789');
    const result = await storyResourceHandler(uri);
    expect(result.contents[0].mimeType).toBe('application/json');
    expect(result.contents[0].uri).toBe('dungeon://stories/story_789');
    const data = parseJson(result.contents[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect(data.id).toBe('story_789');
  });

  test('world-state resource extracts campaign id from URI', async () => {
    const uri = new URL('dungeon://campaigns/camp_abc/world-state');
    const result = await worldStateResourceHandler(uri);
    expect(result.contents[0].mimeType).toBe('application/json');
    expect(result.contents[0].uri).toBe('dungeon://campaigns/camp_abc/world-state');
    const data = parseJson(result.contents[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect(data.id).toBe('camp_abc');
  });
});

describe('errorResponse helper', () => {
  test('returns error response with tool name and message', () => {
    const result = errorResponse('character_create', 'name is required');
    expect(result.content[0].type).toBe('text');
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(false);
    expect(data.error).toBe('character_create: name is required');
  });
});
