import { EmbedBuilder } from 'discord.js';
import { EmbedPaginator } from '../paginator.js';
import { Colors } from '../themes.js';
import type { DiceResult } from '../../services/rpg/dice.js';

export interface BattleParticipant {
  name: string;
  hp: number;
  maxHp: number;
  initiative: number;
  isCurrentTurn: boolean;
  type: 'player' | 'npc';
}

export interface AttackResult {
  attackerName: string;
  defenderName: string;
  attackRoll: number;
  hit: boolean;
  damageDealt: number;
  defenderRemainingHp: number;
  defenderMaxHp: number;
  critical: boolean;
}

function createHpBar(current: number, max: number, length = 10): string {
  const clampedCurrent = Math.max(0, Math.min(current, max));
  const filled = max > 0 ? Math.round((clampedCurrent / max) * length) : 0;
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${clampedCurrent}/${max}`;
}

export function renderBattleState(participants: BattleParticipant[]): EmbedBuilder[] {
  const paginator = new EmbedPaginator('⚔️ Battle');
  paginator.setColor(Colors.DANGER);

  const sortedByInitiative = [...participants].sort((a, b) => b.initiative - a.initiative);

  for (const p of sortedByInitiative) {
    const turnMarker = p.isCurrentTurn ? '▶ ' : '  ';
    const typeIcon = p.type === 'player' ? '🧑' : '👹';
    const name = `${turnMarker}${typeIcon} ${p.name}`;
    const hpBar = createHpBar(p.hp, p.maxHp);
    paginator.addField(name, hpBar, false);
  }

  paginator.setFooter(`${participants.length} combatants`);
  return paginator.build();
}

export function renderAttackResult(result: AttackResult): EmbedBuilder {
  const hitText = result.critical ? '💥 CRITICAL HIT!' : result.hit ? '✅ Hit!' : '❌ Miss!';

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ ${result.attackerName} attacks ${result.defenderName}`)
    .setColor(result.hit ? Colors.DANGER : Colors.INFO)
    .addFields(
      { name: 'Attack Roll', value: `${result.attackRoll}`, inline: true },
      { name: 'Result', value: hitText, inline: true },
    );

  if (result.hit) {
    embed.addFields(
      { name: 'Damage', value: `${result.damageDealt}`, inline: true },
      {
        name: `${result.defenderName} HP`,
        value: createHpBar(result.defenderRemainingHp, result.defenderMaxHp),
        inline: false,
      },
    );
  }

  return embed;
}

export function renderDamageDice(results: DiceResult[]): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle('🎲 Damage Dice').setColor(Colors.DANGER);

  for (const result of results) {
    const rollsStr = result.rolls.join(', ');
    const modStr =
      result.modifier !== 0 ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}` : '';
    embed.addFields({
      name: `${result.notation.count}d${result.notation.sides}${modStr}`,
      value: `[${rollsStr}] = **${result.total}**`,
      inline: true,
    });
  }

  return embed;
}
