import { describe, test, expect, beforeEach } from 'bun:test';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpServer, createTransport, pingHandler, statusHandler } from '../../src/mcp/index';
import {
  PingInputSchema,
  CharacterCreateInputSchema,
  CharacterGetInputSchema,
  CampaignCreateInputSchema,
  StoryAdvanceInputSchema,
  DiceRollInputSchema,
} from '../../src/mcp/types';

describe('MCP Server', () => {
  let server: McpServer;

  beforeEach(() => {
    server = createMcpServer();
  });

  test('createMcpServer returns an McpServer instance', () => {
    expect(server).toBeInstanceOf(McpServer);
  });

  test('createTransport returns a StdioServerTransport instance', () => {
    const transport = createTransport();
    expect(transport).toBeDefined();
    expect(typeof transport).toBe('object');
  });
});

describe('MCP Tools', () => {
  test('dungeon_ping tool returns pong response', async () => {
    const result = await pingHandler();
    expect(result).toEqual({ content: [{ type: 'text', text: 'pong' }] });
  });
});

describe('MCP Resources', () => {
  test('dungeon://status resource returns ok status', async () => {
    const result = await statusHandler(new URL('dungeon://status'));
    const parsed = JSON.parse(result.contents[0].text);
    expect(parsed.status).toBe('ok');
    expect(parsed.version).toBe('0.1.0');
  });
});

describe('Zod Schemas - Validation', () => {
  describe('PingInputSchema', () => {
    test('accepts empty object', () => {
      const result = PingInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    test('rejects non-empty object', () => {
      const result = PingInputSchema.safeParse({ foo: 'bar' });
      expect(result.success).toBe(false);
    });
  });

  describe('CharacterCreateInputSchema', () => {
    test('accepts valid input with required fields', () => {
      const result = CharacterCreateInputSchema.safeParse({
        name: 'Gandalf',
        class: 'Wizard',
        rpgSystem: 'dnd5e',
      });
      expect(result.success).toBe(true);
    });

    test('accepts valid input with optional backstory', () => {
      const result = CharacterCreateInputSchema.safeParse({
        name: 'Gandalf',
        class: 'Wizard',
        rpgSystem: 'dnd5e',
        backstory: 'A wizard who came from Valinor',
      });
      expect(result.success).toBe(true);
    });

    test('accepts custom rpgSystem', () => {
      const result = CharacterCreateInputSchema.safeParse({
        name: 'Bob',
        class: 'Fighter',
        rpgSystem: 'custom',
      });
      expect(result.success).toBe(true);
    });

    test('rejects missing name', () => {
      const result = CharacterCreateInputSchema.safeParse({
        class: 'Wizard',
        rpgSystem: 'dnd5e',
      });
      expect(result.success).toBe(false);
    });

    test('rejects missing class', () => {
      const result = CharacterCreateInputSchema.safeParse({
        name: 'Gandalf',
        rpgSystem: 'dnd5e',
      });
      expect(result.success).toBe(false);
    });

    test('rejects invalid rpgSystem', () => {
      const result = CharacterCreateInputSchema.safeParse({
        name: 'Gandalf',
        class: 'Wizard',
        rpgSystem: 'pathfinder',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CharacterGetInputSchema', () => {
    test('accepts valid id', () => {
      const result = CharacterGetInputSchema.safeParse({ id: 'char_123' });
      expect(result.success).toBe(true);
    });

    test('rejects missing id', () => {
      const result = CharacterGetInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('CampaignCreateInputSchema', () => {
    test('accepts valid input with required fields', () => {
      const result = CampaignCreateInputSchema.safeParse({
        name: 'The Lost Mine',
        rpgSystem: 'dnd5e',
        mode: 'sharedSession',
      });
      expect(result.success).toBe(true);
    });

    test('accepts all mode options', () => {
      const modes = ['sharedSession', 'persistentWorld', 'async'];
      for (const mode of modes) {
        const result = CampaignCreateInputSchema.safeParse({
          name: 'Test Campaign',
          rpgSystem: 'dnd5e',
          mode,
        });
        expect(result.success).toBe(true);
      }
    });

    test('accepts optional description', () => {
      const result = CampaignCreateInputSchema.safeParse({
        name: 'The Lost Mine',
        rpgSystem: 'dnd5e',
        mode: 'sharedSession',
        description: 'A classic D&D adventure',
      });
      expect(result.success).toBe(true);
    });

    test('rejects invalid mode', () => {
      const result = CampaignCreateInputSchema.safeParse({
        name: 'The Lost Mine',
        rpgSystem: 'dnd5e',
        mode: 'battleRoyale',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('StoryAdvanceInputSchema', () => {
    test('accepts valid input', () => {
      const result = StoryAdvanceInputSchema.safeParse({
        campaignId: 'camp_123',
        action: 'The hero attacks the dragon',
      });
      expect(result.success).toBe(true);
    });

    test('rejects missing campaignId', () => {
      const result = StoryAdvanceInputSchema.safeParse({
        action: 'The hero attacks the dragon',
      });
      expect(result.success).toBe(false);
    });

    test('rejects missing action', () => {
      const result = StoryAdvanceInputSchema.safeParse({
        campaignId: 'camp_123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DiceRollInputSchema', () => {
    test('accepts valid notation', () => {
      const result = DiceRollInputSchema.safeParse({ notation: '2d20+5' });
      expect(result.success).toBe(true);
    });

    test('accepts notation with modifier', () => {
      const result = DiceRollInputSchema.safeParse({
        notation: '1d20',
        modifier: 10,
      });
      expect(result.success).toBe(true);
    });

    test('rejects missing notation', () => {
      const result = DiceRollInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    test('rejects non-string notation', () => {
      const result = DiceRollInputSchema.safeParse({ notation: 123 });
      expect(result.success).toBe(false);
    });
  });
});
