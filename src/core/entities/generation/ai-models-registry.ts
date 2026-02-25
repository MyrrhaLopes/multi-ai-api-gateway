import z from "zod";
import { Sora2ImageToVideo } from "../../providers/ai/OpenAI/Sora2ImageToVideo/sora-2-image-to-video.ts";
import type { AiModel } from "./general-entities.ts";
import type { availableWrappers } from "./wrappers/ai-wrappers.ts";


export const ModelRegistry = {
    "sora2-image-to-video": Sora2ImageToVideo,
} satisfies Record<string, new (wrapper?: availableWrappers) => AiModel>;
export type availableModels = keyof typeof ModelRegistry;

