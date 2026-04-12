import { describe, expect, it, vi } from 'bun:test';
import { renderNarrativeResponse } from '../../../src/embeds/renderers/story';

describe('Explore command integration', () => {
  describe('renderNarrativeResponse', () => {
    it('renders narrative response as embeds', () => {
      const narrative = 'You enter the dark dungeon. The air is cold and damp.';
      const embeds = renderNarrativeResponse(narrative);

      expect(embeds).toBeDefined();
      expect(Array.isArray(embeds)).toBe(true);
      expect(embeds.length).toBeGreaterThan(0);
    });

    it('handles long narratives with pagination', () => {
      const longNarrative = 'Lorem ipsum '.repeat(1000);
      const embeds = renderNarrativeResponse(longNarrative);

      expect(embeds).toBeDefined();
      expect(Array.isArray(embeds)).toBe(true);
    });
  });
});
