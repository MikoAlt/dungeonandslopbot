import { describe, test, expect } from 'bun:test';
import {
  renderBattleState,
  renderAttackResult,
  renderDamageDice,
} from '../../../src/embeds/renderers/battle.js';
import type { BattleParticipant, AttackResult } from '../../../src/embeds/renderers/battle.js';
import { Colors } from '../../../src/embeds/themes.js';
import type { DiceResult } from '../../../src/services/rpg/dice.js';

function makeParticipant(overrides: Partial<BattleParticipant> = {}): BattleParticipant {
  return {
    name: 'Fighter',
    hp: 45,
    maxHp: 50,
    initiative: 15,
    isCurrentTurn: false,
    type: 'player',
    ...overrides,
  };
}

function makeDiceResult(overrides: Partial<DiceResult> = {}): DiceResult {
  return {
    rolls: [4, 3],
    total: 7,
    modifier: 0,
    notation: { count: 2, sides: 6, modifier: 0 },
    ...overrides,
  };
}

describe('renderBattleState', () => {
  test('renders battle with participants sorted by initiative', () => {
    const participants: BattleParticipant[] = [
      makeParticipant({
        name: 'Fighter',
        initiative: 15,
        hp: 45,
        maxHp: 50,
        isCurrentTurn: true,
        type: 'player',
      }),
      makeParticipant({
        name: 'Goblin',
        initiative: 12,
        hp: 20,
        maxHp: 20,
        isCurrentTurn: false,
        type: 'npc',
      }),
      makeParticipant({
        name: 'Wizard',
        initiative: 18,
        hp: 30,
        maxHp: 35,
        isCurrentTurn: false,
        type: 'player',
      }),
    ];
    const embeds = renderBattleState(participants);

    expect(embeds.length).toBeGreaterThanOrEqual(1);
    expect(embeds[0].data.color).toBe(Colors.DANGER);

    const fields = embeds[0].data.fields ?? [];
    expect(fields.length).toBe(3);

    expect(fields[0]!.name).toContain('Wizard');
    expect(fields[0]!.name).toContain('🧑');
    expect(fields[1]!.name).toContain('Fighter');
    expect(fields[1]!.name).toContain('▶');
    expect(fields[2]!.name).toContain('Goblin');
    expect(fields[2]!.name).toContain('👹');
  });

  test('renders HP bars for each participant', () => {
    const participants = [makeParticipant({ name: 'Fighter', hp: 45, maxHp: 50 })];
    const embeds = renderBattleState(participants);
    const fields = embeds[0].data.fields ?? [];
    expect(fields[0]!.value).toContain('45/50');
  });

  test('marks current turn with arrow', () => {
    const participants = [
      makeParticipant({ name: 'Fighter', isCurrentTurn: true, type: 'player' }),
      makeParticipant({ name: 'Goblin', isCurrentTurn: false, type: 'npc' }),
    ];
    const embeds = renderBattleState(participants);
    const fields = embeds[0].data.fields ?? [];
    const fighterField = fields.find((f) => f.name.includes('Fighter'));
    const goblinField = fields.find((f) => f.name.includes('Goblin'));
    expect(fighterField!.name).toContain('▶');
    expect(goblinField!.name).not.toContain('▶');
  });

  test('footer shows combatant count', () => {
    const participants = [makeParticipant({ name: 'A' }), makeParticipant({ name: 'B' })];
    const embeds = renderBattleState(participants);
    const last = embeds[embeds.length - 1];
    expect(last.data.footer?.text).toContain('2 combatants');
  });

  test('uses EmbedPaginator for many participants', () => {
    const participants = Array.from(
      { length: 30 },
      (_, i): BattleParticipant => ({
        name: `Fighter ${i + 1}`,
        hp: 50,
        maxHp: 50,
        initiative: 20 - i,
        isCurrentTurn: i === 0,
        type: i % 2 === 0 ? ('player' as const) : ('npc' as const),
      }),
    );
    const embeds = renderBattleState(participants);
    expect(embeds.length).toBeGreaterThanOrEqual(1);
    const allFields = embeds.flatMap((e) => e.data.fields ?? []);
    expect(allFields.length).toBe(30);
  });
});

describe('renderAttackResult', () => {
  test('renders hit attack result', () => {
    const result: AttackResult = {
      attackerName: 'Fighter',
      defenderName: 'Goblin',
      attackRoll: 18,
      hit: true,
      damageDealt: 12,
      defenderRemainingHp: 8,
      defenderMaxHp: 20,
      critical: false,
    };
    const embed = renderAttackResult(result);
    const data = embed.data;

    expect(data.title).toContain('Fighter');
    expect(data.title).toContain('Goblin');
    expect(data.color).toBe(Colors.DANGER);

    const fields = data.fields ?? [];
    expect(fields.find((f) => f.name === 'Attack Roll')!.value).toBe('18');
    expect(fields.find((f) => f.name === 'Result')!.value).toContain('Hit');
    expect(fields.find((f) => f.name === 'Damage')!.value).toBe('12');
  });

  test('renders miss attack result', () => {
    const result: AttackResult = {
      attackerName: 'Fighter',
      defenderName: 'Goblin',
      attackRoll: 5,
      hit: false,
      damageDealt: 0,
      defenderRemainingHp: 20,
      defenderMaxHp: 20,
      critical: false,
    };
    const embed = renderAttackResult(result);
    const data = embed.data;

    expect(data.color).toBe(Colors.INFO);
    const fields = data.fields ?? [];
    expect(fields.find((f) => f.name === 'Result')!.value).toContain('Miss');
    expect(fields.find((f) => f.name === 'Damage')).toBeUndefined();
  });

  test('renders critical hit', () => {
    const result: AttackResult = {
      attackerName: 'Rogue',
      defenderName: 'Orc',
      attackRoll: 20,
      hit: true,
      damageDealt: 28,
      defenderRemainingHp: 2,
      defenderMaxHp: 30,
      critical: true,
    };
    const embed = renderAttackResult(result);
    const fields = embed.data.fields ?? [];
    expect(fields.find((f) => f.name === 'Result')!.value).toContain('CRITICAL');
  });
});

describe('renderDamageDice', () => {
  test('renders single dice result', () => {
    const results = [makeDiceResult()];
    const embed = renderDamageDice(results);
    const data = embed.data;

    expect(data.title).toBe('🎲 Damage Dice');
    expect(data.color).toBe(Colors.DANGER);

    const fields = data.fields ?? [];
    expect(fields[0]!.name).toContain('2d6');
    expect(fields[0]!.value).toContain('4, 3');
    expect(fields[0]!.value).toContain('7');
  });

  test('renders dice with modifier', () => {
    const results: DiceResult[] = [
      {
        rolls: [5, 6],
        total: 15,
        modifier: 4,
        notation: { count: 2, sides: 6, modifier: 4 },
      },
    ];
    const embed = renderDamageDice(results);
    const fields = embed.data.fields ?? [];
    expect(fields[0]!.name).toContain('+4');
  });

  test('renders multiple dice results', () => {
    const results: DiceResult[] = [
      makeDiceResult({ rolls: [3, 4], total: 7, notation: { count: 2, sides: 6, modifier: 0 } }),
      makeDiceResult({ rolls: [8], total: 8, notation: { count: 1, sides: 8, modifier: 0 } }),
    ];
    const embed = renderDamageDice(results);
    const fields = embed.data.fields ?? [];
    expect(fields.length).toBe(2);
  });
});
