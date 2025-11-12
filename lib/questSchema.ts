import { z } from "zod";

export const QuestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional().default(""),
  type: z.enum(["reflection", "action", "tracking"]).default("action"),
  difficulty: z.number().int().min(1).max(3).default(1),
  steps: z.array(z.string()).optional().default([]),
  createdAt: z.number().int().optional(), // epoch ms
});

export type Quest = z.infer<typeof QuestSchema>;

export const QuestArraySchema = z.array(QuestSchema);

