import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

export function createPaginationButtons(
  page: number,
  totalPages: number,
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`page_prev_${page}`)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),

    new ButtonBuilder()
      .setCustomId(`page_info_${page}`)
      .setLabel(`${page} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(`page_next_${page}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages),
  );

  return row;
}

export function createConfirmButtons(customId: string): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`${customId}_confirm`)
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`${customId}_cancel`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger),
  );

  return row;
}

export function createStatSelectMenu(
  customId: string,
  options: { label: string; value: string; description?: string }[],
): ActionRowBuilder<StringSelectMenuBuilder> {
  const row = new ActionRowBuilder<StringSelectMenuBuilder>();
  const menu = new StringSelectMenuBuilder().setCustomId(customId);

  for (const opt of options) {
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(opt.label)
        .setValue(opt.value)
        .setDescription(opt.description),
    );
  }

  row.addComponents(menu);
  return row;
}
