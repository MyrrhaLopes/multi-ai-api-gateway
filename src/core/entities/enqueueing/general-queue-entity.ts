import z from "zod";

export const QueueJobStatusSchema = z.enum(["pending", "running", "success", "failed", "cancelled"]);
export type QueueJobStatus = z.infer<typeof QueueJobStatusSchema>;

export interface QueueJobResult<T = unknown> {
    status: QueueJobStatus;
    result?: T;
    error?: string;
    errorCode?: number;
}

export interface JobQueueProvider {
    /**
     * Enqueues a job to be processed.
     * @param jobId The unique identifier for the type of job (e.g., "process-ai-request").
     * @param payload The data required for the job to run.
     * @returns The unique ID of the created run/job.
     */
    enqueue(jobId: string, payload: Record<string, unknown>): Promise<string>;

    /**
     * Gets the status of a job.
     * @param jobId The unique identifier for the job.
     * @param validator Optional function to validate the output result.
     * @returns The status of the job and its result if completed.
     */
    getStatus<T>(jobId: string, validator?: (data: unknown) => data is T): Promise<QueueJobResult<T>>;

    /**
     * Enqueues a job but waits for it to complete before returning.
     * @param jobId The unique identifier for the type of job (e.g., "process-ai-request").
     * @param payload The data required for the job to run.
     * @returns The unique ID of the created run/job AND the output result.
     */
    enqueueAndWait<T>(jobId: string, payload: Record<string, unknown>): Promise<QueueJobResult<T>>;
}
