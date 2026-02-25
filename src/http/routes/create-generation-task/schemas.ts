import z from "zod";
import { AIMessageSchema } from "../../../core/entities/generation/messages-entities.ts";
import { ModelRegistry, type availableModels } from "../../../core/entities/generation/ai-models-registry.ts";
import { AiWrappersRegistry, type availableWrappers } from "../../../core/entities/generation/wrappers/ai-wrappers.ts";

export const AvailableAiModelsNamesSchema = z.enum(
    Object.keys(ModelRegistry) as [availableModels, ...availableModels[]]
);

export const AvailableAiWrappersNamesSchema = z.enum(
    Object.keys(AiWrappersRegistry) as [availableWrappers, ...availableWrappers[]]
);

export const GenerateContentRequestSchema = z.object({
    modelName: AvailableAiModelsNamesSchema,
    wrapperName: AvailableAiWrappersNamesSchema,
    messages: z.array(AIMessageSchema)
});

export const GenerateContentResponseSchema = z.object({
    taskId: z.string(),
    modelName: AvailableAiModelsNamesSchema,
    status: z.enum(["queued", "processing", "completed", "failed"])
});
type GenerateContentResponse = z.infer<typeof GenerateContentResponseSchema>;

const GetTaskStatusRequestSchema = z.object({
    taskId: z.string()
});
type GetTaskStatusRequest = z.infer<typeof GetTaskStatusRequestSchema>;


