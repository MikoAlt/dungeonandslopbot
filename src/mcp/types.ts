import { z } from 'zod';

export const PingInputSchema = z.object({}).strict();
export type PingInput = z.infer<typeof PingInputSchema>;

export const CharacterCreateInputSchema = z.object({
  name: z.string(),
  class: z.string(),
  rpgSystem: z.enum(['dnd5e', 'custom']),
  backstory: z.string().optional(),
});
export type CharacterCreateInput = z.infer<typeof CharacterCreateInputSchema>;

export const CharacterGetInputSchema = z.object({
  id: z.string(),
});
export type CharacterGetInput = z.infer<typeof CharacterGetInputSchema>;

export const CampaignCreateInputSchema = z.object({
  name: z.string(),
  rpgSystem: z.enum(['dnd5e', 'custom']),
  mode: z.enum(['sharedSession', 'persistentWorld', 'async']),
  description: z.string().optional(),
});
export type CampaignCreateInput = z.infer<typeof CampaignCreateInputSchema>;

export const StoryAdvanceInputSchema = z.object({
  campaignId: z.string(),
  action: z.string(),
});
export type StoryAdvanceInput = z.infer<typeof StoryAdvanceInputSchema>;

export const DiceRollInputSchema = z.object({
  notation: z.string(),
  modifier: z.number().optional(),
});
export type DiceRollInput = z.infer<typeof DiceRollInputSchema>;

export const RESOURCE_URI_PATTERNS = {
  campaign: 'dungeon://campaigns/{id}',
  character: 'dungeon://characters/{id}',
  story: 'dungeon://stories/{id}',
} as const;
