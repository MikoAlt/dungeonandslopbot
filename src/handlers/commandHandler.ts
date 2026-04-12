import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Command } from '../types/command.js';

export async function loadCommands(): Promise<Map<string, Command>> {
  const commands = new Map<string, Command>();
  const commandsPath = join(import.meta.dir, '../commands');

  const files = await readdir(commandsPath, { withFileTypes: true });
  for (const file of files) {
    if (!file.name.endsWith('.ts') || file.name === 'index.ts') continue;

    const module = await import(join(commandsPath, file.name));
    const cmd = module.default as Command | undefined;
    if (cmd?.data && cmd?.execute) {
      commands.set(cmd.data.name, cmd);
    }
  }

  return commands;
}
