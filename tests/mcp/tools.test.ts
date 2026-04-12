import { describe, test, expect, beforeEach, vi } from 'bun:test';
import {
  initHandlers,
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
import type { AppContainer } from '../../src/wiring';
import type { Character } from '../../src/types/character';
import type { Campaign } from '../../src/types/campaign';
import type { Story } from '../../src/types/story';

function parseJson(text: string): unknown {
  return JSON.parse(text);
}

function createMockContainer() {
  const mockCharacterService = {
    createCharacter: vi.fn(),
    getCharacter: vi.fn(),
    listCharacters: vi.fn(),
    updateStats: vi.fn(),
    updateInventory: vi.fn(),
    modifyHp: vi.fn(),
    levelUp: vi.fn(),
    addExperience: vi.fn(),
    deleteCharacter: vi.fn(),
  };

  const mockCampaignService = {
    createCampaign: vi.fn(),
    getCampaign: vi.fn(),
    listCampaigns: vi.fn(),
    joinCampaign: vi.fn(),
    leaveCampaign: vi.fn(),
    updateWorldState: vi.fn(),
    setMode: vi.fn(),
    endCampaign: vi.fn(),
  };

  const mockStoryService = {
    createStory: vi.fn(),
    getStory: vi.fn(),
    getStoryByCampaignId: vi.fn(),
    advanceScene: vi.fn(),
    getCurrentScene: vi.fn(),
    summarizeStory: vi.fn(),
    rollbackScene: vi.fn(),
  };

  const mockContainer = {
    characterService: mockCharacterService,
    campaignService: mockCampaignService,
    storyService: mockStoryService,
    characterRepo: {
      update: vi.fn(),
    },
  } as unknown as AppContainer;

  return { mockContainer, mockCharacterService, mockCampaignService, mockStoryService };
}

const mockCharacter: Character = {
  id: 'char-123',
  userId: 'user-1',
  name: 'Aragorn',
  class: 'Ranger',
  level: 5,
  hp: 42,
  maxHp: 45,
  rpgSystem: 'dnd5e',
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

const mockCampaign: Campaign = {
  id: 'camp-123',
  name: 'Lost Mine of Phandelver',
  description: 'A classic D&D adventure',
  rpgSystem: 'dnd5e',
  mode: 'sharedSession',
  dmUserId: 'dm-1',
  guildId: 'guild-1',
  channelId: 'channel-1',
  worldState: {
    currentLocation: 'Phandalin',
    npcs: [],
    quests: [],
    events: [],
    sessionCount: 1,
  },
  isActive: true,
  players: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockStory: Story = {
  id: 'story-123',
  campaignId: 'camp-123',
  scenes: [
    {
      id: 'scene-1',
      description: 'The party meets in a tavern',
      npcInteractions: [],
      playerActions: [],
      timestamp: new Date(),
    },
  ],
  currentSceneIndex: 0,
  summary: 'The fellowship is formed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Tool Handlers - Valid Inputs', () => {
  let mockContainer: AppContainer;
  let mockCharacterService: ReturnType<typeof vi.fn>;
  let mockCampaignService: ReturnType<typeof vi.fn>;
  let mockStoryService: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const mocks = createMockContainer();
    mockContainer = mocks.mockContainer;
    mockCharacterService = mocks.mockCharacterService;
    mockCampaignService = mocks.mockCampaignService;
    mockStoryService = mocks.mockStoryService;
    initHandlers(mockContainer);
  });

  test('character_create returns success with character data', async () => {
    mockCharacterService.createCharacter.mockResolvedValue(mockCharacter);

    const result = await characterCreateHandler({
      name: 'Aragorn',
      class: 'Ranger',
      rpgSystem: 'dnd5e',
      userId: 'user-1',
    } as Parameters<typeof characterCreateHandler>[0]);

    expect(result.content[0].type).toBe('text');
    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Character).name).toBe('Aragorn');
    expect((data.data as Character).class).toBe('Ranger');
  });

  test('character_create with backstory returns success', async () => {
    const charWithBackstory = { ...mockCharacter, backstory: 'A wizard from Valinor' };
    mockCharacterService.createCharacter.mockResolvedValue(charWithBackstory);

    const result = await characterCreateHandler({
      name: 'Gandalf',
      class: 'Wizard',
      rpgSystem: 'dnd5e',
      backstory: 'A wizard from Valinor',
      userId: 'user-1',
    } as Parameters<typeof characterCreateHandler>[0]);

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Character).backstory).toBe('A wizard from Valinor');
  });

  test('character_get returns success with id', async () => {
    mockCharacterService.getCharacter.mockResolvedValue(mockCharacter);

    const result = await characterGetHandler({ id: 'char-123' });

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Character).id).toBe('char-123');
  });

  test('character_list returns success with userId', async () => {
    const characters = [mockCharacter];
    mockCharacterService.listCharacters.mockResolvedValue(characters);

    const result = await characterListHandler({ userId: 'user-1' });

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('character_list with campaignId returns success', async () => {
    const characters = [{ ...mockCharacter, campaignId: 'camp-123' }];
    mockCharacterService.listCharacters.mockResolvedValue(characters);

    const result = await characterListHandler({ userId: 'user-1', campaignId: 'camp-123' });

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('character_update returns success with id and updates', async () => {
    const updatedChar = { ...mockCharacter, hp: 30 };
    mockCharacterService.modifyHp.mockResolvedValue(updatedChar);

    const result = await characterUpdateHandler({
      id: 'char-123',
      updates: { hp: 30 },
    });

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Character).id).toBe('char-123');
  });

  test('campaign_create returns success with campaign data', async () => {
    mockCampaignService.createCampaign.mockResolvedValue(mockCampaign);

    const result = await campaignCreateHandler({
      name: 'Lost Mine of Phandelver',
      rpgSystem: 'dnd5e',
      mode: 'sharedSession',
      dmUserId: 'dm-1',
      guildId: 'guild-1',
      channelId: 'channel-1',
    } as Parameters<typeof campaignCreateHandler>[0]);

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Campaign).name).toBe('Lost Mine of Phandelver');
  });

  test('campaign_create with description returns success', async () => {
    const campaignWithDesc = { ...mockCampaign, description: 'A custom campaign' };
    mockCampaignService.createCampaign.mockResolvedValue(campaignWithDesc);

    const result = await campaignCreateHandler({
      name: 'Test Campaign',
      rpgSystem: 'custom',
      mode: 'persistentWorld',
      description: 'A custom campaign',
      dmUserId: 'dm-1',
      guildId: 'guild-1',
      channelId: 'channel-1',
    } as Parameters<typeof campaignCreateHandler>[0]);

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Campaign).description).toBe('A custom campaign');
  });

  test('campaign_get returns success with id', async () => {
    mockCampaignService.getCampaign.mockResolvedValue(mockCampaign);

    const result = await campaignGetHandler({ id: 'camp-123' });

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Campaign).id).toBe('camp-123');
  });

  test('campaign_list returns success with guildId', async () => {
    const campaigns = [mockCampaign];
    mockCampaignService.listCampaigns.mockResolvedValue(campaigns);

    const result = await campaignListHandler({ guildId: 'guild-1' });

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('campaign_update_world_state returns success', async () => {
    const updatedCampaign = {
      ...mockCampaign,
      worldState: { ...mockCampaign.worldState, currentLocation: 'Mordor' },
    };
    mockCampaignService.updateWorldState.mockResolvedValue(updatedCampaign);

    const result = await campaignUpdateWorldStateHandler({
      id: 'camp-123',
      worldState: { currentLocation: 'Mordor', npcs: [], quests: [], events: [], sessionCount: 1 },
    });

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Campaign).id).toBe('camp-123');
  });

  test('story_advance returns success with campaignId and action', async () => {
    mockStoryService.advanceScene.mockResolvedValue(mockStory);

    const result = await storyAdvanceHandler({
      campaignId: 'camp-123',
      action: 'The hero attacks the dragon',
    });

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Story).campaignId).toBe('camp-123');
  });

  test('story_get returns success with campaignId', async () => {
    mockStoryService.getStoryByCampaignId.mockResolvedValue(mockStory);

    const result = await storyGetHandler({ campaignId: 'camp-123' });

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Story).campaignId).toBe('camp-123');
  });

  test('dice_roll returns success with notation', async () => {
    const result = await diceRollHandler({ notation: '2d20+5' });

    const data = parseJson(result.content[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data.data as Record<string, unknown>).notation).toBe('2d20+5');
    expect(Array.isArray((data.data as Record<string, unknown>).rolls)).toBe(true);
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
      worldState: { weather: 'sunny', npcs: [], quests: [], events: [], sessionCount: 0 },
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
  let mockContainer: AppContainer;
  let mockCampaignService: ReturnType<typeof vi.fn>;
  let mockCharacterService: ReturnType<typeof vi.fn>;
  let mockStoryService: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const mocks = createMockContainer();
    mockContainer = mocks.mockContainer;
    mockCampaignService = mocks.mockCampaignService;
    mockCharacterService = mocks.mockCharacterService;
    mockStoryService = mocks.mockStoryService;
    initHandlers(mockContainer);
  });

  test('campaign resource returns data for given id', async () => {
    mockCampaignService.getCampaign.mockResolvedValue(mockCampaign);

    const uri = new URL('dungeon://campaigns/camp-123');
    const result = await campaignResourceHandler(uri);

    expect(result.contents[0].mimeType).toBe('application/json');
    expect(result.contents[0].uri).toBe('dungeon://campaigns/camp-123');
    const data = parseJson(result.contents[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data as Campaign).id).toBe('camp-123');
  });

  test('character resource returns data for given id', async () => {
    mockCharacterService.getCharacter.mockImplementation((id: string) => {
      return Promise.resolve({ ...mockCharacter, id });
    });

    const uri = new URL('dungeon://characters/char-456');
    const result = await characterResourceHandler(uri);

    expect(result.contents[0].mimeType).toBe('application/json');
    expect(result.contents[0].uri).toBe('dungeon://characters/char-456');
    const data = parseJson(result.contents[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data as Character).id).toBe('char-456');
  });

  test('story resource returns data for given id', async () => {
    mockStoryService.getStory.mockImplementation((id: string) => {
      return Promise.resolve({ ...mockStory, id });
    });

    const uri = new URL('dungeon://stories/story-789');
    const result = await storyResourceHandler(uri);

    expect(result.contents[0].mimeType).toBe('application/json');
    expect(result.contents[0].uri).toBe('dungeon://stories/story-789');
    const data = parseJson(result.contents[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
    expect((data as Story).id).toBe('story-789');
  });

  test('world-state resource extracts campaign id from URI', async () => {
    mockCampaignService.getCampaign.mockResolvedValue(mockCampaign);

    const uri = new URL('dungeon://campaigns/camp-abc/world-state');
    const result = await worldStateResourceHandler(uri);

    expect(result.contents[0].mimeType).toBe('application/json');
    expect(result.contents[0].uri).toBe('dungeon://campaigns/camp-abc/world-state');
    const data = parseJson(result.contents[0].text) as Record<string, unknown>;
    expect(data.success).toBe(true);
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
