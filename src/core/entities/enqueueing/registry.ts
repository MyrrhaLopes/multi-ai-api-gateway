import { TriggerQueueProvider } from "../../providers/queue/trigger/trigger.ts";
import type { TaskQueueProvider } from "./general-queue-entity.ts";

export const TaskQueueProviderRegistry = {
    "trigger": TriggerQueueProvider
} satisfies Record<string, new () => TaskQueueProvider>;


export type availableProvider = keyof typeof TaskQueueProviderRegistry;

export const availableProviders = Object.keys(TaskQueueProviderRegistry) as availableProvider[];