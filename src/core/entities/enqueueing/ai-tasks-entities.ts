// =============================================================================
// Task & Queue Status
// =============================================================================

import z from "zod";
import { AIResponseSchema } from "../generation/messages-entities.ts";

export const AiTaskStatusSchema = z.enum(["success", "failed", "pending", "running", "cancelled"]);
export type AiTaskStatus = z.infer<typeof AiTaskStatusSchema>;

export const AiTaskLiveDataSchema = z.object({
    status: AiTaskStatusSchema,
    result: AIResponseSchema.optional(),
    error: z.string().optional(),
    errorCode: z.number().optional()
});
export type AiTaskLiveData = z.infer<typeof AiTaskLiveDataSchema>;
