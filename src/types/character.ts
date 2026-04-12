import { z } from 'zod';

export const DnD5eStatsSchema = z.object({
  str: z.number().int().min(1).max(30),
  dex: z.number().int().min(1).max(30),
  con: z.number().int().min(1).max(30),
  int: z.number().int().min(1).max(30),
  wis: z.number().int().min(1).max(30),
  cha: z.number().int().min(1).max(30),
  ac: z.number().int().min(0),
  speed: z.number().int().min(0),
  hitDice: z.string(),
});

export const CustomSimpleStatsSchema = z.object({
  hp: z.number().int().min(0),
  attack: z.number().int().min(0),
  defense: z.number().int().min(0),
  speed: z.number().int().min(0),
  special: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .default([]),
});

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  class: z.string(),
  level: z.number().int().min(1).default(1),
  hp: z.number().int().min(0),
  maxHp: z.number().int().min(1),
  rpgSystem: z.enum(['dnd5e', 'custom']),
  stats: z.union([DnD5eStatsSchema, CustomSimpleStatsSchema]),
  inventory: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().int().min(0),
        description: z.string().optional(),
      }),
    )
    .default([]),
  backstory: z.string().optional(),
  campaignId: z.string().uuid().optional(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Character = z.infer<typeof CharacterSchema>;
export type DnD5eStats = z.infer<typeof DnD5eStatsSchema>;
export type CustomSimpleStats = z.infer<typeof CustomSimpleStatsSchema>;
