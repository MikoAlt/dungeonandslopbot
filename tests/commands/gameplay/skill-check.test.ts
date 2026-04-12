import { describe, expect, it } from 'bun:test';
import { DiceCli } from '../../../src/services/rpg/dice-cli';

describe('Skill Check integration', () => {
  describe('dice rolling for skill checks', () => {
    it('rolls 1d20 correctly', () => {
      const cli = new DiceCli();
      const result = cli.roll('1d20+5');

      expect(result.notation).toBe('1d20+5');
      expect(result.rolls).toHaveLength(1);
      expect(result.modifier).toBe(5);
      expect(result.total).toBe(result.rolls[0]! + 5);
    });

    it('rolls 1d20 with advantage', () => {
      const cli = new DiceCli();
      const result = cli.roll('1d20 advantage');

      expect(result.rolls).toHaveLength(2);
      expect(result.dropped).toHaveLength(1);
    });

    it('identifies critical success', () => {
      const cli = new DiceCli();
      const result = cli.roll('1d20');

      if (result.rolls.includes(20)) {
        expect(result.isCrit).toBe(true);
      }
    });

    it('identifies critical failure', () => {
      const cli = new DiceCli();
      const result = cli.roll('1d20');

      if (result.rolls.includes(1)) {
        expect(result.isFumble).toBe(true);
      }
    });

    it('handles negative modifiers', () => {
      const cli = new DiceCli();
      const result = cli.roll('1d20-3');

      expect(result.modifier).toBe(-3);
      expect(result.total).toBe(result.rolls[0]! - 3);
    });
  });
});
