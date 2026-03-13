import z from "zod";
import {
  AIResponse,
  AIResponseSchema,
} from "../../../core/entities/generation/messages-entities.ts";
import {
  ModelRegistry,
  type availableModels,
} from "../../../core/entities/generation/ai-models-registry.ts";
import {
  AiWrappersRegistry,
  type availableWrappers,
} from "../../../core/entities/generation/model-providers-and-wrappers/kie-dtos.ts";
import { QueueJobStatusSchema } from "../../../core/entities/enqueueing/general-queue-entity.ts";

export const AvailableAiModelsNamesSchema = z.enum(
  Object.keys(ModelRegistry) as [availableModels, ...availableModels[]],
);

export const AvailableAiWrappersNamesSchema = z.enum(
  Object.keys(AiWrappersRegistry) as [
    availableWrappers,
    ...availableWrappers[],
  ],
);

// POST SCHEMAS
export const GenerateContentRequestSchema = z.object({
  modelName: AvailableAiModelsNamesSchema,
  content: z.array(z.string().min(1)).min(1),
});

export const GenerateContentResponseSchema202 = z.object({
  taskId: z.string(),
  modelName: AvailableAiModelsNamesSchema,
  status: QueueJobStatusSchema,
});
// GET SCHEMAS

export const GetGenerationResponseSchema = z.object({
  status: QueueJobStatusSchema,
  result: AIResponseSchema.optional(), // The result might not be ready
  error: z.string().optional(),
  errorCode: z.number().optional(),
});

export function isAIResponse(data: unknown): data is AIResponse {
  return AIResponseSchema.safeParse(data).success;
}
