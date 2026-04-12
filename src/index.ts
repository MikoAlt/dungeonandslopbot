import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import { createContainer } from './wiring.js';
import {
  setupErrorHandlers,
  setupDiscordCloseHandler,
  createShutdownHandler,
} from './events/error.js';
import { Logger } from './utils/logger.js';
import { loadCommands } from './handlers/commandHandler.js';
import { createReadyHandler } from './events/ready.js';
import { createInteractionHandler } from './events/interactionCreate.js';
import { loadConfig } from './config/index.js';

async function main(): Promise<void> {
  const config = loadConfig();

  Logger.info('Bot', 'Starting Dungeon and Slop bot...');

  const container = await createContainer();
  Logger.info('Bot', 'Container initialized');

  setupErrorHandlers(Logger);
  Logger.info('Bot', 'Error handlers configured');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
    ],
  });

  setupDiscordCloseHandler(client as Client<true>, Logger);
  Logger.info('Bot', 'Discord close handlers configured');

  const commands = await loadCommands();
  Logger.info('Bot', `Loaded ${commands.size} commands`);

  const readyHandler = createReadyHandler(commands, Logger);
  client.on(readyHandler.name, readyHandler.execute);

  const interactionHandler = createInteractionHandler(
    commands,
    container.rateLimiter,
    container.commandQueue,
    Logger,
  );
  client.on(interactionHandler.name, interactionHandler.execute);

  const shutdownHandler = createShutdownHandler(client as Client<true>, container, Logger);
  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);

  Logger.info('Bot', 'Logging in to Discord...');
  await client.login(config.DISCORD_TOKEN);
  Logger.info('Bot', 'Login successful');
}

main().catch((err) => {
  Logger.error('Bot', 'Failed to start bot', err);
  process.exit(1);
});
