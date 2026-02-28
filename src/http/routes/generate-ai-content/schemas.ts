import z from "zod";
import { AIMessageSchema } from "../../../core/entities/generation/messages-entities.ts";
import { ModelRegistry, type availableModels } from "../../../core/entities/generation/ai-models-registry.ts";
import { AiWrappersRegistry, type availableWrappers } from "../../../core/entities/generation/model-providers-and-wrappers/kie-dtos.ts";
import { QueueJobStatusSchema } from "../../../core/entities/enqueueing/general-queue-entity.ts";

export const AvailableAiModelsNamesSchema = z.enum(
    Object.keys(ModelRegistry) as [availableModels, ...availableModels[]]
);

export const AvailableAiWrappersNamesSchema = z.enum(
    Object.keys(AiWrappersRegistry) as [availableWrappers, ...availableWrappers[]]
);

export const GenerateContentRequestSchema = z.object({
    modelName: AvailableAiModelsNamesSchema,
    messages: z.array(AIMessageSchema)
});

export const GenerateContentResponseSchema202 = z.object({
    taskId: z.string(),
    modelName: AvailableAiModelsNamesSchema,
    status: QueueJobStatusSchema
});

