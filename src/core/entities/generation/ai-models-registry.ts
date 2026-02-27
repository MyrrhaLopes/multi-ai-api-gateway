import z from "zod";
import type { AiModel } from "./general-entities.ts";
import type { availableWrappers } from "./model-providers-and-wrappers/kie-dtos.ts";
import { Sora2ImageToVideo } from "../../providers/ai/open-ai/sora-2-image-to-video/sora-2-image-to-video@kie.ts";


export const ModelRegistry = {
    "sora2-image-to-video": Sora2ImageToVideo,
} satisfies Record<string, new (wrapper?: availableWrappers) => AiModel>;
export type availableModels = keyof typeof ModelRegistry;

