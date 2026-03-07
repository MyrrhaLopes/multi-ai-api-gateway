import z from "zod";
import type { AiModel } from "./general-entities.ts";
import type { availableWrappers } from "./model-providers-and-wrappers/kie-dtos.ts";
import { Sora2ImageToVideoKie } from "../../providers/ai/open-ai/sora-2-image-to-video/sora-2-image-to-video@kie.ts";

export const ModelRegistry = {
  "sora2-image-to-video@kie": Sora2ImageToVideoKie,
} satisfies Record<string, new (wrapper?: availableWrappers) => AiModel>;
export type availableModels = keyof typeof ModelRegistry;

// Extract the valid keys dynamically from your registry for runtime validation with Zod
const validModelKeys = Object.keys(ModelRegistry) as [
  keyof typeof ModelRegistry,
];

// Create a Zod enum that will automatically update when ModelRegistry updates
export const availableAiModelsZodSchema = z.enum(validModelKeys);
