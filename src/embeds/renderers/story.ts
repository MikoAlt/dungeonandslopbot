import { EmbedBuilder } from 'discord.js';
import { EmbedPaginator } from '../paginator.js';
import { Colors } from '../themes.js';
import type { Story, Scene } from '../../types/story.js';

export function renderScene(scene: Scene): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle(`Scene ${scene.id}`).setColor(Colors.STORY);

  if (scene.description) {
    embed.setDescription(
      scene.description.length > 4096
        ? scene.description.slice(0, 4093) + '...'
        : scene.description,
    );
  }

  if (scene.npcInteractions.length > 0) {
    const npcList = scene.npcInteractions.map((npc) => `• ${npc}`).join('\n');
    embed.addFields({ name: 'NPC Interactions', value: npcList.slice(0, 1024), inline: false });
  }

  if (scene.playerActions.length > 0) {
    const actionList = scene.playerActions.map((a) => `• ${a}`).join('\n');
    embed.addFields({ name: 'Player Actions', value: actionList.slice(0, 1024), inline: false });
  }

  if (scene.outcome) {
    embed.addFields({ name: 'Outcome', value: scene.outcome.slice(0, 1024), inline: false });
  }

  return embed;
}

export function renderStorySummary(story: Story): EmbedBuilder[] {
  const paginator = new EmbedPaginator('Story Summary');
  paginator.setColor(Colors.STORY);

  if (story.summary) {
    paginator.addDescription(story.summary);
  }

  for (const scene of story.scenes) {
    const sceneTitle = `Scene ${scene.id}`;
    let sceneBody = scene.description;
    if (scene.outcome) {
      sceneBody += `\n**Outcome:** ${scene.outcome}`;
    }
    paginator.addField(sceneTitle, sceneBody, false);
  }

  paginator.setFooter(`Campaign: ${story.campaignId}`);
  return paginator.build();
}

export function renderNarrativeResponse(response: string): EmbedBuilder[] {
  const paginator = new EmbedPaginator('Narrative');
  paginator.setColor(Colors.STORY);
  paginator.addDescription(response);
  return paginator.build();
}
