import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { Colors } from '../../embeds/themes.js';
import { renderBattleState, renderAttackResult } from '../../embeds/renderers/battle.js';
import { getEngine } from '../../services/rpg/engine.js';
import { abilityModifier } from '../../services/rpg/dnd5e.js';
import type { DnD5eStats, CustomSimpleStats } from '../../types/character.js';
import type { CombatRepository } from '../../db/repositories/combat.js';
import type { CombatModel } from '../../db/repositories/combat.js';
import type { AppContainer } from '../../wiring.js';

interface CombatParticipant {
  characterId: string;
  name: string;
  hp: number;
  maxHp: number;
  initiative: number;
  isDefending: boolean;
  type: 'player' | 'npc';
  stats: DnD5eStats | CustomSimpleStats;
}

interface CombatState {
  campaignId: string;
  participants: CombatParticipant[];
  currentTurnIndex: number;
  round: number;
  isActive: boolean;
}

class CombatManager {
  constructor(private combatRepository: CombatRepository) {}

  private toCombatState(model: CombatModel): CombatState {
    return {
      campaignId: model.campaignId,
      participants: model.participants as CombatParticipant[],
      currentTurnIndex: model.currentTurnIndex,
      round: model.round,
      isActive: model.isActive,
    };
  }

  async startCombat(
    campaignId: string,
    characters: Array<{
      id: string;
      name: string;
      hp: number;
      maxHp: number;
      stats: unknown;
      rpgSystem: 'dnd5e' | 'custom';
    }>,
  ): Promise<CombatState> {
    const existing = await this.combatRepository.findActiveByCampaignId(campaignId);
    if (existing) {
      throw new Error('Combat already active in this campaign');
    }

    const participants: CombatParticipant[] = characters.map((char) => {
      let initiative: number;
      const stats = char.stats as DnD5eStats | CustomSimpleStats;
      if (char.rpgSystem === 'dnd5e') {
        const dexMod = abilityModifier((stats as DnD5eStats).dex);
        initiative = Math.floor(Math.random() * 20) + 1 + dexMod;
      } else {
        initiative = Math.floor(Math.random() * 20) + 1 + (stats as CustomSimpleStats).speed;
      }

      return {
        characterId: char.id,
        name: char.name,
        hp: char.hp,
        maxHp: char.maxHp,
        initiative,
        isDefending: false,
        type: 'player' as const,
        stats,
      };
    });

    participants.sort((a, b) => b.initiative - a.initiative);

    const combat = await this.combatRepository.create({
      campaignId,
      participants,
      currentTurnIndex: 0,
      round: 1,
      isActive: true,
    });

    return this.toCombatState(combat);
  }

  async getCombat(campaignId: string): Promise<CombatState | undefined> {
    const combat = await this.combatRepository.findActiveByCampaignId(campaignId);
    return combat ? this.toCombatState(combat) : undefined;
  }

  async getCurrentParticipant(campaignId: string): Promise<CombatParticipant | undefined> {
    const combat = await this.getCombat(campaignId);
    if (!combat || !combat.isActive) return undefined;
    return combat.participants[combat.currentTurnIndex];
  }

  async endCombat(campaignId: string): Promise<CombatState | undefined> {
    const combat = await this.combatRepository.findActiveByCampaignId(campaignId);
    if (!combat) return undefined;

    const deactivated = await this.combatRepository.deactivate(combat.id);
    return this.toCombatState(deactivated);
  }

  async nextTurn(campaignId: string): Promise<CombatParticipant | undefined> {
    const combat = await this.combatRepository.findActiveByCampaignId(campaignId);
    if (!combat || !combat.isActive) return undefined;

    const participants = combat.participants as CombatParticipant[];
    let nextTurnIndex = combat.currentTurnIndex + 1;
    let nextRound = combat.round;

    if (nextTurnIndex >= participants.length) {
      nextTurnIndex = 0;
      nextRound++;
    }

    await this.combatRepository.updateParticipants(
      combat.id,
      participants,
      nextTurnIndex,
      nextRound,
    );

    return participants[nextTurnIndex];
  }

