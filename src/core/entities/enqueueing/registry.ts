import { TriggerQueueProvider } from "../../providers/queue/trigger/trigger.ts";
import type { JobQueueProvider } from "./general-queue-entity.ts";

export const JobQueueProviderRegistry = {
    "trigger": TriggerQueueProvider
} satisfies Record<string, new () => JobQueueProvider>;


export type availableProvider = keyof typeof JobQueueProviderRegistry;

export const availableProviders = Object.keys(JobQueueProviderRegistry) as availableProvider[];