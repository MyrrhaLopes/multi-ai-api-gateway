import { type availableProvider, TaskQueueProviderRegistry } from "../entities/enqueueing/registry.ts";
import type { TaskQueueProvider, QueueJobResult } from "../entities/enqueueing/general-queue-entity.ts";

export default class QueueService {
    private provider: TaskQueueProvider;
    constructor(provider: availableProvider = "trigger") {
        const providerClass = TaskQueueProviderRegistry[provider];
        if (!providerClass) {
            throw new Error(`Provider ${provider} not found`);
        }
        this.provider = new providerClass();
    }

    enqueue<T extends Record<string, unknown>>(taskId: string, payload: T): Promise<string> {
        return this.provider.enqueue(taskId, payload);
    }

    getStatus<T>(runId: string, validator?: (data: unknown) => data is T): Promise<QueueJobResult<T>> {
        return this.provider.getStatus(runId, validator);
    }

    enqueueAndWait<R, P extends Record<string, unknown> = Record<string, unknown>>(taskId: string, payload: P): Promise<QueueJobResult<R>> {
        return this.provider.enqueueAndWait<R>(taskId, payload);
    }

}