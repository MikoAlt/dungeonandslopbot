import { EmbedBuilder } from 'discord.js';
import { Colors } from './themes.js';

const MAX_TITLE = 256;
const MAX_DESCRIPTION = 4096;
const MAX_FIELD_NAME = 256;
const MAX_FIELD_VALUE = 1024;
const MAX_FIELDS = 25;
const MAX_EMBED_TOTAL = 6000;
const CONTINUATION_POSTFIX = '...';

export class EmbedPaginator {
  private embeds: EmbedBuilder[] = [];
  private currentEmbed: EmbedBuilder;
  private title = '';
  private footerText = '';
  private color = Colors.INFO;

  constructor(title?: string) {
    this.currentEmbed = new EmbedBuilder();
    if (title) {
      this.title = title.slice(0, MAX_TITLE);
      this.currentEmbed.setTitle(this.title);
    }
  }

  setHeader(title: string, url?: string): this {
    this.title = title.slice(0, MAX_TITLE);
    if (this.embeds.length > 0) {
      this.finalizeCurrentEmbed();
    }
    this.currentEmbed = new EmbedBuilder().setTitle(this.title);
    if (url) this.currentEmbed.setURL(url);
    if (this.embeds.length > 0) {
      this.embeds.push(this.currentEmbed);
    }
    return this;
  }

  setFooter(text: string): this {
    this.footerText = text;
    return this;
  }

  setColor(color: number): this {
    this.color = color;
    for (const embed of this.embeds) {
      embed.setColor(color);
    }
    this.currentEmbed.setColor(color);
    return this;
  }

  addField(name: string, value: string, inline = false): this {
    const truncatedName =
      name.length > MAX_FIELD_NAME
        ? name.slice(0, MAX_FIELD_NAME - CONTINUATION_POSTFIX.length) + CONTINUATION_POSTFIX
        : name;

    if (value.length > MAX_FIELD_VALUE) {
      this.addLongField(truncatedName, value, inline);
    } else {
      this.addFieldToCurrentEmbed({ name: truncatedName, value, inline });
    }
    return this;
  }

  addDescription(text: string): this {
    if (!text) return this;

    const chunks = this.splitText(text, MAX_DESCRIPTION);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (i === 0) {
        const existingDesc = this.currentEmbed.data.description;
        if (existingDesc) {
          this.currentEmbed.setDescription(existingDesc + '\n' + chunk);
        } else {
          this.currentEmbed.setDescription(chunk);
        }
      } else {
        this.embeds.push(this.currentEmbed);
        this.currentEmbed = new EmbedBuilder().setTitle(this.title).setColor(this.color);
        this.currentEmbed.setDescription(chunk);
      }
    }
    return this;
  }

  build(): EmbedBuilder[] {
    const result: EmbedBuilder[] = [];

    if (this.embeds.length > 0) {
      result.push(...this.embeds);
    }

    const hasContent =
      this.currentEmbed.data.title ||
      this.currentEmbed.data.description ||
      (this.currentEmbed.data.fields?.length ?? 0) > 0;

    if (hasContent) {
      result.push(this.currentEmbed);
    }

    if (this.footerText && result.length > 0) {
      const last = result[result.length - 1];
      const existingFooter = last.data.footer?.text;
      if (existingFooter) {
        last.setFooter({ text: `${existingFooter} • ${this.footerText}` });
      } else {
        last.setFooter({ text: this.footerText });
      }
    }

    return result;
  }

  private finalizeCurrentEmbed(): void {
    const hasFields = (this.currentEmbed.data.fields?.length ?? 0) > 0;
    if (hasFields) {
      this.embeds.push(this.currentEmbed);
    }
  }

  private addFieldToCurrentEmbed(field: { name: string; value: string; inline: boolean }): void {
    const fields = this.currentEmbed.data.fields ?? [];

    if (
      fields.length >= MAX_FIELDS ||
      this.currentEmbed.length + field.name.length + field.value.length > MAX_EMBED_TOTAL
    ) {
      this.finalizeCurrentEmbed();
      this.currentEmbed = new EmbedBuilder().setTitle(this.title).setColor(this.color);
    }

    this.currentEmbed.addFields(field);
  }

  private addLongField(name: string, value: string, inline: boolean): void {
    const chunks = this.splitText(value, MAX_FIELD_VALUE - CONTINUATION_POSTFIX.length);

    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      const chunk = chunks[i];

      if (isLast) {
        this.addFieldToCurrentEmbed({ name, value: chunk, inline });
      } else {
        const header = `${name} (cont.)`;
        const maxValueLen = MAX_FIELD_VALUE - header.length - CONTINUATION_POSTFIX.length;
        const truncatedChunk =
          chunk.length > maxValueLen ? chunk.slice(0, maxValueLen) + CONTINUATION_POSTFIX : chunk;
        this.addFieldToCurrentEmbed({ name: header, value: truncatedChunk, inline });
      }
    }
  }

  private splitText(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > maxLength) {
      const splitIndex = this.findSplitPoint(remaining, maxLength);
      chunks.push(remaining.slice(0, splitIndex));
      remaining = remaining.slice(splitIndex);
    }
    if (remaining.length > 0) {
      chunks.push(remaining);
    }

    return chunks;
  }

  private findSplitPoint(text: string, maxLength: number): number {
    if (maxLength <= 0) return 0;

    const paragraphIdx = text.lastIndexOf('\n\n', maxLength);
    if (paragraphIdx > maxLength * 0.5) {
      return paragraphIdx + 2;
    }

    const sentenceIdx = text.lastIndexOf('. ', maxLength);
    if (sentenceIdx > maxLength * 0.5) {
      return sentenceIdx + 2;
    }

    const wordIdx = text.lastIndexOf(' ', maxLength);
    if (wordIdx > maxLength * 0.5) {
      return wordIdx + 1;
    }

    return maxLength;
  }
}