  async setDefending(campaignId: string, characterId: string, defending: boolean): Promise<void> {
    const combat = await this.combatRepository.findActiveByCampaignId(campaignId);
    if (!combat || !combat.isActive) return;

    const participants = combat.participants as CombatParticipant[];
    const participant = participants.find((p) => p.characterId === characterId);
    if (participant) {
      participant.isDefending = defending;
      await this.combatRepository.updateParticipants(
        combat.id,
        participants,
        combat.currentTurnIndex,
        combat.round,
      );
    }
  }

  async applyDamage(campaignId: string, characterId: string, damage: number): Promise<number> {
    const combat = await this.combatRepository.findActiveByCampaignId(campaignId);
    if (!combat || !combat.isActive) return 0;

    const participants = combat.participants as CombatParticipant[];
    const participant = participants.find((p) => p.characterId === characterId);
    if (!participant) return 0;

    const actualDamage = participant.isDefending ? Math.floor(damage / 2) : damage;
    participant.hp = Math.max(0, participant.hp - actualDamage);

    await this.combatRepository.updateParticipants(
      combat.id,
      participants,
      combat.currentTurnIndex,
      combat.round,
    );

    return actualDamage;
  }
}

export type { CombatState, CombatParticipant };
export { CombatManager };

export interface CombatCommandServices {
  getCharactersByCampaignId?(campaignId: string): Promise<
    Array<{
      id: string;
      name: string;
      hp: number;
      maxHp: number;
      stats: unknown;
      rpgSystem: 'dnd5e' | 'custom';
    }>
  >;
  combatManager: CombatManager;
}

