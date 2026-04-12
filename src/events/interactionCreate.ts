import {
  Events,
  type ChatInputCommandInteraction,
  type Interaction,
  MessageFlags,
} from 'discord.js';
import type { Command } from '../types/command.js';
import { CommandType } from '../config/rate-limits.js';
import { Logger } from '../utils/logger.js';

const COMMAND_TYPE_MAP: Record<string, (typeof CommandType)[keyof typeof CommandType]> = {
  dice: CommandType.DICE,
  story: CommandType.STORY,
  advance: CommandType.STORY,
  summary: CommandType.STORY,
  character: CommandType.CHARACTER,
  create: CommandType.CHARACTER,
  inventory: CommandType.CHARACTER,
  stats: CommandType.CHARACTER,
  campaign: CommandType.CAMPAIGN,
  'campaign.create': CommandType.CAMPAIGN,
  'campaign.join': CommandType.CAMPAIGN,
  'campaign.leave': CommandType.CAMPAIGN,
  'campaign.status': CommandType.CAMPAIGN,
  'campaign.end': CommandType.CAMPAIGN,
  combat: CommandType.COMBAT,
  explore: CommandType.STORY,
  'skill-check': CommandType.CHARACTER,
};

function getCommandType(commandName: string): (typeof CommandType)[keyof typeof CommandType] {
  return COMMAND_TYPE_MAP[commandName] ?? CommandType.CHARACTER;
}

export function createInteractionHandler(
  commands: Map<string, Command>,
  rateLimiter: {
    consume: (
      userId: string,
      commandType: (typeof CommandType)[keyof typeof CommandType],
    ) => boolean;
  },
  commandQueue: {
    enqueue: (userId: string, command: { id: string; execute: () => Promise<unknown> }) => void;
  },
  logger: typeof Logger,
) {
  return {
    name: Events.InteractionCreate as const,
    async execute(interaction: Interaction): Promise<void> {
      if (!interaction.isChatInputCommand()) return;

      const command = commands.get(interaction.commandName);
      if (!command) {
        await interaction.reply({
          content: 'Unknown command.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const userId = interaction.user.id;
      const commandType = getCommandType(interaction.commandName);

      if (!rateLimiter.consume(userId, commandType)) {
        logger.warn(
          'RateLimiter',
          `User ${userId} rate limited for command ${interaction.commandName}`,
        );
        await interaction.reply({
          content: 'You are rate limited. Please wait before using this command again.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      commandQueue.enqueue(userId, {
        id: `${interaction.commandName}-${Date.now()}`,
        execute: async () => {
          try {
            await command.execute(interaction);
          } catch (error) {
            logger.error('Command', `Error executing command ${interaction.commandName}`, error);
            const content =
              error instanceof Error
                ? error.message
                : 'An error occurred while executing this command.';
            if (interaction.replied || interaction.deferred) {
              await interaction.editReply({ content });
            } else {
              await interaction.reply({
                content,
                flags: MessageFlags.Ephemeral,
              });
            }
          }
        },
      });
    },
  };
}
