import { describe, test, expect } from 'bun:test';
import { renderDiceRoll } from '../../../src/embeds/renderers/dice.js';
import { Colors } from '../../../src/embeds/themes.js';
import type { DiceResult } from '../../../src/services/rpg/dice.js';

function makeDiceResult(overrides: Partial<DiceResult> = {}): DiceResult {
  return {
    rolls: [15],
    total: 15,
    modifier: 0,
    notation: { count: 1, sides: 20, modifier: 0 },
    ...overrides,
  };
}

describe('renderDiceRoll', () => {
  test('renders basic dice roll', () => {
    const result = makeDiceResult();
    const embed = renderDiceRoll('1d20', result);
    const data = embed.data;

    expect(data.title).toBe('🎲 1d20');
    expect(data.color).toBe(Colors.RPG);

    const fields = data.fields ?? [];
    const rollsField = fields.find((f) => f.name === 'Rolls');
    expect(rollsField!.value).toBe('[15]');

    const totalField = fields.find((f) => f.name === 'Total');
    expect(totalField!.value).toBe('15');
  });

  test('renders dice roll with positive modifier', () => {
    const result = makeDiceResult({
      rolls: [12],
      total: 14,
      modifier: 2,
      notation: { count: 1, sides: 20, modifier: 2 },
    });
    const embed = renderDiceRoll('1d20+2', result);
    const fields = embed.data.fields ?? [];

    const modField = fields.find((f) => f.name === 'Modifier');
    expect(modField).toBeDefined();
    expect(modField!.value).toBe('+2');
  });

  test('renders dice roll with negative modifier', () => {
    const result = makeDiceResult({
      rolls: [10],
      total: 8,
      modifier: -2,
      notation: { count: 1, sides: 20, modifier: -2 },
    });
    const embed = renderDiceRoll('1d20-2', result);
    const fields = embed.data.fields ?? [];

    const modField = fields.find((f) => f.name === 'Modifier');
    expect(modField).toBeDefined();
    expect(modField!.value).toBe('-2');
  });

  test('hides modifier field when modifier is zero', () => {
    const result = makeDiceResult({ modifier: 0 });
    const embed = renderDiceRoll('1d20', result);
    const fields = embed.data.fields ?? [];
    expect(fields.find((f) => f.name === 'Modifier')).toBeUndefined();
  });

  test('renders multiple dice rolls', () => {
    const result = makeDiceResult({
      rolls: [3, 5, 2],
      total: 10,
      notation: { count: 3, sides: 6, modifier: 0 },
    });
    const embed = renderDiceRoll('3d6', result);
    const fields = embed.data.fields ?? [];
    const rollsField = fields.find((f) => f.name === 'Rolls');
    expect(rollsField!.value).toBe('[3, 5, 2]');
  });
});
