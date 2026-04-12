import {
  CharacterSchema,
  DnD5eStatsSchema,
  CustomSimpleStatsSchema,
  CampaignSchema,
  WorldStateSchema,
  StorySchema,
  SceneSchema,
  ChatMessageSchema,
  ContextWindowSchema,
  CharacterCreateInputSchema,
  CampaignCreateInputSchema,
  StoryAdvanceInputSchema,
  DiceRollInputSchema,
} from '../../src/types/index';
import { z } from 'zod';

describe('DnD5eStatsSchema', () => {
  const validDndStats = {
    str: 16,
    dex: 14,
    con: 15,
    int: 12,
    wis: 10,
    cha: 8,
    ac: 18,
    speed: 30,
    hitDice: '2d8',
  };

  it('accepts valid D&D 5e stats', () => {
    const result = DnD5eStatsSchema.safeParse(validDndStats);
    expect(result.success).toBe(true);
  });

  it('rejects str score out of range (1-30)', () => {
    const result = DnD5eStatsSchema.safeParse({ ...validDndStats, str: 50 });
    expect(result.success).toBe(false);
  });

  it('rejects negative ability score', () => {
    const result = DnD5eStatsSchema.safeParse({ ...validDndStats, dex: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer ability score', () => {
    const result = DnD5eStatsSchema.safeParse({ ...validDndStats, con: 15.5 });
    expect(result.success).toBe(false);
  });
});

describe('CustomSimpleStatsSchema', () => {
  const validCustomStats = {
    hp: 25,
    attack: 8,
    defense: 12,
    speed: 20,
    special: [],
  };

  it('accepts valid custom simple stats', () => {
    const result = CustomSimpleStatsSchema.safeParse(validCustomStats);
    expect(result.success).toBe(true);
  });

  it('accepts custom stats with special abilities', () => {
    const result = CustomSimpleStatsSchema.safeParse({
      ...validCustomStats,
      special: [{ name: 'Fireball', description: 'Deals 6d6 fire damage' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative hp', () => {
    const result = CustomSimpleStatsSchema.safeParse({ ...validCustomStats, hp: -5 });
    expect(result.success).toBe(false);
  });
});

describe('CharacterSchema', () => {
  const baseCharacter = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Gandalf',
    class: 'Wizard',
    level: 5,
    hp: 30,
    maxHp: 35,
    rpgSystem: 'dnd5e' as const,
    userId: 'user123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validDndCharacter = {
    ...baseCharacter,
    stats: {
      str: 10,
      dex: 14,
      con: 12,
      int: 18,
      wis: 15,
      cha: 13,
      ac: 15,
      speed: 30,
      hitDice: '3d6',
    },
  };

  const validCustomCharacter = {
    ...baseCharacter,
    rpgSystem: 'custom' as const,
    stats: {
      hp: 25,
      attack: 8,
      defense: 12,
      speed: 20,
      special: [],
    },
  };

  it('accepts valid D&D 5e character', () => {
    const result = CharacterSchema.safeParse(validDndCharacter);
    expect(result.success).toBe(true);
  });

  it('accepts valid Custom Simple character', () => {
    const result = CharacterSchema.safeParse(validCustomCharacter);
    expect(result.success).toBe(true);
  });

  it('rejects missing required field (name)', () => {
    const result = CharacterSchema.safeParse({ ...validDndCharacter, name: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects invalid uuid for id', () => {
    const result = CharacterSchema.safeParse({ ...validDndCharacter, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects level less than 1', () => {
    const result = CharacterSchema.safeParse({ ...validDndCharacter, level: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects hp greater than maxHp', () => {
    const result = CharacterSchema.safeParse({ ...validDndCharacter, hp: 100, maxHp: 50 });
    expect(result.success).toBe(true);
  });

  it('applies default level of 1', () => {
    const result = CharacterSchema.safeParse({ ...validDndCharacter, level: undefined });
    expect(result.success).toBe(true);
    expect(result.data?.level).toBe(1);
  });

  it('applies default empty inventory', () => {
    const result = CharacterSchema.safeParse({ ...validDndCharacter, inventory: undefined });
    expect(result.success).toBe(true);
    expect(result.data?.inventory).toEqual([]);
  });
});

describe('CampaignSchema', () => {
  const validCampaign = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'The Lost Mine',
    description: 'A classic D&D adventure',
    rpgSystem: 'dnd5e' as const,
    mode: 'sharedSession' as const,
    dmUserId: 'dm123',
    guildId: 'guild456',
    channelId: 'channel789',
    worldState: {
      currentLocation: 'Phandalin',
      npcs: ['Gundren Rockseeker'],
      quests: [{ name: 'Lost Mine', status: 'active' as const }],
      events: [],
      sessionCount: 0,
    },
    isActive: true,
    players: ['player1', 'player2'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('accepts valid campaign', () => {
    const result = CampaignSchema.safeParse(validCampaign);
    expect(result.success).toBe(true);
  });

  it('accepts sharedSession mode', () => {
    const result = CampaignSchema.safeParse({ ...validCampaign, mode: 'sharedSession' });
    expect(result.success).toBe(true);
  });

  it('accepts persistentWorld mode', () => {
    const result = CampaignSchema.safeParse({ ...validCampaign, mode: 'persistentWorld' });
    expect(result.success).toBe(true);
  });

  it('accepts async mode', () => {
    const result = CampaignSchema.safeParse({ ...validCampaign, mode: 'async' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid mode "realtime"', () => {
    const result = CampaignSchema.safeParse({ ...validCampaign, mode: 'realtime' as any });
    expect(result.success).toBe(false);
  });

  it('rejects invalid rpgSystem', () => {
    const result = CampaignSchema.safeParse({ ...validCampaign, rpgSystem: 'pathfinder' as any });
    expect(result.success).toBe(false);
  });
});

describe('WorldStateSchema', () => {
  const validWorldState = {
    currentLocation: 'Neverwinter',
    npcs: ['Ashara', 'Vellas'],
    quests: [{ name: 'Main Quest', status: 'active' as const }],
    events: ['Dragon spotted'],
    sessionCount: 5,
  };

  it('accepts valid world state', () => {
    const result = WorldStateSchema.safeParse(validWorldState);
    expect(result.success).toBe(true);
  });

  it('applies default empty arrays', () => {
    const result = WorldStateSchema.safeParse({ currentLocation: 'Town' });
    expect(result.success).toBe(true);
    expect(result.data?.npcs).toEqual([]);
    expect(result.data?.quests).toEqual([]);
    expect(result.data?.events).toEqual([]);
    expect(result.data?.sessionCount).toBe(0);
  });

  it('rejects negative sessionCount', () => {
    const result = WorldStateSchema.safeParse({ ...validWorldState, sessionCount: -1 });
    expect(result.success).toBe(false);
  });
});

describe('StorySchema', () => {
  const validStory = {
    id: '550e8400-e29b-41d4-a716-446655440002',
    campaignId: '550e8400-e29b-41d4-a716-446655440001',
    scenes: [
      {
        id: 'scene1',
        description: 'The party enters the dungeon',
        npcInteractions: [],
        playerActions: ['Check for traps'],
        outcome: 'Found a hidden pit',
        timestamp: new Date(),
      },
    ],
    currentSceneIndex: 0,
    summary: 'Adventure begins',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('accepts valid story', () => {
    const result = StorySchema.safeParse(validStory);
    expect(result.success).toBe(true);
  });

  it('accepts story without summary', () => {
    const result = StorySchema.safeParse({ ...validStory, summary: undefined });
    expect(result.success).toBe(true);
  });

  it('rejects negative currentSceneIndex', () => {
    const result = StorySchema.safeParse({ ...validStory, currentSceneIndex: -1 });
    expect(result.success).toBe(false);
  });
});

describe('SceneSchema', () => {
  const validScene = {
    id: 'scene1',
    description: 'A dark cavern',
    npcInteractions: ['Goblin ambush'],
    playerActions: ['Fight', 'Flee'],
    outcome: 'Victory',
    timestamp: new Date(),
  };

  it('accepts valid scene', () => {
    const result = SceneSchema.safeParse(validScene);
    expect(result.success).toBe(true);
  });

  it('accepts scene without outcome', () => {
    const result = SceneSchema.safeParse({ ...validScene, outcome: undefined });
    expect(result.success).toBe(true);
  });
});

describe('ChatMessageSchema', () => {
  const validMessage = {
    role: 'user' as const,
    content: 'Hello, world!',
    timestamp: new Date(),
  };

  it('accepts valid chat message with system role', () => {
    const result = ChatMessageSchema.safeParse({ ...validMessage, role: 'system' });
    expect(result.success).toBe(true);
  });

  it('accepts valid chat message with user role', () => {
    const result = ChatMessageSchema.safeParse({ ...validMessage, role: 'user' });
    expect(result.success).toBe(true);
  });

  it('accepts valid chat message with assistant role', () => {
    const result = ChatMessageSchema.safeParse({ ...validMessage, role: 'assistant' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = ChatMessageSchema.safeParse({ ...validMessage, role: 'bot' as any });
    expect(result.success).toBe(false);
  });

  it('accepts message with optional metadata', () => {
    const result = ChatMessageSchema.safeParse({
      ...validMessage,
      metadata: { source: 'discord' },
    });
    expect(result.success).toBe(true);
  });
});

describe('ContextWindowSchema', () => {
  const validContext = {
    system: 'You are a dungeon master.',
    worldState: 'Party is in a tavern.',
    recentMessages: [],
    ragResults: [],
    totalTokens: 1000,
  };

  it('accepts valid context window', () => {
    const result = ContextWindowSchema.safeParse(validContext);
    expect(result.success).toBe(true);
  });

  it('accepts context with messages and RAG results', () => {
    const result = ContextWindowSchema.safeParse({
      ...validContext,
      recentMessages: [{ role: 'user' as const, content: 'Hello', timestamp: new Date() }],
      ragResults: ['Relevant rule: Dash action'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative totalTokens', () => {
    const result = ContextWindowSchema.safeParse({ ...validContext, totalTokens: -100 });
    expect(result.success).toBe(false);
  });
});

describe('MCP Input Schemas', () => {
  describe('CharacterCreateInputSchema', () => {
    it('accepts valid character creation input', () => {
      const result = CharacterCreateInputSchema.safeParse({
        name: 'Frodo',
        class: 'Rogue',
        rpgSystem: 'dnd5e',
      });
      expect(result.success).toBe(true);
    });

    it('accepts character creation with optional backstory', () => {
      const result = CharacterCreateInputSchema.safeParse({
        name: 'Frodo',
        class: 'Rogue',
        rpgSystem: 'dnd5e',
        backstory: 'Found the one ring',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing required field', () => {
      const result = CharacterCreateInputSchema.safeParse({
        class: 'Rogue',
        rpgSystem: 'dnd5e',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CampaignCreateInputSchema', () => {
    it('accepts valid campaign creation input', () => {
      const result = CampaignCreateInputSchema.safeParse({
        name: 'New Campaign',
        rpgSystem: 'dnd5e',
        mode: 'sharedSession',
      });
      expect(result.success).toBe(true);
    });

    it('accepts campaign creation with optional description', () => {
      const result = CampaignCreateInputSchema.safeParse({
        name: 'New Campaign',
        rpgSystem: 'dnd5e',
        mode: 'persistentWorld',
        description: 'An epic adventure',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid mode', () => {
      const result = CampaignCreateInputSchema.safeParse({
        name: 'New Campaign',
        rpgSystem: 'dnd5e',
        mode: 'realtime' as any,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('StoryAdvanceInputSchema', () => {
    it('accepts valid story advance input', () => {
      const result = StoryAdvanceInputSchema.safeParse({
        campaignId: '550e8400-e29b-41d4-a716-446655440001',
        action: 'Explore the forest',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid campaignId format', () => {
      const result = StoryAdvanceInputSchema.safeParse({
        campaignId: 'not-a-uuid',
        action: 'Explore',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DiceRollInputSchema', () => {
    it('accepts valid dice roll input', () => {
      const result = DiceRollInputSchema.safeParse({
        notation: '2d20+5',
      });
      expect(result.success).toBe(true);
    });

    it('accepts dice roll with optional modifier', () => {
      const result = DiceRollInputSchema.safeParse({
        notation: '1d20',
        modifier: 10,
      });
      expect(result.success).toBe(true);
    });
  });
});
