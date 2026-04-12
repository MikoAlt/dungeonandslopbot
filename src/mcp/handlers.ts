import type {
  CharacterCreateInput,
  CharacterGetInput,
  CharacterListInput,
  CharacterUpdateInput,
  CampaignCreateInput,
  CampaignGetInput,
  CampaignListInput,
  CampaignUpdateWorldStateInput,
  StoryAdvanceInput,
  StoryGetInput,
  DiceRollInput,
} from './types.js';

type ToolResponse = { content: [{ type: 'text'; text: string }] };
type ResourceResponse = { contents: [{ uri: string; text: string; mimeType: string }] };

function placeholderResponse(toolName: string, data: Record<string, unknown>): ToolResponse {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ success: true, message: `${toolName} not yet connected`, data }),
      },
    ],
  };
}

function errorResponse(toolName: string, message: string): ToolResponse {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ success: false, error: `${toolName}: ${message}` }),
      },
    ],
  };
}

// --- Tool Handlers ---

export async function characterCreateHandler(input: CharacterCreateInput): Promise<ToolResponse> {
  return placeholderResponse('character_create', {
    name: input.name,
    class: input.class,
    rpgSystem: input.rpgSystem,
    backstory: input.backstory ?? null,
  });
}

export async function characterGetHandler(input: CharacterGetInput): Promise<ToolResponse> {
  return placeholderResponse('character_get', { id: input.id });
}

export async function characterListHandler(input: CharacterListInput): Promise<ToolResponse> {
  return placeholderResponse('character_list', {
    userId: input.userId,
    campaignId: input.campaignId ?? null,
  });
}

export async function characterUpdateHandler(input: CharacterUpdateInput): Promise<ToolResponse> {
  return placeholderResponse('character_update', { id: input.id, updates: input.updates });
}

export async function campaignCreateHandler(input: CampaignCreateInput): Promise<ToolResponse> {
  return placeholderResponse('campaign_create', {
    name: input.name,
    rpgSystem: input.rpgSystem,
    mode: input.mode,
    description: input.description ?? null,
  });
}

export async function campaignGetHandler(input: CampaignGetInput): Promise<ToolResponse> {
  return placeholderResponse('campaign_get', { id: input.id });
}

export async function campaignListHandler(input: CampaignListInput): Promise<ToolResponse> {
  return placeholderResponse('campaign_list', { guildId: input.guildId });
}

export async function campaignUpdateWorldStateHandler(
  input: CampaignUpdateWorldStateInput,
): Promise<ToolResponse> {
  return placeholderResponse('campaign_update_world_state', {
    id: input.id,
    worldState: input.worldState,
  });
}

export async function storyAdvanceHandler(input: StoryAdvanceInput): Promise<ToolResponse> {
  return placeholderResponse('story_advance', {
    campaignId: input.campaignId,
    action: input.action,
  });
}

export async function storyGetHandler(input: StoryGetInput): Promise<ToolResponse> {
  return placeholderResponse('story_get', { campaignId: input.campaignId });
}

export async function diceRollHandler(input: DiceRollInput): Promise<ToolResponse> {
  return placeholderResponse('dice_roll', {
    notation: input.notation,
    modifier: input.modifier ?? null,
  });
}

// --- Resource Handlers ---

export async function campaignResourceHandler(uri: URL): Promise<ResourceResponse> {
  const id = uri.pathname.replace(/^\//, '');
  return {
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({ success: true, message: 'campaign resource not yet connected', id }),
        mimeType: 'application/json',
      },
    ],
  };
}

export async function characterResourceHandler(uri: URL): Promise<ResourceResponse> {
  const id = uri.pathname.replace(/^\//, '');
  return {
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({
          success: true,
          message: 'character resource not yet connected',
          id,
        }),
        mimeType: 'application/json',
      },
    ],
  };
}

export async function storyResourceHandler(uri: URL): Promise<ResourceResponse> {
  const id = uri.pathname.replace(/^\//, '');
  return {
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({ success: true, message: 'story resource not yet connected', id }),
        mimeType: 'application/json',
      },
    ],
  };
}

export async function worldStateResourceHandler(uri: URL): Promise<ResourceResponse> {
  const id = uri.pathname.replace(/^\//, '').replace(/\/world-state$/, '');
  return {
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({
          success: true,
          message: 'world-state resource not yet connected',
          id,
        }),
        mimeType: 'application/json',
      },
    ],
  };
}

// Export errorResponse for testing
export { errorResponse };
