import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  campaignResourceHandler,
  characterResourceHandler,
  storyResourceHandler,
  worldStateResourceHandler,
} from './handlers.js';

export function registerResources(server: McpServer): void {
  server.registerResource(
    'campaign',
    'dungeon://campaigns/{id}',
    {
      description: 'Read-only campaign data',
      mimeType: 'application/json',
    },
    campaignResourceHandler,
  );

  server.registerResource(
    'character',
    'dungeon://characters/{id}',
    {
      description: 'Read-only character data',
      mimeType: 'application/json',
    },
    characterResourceHandler,
  );

  server.registerResource(
    'story',
    'dungeon://stories/{id}',
    {
      description: 'Read-only story data',
      mimeType: 'application/json',
    },
    storyResourceHandler,
  );

  server.registerResource(
    'world-state',
    'dungeon://campaigns/{id}/world-state',
    {
      description: 'Read-only world state for a campaign',
      mimeType: 'application/json',
    },
    worldStateResourceHandler,
  );
}
