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
import type { AppContainer } from '../wiring.js';
import { NotFoundError, ValidationError } from '../errors.js';
import { rollFromNotation } from '../services/rpg/dice.js';

type ToolResponse = { content: [{ type: 'text'; text: string }] };
type ResourceResponse = { contents: [{ uri: string; text: string; mimeType: string }] };

// Global service container for handlers
let _container: AppContainer | null = null;

export function initHandlers(c: AppContainer): void {
  _container = c;
}

function getContainer(): AppContainer {
  if (!_container) {
    throw new Error('Handlers not initialized. Call initHandlers() first.');
  }
  return _container;
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

function successResponse(data: unknown): ToolResponse {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ success: true, data }),
      },
    ],
  };
}

// --- Tool Handlers ---

export async function characterCreateHandler(input: CharacterCreateInput): Promise<ToolResponse> {
  try {
    const container = getContainer();
    // userId is required by the service but not in MCP input
    // The MCP client must provide userId through connection context
    // For now, we require userId to be passed or fail
    const userId = (input as unknown as { userId?: string }).userId;
    if (!userId) {
      throw new ValidationError([{ message: 'userId is required but not provided in input' }]);
    }

    const character = await container.characterService.createCharacter(userId, {
      name: input.name,
      class: input.class,
      rpgSystem: input.rpgSystem,
      backstory: input.backstory,
    });
    return successResponse(character);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse('character_create', err.message);
    }
    if (err instanceof ValidationError) {
      return errorResponse('character_create', err.message);
    }
    return errorResponse('character_create', err instanceof Error ? err.message : String(err));
  }
}

export async function characterGetHandler(input: CharacterGetInput): Promise<ToolResponse> {
  try {
    const container = getContainer();
    const character = await container.characterService.getCharacter(input.id);
    return successResponse(character);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse('character_get', err.message);
    }
    if (err instanceof ValidationError) {
      return errorResponse('character_get', err.message);
    }
    return errorResponse('character_get', err instanceof Error ? err.message : String(err));
  }
}

export async function characterListHandler(input: CharacterListInput): Promise<ToolResponse> {
  try {
    const container = getContainer();
    const characters = await container.characterService.listCharacters(input.userId);
    // Optionally filter by campaignId if provided
    const filtered = input.campaignId
      ? characters.filter((c) => c.campaignId === input.campaignId)
      : characters;
    return successResponse(filtered);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse('character_list', err.message);
    }
    if (err instanceof ValidationError) {
      return errorResponse('character_list', err.message);
    }
    return errorResponse('character_list', err instanceof Error ? err.message : String(err));
  }
}

export async function characterUpdateHandler(input: CharacterUpdateInput): Promise<ToolResponse> {
  try {
    const container = getContainer();
    const updates = input.updates;

    // Determine which update method to call based on what fields are present
    let character;
    if ('stats' in updates && updates.stats) {
      character = await container.characterService.updateStats(input.id, updates.stats);
    } else if ('inventory' in updates && updates.inventory) {
      character = await container.characterService.updateInventory(input.id, updates.inventory);
    } else if ('hp' in updates) {
      const hpDelta = typeof updates.hp === 'number' ? updates.hp : 0;
      character = await container.characterService.modifyHp(input.id, hpDelta);
    } else {
      // Generic update - pass all updates to updateStats after filtering relevant fields
      const allowedKeys = ['name', 'class', 'level', 'hp', 'maxHp', 'backstory', 'campaignId'];
      const filteredUpdates: Record<string, unknown> = {};
      for (const key of allowedKeys) {
        if (key in updates) {
          filteredUpdates[key] = updates[key];
        }
      }
      // For simple updates, use modifyHp if only hp is provided, otherwise fall back to updateStats
      if (Object.keys(filteredUpdates).length === 1 && 'hp' in filteredUpdates) {
        character = await container.characterService.modifyHp(
          input.id,
          filteredUpdates.hp as number,
        );
      } else if (Object.keys(filteredUpdates).length > 0) {
        // For other updates, we need to call repo.update directly through a service method
        // Since CharacterService doesn't have a generic update, use the repo directly
        character = await container.characterRepo.update(input.id, filteredUpdates);
      } else {
        throw new ValidationError([{ message: 'No valid updates provided' }]);
      }
    }

    return successResponse(character);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse('character_update', err.message);
    }
    if (err instanceof ValidationError) {
      return errorResponse('character_update', err.message);
    }
    return errorResponse('character_update', err instanceof Error ? err.message : String(err));
  }
}

export async function campaignCreateHandler(input: CampaignCreateInput): Promise<ToolResponse> {
  try {
    const container = getContainer();
    // dmUserId, guildId, channelId are required by service but not in MCP input
    // MCP client should provide these through connection context
    const extra = input as unknown as { dmUserId?: string; guildId?: string; channelId?: string };
    if (!extra.dmUserId || !extra.guildId || !extra.channelId) {
      throw new ValidationError([
        { message: 'dmUserId, guildId, and channelId are required but not provided in input' },
      ]);
    }

    const campaign = await container.campaignService.createCampaign({
      name: input.name,
      description: input.description ?? '',
      rpgSystem: input.rpgSystem,
      mode: input.mode,
      dmUserId: extra.dmUserId,
      guildId: extra.guildId,
      channelId: extra.channelId,
    });
    return successResponse(campaign);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse('campaign_create', err.message);
    }
    if (err instanceof ValidationError) {
      return errorResponse('campaign_create', err.message);
    }
    return errorResponse('campaign_create', err instanceof Error ? err.message : String(err));
  }
}

