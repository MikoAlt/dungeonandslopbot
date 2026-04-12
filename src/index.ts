import { Client, GatewayIntentBits } from 'discord.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { createReadyHandler } from './events/ready.js';
import { event as interactionEvent } from './events/interactionCreate.js';
import 'dotenv/config';

const { DISCORD_TOKEN } = process.env;
if (!DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = await loadCommands();

const readyHandler = createReadyHandler(commands);
client.on(readyHandler.name, readyHandler.execute);
client.on(interactionEvent.name, (interaction) => interactionEvent.execute(interaction, commands));

await loadEvents(client);
await client.login(DISCORD_TOKEN);
