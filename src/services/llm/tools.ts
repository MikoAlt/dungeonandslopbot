import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { rollFromNotation } from '../rpg/dice.js';
import type {
  CharacterCreateInput,
  CampaignCreateInput,
  StoryAdvanceInput,
} from '../../types/index.js';

export const createCharacterTool = tool(
  (input: { name: string; characterClass: string; rpgSystem: string; backstory?: string }) => {
    const characterInput: CharacterCreateInput = {
      name: input.name,
      class: input.characterClass,
      rpgSystem: input.rpgSystem as 'dnd5e' | 'custom',
      backstory: input.backstory,
    };
    return JSON.stringify(characterInput);
  },
  {
    name: 'create_character',
    description:
      'Create a new RPG character. Use this when a player wants to create a character for a campaign.',
    schema: z.object({
      name: z.string().min(1).max(100).describe('Character name'),
      characterClass: z.string().describe('Character class (e.g., Fighter, Wizard, Rogue)'),
      rpgSystem: z.enum(['dnd5e', 'custom']).describe('RPG system to use'),
      backstory: z.string().optional().describe('Optional character backstory'),
    }),
  },
);

export const getCampaignTool = tool(
  (input: { campaignId: string }) => {
    return JSON.stringify({ action: 'get_campaign', campaignId: input.campaignId });
  },
  {
    name: 'get_campaign',
    description:
      'Retrieve campaign details by ID. Use this to look up information about the current campaign.',
    schema: z.object({
      campaignId: z.string().uuid().describe('The UUID of the campaign to retrieve'),
    }),
  },
);

export const storyAdvanceTool = tool(
  (input: { campaignId: string; action: string }) => {
    const advanceInput: StoryAdvanceInput = {
      campaignId: input.campaignId,
      action: input.action,
    };
    return JSON.stringify(advanceInput);
  },
  {
    name: 'story_advance',
    description:
      'Advance the story in a campaign. Use this when a player takes an action that moves the narrative forward.',
    schema: z.object({
      campaignId: z.string().uuid().describe('The UUID of the campaign'),
      action: z.string().min(1).describe('The action the player is taking in the story'),
    }),
  },
);

export const diceRollTool = tool(
  (input: { notation: string; modifier?: number }) => {
    try {
      const result = rollFromNotation(input.notation);
      const totalWithModifier = result.total + (input.modifier ?? 0);
      return JSON.stringify({
        notation: input.notation,
        rolls: result.rolls,
        modifier: input.modifier ?? 0,
        total: totalWithModifier,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return JSON.stringify({ error: message });
    }
  },
  {
    name: 'dice_roll',
    description:
      'Roll dice using standard RPG notation (e.g., "2d6+3", "1d20"). Use this when a dice roll is needed for game mechanics.',
    schema: z.object({
      notation: z.string().describe('Dice notation (e.g., "2d6+3", "1d20-1", "4d8")'),
      modifier: z
        .number()
        .int()
        .optional()
        .describe('Additional modifier to add to the roll result'),
    }),
  },
);

export const searchMemoryTool = tool(
  (input: { query: string; campaignId: string }) => {
    return JSON.stringify({
      action: 'search_memory',
      query: input.query,
      campaignId: input.campaignId,
      results: [],
      note: 'Memory search is a placeholder — will integrate with ContextManager for persistent storage',
    });
  },
  {
    name: 'search_memory',
    description:
      'Search memory for relevant past context from the campaign history. Use this to recall previous events, NPC interactions, or story details.',
    schema: z.object({
      query: z.string().min(1).describe('What to search for in campaign memory'),
      campaignId: z.string().uuid().describe('The UUID of the campaign to search within'),
    }),
  },
);

export const allTools = [
  createCharacterTool,
  getCampaignTool,
  storyAdvanceTool,
  diceRollTool,
  searchMemoryTool,
] as const;
