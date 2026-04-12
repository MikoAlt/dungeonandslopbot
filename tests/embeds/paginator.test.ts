import { describe, test, expect } from 'bun:test';
import { EmbedPaginator } from '../../src/embeds/paginator.ts';
import { Colors } from '../../src/embeds/themes.ts';
import { createBaseEmbed, addFieldSafe, setThumbnailSafe } from '../../src/embeds/builder.ts';

describe('EmbedPaginator', () => {
  test('empty paginator returns empty array', () => {
    const paginator = new EmbedPaginator();
    expect(paginator.build()).toEqual([]);
  });

  test('single embed stays within limits', () => {
    const paginator = new EmbedPaginator('Test Title');
    paginator.addField('Field 1', 'Value 1');
    const embeds = paginator.build();
    expect(embeds.length).toBe(1);
    expect(embeds[0].data.title).toBe('Test Title');
    expect(embeds[0].data.fields?.length).toBe(1);
  });

  test('30 fields auto-split across 2 embeds (25 + 5)', () => {
    const paginator = new EmbedPaginator('Many Fields');
    for (let i = 0; i < 30; i++) {
      paginator.addField(`Field ${i + 1}`, `Value ${i + 1}`);
    }
    const embeds = paginator.build();
    expect(embeds.length).toBe(2);
    expect(embeds[0].data.fields?.length).toBe(25);
    expect(embeds[1].data.fields?.length).toBe(5);
  });

  test('10000 char description auto-splits across multiple embeds', () => {
    const paginator = new EmbedPaginator('Long Desc');
    const longText = 'A'.repeat(10000);
    paginator.addDescription(longText);
    const embeds = paginator.build();
    expect(embeds.length).toBeGreaterThan(1);
    let totalDesc = '';
    for (const embed of embeds) {
      totalDesc += embed.data.description ?? '';
    }
    expect(totalDesc.length).toBe(10000);
  });

  test('footer appears ONLY on last embed', () => {
    const paginator = new EmbedPaginator('Footer Test');
    paginator.addField('Field 1', 'Value 1');
    paginator.addField('Field 2', 'Value 2');
    paginator.setFooter('Custom Footer');
    const embeds = paginator.build();
    expect(embeds.length).toBe(1);
    expect(embeds[0].data.footer?.text).toBe('Custom Footer');
  });

  test('footer only on last embed when split across multiple', () => {
    const paginator = new EmbedPaginator('Multi Embed');
    for (let i = 0; i < 30; i++) {
      paginator.addField(`Field ${i + 1}`, `Value ${i + 1}`);
    }
    paginator.setFooter('Final Footer');
    const embeds = paginator.build();
    expect(embeds.length).toBe(2);
    expect(embeds[0].data.footer?.text).toBeUndefined();
    expect(embeds[1].data.footer?.text).toBe('Final Footer');
  });

  test('each embed stays within 6000 total chars', () => {
    const paginator = new EmbedPaginator('Char Limit');
    for (let i = 0; i < 25; i++) {
      paginator.addField(`Field ${i}`, `Value`.repeat(200));
    }
    const embeds = paginator.build();
    for (const embed of embeds) {
      const length = embed.length;
      expect(length).toBeLessThanOrEqual(6000);
    }
  });

  test('no single field value exceeds 1024 chars', () => {
    const paginator = new EmbedPaginator('Field Limit');
    paginator.addField('Long Field', 'X'.repeat(2000));
    const embeds = paginator.build();
    for (const embed of embeds) {
      const fields = embed.data.fields ?? [];
      for (const field of fields) {
        expect(field.value.length).toBeLessThanOrEqual(1024);
      }
    }
  });

  test('title max 256 chars enforced', () => {
    const paginator = new EmbedPaginator('A'.repeat(300));
    paginator.addField('Field', 'Value');
    const embeds = paginator.build();
    expect(embeds[0].data.title?.length).toBeLessThanOrEqual(256);
  });

  test('setColor applies to all embeds', () => {
    const paginator = new EmbedPaginator('Color Test');
    for (let i = 0; i < 30; i++) {
      paginator.addField(`Field ${i}`, 'Value');
    }
    paginator.setColor(Colors.DANGER);
    const embeds = paginator.build();
    for (const embed of embeds) {
      expect(embed.data.color).toBe(Colors.DANGER);
    }
  });
});

describe('addFieldSafe', () => {
  test('500-char value passes through unchanged', () => {
    const embed = createBaseEmbed();
    const value = 'V'.repeat(500);
    addFieldSafe(embed, 'Field', value);
    expect(embed.data.fields?.[0].value.length).toBe(500);
  });

  test('1025-char value truncated to 1021 chars plus ellipsis', () => {
    const embed = createBaseEmbed();
    const value = 'X'.repeat(1025);
    addFieldSafe(embed, 'Field', value);
    const result = embed.data.fields?.[0].value;
    expect(result?.length).toBe(1024);
    expect(result?.endsWith('...')).toBe(true);
  });

  test('500-char name passes through unchanged', () => {
    const embed = createBaseEmbed();
    const name = 'N'.repeat(500);
    addFieldSafe(embed, name, 'Value');
    expect(embed.data.fields?.[0].name.length).toBe(256);
  });

  test('300-char name truncated to 253 chars plus ellipsis', () => {
    const embed = createBaseEmbed();
    const name = 'M'.repeat(300);
    addFieldSafe(embed, name, 'Value');
    const result = embed.data.fields?.[0].name;
    expect(result?.length).toBe(256);
    expect(result?.endsWith('...')).toBe(true);
  });
});

describe('setThumbnailSafe', () => {
  test('null URL returns embed unchanged', () => {
    const embed = createBaseEmbed();
    setThumbnailSafe(embed, null);
    expect(embed.data.thumbnail).toBeUndefined();
  });

  test('undefined URL returns embed unchanged', () => {
    const embed = createBaseEmbed();
    setThumbnailSafe(embed, undefined);
    expect(embed.data.thumbnail).toBeUndefined();
  });

  test('empty string URL returns embed unchanged', () => {
    const embed = createBaseEmbed();
    setThumbnailSafe(embed, '');
    expect(embed.data.thumbnail).toBeUndefined();
  });

  test('valid URL sets thumbnail', () => {
    const embed = createBaseEmbed();
    setThumbnailSafe(embed, 'https://example.com/image.png');
    expect(embed.data.thumbnail?.url).toBe('https://example.com/image.png');
  });

  test('invalid URL gracefully ignored', () => {
    const embed = createBaseEmbed();
    setThumbnailSafe(embed, 'not-a-valid-url');
    expect(embed.data.thumbnail?.url).toBeUndefined();
  });
});

describe('createBaseEmbed', () => {
  test('returns EmbedBuilder with default color', () => {
    const embed = createBaseEmbed();
    expect(embed.data.color).toBe(Colors.INFO);
  });

  test('returns EmbedBuilder with default footer', () => {
    const embed = createBaseEmbed();
    expect(embed.data.footer?.text).toBe('Dungeon & Slop');
  });

  test('returns EmbedBuilder with timestamp', () => {
    const embed = createBaseEmbed();
    expect(embed.data.timestamp).toBeDefined();
  });
});
