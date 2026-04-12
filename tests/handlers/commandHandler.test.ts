import { describe, expect, it } from 'bun:test';
import { loadCommands } from '../../src/handlers/commandHandler';

describe('commandHandler', () => {
  describe('loadCommands', () => {
    it('returns a map', async () => {
      const commands = await loadCommands();
      expect(commands).toBeInstanceOf(Map);
    });

    it('loads ping command when present', async () => {
      const commands = await loadCommands();
      expect(commands.has('ping')).toBe(true);
    });
  });
});
