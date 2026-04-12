import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ClientEvents } from 'discord.js';

type EventHandler = (...args: unknown[]) => Promise<void> | void;

export async function loadEvents(client: import('discord.js').Client<true>): Promise<void> {
  const eventsPath = join(import.meta.dir, '../events');

  const files = await readdir(eventsPath, { withFileTypes: true });
  for (const file of files) {
    if (!file.name.endsWith('.ts') || file.name === 'index.ts') continue;

    const module = await import(join(eventsPath, file.name));
    const event = module.default as { name: keyof ClientEvents; execute: EventHandler } | undefined;
    if (event?.name && event?.execute) {
      client.on(event.name, event.execute);
    }
  }
}
