import { z } from 'zod';

export const SceneSchema = z.object({
  id: z.string(),
  description: z.string(),
  npcInteractions: z.array(z.string()).default([]),
  playerActions: z.array(z.string()).default([]),
  outcome: z.string().optional(),
  timestamp: z.date(),
});

export const StorySchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  scenes: z.array(SceneSchema),
  currentSceneIndex: z.number().int().min(0).default(0),
  summary: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Story = z.infer<typeof StorySchema>;
export type Scene = z.infer<typeof SceneSchema>;
