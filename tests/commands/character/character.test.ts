import { describe, it, expect } from 'bun:test';
import characterCmd from '../../../src/commands/character/character.js';

describe('character command', () => {
  describe('data', () => {
    it('has correct command name', () => {
      expect(characterCmd.data.name).toBe('character');
    });

    it('has create subcommand', () => {
      const subcommandNames = characterCmd.data.options.map((opt) => opt.name);
      expect(subcommandNames).toContain('create');
    });

    it('has sheet subcommand', () => {
      const subcommandNames = characterCmd.data.options.map((opt) => opt.name);
      expect(subcommandNames).toContain('sheet');
    });

    it('has list subcommand', () => {
      const subcommandNames = characterCmd.data.options.map((opt) => opt.name);
      expect(subcommandNames).toContain('list');
    });

    it('has update subcommand', () => {
      const subcommandNames = characterCmd.data.options.map((opt) => opt.name);
      expect(subcommandNames).toContain('update');
    });

    it('has delete subcommand', () => {
      const subcommandNames = characterCmd.data.options.map((opt) => opt.name);
      expect(subcommandNames).toContain('delete');
    });

    it('create subcommand has required name option', () => {
      const createSubcommand = characterCmd.data.options.find((opt) => opt.name === 'create');
      expect(createSubcommand).toBeDefined();
      const nameOption = (createSubcommand as any)?.options?.find(
        (opt: any) => opt.name === 'name',
      );
      expect(nameOption?.required).toBe(true);
    });

    it('create subcommand has required class option', () => {
      const createSubcommand = characterCmd.data.options.find((opt) => opt.name === 'create');
      expect(createSubcommand).toBeDefined();
      const classOption = (createSubcommand as any)?.options?.find(
        (opt: any) => opt.name === 'class',
      );
      expect(classOption?.required).toBe(true);
    });

    it('create subcommand has required system option with choices', () => {
      const createSubcommand = characterCmd.data.options.find((opt) => opt.name === 'create');
      expect(createSubcommand).toBeDefined();
      const systemOption = (createSubcommand as any)?.options?.find(
        (opt: any) => opt.name === 'system',
      );
      expect(systemOption?.required).toBe(true);
      expect(systemOption?.choices).toBeDefined();
      expect(systemOption?.choices.length).toBe(2);
    });

    it('create subcommand has optional backstory option', () => {
      const createSubcommand = characterCmd.data.options.find((opt) => opt.name === 'create');
      expect(createSubcommand).toBeDefined();
      const backstoryOption = (createSubcommand as any)?.options?.find(
        (opt: any) => opt.name === 'backstory',
      );
      expect(backstoryOption?.required).toBe(false);
    });

    it('sheet subcommand has optional character-id option', () => {
      const sheetSubcommand = characterCmd.data.options.find((opt) => opt.name === 'sheet');
      expect(sheetSubcommand).toBeDefined();
      const characterIdOption = (sheetSubcommand as any)?.options?.find(
        (opt: any) => opt.name === 'character-id',
      );
      expect(characterIdOption?.required).toBe(false);
    });

    it('update subcommand has required character-id and action options', () => {
      const updateSubcommand = characterCmd.data.options.find((opt) => opt.name === 'update');
      expect(updateSubcommand).toBeDefined();
      const characterIdOption = (updateSubcommand as any)?.options?.find(
        (opt: any) => opt.name === 'character-id',
      );
      expect(characterIdOption?.required).toBe(true);
      const actionOption = (updateSubcommand as any)?.options?.find(
        (opt: any) => opt.name === 'action',
      );
      expect(actionOption?.required).toBe(true);
      expect(actionOption?.choices).toBeDefined();
    });

    it('delete subcommand has required character-id and confirm options', () => {
      const deleteSubcommand = characterCmd.data.options.find((opt) => opt.name === 'delete');
      expect(deleteSubcommand).toBeDefined();
      const characterIdOption = (deleteSubcommand as any)?.options?.find(
        (opt: any) => opt.name === 'character-id',
      );
      expect(characterIdOption?.required).toBe(true);
      const confirmOption = (deleteSubcommand as any)?.options?.find(
        (opt: any) => opt.name === 'confirm',
      );
      expect(confirmOption?.required).toBe(true);
    });
  });
});
