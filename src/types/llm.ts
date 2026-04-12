import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export const ContextWindowSchema = z.object({
  system: z.string(),
  worldState: z.string(),
  recentMessages: z.array(ChatMessageSchema),
  ragResults: z.array(z.string()).default([]),
  totalTokens: z.number().int().min(0),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ContextWindow = z.infer<typeof ContextWindowSchema>;
