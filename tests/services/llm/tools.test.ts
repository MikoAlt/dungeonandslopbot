import { describe, it, expect } from 'bun:test';
import {
  createCharacterTool,
  getCampaignTool,
  storyAdvanceTool,
  diceRollTool,
  searchMemoryTool,
  allTools,
} from '../../../src/services/llm/tools';

describe('LLM Tools', () => {
  describe('createCharacterTool', () => {
    it('has correct name and description', () => {
      expect(createCharacterTool.name).toBe('create_character');
      expect(createCharacterTool.description).toContain('character');
    });

    it('has a schema with required fields', () => {
      const schema = createCharacterTool.schema;
      expect(schema).toBeDefined();
    });

    it('returns valid CharacterCreateInput JSON when invoked', async () => {
      const result = await createCharacterTool.invoke({
        name: 'Aragorn',
        characterClass: 'Ranger',
        rpgSystem: 'dnd5e',
        backstory: 'Heir of Isildur',
      });

      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('Aragorn');
      expect(parsed.class).toBe('Ranger');
      expect(parsed.rpgSystem).toBe('dnd5e');
      expect(parsed.backstory).toBe('Heir of Isildur');
    });

    it('works without optional backstory', async () => {
      const result = await createCharacterTool.invoke({
        name: 'Gimli',
        characterClass: 'Fighter',
        rpgSystem: 'custom',
      });

      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('Gimli');
      expect(parsed.rpgSystem).toBe('custom');
    });
  });

  describe('getCampaignTool', () => {
    it('has correct name and description', () => {
      expect(getCampaignTool.name).toBe('get_campaign');
      expect(getCampaignTool.description).toContain('campaign');
    });

    it('returns campaign retrieval action when invoked', async () => {
      const campaignId = '550e8400-e29b-41d4-a716-446655440001';
      const result = await getCampaignTool.invoke({ campaignId });

      const parsed = JSON.parse(result);
      expect(parsed.action).toBe('get_campaign');
      expect(parsed.campaignId).toBe(campaignId);
    });
  });

  describe('storyAdvanceTool', () => {
    it('has correct name and description', () => {
      expect(storyAdvanceTool.name).toBe('story_advance');
      expect(storyAdvanceTool.description).toContain('story');
    });

    it('returns valid StoryAdvanceInput JSON when invoked', async () => {
      const campaignId = '550e8400-e29b-41d4-a716-446655440001';
      const result = await storyAdvanceTool.invoke({
        campaignId,
        action: 'I attack the goblin with my sword',
      });

      const parsed = JSON.parse(result);
      expect(parsed.campaignId).toBe(campaignId);
      expect(parsed.action).toBe('I attack the goblin with my sword');
    });
  });

  describe('diceRollTool', () => {
    it('has correct name and description', () => {
      expect(diceRollTool.name).toBe('dice_roll');
      expect(diceRollTool.description).toContain('dice');
    });

    it('rolls dice and returns valid result', async () => {
      const result = await diceRollTool.invoke({ notation: '2d6+3' });

      const parsed = JSON.parse(result);
      expect(parsed.notation).toBe('2d6+3');
      expect(parsed.rolls).toHaveLength(2);
      expect(parsed.modifier).toBe(0);
      expect(parsed.total).toBeGreaterThan(0);
      for (const roll of parsed.rolls) {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      }
    });

    it('rolls d20 without modifier', async () => {
      const result = await diceRollTool.invoke({ notation: '1d20' });

      const parsed = JSON.parse(result);
      expect(parsed.rolls).toHaveLength(1);
      expect(parsed.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(parsed.rolls[0]).toBeLessThanOrEqual(20);
      expect(parsed.modifier).toBe(0);
    });

    it('rolls with explicit modifier', async () => {
      const result = await diceRollTool.invoke({ notation: '1d20', modifier: 5 });

      const parsed = JSON.parse(result);
      expect(parsed.modifier).toBe(5);
      expect(parsed.total).toBe(parsed.rolls[0] + 5);
    });

    it('returns error for invalid notation', async () => {
      const result = await diceRollTool.invoke({ notation: 'invalid' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBeDefined();
    });
  });

  describe('searchMemoryTool', () => {
    it('has correct name and description', () => {
      expect(searchMemoryTool.name).toBe('search_memory');
      expect(searchMemoryTool.description).toContain('memory');
    });

    it('returns placeholder response when invoked', async () => {
      const campaignId = '550e8400-e29b-41d4-a716-446655440001';
      const result = await searchMemoryTool.invoke({
        query: 'What happened to the dragon?',
        campaignId,
      });

      const parsed = JSON.parse(result);
      expect(parsed.action).toBe('search_memory');
      expect(parsed.query).toBe('What happened to the dragon?');
      expect(parsed.campaignId).toBe(campaignId);
      expect(parsed.results).toEqual([]);
    });
  });

  describe('allTools', () => {
    it('contains all five tools', () => {
      expect(allTools).toHaveLength(5);
    });

    it('contains tools with unique names', () => {
      const names = allTools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('includes each tool by name', () => {
      const names = allTools.map((t) => t.name);
      expect(names).toContain('create_character');
      expect(names).toContain('get_campaign');
      expect(names).toContain('story_advance');
      expect(names).toContain('dice_roll');
      expect(names).toContain('search_memory');
    });
  });
});
