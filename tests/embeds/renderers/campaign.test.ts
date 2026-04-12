import { describe, test, expect } from 'bun:test';
import {
  renderCampaignStatus,
  renderWorldState,
  renderPlayerList,
} from '../../../src/embeds/renderers/campaign.js';
import { Colors } from '../../../src/embeds/themes.js';
import type { Campaign } from '../../../src/types/campaign.js';

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Campaign',
    description: 'An epic adventure',
    rpgSystem: 'dnd5e',
    mode: 'sharedSession',
    dmUserId: 'dm-123',
    guildId: 'guild-456',
    channelId: 'channel-789',
    worldState: {
      currentLocation: 'The Tavern',
      npcs: ['Gandalf', 'Elrond'],
      quests: [
        { name: 'Destroy the Ring', status: 'active' },
        { name: 'Save the Shire', status: 'completed' },
      ],
      events: ['The fellowship was formed'],
      sessionCount: 5,
    },
    isActive: true,
    players: ['player-1', 'player-2'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('renderCampaignStatus', () => {
  test('renders campaign overview with all fields', () => {
    const campaign = makeCampaign();
    const embeds = renderCampaignStatus(campaign);

    expect(embeds.length).toBeGreaterThanOrEqual(1);
    const first = embeds[0].data;
    expect(first.title).toBe('Test Campaign');
    expect(first.color).toBe(Colors.INFO);

    const fields = first.fields ?? [];
    const systemField = fields.find((f) => f.name === 'System');
    expect(systemField!.value).toBe('D&D 5e');

    const modeField = fields.find((f) => f.name === 'Mode');
    expect(modeField!.value).toBe('Shared Session');

    const statusField = fields.find((f) => f.name === 'Status');
    expect(statusField!.value).toContain('Active');

    const dmField = fields.find((f) => f.name === 'DM');
    expect(dmField!.value).toContain('dm-123');

    const playersField = fields.find((f) => f.name === 'Players');
    expect(playersField!.value).toBe('2');

    const locationField = fields.find((f) => f.name === 'Location');
    expect(locationField!.value).toBe('The Tavern');
  });

  test('renders inactive campaign', () => {
    const campaign = makeCampaign({ isActive: false });
    const embeds = renderCampaignStatus(campaign);
    const fields = embeds[0].data.fields ?? [];
    const statusField = fields.find((f) => f.name === 'Status');
    expect(statusField!.value).toContain('Inactive');
  });

  test('renders custom system label', () => {
    const campaign = makeCampaign({ rpgSystem: 'custom' });
    const embeds = renderCampaignStatus(campaign);
    const fields = embeds[0].data.fields ?? [];
    const systemField = fields.find((f) => f.name === 'System');
    expect(systemField!.value).toBe('Custom Simple');
  });

  test('renders description', () => {
    const campaign = makeCampaign({ description: 'An epic adventure' });
    const embeds = renderCampaignStatus(campaign);
    expect(embeds[0].data.description).toContain('An epic adventure');
  });

  test('footer contains campaign ID', () => {
    const campaign = makeCampaign();
    const embeds = renderCampaignStatus(campaign);
    const last = embeds[embeds.length - 1];
    expect(last.data.footer?.text).toContain(campaign.id);
  });
});

describe('renderWorldState', () => {
  test('renders world state with NPCs and quests', () => {
    const campaign = makeCampaign();
    const embeds = renderWorldState(campaign);

    expect(embeds.length).toBeGreaterThanOrEqual(1);
    const fields = embeds[0].data.fields ?? [];

    const locationField = fields.find((f) => f.name === 'Current Location');
    expect(locationField!.value).toBe('The Tavern');

    const npcField = fields.find((f) => f.name === 'NPCs');
    expect(npcField!.value).toContain('Gandalf');
    expect(npcField!.value).toContain('Elrond');

    const questField = fields.find((f) => f.name === 'Quests');
    expect(questField!.value).toContain('Destroy the Ring');
    expect(questField!.value).toContain('active');
    expect(questField!.value).toContain('Save the Shire');
    expect(questField!.value).toContain('completed');

    const sessionField = fields.find((f) => f.name === 'Sessions Played');
    expect(sessionField!.value).toBe('5');
  });

  test('uses EmbedPaginator for 30+ NPCs', () => {
    const npcs = Array.from({ length: 35 }, (_, i) => `NPC ${i + 1}`);
    const campaign = makeCampaign({
      worldState: {
        currentLocation: 'City',
        npcs,
        quests: [],
        events: [],
        sessionCount: 10,
      },
    });
    const embeds = renderWorldState(campaign);
    expect(embeds.length).toBeGreaterThanOrEqual(1);
    const allFields = embeds.flatMap((e) => e.data.fields ?? []);
    const npcField = allFields.find((f) => f.name === 'NPCs');
    expect(npcField).toBeDefined();
  });

  test('renders events', () => {
    const campaign = makeCampaign();
    const embeds = renderWorldState(campaign);
    const fields = embeds[0].data.fields ?? [];
    const eventsField = fields.find((f) => f.name === 'Events');
    expect(eventsField!.value).toContain('The fellowship was formed');
  });

  test('omits empty sections', () => {
    const campaign = makeCampaign({
      worldState: {
        currentLocation: 'Void',
        npcs: [],
        quests: [],
        events: [],
        sessionCount: 0,
      },
    });
    const embeds = renderWorldState(campaign);
    const fields = embeds[0].data.fields ?? [];
    expect(fields.find((f) => f.name === 'NPCs')).toBeUndefined();
    expect(fields.find((f) => f.name === 'Quests')).toBeUndefined();
    expect(fields.find((f) => f.name === 'Events')).toBeUndefined();
  });
});

describe('renderPlayerList', () => {
  test('renders player list with players', () => {
    const campaign = makeCampaign();
    const embed = renderPlayerList(campaign);
    const data = embed.data;

    expect(data.title).toContain('Players');
    expect(data.title).toContain('Test Campaign');
    expect(data.color).toBe(Colors.INFO);

    const fields = data.fields ?? [];
    const playersField = fields.find((f) => f.name === 'Players');
    expect(playersField!.value).toContain('player-1');
    expect(playersField!.value).toContain('player-2');

    const dmField = fields.find((f) => f.name === 'DM');
    expect(dmField!.value).toContain('dm-123');
  });

  test('renders empty player list', () => {
    const campaign = makeCampaign({ players: [] });
    const embed = renderPlayerList(campaign);
    const fields = embed.data.fields ?? [];
    const playersField = fields.find((f) => f.name === 'Players');
    expect(playersField!.value).toBe('No players yet');
  });
});
