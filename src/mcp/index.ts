import { createMcpServer, pingHandler, statusHandler } from './server.js';
import { createTransport } from './transport.js';

export { createMcpServer, createTransport, pingHandler, statusHandler };

export async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = createTransport();
  await server.connect(transport);
}
