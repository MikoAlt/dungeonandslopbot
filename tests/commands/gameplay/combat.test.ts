import { describe, expect, it, beforeEach } from 'bun:test';
import { renderBattleState, renderAttackResult } from '../../../src/embeds/renderers/battle';

describe('Combat command integration', () => {
  describe('renderBattleState', () => {
    it('renders battle state with participants', () => {
      const participants = [
        {
          name: 'Aragorn',
          hp: 45,
          maxHp: 50,
          initiative: 18,
          isCurrentTurn: true,
          type: 'player' as const,
        },
        {
          name: 'Goblin',
          hp: 15,
          maxHp: 15,
          initiative: 12,
          isCurrentTurn: false,
          type: 'npc' as const,
        },
      ];

      const embeds = renderBattleState(participants);

      expect(embeds).toBeDefined();
      expect(Array.isArray(embeds)).toBe(true);
      expect(embeds.length).toBeGreaterThan(0);
    });

    it('handles empty participants', () => {
      const embeds = renderBattleState([]);
      expect(embeds).toBeDefined();
    });
  });

  describe('renderAttackResult', () => {
    it('renders successful attack result', () => {
      const result = {
        attackerName: 'Aragorn',
        defenderName: 'Goblin',
        attackRoll: 17,
        hit: true,
        damageDealt: 8,
        defenderRemainingHp: 7,
        defenderMaxHp: 15,
        critical: false,
      };

      const embed = renderAttackResult(result);

      expect(embed).toBeDefined();
      expect(embed.data.title).toContain('Aragorn');
      expect(embed.data.title).toContain('Goblin');
    });

    it('renders critical hit result', () => {
      const result = {
        attackerName: 'Aragorn',
        defenderName: 'Goblin',
        attackRoll: 20,
        hit: true,
        damageDealt: 16,
        defenderRemainingHp: 0,
        defenderMaxHp: 15,
        critical: true,
      };

      const embed = renderAttackResult(result);

      expect(embed).toBeDefined();
      // Result text is in the fields, check for hit text in embed description or fields
      expect(embed.data.fields).toBeDefined();
      const resultField = embed.data.fields?.find((f: any) => f.name === 'Result');
      expect(resultField?.value).toContain('CRITICAL HIT');
    });

    it('renders missed attack result', () => {
      const result = {
        attackerName: 'Aragorn',
        defenderName: 'Goblin',
        attackRoll: 5,
        hit: false,
        damageDealt: 0,
        defenderRemainingHp: 15,
        defenderMaxHp: 15,
        critical: false,
      };

      const embed = renderAttackResult(result);

      expect(embed).toBeDefined();
      expect(embed.data.fields).toBeDefined();
      const resultField = embed.data.fields?.find((f: any) => f.name === 'Result');
      expect(resultField?.value).toContain('Miss');
    });
  });
});
