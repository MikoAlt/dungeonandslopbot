import { createMcpServer, pingHandler, statusHandler } from './server.js';
import { createTransport } from './transport.js';

export { createMcpServer, createTransport, pingHandler, statusHandler };
export { registerTools } from './tools.js';
export { registerResources } from './resources.js';
export {
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
} from './handlers.js';

export async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = createTransport();
  await server.connect(transport);
}
