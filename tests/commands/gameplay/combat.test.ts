import { describe, expect, it, beforeEach, vi } from 'bun:test';
import { renderBattleState, renderAttackResult } from '../../../src/embeds/renderers/battle';
import { CombatManager } from '../../../src/commands/gameplay/combat';
import type { CombatRepository, CombatModel } from '../../../src/db/repositories/combat';

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

  describe('CombatManager', () => {
    const createMockRepository = (): CombatRepository => {
      const combats: Map<string, CombatModel> = new Map();

      return {
        prisma: {} as any,
        findById: vi.fn(async (id: string) => combats.get(id) || null),
        create: vi.fn(async (data: any) => {
          const combat: CombatModel = {
            id: `combat-${Date.now()}`,
            campaignId: data.campaignId,
            participants: data.participants,
            currentTurnIndex: data.currentTurnIndex,
            round: data.round,
            isActive: data.isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          combats.set(combat.id, combat);
          return combat;
        }),
        update: vi.fn(async (id: string, data: any) => {
          const combat = combats.get(id);
          if (!combat) throw new Error('Not found');
          Object.assign(combat, data);
          return combat;
        }),
        delete: vi.fn(async (id: string) => {
          const combat = combats.get(id);
          if (!combat) throw new Error('Not found');
          combats.delete(id);
          return combat;
        }),
        list: vi.fn(),
        count: vi.fn(),
        findByCampaignId: vi.fn(async (campaignId: string) => {
          for (const combat of combats.values()) {
            if (combat.campaignId === campaignId) return combat;
          }
          return null;
        }),
        findActiveByCampaignId: vi.fn(async (campaignId: string) => {
          for (const combat of combats.values()) {
            if (combat.campaignId === campaignId && combat.isActive) return combat;
          }
          return null;
        }),
        updateParticipants: vi.fn(
          async (id: string, participants: unknown, currentTurnIndex: number, round: number) => {
            const combat = combats.get(id);
            if (!combat) throw new Error('Not found');
            combat.participants = participants;
            combat.currentTurnIndex = currentTurnIndex;
            combat.round = round;
            return combat;
          },
        ),
        deactivate: vi.fn(async (id: string) => {
          const combat = combats.get(id);
          if (!combat) throw new Error('Not found');
          combat.isActive = false;
          return combat;
        }),
      } as unknown as CombatRepository;
    };

    describe('startCombat', () => {
      it('starts a new combat with characters', async () => {
        const mockRepo = createMockRepository();
        const combatManager = new CombatManager(mockRepo);

        const characters = [
          {
            id: 'char-1',
            name: 'Aragorn',
            hp: 45,
            maxHp: 50,
            stats: {
              str: 16,
              dex: 15,
              con: 14,
              int: 10,
              wis: 13,
              cha: 14,
              ac: 15,
              speed: 30,
              hitDice: '12d10',
            },
            rpgSystem: 'dnd5e' as const,
          },
          {
            id: 'char-2',
            name: 'Gandalf',
            hp: 30,
            maxHp: 30,
            stats: {
              str: 10,
              dex: 12,
              con: 10,
              int: 18,
              wis: 18,
              cha: 16,
              ac: 12,
              speed: 30,
              hitDice: '8d8',
            },
            rpgSystem: 'dnd5e' as const,
          },
        ];

        const combat = await combatManager.startCombat('campaign-1', characters);

        expect(combat).toBeDefined();
        expect(combat.campaignId).toBe('campaign-1');
        expect(combat.participants).toHaveLength(2);
        expect(combat.round).toBe(1);
        expect(combat.currentTurnIndex).toBe(0);
        expect(combat.isActive).toBe(true);
      });

      it('throws error if combat already active', async () => {
        const mockRepo = createMockRepository();
        const combatManager = new CombatManager(mockRepo);

        const characters = [
          {
            id: 'char-1',
            name: 'Aragorn',
            hp: 45,
            maxHp: 50,
            stats: {
              str: 16,
              dex: 15,
              con: 14,
              int: 10,
              wis: 13,
              cha: 14,
              ac: 15,
              speed: 30,
              hitDice: '12d10',
            },
            rpgSystem: 'dnd5e' as const,
          },
        ];

        await combatManager.startCombat('campaign-1', characters);

        await expect(combatManager.startCombat('campaign-1', characters)).rejects.toThrow(
          'Combat already active in this campaign',
        );
      });
    });

    describe('getCombat', () => {
      it('returns combat for active campaign', async () => {
        const mockRepo = createMockRepository();
        const combatManager = new CombatManager(mockRepo);

        const characters = [
          {
            id: 'char-1',
            name: 'Aragorn',
            hp: 45,
            maxHp: 50,
            stats: {
              str: 16,
              dex: 15,
              con: 14,
              int: 10,
              wis: 13,
              cha: 14,
              ac: 15,
              speed: 30,
              hitDice: '12d10',
            },
            rpgSystem: 'dnd5e' as const,
          },
        ];

        await combatManager.startCombat('campaign-1', characters);
        const combat = await combatManager.getCombat('campaign-1');

        expect(combat).toBeDefined();
        expect(combat?.campaignId).toBe('campaign-1');
        expect(combat?.isActive).toBe(true);
      });

      it('returns undefined for non-existent campaign', async () => {
        const mockRepo = createMockRepository();
        const combatManager = new CombatManager(mockRepo);

        const combat = await combatManager.getCombat('non-existent');

        expect(combat).toBeUndefined();
      });
    });

    describe('endCombat', () => {
      it('deactivates combat and returns summary', async () => {
        const mockRepo = createMockRepository();
        const combatManager = new CombatManager(mockRepo);

        const characters = [
          {
            id: 'char-1',
            name: 'Aragorn',
            hp: 45,
            maxHp: 50,
            stats: {
              str: 16,
              dex: 15,
              con: 14,
              int: 10,
              wis: 13,
              cha: 14,
              ac: 15,
              speed: 30,
              hitDice: '12d10',
            },
            rpgSystem: 'dnd5e' as const,
          },
        ];

        await combatManager.startCombat('campaign-1', characters);
        const summary = await combatManager.endCombat('campaign-1');

        expect(summary).toBeDefined();
        expect(summary?.isActive).toBe(false);

        const combat = await combatManager.getCombat('campaign-1');
        expect(combat).toBeUndefined();
      });
    });

    describe('applyDamage', () => {
      it('applies damage to target', async () => {
        const mockRepo = createMockRepository();
        const combatManager = new CombatManager(mockRepo);

        const characters = [
          {
            id: 'char-1',
            name: 'Aragorn',
            hp: 45,
            maxHp: 50,
            stats: {
              str: 16,
              dex: 15,
              con: 14,
              int: 10,
              wis: 13,
              cha: 14,
              ac: 15,
              speed: 30,
              hitDice: '12d10',
            },
            rpgSystem: 'dnd5e' as const,
          },
          {
            id: 'char-2',
            name: 'Goblin',
            hp: 15,
            maxHp: 15,
            stats: {
              str: 8,
              dex: 14,
              con: 10,
              int: 8,
              wis: 8,
              cha: 6,
              ac: 13,
              speed: 30,
              hitDice: '2d6',
            },
            rpgSystem: 'dnd5e' as const,
          },
        ];

        await combatManager.startCombat('campaign-1', characters);

        const damage = await combatManager.applyDamage('campaign-1', 'char-2', 10);

        expect(damage).toBe(10);

        const combat = await combatManager.getCombat('campaign-1');
        const goblin = combat?.participants.find((p) => p.characterId === 'char-2');
        expect(goblin?.hp).toBe(5);
      });

      it('halves damage when defending', async () => {
        const mockRepo = createMockRepository();
        const combatManager = new CombatManager(mockRepo);

        const characters = [
          {
            id: 'char-1',
            name: 'Aragorn',
            hp: 45,
            maxHp: 50,
            stats: {
              str: 16,
              dex: 15,
              con: 14,
              int: 10,
              wis: 13,
              cha: 14,
              ac: 15,
              speed: 30,
              hitDice: '12d10',
            },
            rpgSystem: 'dnd5e' as const,
          },
          {
            id: 'char-2',
            name: 'Goblin',
            hp: 15,
            maxHp: 15,
            stats: {
              str: 8,
              dex: 14,
              con: 10,
              int: 8,
              wis: 8,
              cha: 6,
              ac: 13,
              speed: 30,
              hitDice: '2d6',
            },
            rpgSystem: 'dnd5e' as const,
          },
        ];

        await combatManager.startCombat('campaign-1', characters);
        await combatManager.setDefending('campaign-1', 'char-2', true);

        const damage = await combatManager.applyDamage('campaign-1', 'char-2', 10);

        expect(damage).toBe(5);
      });
    });

    describe('nextTurn', () => {
      it('advances to next turn', async () => {
        const mockRepo = createMockRepository();
        const combatManager = new CombatManager(mockRepo);

        const characters = [
          {
            id: 'char-1',
            name: 'Aragorn',
            hp: 45,
            maxHp: 50,
            stats: {
              str: 16,
              dex: 15,
              con: 14,
              int: 10,
              wis: 13,
              cha: 14,
              ac: 15,
              speed: 30,
              hitDice: '12d10',
            },
            rpgSystem: 'dnd5e' as const,
          },
          {
            id: 'char-2',
            name: 'Gandalf',
            hp: 30,
            maxHp: 30,
            stats: {
              str: 10,
              dex: 12,
              con: 10,
              int: 18,
              wis: 18,
              cha: 16,
              ac: 12,
              speed: 30,
              hitDice: '8d8',
            },
            rpgSystem: 'dnd5e' as const,
          },
        ];

        await combatManager.startCombat('campaign-1', characters);
        const combatBefore = await combatManager.getCombat('campaign-1');
        const firstParticipant = combatBefore?.participants[0];

        await combatManager.nextTurn('campaign-1');

        const combatAfter = await combatManager.getCombat('campaign-1');
        expect(combatAfter?.currentTurnIndex).toBe(1);

        await combatManager.nextTurn('campaign-1');

        const combatFinal = await combatManager.getCombat('campaign-1');
        expect(combatFinal?.currentTurnIndex).toBe(0);
        expect(combatFinal?.round).toBe(2);
      });
    });
  });
});
