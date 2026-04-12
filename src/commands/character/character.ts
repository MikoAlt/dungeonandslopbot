import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { CharacterService } from '../../services/character.js';
import { CharacterRepository } from '../../db/repositories/character.js';
import { renderCharacterSheet, renderCharacterMini } from '../../embeds/renderers/character.js';
import { prisma } from '../../db/prisma.js';

const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Character management commands')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('create')
      .setDescription('Create a new character')
      .addStringOption((option) =>
        option.setName('name').setDescription('Character name').setRequired(true),
      )
      .addStringOption((option) =>
        option.setName('class').setDescription('Character class').setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName('system')
          .setDescription('RPG system')
          .addChoices({ name: 'D&D 5e', value: 'dnd5e' }, { name: 'Custom', value: 'custom' })
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName('backstory')
          .setDescription('Character backstory (optional)')
          .setRequired(false),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('sheet')
      .setDescription('View your character sheet')
      .addStringOption((option) =>
        option
          .setName('character-id')
          .setDescription('Specific character ID to view')
          .setRequired(false),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('list').setDescription('List all your characters'),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('update')
      .setDescription('Update a character')
      .addStringOption((option) =>
        option.setName('character-id').setDescription('Character ID to update').setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName('action')
          .setDescription('Update action')
          .addChoices(
            { name: 'Add Item', value: 'add-item' },
            { name: 'Remove Item', value: 'remove-item' },
          )
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName('item-name')
          .setDescription('Item name (for add/remove item)')
          .setRequired(false),
      )
      .addNumberOption((option) =>
        option
          .setName('quantity')
          .setDescription('Item quantity (for add item)')
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName('description')
          .setDescription('Item description (for add item)')
          .setRequired(false),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('delete')
      .setDescription('Delete a character')
      .addStringOption((option) =>
        option.setName('character-id').setDescription('Character ID to delete').setRequired(true),
      )
      .addBooleanOption((option) =>
        option.setName('confirm').setDescription('Confirm deletion').setRequired(true),
      ),
  );

export default {
  data: data as SlashCommandBuilder,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const repo = new CharacterRepository(prisma);
    const characterService = new CharacterService(repo);

    switch (subcommand) {
      case 'create': {
        const name = interaction.options.getString('name', true);
        const characterClass = interaction.options.getString('class', true);
        const system = interaction.options.getString('system', true) as 'dnd5e' | 'custom';
        const backstory = interaction.options.getString('backstory') ?? undefined;

        const character = await characterService.createCharacter(userId, {
          name,
          class: characterClass,
          rpgSystem: system,
          backstory,
        });

        const embeds = renderCharacterSheet(character);
        await interaction.editReply({ embeds });
        break;
      }

      case 'sheet': {
        const characterId = interaction.options.getString('character-id');

        let character;
        if (characterId) {
          character = await characterService.getCharacter(characterId);
          if (character.userId !== userId) {
            await interaction.editReply({
              content: 'You can only view your own character sheets.',
            });
            return;
          }
        } else {
          const characters = await characterService.listCharacters(userId);
          if (characters.length === 0) {
            await interaction.editReply({
              content: 'You have no characters. Use /character create to make one!',
            });
            return;
          }
          character = characters[0];
        }

        const embeds = renderCharacterSheet(character);
        await interaction.editReply({ embeds });
        break;
      }

      case 'list': {
        const characters = await characterService.listCharacters(userId);

        if (characters.length === 0) {
          await interaction.editReply({
            content: 'You have no characters. Use /character create to make one!',
          });
          return;
        }

        const embeds = characters.map((character) => renderCharacterMini(character));
        await interaction.editReply({ embeds });
        break;
      }

      case 'update': {
        const characterId = interaction.options.getString('character-id', true);
        const action = interaction.options.getString('action', true) as 'add-item' | 'remove-item';

        const character = await characterService.getCharacter(characterId);

        if (character.userId !== userId) {
          await interaction.editReply({ content: 'You can only update your own characters.' });
          return;
        }

        if (action === 'add-item') {
          const itemName = interaction.options.getString('item-name');
          const quantity = interaction.options.getNumber('quantity') ?? 1;
          const description = interaction.options.getString('description');

          if (!itemName) {
            await interaction.editReply({ content: 'Item name is required for add-item action.' });
            return;
          }

          const newItem = { name: itemName, quantity, description };
          const updatedInventory = [...character.inventory, newItem];
          const updated = await characterService.updateInventory(characterId, updatedInventory);
          const embeds = renderCharacterSheet(updated);
          await interaction.editReply({ embeds });
        } else if (action === 'remove-item') {
          const itemName = interaction.options.getString('item-name');

          if (!itemName) {
            await interaction.editReply({
              content: 'Item name is required for remove-item action.',
            });
            return;
          }

          const itemIndex = character.inventory.findIndex(
            (item) => item.name.toLowerCase() === itemName.toLowerCase(),
          );

          if (itemIndex === -1) {
            await interaction.editReply({ content: `Item "${itemName}" not found in inventory.` });
            return;
          }

          const updatedInventory = character.inventory.filter((_, i) => i !== itemIndex);
          const updated = await characterService.updateInventory(characterId, updatedInventory);
          const embeds = renderCharacterSheet(updated);
          await interaction.editReply({ embeds });
        }
        break;
      }

      case 'delete': {
        const characterId = interaction.options.getString('character-id', true);
        const confirm = interaction.options.getBoolean('confirm', true);

        const character = await characterService.getCharacter(characterId);

        if (character.userId !== userId) {
          await interaction.editReply({ content: 'You can only delete your own characters.' });
          return;
        }

        if (!confirm) {
          await interaction.editReply({
            content: `Are you sure you want to delete **${character.name}**? Run the command again with \`confirm: true\` to confirm deletion.`,
          });
          return;
        }

        await characterService.deleteCharacter(characterId);
        await interaction.editReply({ content: `**${character.name}** has been deleted.` });
        break;
      }

      default:
        await interaction.editReply({ content: 'Invalid subcommand' });
    }
  },
} satisfies Command;
