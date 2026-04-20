import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Command } from '../../types/command.js';
import { Colors } from '../../embeds/themes.js';

export interface InventoryItem {
  name: string;
  quantity: number;
  description?: string;
}

export interface InventoryCommandServices {
  getCharacter?(characterId: string): Promise<{
    id: string;
    name: string;
    inventory: InventoryItem[];
  }>;
  updateInventory?(characterId: string, items: InventoryItem[]): Promise<void>;
}

export default {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Manage character inventory')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List inventory items')
        .addStringOption((option) =>
          option.setName('character-id').setDescription('Character ID').setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add an item to inventory')
        .addStringOption((option) =>
          option.setName('character-id').setDescription('Character ID').setRequired(true),
        )
        .addStringOption((option) =>
          option.setName('item-name').setDescription('Item name').setRequired(true),
        )
        .addIntegerOption((option) =>
          option.setName('quantity').setDescription('Quantity').setRequired(true),
        )
        .addStringOption((option) =>
          option.setName('description').setDescription('Item description'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove an item from inventory')
        .addStringOption((option) =>
          option.setName('character-id').setDescription('Character ID').setRequired(true),
        )
        .addStringOption((option) =>
          option.setName('item-name').setDescription('Item name').setRequired(true),
        )
        .addIntegerOption((option) =>
          option.setName('quantity').setDescription('Quantity to remove'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('use')
        .setDescription('Use an item from inventory')
        .addStringOption((option) =>
          option.setName('character-id').setDescription('Character ID').setRequired(true),
        )
        .addStringOption((option) =>
          option.setName('item-name').setDescription('Item name').setRequired(true),
        ),
    ),

  async execute(interaction, services?: InventoryCommandServices) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const subcommand = interaction.options.getSubcommand();
    const characterId = interaction.options.getString('character-id', true);

    switch (subcommand) {
      case 'list': {
        if (!services?.getCharacter) {
          await interaction.editReply({
            content: '❌ Character service not available. Please try again later.',
          });
          return;
        }

        try {
          const character = await services.getCharacter(characterId);
          const embed = new EmbedBuilder()
            .setTitle(`📦 ${character.name}'s Inventory`)
            .setColor(Colors.INFO);

          if (character.inventory.length === 0) {
            embed.setDescription('Your inventory is empty.');
          } else {
            const items = character.inventory
              .map(
                (item) =>
                  `• ${item.name} x${item.quantity}${item.description ? ` - ${item.description}` : ''}`,
              )
              .join('\n');
            embed.setDescription(items.slice(0, 4096));
          }

          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to get inventory';
          await interaction.editReply({ content: `❌ ${message}` });
        }
        break;
      }

      case 'add': {
        if (!services?.updateInventory || !services?.getCharacter) {
          await interaction.editReply({
            content: '❌ Character service not available. Please try again later.',
          });
          return;
        }

        const itemName = interaction.options.getString('item-name', true);
        const quantity = interaction.options.getInteger('quantity', true);
        const description = interaction.options.getString('description');

        try {
          const character = await services.getCharacter(characterId);
          const existingItem = character.inventory.find(
            (item) => item.name.toLowerCase() === itemName.toLowerCase(),
          );

          let newInventory: InventoryItem[];
          if (existingItem) {
            existingItem.quantity += quantity;
            newInventory = character.inventory;
          } else {
            newInventory = [...character.inventory, { name: itemName, quantity, description }];
          }

          await services.updateInventory(characterId, newInventory);

          const embed = new EmbedBuilder()
            .setTitle('✅ Item Added')
            .setColor(Colors.SUCCESS)
            .setDescription(`Added ${quantity}x ${itemName} to your inventory.`);

          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add item';
          await interaction.editReply({ content: `❌ ${message}` });
        }
        break;
      }

      case 'remove': {
        if (!services?.updateInventory || !services?.getCharacter) {
          await interaction.editReply({
            content: '❌ Character service not available. Please try again later.',
          });
          return;
        }

        const itemName = interaction.options.getString('item-name', true);
        const removeQty = interaction.options.getInteger('quantity') ?? 1;

        try {
          const character = await services.getCharacter(characterId);
          const existingItem = character.inventory.find(
            (item) => item.name.toLowerCase() === itemName.toLowerCase(),
          );

          if (!existingItem) {
            await interaction.editReply({
              content: `❌ Item "${itemName}" not found in inventory.`,
            });
            return;
          }

          if (existingItem.quantity < removeQty) {
            await interaction.editReply({
              content: `❌ You only have ${existingItem.quantity}x ${itemName}.`,
            });
            return;
          }

          let newInventory: InventoryItem[];
          if (existingItem.quantity === removeQty) {
            newInventory = character.inventory.filter(
              (item) => item.name.toLowerCase() !== itemName.toLowerCase(),
            );
          } else {
            existingItem.quantity -= removeQty;
            newInventory = character.inventory;
          }

          await services.updateInventory(characterId, newInventory);

          const embed = new EmbedBuilder()
            .setTitle('✅ Item Removed')
            .setColor(Colors.SUCCESS)
            .setDescription(`Removed ${removeQty}x ${itemName} from your inventory.`);

          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to remove item';
          await interaction.editReply({ content: `❌ ${message}` });
        }
        break;
      }

      case 'use': {
        if (!services?.updateInventory || !services?.getCharacter) {
          await interaction.editReply({
            content: '❌ Character service not available. Please try again later.',
          });
          return;
        }

        const itemName = interaction.options.getString('item-name', true);

        try {
          const character = await services.getCharacter(characterId);
          const existingItem = character.inventory.find(
            (item) => item.name.toLowerCase() === itemName.toLowerCase(),
          );

          if (!existingItem) {
            await interaction.editReply({
              content: `❌ Item "${itemName}" not found in inventory.`,
            });
            return;
          }

          const embed = new EmbedBuilder()
            .setTitle(`✅ Using ${itemName}`)
            .setColor(Colors.INFO)
            .setDescription(
              existingItem.description
                ? `You use ${itemName}: ${existingItem.description}`
                : `You use ${itemName}.`,
            );

          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to use item';
          await interaction.editReply({ content: `❌ ${message}` });
        }
        break;
      }

      default:
        await interaction.editReply({ content: '❌ Invalid subcommand' });
    }
  },
} satisfies Command;
