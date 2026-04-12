import { REST, Routes } from 'discord.js';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import 'dotenv/config';

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID');
  process.exit(1);
}

async function loadCommands(): Promise<unknown[]> {
  const commands = [];
  const commandsPath = join(import.meta.dir, 'commands');

  const files = await readdir(commandsPath, { withFileTypes: true });
  for (const file of files) {
    if (!file.name.endsWith('.ts') || file.name === 'index.ts') continue;

    const module = await import(join(commandsPath, file.name));
    const cmd = module.default;
    if (cmd?.data) {
      commands.push(cmd.data.toJSON());
    }
  }

  return commands;
}

const rest = new REST().setToken(DISCORD_TOKEN);
const commands = await loadCommands();

try {
  console.log(`Registering ${commands.length} commands...`);
  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Commands registered globally.');
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Commands registered to guild.');
  }
} catch (error) {
  console.error('Failed to register commands:', error);
  process.exit(1);
}
