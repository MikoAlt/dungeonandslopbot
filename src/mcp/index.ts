import { createMcpServer, pingHandler, statusHandler } from './server.js';
import { createTransport } from './transport.js';
import type { AppContainer } from '../wiring.js';

export { createMcpServer, createTransport, pingHandler, statusHandler };
export { registerTools } from './tools.js';
export { registerResources } from './resources.js';
export {
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
} from './handlers.js';

export async function startMcpServer(container: AppContainer): Promise<void> {
  initHandlers(container);
  const server = createMcpServer();
  const transport = createTransport();
  await server.connect(transport);
}
