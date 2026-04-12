import { Events, type Client } from 'discord.js';
import { Logger } from '../utils/logger.js';

export function createReadyHandler(
  commands: Map<string, { data: { name: string } }>,
  logger: typeof Logger = Logger,
) {
  return {
    name: Events.ClientReady as const,
    async execute(client: Client<true>): Promise<void> {
      logger.info('Bot', `Bot logged in as ${client.user.tag}`);

      if (commands.size > 0) {
        logger.info('Bot', `Registering ${commands.size} slash commands...`);
        await client.application.commands.set([...commands.values()].map((cmd) => cmd.data));
        logger.info('Bot', 'Slash commands registered.');
      }
    },
  };
}
