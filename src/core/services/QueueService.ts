import { type availableProvider, JobQueueProviderRegistry } from "../entities/enqueueing/registry.ts";
import type { JobQueueProvider, QueueJobResult } from "../entities/enqueueing/general-queue-entity.ts";

export default class QueueService {
    private provider: JobQueueProvider;
    constructor(provider: availableProvider = "trigger") {
        const providerClass = JobQueueProviderRegistry[provider];
        if (!providerClass) {
            throw new Error(`Provider ${provider} not found`);
        }
        this.provider = new providerClass();
    }

    enqueue<T extends Record<string, unknown>>(jobId: string, payload: T): Promise<string> {
        return this.provider.enqueue(jobId, payload);
    }

    getStatus<T>(runId: string, validator?: (data: unknown) => data is T): Promise<QueueJobResult<T>> {
        return this.provider.getStatus(runId, validator);
    }

    enqueueAndWait<R, P extends Record<string, unknown> = Record<string, unknown>>(jobId: string, payload: P): Promise<QueueJobResult<R>> {
        return this.provider.enqueueAndWait<R>(jobId, payload);
    }

}