export default {
  data: new SlashCommandBuilder()
    .setName('combat')
    .setDescription('Combat commands')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('start')
        .setDescription('Start a combat encounter')
        .addStringOption((option) =>
          option.setName('campaign-id').setDescription('Campaign ID').setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('attack')
        .setDescription('Attack a target in combat')
        .addStringOption((option) =>
          option.setName('campaign-id').setDescription('Campaign ID').setRequired(true),
        )
        .addStringOption((option) =>
          option.setName('target').setDescription('Target name').setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('defend')
        .setDescription('Take a defensive stance')
        .addStringOption((option) =>
          option.setName('campaign-id').setDescription('Campaign ID').setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('cast')
        .setDescription('Cast a spell or ability')
        .addStringOption((option) =>
          option.setName('campaign-id').setDescription('Campaign ID').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('spell-name')
            .setDescription('Name of the spell or ability')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName('target').setDescription('Target name (optional)'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('end')
        .setDescription('End the combat encounter')
        .addStringOption((option) =>
          option.setName('campaign-id').setDescription('Campaign ID').setRequired(true),
        ),
    ),

  async execute(interaction, container?: AppContainer) {
    await interaction.deferReply();

    if (!container?.combatRepo) {
      await interaction.editReply({
        content: 'Services not available. Please try again later.',
      });
      return;
    }

    const combatManager = new CombatManager(container.combatRepo);
    const combatCommandServices: CombatCommandServices = {
      getCharactersByCampaignId: async (campaignId) => {
        const characters = await container.characterRepo.findByCampaignId(campaignId);
        return characters.map((c) => ({
          id: c.id,
          name: c.name,
          hp: c.hp,
          maxHp: c.maxHp,
          stats: c.stats as unknown,
          rpgSystem: c.rpgSystem as 'dnd5e' | 'custom',
        }));
      },
      combatManager,
    };

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'start':
        await handleCombatStart(interaction, combatCommandServices);
        break;
      case 'attack':
        await handleCombatAttack(interaction, combatCommandServices);
        break;
      case 'defend':
        await handleCombatDefend(interaction, combatCommandServices);
        break;
      case 'cast':
        await handleCombatCast(interaction, combatCommandServices);
        break;
      case 'end':
        await handleCombatEnd(interaction, combatCommandServices);
        break;
      default:
        await interaction.editReply({ content: 'Invalid subcommand' });
    }
  },
} satisfies Command;

async function handleCombatStart(interaction: any, services: CombatCommandServices) {
  const campaignId = interaction.options.getString('campaign-id', true);

  if (!services?.getCharactersByCampaignId || !services?.combatManager) {
    await interaction.editReply({
      content: '❌ Combat service not available. Please try again later.',
    });
    return;
  }

  try {
    const characters = await services.getCharactersByCampaignId(campaignId);

    if (characters.length === 0) {
      await interaction.editReply({
        content: '❌ No characters found in this campaign. Add characters before starting combat.',
      });
      return;
    }

    const combat = await services.combatManager.startCombat(campaignId, characters);

    const participants = combat.participants.map((p) => ({
      name: p.name,
      hp: p.hp,
      maxHp: p.maxHp,
      initiative: p.initiative,
      isCurrentTurn: p.characterId === combat.participants[combat.currentTurnIndex]?.characterId,
      type: p.type,
    }));

    const embeds = renderBattleState(participants);
    await interaction.editReply({ embeds });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start combat';
    await interaction.editReply({ content: `❌ ${message}` });
  }
}

async function handleCombatAttack(interaction: any, services: CombatCommandServices) {
  const campaignId = interaction.options.getString('campaign-id', true);
  const targetName = interaction.options.getString('target', true);

  if (!services?.combatManager) {
    await interaction.editReply({
      content: '❌ Combat service not available. Please try again later.',
    });
    return;
  }

  const combat = await services.combatManager.getCombat(campaignId);
  if (!combat || !combat.isActive) {
    await interaction.editReply({
      content: '❌ No active combat in this campaign. Use `/combat start` to begin.',
    });
    return;
  }

  const attacker = await services.combatManager.getCurrentParticipant(campaignId);
  if (!attacker) {
    await interaction.editReply({ content: '❌ No active combatant.' });
    return;
  }

  const target = combat.participants.find((p) => p.name.toLowerCase() === targetName.toLowerCase());
  if (!target) {
    await interaction.editReply({
      content: `❌ Target "${targetName}" not found in combat.`,
    });
    return;
  }

  if (target.characterId === attacker.characterId) {
    await interaction.editReply({ content: '❌ You cannot attack yourself.' });
    return;
  }

  try {
    let attackResult: {
      attackRoll: number;
      attackTotal: number;
      hit: boolean;
      critical: boolean;
      damageRolls: number[];
      damageTotal: number;
    };

    if (attacker.stats && 'dex' in attacker.stats) {
      const dndStats = attacker.stats as DnD5eStats;
      const attackMod = abilityModifier(dndStats.dex);
      const engine = getEngine('dnd5e');
      const targetAc = target.stats && 'ac' in target.stats ? (target.stats as DnD5eStats).ac : 10;
      attackResult = engine.calculateDamageRoll(attackMod, targetAc);
    } else if (attacker.stats && 'attack' in attacker.stats) {
      const customStats = attacker.stats as CustomSimpleStats;
      const engine = getEngine('custom');
      const targetDefense =
        target.stats && 'defense' in target.stats
          ? (target.stats as CustomSimpleStats).defense
          : 10;
      attackResult = engine.calculateDamageRoll(customStats.attack, targetDefense);
    } else {
      await interaction.editReply({
        content: '❌ Unable to resolve attack. Invalid character stats.',
      });
      return;
    }

    let damageDealt = 0;
    if (attackResult.hit) {
      damageDealt = await services.combatManager.applyDamage(
        campaignId,
        target.characterId,
        attackResult.damageTotal,
      );
    }

    const result = {
      attackerName: attacker.name,
      defenderName: target.name,
      attackRoll: attackResult.attackRoll,
      hit: attackResult.hit,
      damageDealt,
      defenderRemainingHp: target.hp - damageDealt,
      defenderMaxHp: target.maxHp,
      critical: attackResult.critical,
    };

    const embeds = renderAttackResult(result);
    await interaction.editReply({ embeds: [embeds] });

    await services.combatManager.nextTurn(campaignId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Attack failed';
    await interaction.editReply({ content: `❌ ${message}` });
  }
}

async function handleCombatDefend(interaction: any, services: CombatCommandServices) {
  const campaignId = interaction.options.getString('campaign-id', true);

  if (!services?.combatManager) {
    await interaction.editReply({
      content: '❌ Combat service not available. Please try again later.',
    });
    return;
  }

  const combat = await services.combatManager.getCombat(campaignId);
  if (!combat || !combat.isActive) {
    await interaction.editReply({
      content: '❌ No active combat in this campaign. Use `/combat start` to begin.',
    });
    return;
  }

  const participant = await services.combatManager.getCurrentParticipant(campaignId);
  if (!participant) {
    await interaction.editReply({ content: '❌ No active combatant.' });
    return;
  }

  await services.combatManager.setDefending(campaignId, participant.characterId, true);

  const embed = new EmbedBuilder()
    .setTitle(`🛡️ ${participant.name} takes a defensive stance!`)
    .setDescription('Incoming damage reduced by 50% until next turn.')
    .setColor(Colors.INFO);

  await interaction.editReply({ embeds: [embed] });

  await services.combatManager.nextTurn(campaignId);
}

async function handleCombatCast(interaction: any, services: CombatCommandServices) {
  const campaignId = interaction.options.getString('campaign-id', true);
  const spellName = interaction.options.getString('spell-name', true);
  const targetName = interaction.options.getString('target');

  if (!services?.combatManager) {
    await interaction.editReply({
      content: '❌ Combat service not available. Please try again later.',
    });
    return;
  }

  const combat = await services.combatManager.getCombat(campaignId);
  if (!combat || !combat.isActive) {
    await interaction.editReply({
      content: '❌ No active combat in this campaign. Use `/combat start` to begin.',
    });
    return;
  }

  const participant = await services.combatManager.getCurrentParticipant(campaignId);
  if (!participant) {
    await interaction.editReply({ content: '❌ No active combatant.' });
    return;
  }

  let targetDesc = targetName ? ` on ${targetName}` : '';
  const embed = new EmbedBuilder()
    .setTitle(`✨ ${participant.name} casts ${spellName}!`)
    .setDescription(`Casting${targetDesc}. This is a placeholder for spell resolution.`)
    .setColor(Colors.STORY)
    .addFields({
      name: 'Note',
      value: 'Spell casting is not yet fully implemented. The DM will resolve this action.',
      inline: false,
    });

  await interaction.editReply({ embeds: [embed] });

  await services.combatManager.nextTurn(campaignId);
}

async function handleCombatEnd(interaction: any, services: CombatCommandServices) {
  const campaignId = interaction.options.getString('campaign-id', true);

  if (!services?.combatManager) {
    await interaction.editReply({
      content: '❌ Combat service not available. Please try again later.',
    });
    return;
  }

  const combat = await services.combatManager.getCombat(campaignId);
  if (!combat) {
    await interaction.editReply({
      content: '❌ No combat found in this campaign.',
    });
    return;
  }

  const summary = await services.combatManager.endCombat(campaignId);
  if (!summary) {
    await interaction.editReply({
      content: '❌ Failed to end combat.',
    });
    return;
  }

  const survivors = summary.participants.filter((p) => p.hp > 0);
  const casualties = summary.participants.filter((p) => p.hp <= 0);

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Combat Ended')
    .setColor(Colors.WARNING)
    .addFields(
      { name: 'Rounds', value: `${summary.round}`, inline: true },
      { name: 'Participants', value: `${summary.participants.length}`, inline: true },
      { name: 'Survivors', value: `${survivors.length}`, inline: true },
    );

  if (survivors.length > 0) {
    const survivorList = survivors.map((s) => `• ${s.name} (${s.hp}/${s.maxHp} HP)`).join('\n');
    embed.addFields({
      name: 'Survivors',
      value: survivorList.slice(0, 1024),
      inline: false,
    });
  }

  if (casualties.length > 0) {
    const casualtyList = casualties.map((s) => `• ${s.name}`).join('\n');
    embed.addFields({
      name: 'Casualties',
      value: casualtyList.slice(0, 1024),
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}
