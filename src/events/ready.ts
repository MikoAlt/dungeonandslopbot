import { Events, type Client } from 'discord.js';

export function createReadyHandler(commands: Map<string, { data: { name: string } }>) {
  return {
    name: Events.ClientReady as const,
    async execute(client: Client<true>): Promise<void> {
      console.log(`Bot logged in as ${client.user.tag}`);

      if (commands.size > 0) {
        console.log(`Registering ${commands.size} slash commands...`);
        await client.application.commands.set([...commands.values()].map((cmd) => cmd.data));
        console.log('Slash commands registered.');
      }
    },
  };
}
