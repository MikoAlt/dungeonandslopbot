import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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
} from './types.js';
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
} from './handlers.js';

export function registerTools(server: McpServer): void {
  server.registerTool(
    'character_create',
    {
      description: 'Create a new character',
      inputSchema: CharacterCreateInputSchema,
    },
    characterCreateHandler,
  );

  server.registerTool(
    'character_get',
    {
      description: 'Get character details by ID',
      inputSchema: CharacterGetInputSchema,
    },
    characterGetHandler,
  );

  server.registerTool(
    'character_list',
    {
      description: 'List characters for a user or campaign',
      inputSchema: CharacterListInputSchema,
    },
    characterListHandler,
  );

  server.registerTool(
    'character_update',
    {
      description: 'Update character stats, inventory, or HP',
      inputSchema: CharacterUpdateInputSchema,
    },
    characterUpdateHandler,
  );

  server.registerTool(
    'campaign_create',
    {
      description: 'Create a new campaign',
      inputSchema: CampaignCreateInputSchema,
    },
    campaignCreateHandler,
  );

  server.registerTool(
    'campaign_get',
    {
      description: 'Get campaign details by ID',
      inputSchema: CampaignGetInputSchema,
    },
    campaignGetHandler,
  );

  server.registerTool(
    'campaign_list',
    {
      description: 'List campaigns for a guild',
      inputSchema: CampaignListInputSchema,
    },
    campaignListHandler,
  );

  server.registerTool(
    'campaign_update_world_state',
    {
      description: 'Update the world state of a campaign',
      inputSchema: CampaignUpdateWorldStateInputSchema,
    },
    campaignUpdateWorldStateHandler,
  );

  server.registerTool(
    'story_advance',
    {
      description: 'Advance the story with a player action',
      inputSchema: StoryAdvanceInputSchema,
    },
    storyAdvanceHandler,
  );

  server.registerTool(
    'story_get',
    {
      description: 'Get the current story state for a campaign',
      inputSchema: StoryGetInputSchema,
    },
    storyGetHandler,
  );

  server.registerTool(
    'dice_roll',
    {
      description: 'Roll dice using standard notation (e.g., 2d6, 1d20+5)',
      inputSchema: DiceRollInputSchema,
    },
    diceRollHandler,
  );
}
