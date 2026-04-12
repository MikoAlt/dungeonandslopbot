import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PingInputSchema } from './types.js';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'dungeon-and-slop',
    version: '0.1.0',
  });

  registerPlaceholderTools(server);
  registerPlaceholderResources(server);

  return server;
}

export async function pingHandler(): Promise<{ content: [{ type: 'text'; text: string }] }> {
  return { content: [{ type: 'text' as const, text: 'pong' }] };
}

export async function statusHandler(
  uri: URL,
): Promise<{ contents: [{ uri: string; text: string; mimeType: string }] }> {
  const status = JSON.stringify({ status: 'ok', version: '0.1.0' });
  return { contents: [{ uri: uri.href, text: status, mimeType: 'application/json' }] };
}

function registerPlaceholderTools(server: McpServer): void {
  server.registerTool(
    'dungeon_ping',
    {
      description: 'Ping the dungeon bot to verify connectivity',
      inputSchema: PingInputSchema,
    },
    pingHandler,
  );
}

function registerPlaceholderResources(server: McpServer): void {
  server.registerResource(
    'status',
    'dungeon://status',
    {
      description: 'Get the current status of the dungeon bot',
      mimeType: 'application/json',
    },
    statusHandler,
  );
}
