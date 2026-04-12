import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Command } from '../types/command.js';

async function loadCommandsFromDir(commandsPath: string): Promise<Map<string, Command>> {
  const commands = new Map<string, Command>();

  const files = await readdir(commandsPath, { withFileTypes: true });
  for (const file of files) {
    const fullPath = join(commandsPath, file.name);

    if (file.isDirectory()) {
      const subCommands = await loadCommandsFromDir(fullPath);
      for (const [name, cmd] of subCommands) {
        commands.set(name, cmd);
      }
    } else if (file.name.endsWith('.ts') && file.name !== 'index.ts') {
      const module = await import(fullPath);
      const cmd = module.default as Command | undefined;
      if (cmd?.data && cmd?.execute) {
        commands.set(cmd.data.name, cmd);
      }
    }
  }

  return commands;
}

export async function loadCommands(): Promise<Map<string, Command>> {
  const commandsPath = join(import.meta.dir, '../commands');
  return loadCommandsFromDir(commandsPath);
}