export async function campaignGetHandler(input: CampaignGetInput): Promise<ToolResponse> {
  try {
    const container = getContainer();
    const campaign = await container.campaignService.getCampaign(input.id);
    return successResponse(campaign);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse('campaign_get', err.message);
    }
    if (err instanceof ValidationError) {
      return errorResponse('campaign_get', err.message);
    }
    return errorResponse('campaign_get', err instanceof Error ? err.message : String(err));
  }
}

export async function campaignListHandler(input: CampaignListInput): Promise<ToolResponse> {
  try {
    const container = getContainer();
    const campaigns = await container.campaignService.listCampaigns(input.guildId);
    return successResponse(campaigns);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse('campaign_list', err.message);
    }
    if (err instanceof ValidationError) {
      return errorResponse('campaign_list', err.message);
    }
    return errorResponse('campaign_list', err instanceof Error ? err.message : String(err));
  }
}

export async function campaignUpdateWorldStateHandler(
  input: CampaignUpdateWorldStateInput,
): Promise<ToolResponse> {
  try {
    const container = getContainer();
    const campaign = await container.campaignService.updateWorldState(input.id, input.worldState);
    return successResponse(campaign);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse('campaign_update_world_state', err.message);
    }
    if (err instanceof ValidationError) {
      return errorResponse('campaign_update_world_state', err.message);
    }
    return errorResponse(
      'campaign_update_world_state',
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function storyAdvanceHandler(input: StoryAdvanceInput): Promise<ToolResponse> {
  try {
    const container = getContainer();
    const story = await container.storyService.advanceScene(input.campaignId, {
      description: input.action,
      playerActions: [input.action],
    });
    return successResponse(story);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse('story_advance', err.message);
    }
    if (err instanceof ValidationError) {
      return errorResponse('story_advance', err.message);
    }
    return errorResponse('story_advance', err instanceof Error ? err.message : String(err));
  }
}

export async function storyGetHandler(input: StoryGetInput): Promise<ToolResponse> {
  try {
    const container = getContainer();
    const story = await container.storyService.getStoryByCampaignId(input.campaignId);
    return successResponse(story);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return errorResponse('story_get', err.message);
    }
    if (err instanceof ValidationError) {
      return errorResponse('story_get', err.message);
    }
    return errorResponse('story_get', err instanceof Error ? err.message : String(err));
  }
}

export async function diceRollHandler(input: DiceRollInput): Promise<ToolResponse> {
  try {
    const result = rollFromNotation(input.notation);
    // If input has a separate modifier, add it to the total
    const finalTotal = input.modifier !== undefined ? result.total + input.modifier : result.total;

    return successResponse({
      notation: input.notation,
      rolls: result.rolls,
      modifier: input.modifier ?? result.modifier,
      total: finalTotal,
    });
  } catch (err) {
    return errorResponse('dice_roll', err instanceof Error ? err.message : String(err));
  }
}

// --- Resource Handlers ---

function getLastPathSegment(uri: URL): string {
  const parts = uri.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

export async function campaignResourceHandler(uri: URL): Promise<ResourceResponse> {
  try {
    const container = getContainer();
    const id = getLastPathSegment(uri);
    const campaign = await container.campaignService.getCampaign(id);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ success: true, id: campaign.id, ...campaign }),
          mimeType: 'application/json',
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ success: false, error: message }),
          mimeType: 'application/json',
        },
      ],
    };
  }
}

export async function characterResourceHandler(uri: URL): Promise<ResourceResponse> {
  try {
    const container = getContainer();
    const id = getLastPathSegment(uri);
    const character = await container.characterService.getCharacter(id);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ success: true, id: character.id, ...character }),
          mimeType: 'application/json',
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ success: false, error: message }),
          mimeType: 'application/json',
        },
      ],
    };
  }
}

export async function storyResourceHandler(uri: URL): Promise<ResourceResponse> {
  try {
    const container = getContainer();
    const id = getLastPathSegment(uri);
    const story = await container.storyService.getStory(id);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ success: true, id: story.id, ...story }),
          mimeType: 'application/json',
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ success: false, error: message }),
          mimeType: 'application/json',
        },
      ],
    };
  }
}

export async function worldStateResourceHandler(uri: URL): Promise<ResourceResponse> {
  try {
    const container = getContainer();
    const pathname = uri.pathname.replace(/^\//, '').replace(/\/world-state$/, '');
    const parts = pathname.split('/');
    const campaignId = parts[parts.length - 1];

    const campaign = await container.campaignService.getCampaign(campaignId);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ success: true, id: campaign.id, ...campaign.worldState }),
          mimeType: 'application/json',
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ success: false, error: message }),
          mimeType: 'application/json',
        },
      ],
    };
  }
}

// Export errorResponse for testing
export { errorResponse };
