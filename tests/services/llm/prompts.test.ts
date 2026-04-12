import { describe, it, expect } from 'bun:test';
import {
  DND5E_SYSTEM_PROMPT,
  CUSTOM_SYSTEM_PROMPT,
  STORY_SUMMARY_PROMPT,
  CHARACTER_SHEET_PROMPT,
  createStoryPromptTemplate,
  createSummaryPromptTemplate,
  createCharacterSheetPromptTemplate,
  interpolateTemplate,
} from '../../../src/services/llm/prompts';

describe('LLM Prompts', () => {
  describe('DND5E_SYSTEM_PROMPT', () => {
    it('contains D&D 5e rules reference', () => {
      expect(DND5E_SYSTEM_PROMPT).toContain('Ability Modifiers');
      expect(DND5E_SYSTEM_PROMPT).toContain('Combat Rules');
      expect(DND5E_SYSTEM_PROMPT).toContain('Skill Checks');
      expect(DND5E_SYSTEM_PROMPT).toContain('Saving Throws');
    });

    it('contains ability modifier table', () => {
      expect(DND5E_SYSTEM_PROMPT).toContain('Score 10-11: 0');
      expect(DND5E_SYSTEM_PROMPT).toContain('Score 20: +5');
    });

    it('contains combat rules', () => {
      expect(DND5E_SYSTEM_PROMPT).toContain('d20');
      expect(DND5E_SYSTEM_PROMPT).toContain('Critical Hit');
      expect(DND5E_SYSTEM_PROMPT).toContain('Armor Class');
    });

    it('contains skill check DCs', () => {
      expect(DND5E_SYSTEM_PROMPT).toContain('Difficulty Class');
      expect(DND5E_SYSTEM_PROMPT).toContain('Advantage');
      expect(DND5E_SYSTEM_PROMPT).toContain('Disadvantage');
    });

    it('has {{campaignName}} and {{characters}} variables', () => {
      expect(DND5E_SYSTEM_PROMPT).toContain('{{campaignName}}');
      expect(DND5E_SYSTEM_PROMPT).toContain('{{characters}}');
    });

    it('includes DM instructions for dice rolls and state changes', () => {
      expect(DND5E_SYSTEM_PROMPT).toContain('[roll:');
      expect(DND5E_SYSTEM_PROMPT).toContain('[state:');
    });
  });

  describe('CUSTOM_SYSTEM_PROMPT', () => {
    it('contains Custom Simple rules reference', () => {
      expect(CUSTOM_SYSTEM_PROMPT).toContain('HP');
      expect(CUSTOM_SYSTEM_PROMPT).toContain('Attack');
      expect(CUSTOM_SYSTEM_PROMPT).toContain('Defense');
      expect(CUSTOM_SYSTEM_PROMPT).toContain('Speed');
    });

    it('contains combat mechanics', () => {
      expect(CUSTOM_SYSTEM_PROMPT).toContain('1d6');
      expect(CUSTOM_SYSTEM_PROMPT).toContain('attack value');
      expect(CUSTOM_SYSTEM_PROMPT).toContain('defense value');
    });

    it('contains leveling rules', () => {
      expect(CUSTOM_SYSTEM_PROMPT).toContain('Leveling Up');
      expect(CUSTOM_SYSTEM_PROMPT).toContain('+5 HP');
    });

    it('has {{campaignName}} and {{characters}} variables', () => {
      expect(CUSTOM_SYSTEM_PROMPT).toContain('{{campaignName}}');
      expect(CUSTOM_SYSTEM_PROMPT).toContain('{{characters}}');
    });

    it('includes GM instructions for dice rolls and state changes', () => {
      expect(CUSTOM_SYSTEM_PROMPT).toContain('[roll:');
      expect(CUSTOM_SYSTEM_PROMPT).toContain('[state:');
    });
  });

  describe('STORY_SUMMARY_PROMPT', () => {
    it('contains summarization instructions', () => {
      expect(STORY_SUMMARY_PROMPT).toContain('summar');
      expect(STORY_SUMMARY_PROMPT).toContain('concise');
    });

    it('preserves key plot points instruction', () => {
      expect(STORY_SUMMARY_PROMPT).toContain('plot');
      expect(STORY_SUMMARY_PROMPT).toContain('character');
    });

    it('has {{campaignName}}, {{rpgSystem}}, and {{conversationHistory}} variables', () => {
      expect(STORY_SUMMARY_PROMPT).toContain('{{campaignName}}');
      expect(STORY_SUMMARY_PROMPT).toContain('{{rpgSystem}}');
      expect(STORY_SUMMARY_PROMPT).toContain('{{conversationHistory}}');
    });
  });

  describe('CHARACTER_SHEET_PROMPT', () => {
    it('contains character generation instructions', () => {
      expect(CHARACTER_SHEET_PROMPT).toContain('character');
      expect(CHARACTER_SHEET_PROMPT).toContain('balanced');
    });

    it('has {{characterConcept}} and {{rpgSystem}} variables', () => {
      expect(CHARACTER_SHEET_PROMPT).toContain('{{characterConcept}}');
      expect(CHARACTER_SHEET_PROMPT).toContain('{{rpgSystem}}');
    });

    it('references both RPG systems', () => {
      expect(CHARACTER_SHEET_PROMPT).toContain('D&D 5e');
      expect(CHARACTER_SHEET_PROMPT).toContain('Custom Simple');
    });
  });

  describe('createStoryPromptTemplate', () => {
    it('creates a prompt template for dnd5e', () => {
      const template = createStoryPromptTemplate('dnd5e');
      expect(template).toBeDefined();
      expect(template.inputVariables).toContain('input');
      expect(template.inputVariables).toContain('history');
    });

    it('creates a prompt template for custom system', () => {
      const template = createStoryPromptTemplate('custom');
      expect(template).toBeDefined();
      expect(template.inputVariables).toContain('input');
    });
  });

  describe('createSummaryPromptTemplate', () => {
    it('creates a summary prompt template', () => {
      const template = createSummaryPromptTemplate();
      expect(template).toBeDefined();
      expect(template.inputVariables).toContain('conversationHistory');
    });
  });

  describe('createCharacterSheetPromptTemplate', () => {
    it('creates a character sheet prompt template', () => {
      const template = createCharacterSheetPromptTemplate();
      expect(template).toBeDefined();
      expect(template.inputVariables).toContain('characterConcept');
    });
  });

  describe('interpolateTemplate', () => {
    it('replaces {{variables}} with values', () => {
      const template = 'Hello {{name}}, welcome to {{place}}!';
      const result = interpolateTemplate(template, { name: 'Adventurer', place: 'Dungeon' });
      expect(result).toBe('Hello Adventurer, welcome to Dungeon!');
    });

    it('replaces multiple occurrences of same variable', () => {
      const template = '{{name}} enters the {{name}} hall';
      const result = interpolateTemplate(template, { name: 'Hero' });
      expect(result).toBe('Hero enters the Hero hall');
    });

    it('leaves unreferenced variables unchanged', () => {
      const template = 'Hello {{name}}, {{unknown}}';
      const result = interpolateTemplate(template, { name: 'Hero' });
      expect(result).toBe('Hello Hero, {{unknown}}');
    });

    it('handles empty variables object', () => {
      const template = 'No variables here';
      const result = interpolateTemplate(template, {});
      expect(result).toBe('No variables here');
    });

    it('handles DND5E system prompt interpolation', () => {
      const result = interpolateTemplate(DND5E_SYSTEM_PROMPT, {
        campaignName: 'Lost Mines',
        characters: 'Fighter, Wizard',
      });
      expect(result).toContain('Lost Mines');
      expect(result).toContain('Fighter, Wizard');
      expect(result).not.toContain('{{campaignName}}');
      expect(result).not.toContain('{{characters}}');
    });

    it('handles CUSTOM system prompt interpolation', () => {
      const result = interpolateTemplate(CUSTOM_SYSTEM_PROMPT, {
        campaignName: 'Space Quest',
        characters: 'Captain, Engineer',
      });
      expect(result).toContain('Space Quest');
      expect(result).toContain('Captain, Engineer');
    });
  });
});
