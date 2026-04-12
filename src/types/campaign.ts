import { z } from 'zod';

export const WorldStateSchema = z.object({
  currentLocation: z.string(),
  npcs: z.array(z.string()).default([]),
  quests: z
    .array(
      z.object({
        name: z.string(),
        status: z.enum(['active', 'completed', 'failed']),
      }),
    )
    .default([]),
  events: z.array(z.string()).default([]),
  sessionCount: z.number().int().min(0).default(0),
});

export const CampaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  rpgSystem: z.enum(['dnd5e', 'custom']),
  mode: z.enum(['sharedSession', 'persistentWorld', 'async']),
  dmUserId: z.string(),
  guildId: z.string(),
  channelId: z.string(),
  worldState: WorldStateSchema,
  isActive: z.boolean().default(true),
  players: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Campaign = z.infer<typeof CampaignSchema>;
export type WorldState = z.infer<typeof WorldStateSchema>;
