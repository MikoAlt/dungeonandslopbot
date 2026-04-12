import { EmbedBuilder } from 'discord.js';
import { EmbedPaginator } from '../paginator.js';
import { Colors } from '../themes.js';
import type { Campaign } from '../../types/campaign.js';

export function renderCampaignStatus(campaign: Campaign): EmbedBuilder[] {
  const paginator = new EmbedPaginator(campaign.name);
  paginator.setColor(Colors.INFO);

  const modeLabels: Record<string, string> = {
    sharedSession: 'Shared Session',
    persistentWorld: 'Persistent World',
    async: 'Async',
  };

  const systemLabels: Record<string, string> = {
    dnd5e: 'D&D 5e',
    custom: 'Custom Simple',
  };

  paginator.addField('System', systemLabels[campaign.rpgSystem] ?? campaign.rpgSystem, true);
  paginator.addField('Mode', modeLabels[campaign.mode] ?? campaign.mode, true);
  paginator.addField('Status', campaign.isActive ? '🟢 Active' : '🔴 Inactive', true);

  if (campaign.description) {
    paginator.addDescription(campaign.description);
  }

  paginator.addField('DM', `<@${campaign.dmUserId}>`, true);
  paginator.addField('Players', `${campaign.players.length}`, true);

  if (campaign.worldState.currentLocation) {
    paginator.addField('Location', campaign.worldState.currentLocation, false);
  }

  paginator.setFooter(`Campaign ID: ${campaign.id}`);
  return paginator.build();
}

export function renderWorldState(campaign: Campaign): EmbedBuilder[] {
  const paginator = new EmbedPaginator(`World State — ${campaign.name}`);
  paginator.setColor(Colors.STORY);

  const ws = campaign.worldState;

  if (ws.currentLocation) {
    paginator.addField('Current Location', ws.currentLocation, false);
  }

  paginator.addField('Sessions Played', `${ws.sessionCount}`, true);

  if (ws.npcs.length > 0) {
    const npcList = ws.npcs.map((npc) => `• ${npc}`).join('\n');
    paginator.addField('NPCs', npcList, false);
  }

  if (ws.quests.length > 0) {
    const questLines = ws.quests.map((q) => {
      const statusEmoji: Record<string, string> = {
        active: '🟡',
        completed: '🟢',
        failed: '🔴',
      };
      return `${statusEmoji[q.status] ?? '⚪'} ${q.name} [${q.status}]`;
    });
    paginator.addField('Quests', questLines.join('\n'), false);
  }

  if (ws.events.length > 0) {
    const eventList = ws.events.map((e) => `• ${e}`).join('\n');
    paginator.addField('Events', eventList, false);
  }

  paginator.setFooter(`Campaign ID: ${campaign.id}`);
  return paginator.build();
}

export function renderPlayerList(campaign: Campaign): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(`Players — ${campaign.name}`).setColor(Colors.INFO);

  if (campaign.players.length === 0) {
    embed.addFields({ name: 'Players', value: 'No players yet', inline: false });
  } else {
    const playerList = campaign.players.map((id) => `• <@${id}>`).join('\n');
    embed.addFields({ name: 'Players', value: playerList, inline: false });
  }

  embed.addFields({ name: 'DM', value: `<@${campaign.dmUserId}>`, inline: false });

  return embed;
}
