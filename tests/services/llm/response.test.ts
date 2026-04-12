import { describe, it, expect } from 'bun:test';
import {
  parseNarrativeResponse,
  parseDiceRolls,
  parseStateChanges,
} from '../../../src/services/llm/response';
import type { DiceRollRequest, StateChange } from '../../../src/services/llm/response';

describe('LLM Response Parser', () => {
  describe('parseDiceRolls', () => {
    it('extracts a single dice roll request', () => {
      const raw = 'The goblin attacks! [roll:1d20+5] and hits!';
      const rolls = parseDiceRolls(raw);
      expect(rolls).toHaveLength(1);
      expect(rolls[0]!.notation).toBe('1d20+5');
      expect(rolls[0]!.modifier).toBe(5);
    });

    it('extracts multiple dice roll requests', () => {
      const raw = 'Attack [roll:1d20+3] for damage [roll:2d6+4]';
      const rolls = parseDiceRolls(raw);
      expect(rolls).toHaveLength(2);
      expect(rolls[0]!.notation).toBe('1d20+3');
      expect(rolls[0]!.modifier).toBe(3);
      expect(rolls[1]!.notation).toBe('2d6+4');
      expect(rolls[1]!.modifier).toBe(4);
    });

    it('extracts dice roll with negative modifier', () => {
      const raw = 'Weak attack [roll:1d20-2]';
      const rolls = parseDiceRolls(raw);
      expect(rolls).toHaveLength(1);
      expect(rolls[0]!.notation).toBe('1d20-2');
      expect(rolls[0]!.modifier).toBe(-2);
    });

    it('extracts dice roll without modifier', () => {
      const raw = 'Simple roll [roll:1d20]';
      const rolls = parseDiceRolls(raw);
      expect(rolls).toHaveLength(1);
      expect(rolls[0]!.notation).toBe('1d20');
      expect(rolls[0]!.modifier).toBe(0);
    });

    it('extracts multi-dice rolls', () => {
      const raw = 'Fireball! [roll:8d6]';
      const rolls = parseDiceRolls(raw);
      expect(rolls).toHaveLength(1);
      expect(rolls[0]!.notation).toBe('8d6');
      expect(rolls[0]!.modifier).toBe(0);
    });

    it('returns empty array when no dice rolls found', () => {
      const raw = 'No dice rolls here, just narrative text.';
      const rolls = parseDiceRolls(raw);
      expect(rolls).toHaveLength(0);
    });

    it('handles custom simple system dice notation', () => {
      const raw = 'Attack roll [roll:1d6+3]';
      const rolls = parseDiceRolls(raw);
      expect(rolls).toHaveLength(1);
      expect(rolls[0]!.notation).toBe('1d6+3');
      expect(rolls[0]!.modifier).toBe(3);
    });

    it('rejects invalid dice notations', () => {
      const raw = 'Invalid [roll:0d6] and [roll:1d1]';
      const rolls = parseDiceRolls(raw);
      expect(rolls).toHaveLength(0);
    });

    it('normalizes notation to lowercase', () => {
      const raw = 'Attack [roll:2D10+5]';
      const rolls = parseDiceRolls(raw);
      expect(rolls).toHaveLength(1);
      expect(rolls[0]!.notation).toBe('2d10+5');
    });
  });

  describe('parseStateChanges', () => {
    it('extracts a set state change', () => {
      const raw = 'You arrive at [state:location=forest] and look around.';
      const changes = parseStateChanges(raw);
      expect(changes).toHaveLength(1);
      expect(changes[0]!.key).toBe('location');
      expect(changes[0]!.operation).toBe('set');
      expect(changes[0]!.value).toBe('forest');
    });

    it('extracts a numeric set state change', () => {
      const raw = 'Your speed increases! [state:speed=8]';
      const changes = parseStateChanges(raw);
      expect(changes).toHaveLength(1);
      expect(changes[0]!.key).toBe('speed');
      expect(changes[0]!.operation).toBe('set');
      expect(changes[0]!.value).toBe(8);
    });

    it('extracts a modify state change with subtraction', () => {
      const raw = 'You take damage! [state:hp-5]';
      const changes = parseStateChanges(raw);
      expect(changes).toHaveLength(1);
      expect(changes[0]!.key).toBe('hp');
      expect(changes[0]!.operation).toBe('modify');
      expect(changes[0]!.value).toBe(-5);
    });

    it('extracts a modify state change with addition', () => {
      const raw = 'You heal! [state:hp+10]';
      const changes = parseStateChanges(raw);
      expect(changes).toHaveLength(1);
      expect(changes[0]!.key).toBe('hp');
      expect(changes[0]!.operation).toBe('modify');
      expect(changes[0]!.value).toBe(10);
    });

    it('extracts multiple state changes', () => {
      const raw = 'You move [state:location=cave] and take damage [state:hp-3]';
      const changes = parseStateChanges(raw);
      expect(changes).toHaveLength(2);
      expect(changes[0]!.key).toBe('location');
      expect(changes[0]!.operation).toBe('set');
      expect(changes[1]!.key).toBe('hp');
      expect(changes[1]!.operation).toBe('modify');
    });

    it('returns empty array when no state changes found', () => {
      const raw = 'No state changes here, just narrative.';
      const changes = parseStateChanges(raw);
      expect(changes).toHaveLength(0);
    });

    it('handles condition state changes', () => {
      const raw = 'You are poisoned! [state:condition=poisoned]';
      const changes = parseStateChanges(raw);
      expect(changes).toHaveLength(1);
      expect(changes[0]!.key).toBe('condition');
      expect(changes[0]!.operation).toBe('set');
      expect(changes[0]!.value).toBe('poisoned');
    });

    it('handles underscored keys', () => {
      const raw = '[state:temp_hp-2]';
      const changes = parseStateChanges(raw);
      expect(changes).toHaveLength(1);
      expect(changes[0]!.key).toBe('temp_hp');
    });
  });

  describe('parseNarrativeResponse', () => {
    it('extracts clean narrative text', () => {
      const raw = 'The dragon breathes fire! [roll:1d20+7] You take [state:hp-12] damage.';
      const result = parseNarrativeResponse(raw);
      expect(result.narrative).toContain('dragon breathes fire');
      expect(result.narrative).toContain('You take');
      expect(result.narrative).toContain('damage');
      expect(result.narrative).not.toContain('[roll:');
      expect(result.narrative).not.toContain('[state:');
    });

    it('extracts dice rolls from narrative', () => {
      const raw = 'Attack [roll:1d20+5] and damage [roll:2d6+3]';
      const result = parseNarrativeResponse(raw);
      expect(result.diceRolls).toHaveLength(2);
      expect(result.diceRolls[0]!.notation).toBe('1d20+5');
      expect(result.diceRolls[1]!.notation).toBe('2d6+3');
    });

    it('extracts state changes from narrative', () => {
      const raw = 'You move [state:location=tavern] and rest [state:hp+5]';
      const result = parseNarrativeResponse(raw);
      expect(result.stateChanges).toHaveLength(2);
      expect(result.stateChanges[0]!.key).toBe('location');
      expect(result.stateChanges[1]!.key).toBe('hp');
    });

    it('handles narrative with no markers', () => {
      const raw = 'The sun sets over the mountains. You feel at peace.';
      const result = parseNarrativeResponse(raw);
      expect(result.narrative).toBe(raw);
      expect(result.diceRolls).toHaveLength(0);
      expect(result.stateChanges).toHaveLength(0);
    });

    it('handles narrative with only dice rolls', () => {
      const raw = 'Roll for initiative! [roll:1d20+2]';
      const result = parseNarrativeResponse(raw);
      expect(result.narrative).toBe('Roll for initiative!');
      expect(result.diceRolls).toHaveLength(1);
      expect(result.stateChanges).toHaveLength(0);
    });

    it('handles narrative with only state changes', () => {
      const raw = 'You rest at the inn. [state:hp+10] [state:location=inn]';
      const result = parseNarrativeResponse(raw);
      expect(result.narrative).toBe('You rest at the inn.');
      expect(result.diceRolls).toHaveLength(0);
      expect(result.stateChanges).toHaveLength(2);
    });

    it('collapses excessive whitespace after marker removal', () => {
      const raw = 'Hello [roll:1d20]   [state:hp-5]   world';
      const result = parseNarrativeResponse(raw);
      expect(result.narrative).toContain('Hello');
      expect(result.narrative).toContain('world');
      expect(result.narrative).not.toContain('[roll:');
      expect(result.narrative).not.toContain('[state:');
      expect(result.narrative).not.toMatch(/ {3,}/);
    });

    it('trims whitespace from narrative', () => {
      const raw = '  The story begins.  [roll:1d20]  ';
      const result = parseNarrativeResponse(raw);
      expect(result.narrative).toMatch(/^The story begins/);
      expect(result.narrative).not.toMatch(/\s+$/);
    });

    it('handles complex mixed narrative', () => {
      const raw = `The goblin attacks with a rusty sword!
[roll:1d20+4] The attack hits!
You take [state:hp-6] damage and are pushed back [state:location=cliff_edge].
Make a saving throw! [roll:1d20]`;
      const result = parseNarrativeResponse(raw);
      expect(result.diceRolls).toHaveLength(2);
      expect(result.stateChanges).toHaveLength(2);
      expect(result.narrative).toContain('goblin attacks');
      expect(result.narrative).toContain('attack hits');
      expect(result.narrative).toContain('damage');
      expect(result.narrative).toContain('saving throw');
      expect(result.narrative).not.toContain('[roll:');
      expect(result.narrative).not.toContain('[state:');
    });
  });
});
