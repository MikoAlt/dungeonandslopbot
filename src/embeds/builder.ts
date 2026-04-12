import { EmbedBuilder } from 'discord.js';
import { Colors } from './themes.js';

const DEFAULT_COLOR = Colors.INFO;
const DEFAULT_FOOTER = 'Dungeon & Slop';
const MAX_FIELD_NAME = 256;
const MAX_FIELD_VALUE = 1024;

export function createBaseEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(DEFAULT_COLOR)
    .setFooter({ text: DEFAULT_FOOTER })
    .setTimestamp();
}

export function addFieldSafe(
  embed: EmbedBuilder,
  name: string,
  value: string,
  inline = false,
): EmbedBuilder {
  const truncatedName =
    name.length > MAX_FIELD_NAME ? name.slice(0, MAX_FIELD_NAME - 3) + '...' : name;

  const truncatedValue =
    value.length > MAX_FIELD_VALUE ? value.slice(0, MAX_FIELD_VALUE - 3) + '...' : value;

  embed.addFields({ name: truncatedName, value: truncatedValue, inline });
  return embed;
}

export function setThumbnailSafe(
  embed: EmbedBuilder,
  url: string | null | undefined,
): EmbedBuilder {
  if (!url) return embed;
  try {
    embed.setThumbnail(url);
  } catch (err) {
    console.warn(
      '[EmbedBuilder] setThumbnail failed:',
      err instanceof Error ? err.message : String(err),
    );
  }
  return embed;
}
