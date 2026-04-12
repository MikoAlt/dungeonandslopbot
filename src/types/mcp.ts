import { z } from 'zod';

export const CharacterCreateInputSchema = z.object({
  name: z.string().min(1).max(100),
  class: z.string(),
  rpgSystem: z.enum(['dnd5e', 'custom']),
  backstory: z.string().optional(),
});

export const CharacterGetInputSchema = z.object({
  id: z.string().uuid(),
});

export const CampaignCreateInputSchema = z.object({
  name: z.string(),
  rpgSystem: z.enum(['dnd5e', 'custom']),
  mode: z.enum(['sharedSession', 'persistentWorld', 'async']),
  description: z.string().optional(),
});

export const StoryAdvanceInputSchema = z.object({
  campaignId: z.string().uuid(),
  action: z.string(),
});

export const DiceRollInputSchema = z.object({
  notation: z.string(),
  modifier: z.number().int().optional(),
});

export type CharacterCreateInput = z.infer<typeof CharacterCreateInputSchema>;
export type CharacterGetInput = z.infer<typeof CharacterGetInputSchema>;
export type CampaignCreateInput = z.infer<typeof CampaignCreateInputSchema>;
export type StoryAdvanceInput = z.infer<typeof StoryAdvanceInputSchema>;
export type DiceRollInput = z.infer<typeof DiceRollInputSchema>;
