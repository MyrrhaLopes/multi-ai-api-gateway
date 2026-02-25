// import { tasks, runs } from "@trigger.dev/sdk/v3";
// import { QueueJobResult, QueueJobStatus, TaskQueueProvider } from "../types";


/**
 * @property taskId - The id of the task to trigger. It servers to identify the function to be run on trigger.dev servers.
 * @property payload - The payload to send to the task.
 * @returns the id of the RUN, the live object which keeps record of the task execution and its place on trigger.dev queue.
 */
export class TriggerQueueProvider implements TaskQueueProvider {

    private static taskStatusMap: Record<string, QueueJobStatus> = {
        "WAITING_FOR_DEPLOY": "pending",
        "PENDING_VERSION": "pending",
        "QUEUED": "pending",
        "DEQUEUED": "running",
        "EXECUTING": "running",
        "WAITING": "running",
        "COMPLETED": "success",
        "CANCELED": "cancelled",
        "FAILED": "failed",
        "CRASHED": "failed",
        "SYSTEM_FAILURE": "failed",
        "DELAYED": "pending",
        "EXPIRED": "failed",
        "TIMED_OUT": "failed",
        "FROZEN": "pending",
        "INTERRUPTED": "failed"
    };

    async enqueue<T>(taskId: string, payload: T): Promise<string> {
        const handle = await tasks.trigger(taskId, payload);
        return handle.id;
    }

    async getStatus<T>(runId: string, validator?: (data: unknown) => data is T): Promise<QueueJobResult<T>> {
        const availableruns = await runs.list();
        console.log("lista de runs:", availableruns)
        const run = await runs.retrieve(runId);

        let validResult: T | undefined = undefined;
        if (run.status === "COMPLETED" && run.output) {
            try {
                if (validator) {
                    if (validator(run.output)) {
                        validResult = run.output;
                    } else {
                        throw new Error(`Run ${runId} output mismatch. Expected to match validator: ${validator}. Received: ${JSON.stringify(run.output)}`);
                    }
                } else {
                    validResult = run.output as T;
                }
            } catch (e: any) {
                console.error(e);
                throw new Error(`Validation Error on job ${runId}: ${e.message}`);
            }
        }

        // Extract error code if present in the error message (format: "Code XXX - message")
        let errorCode: number | undefined;
        if (run.error?.message) {
            const codeMatch = run.error.message.match(/Code (\d+)/);
            if (codeMatch) {
                errorCode = parseInt(codeMatch[1], 10);
            }
        }

        return {
            status: TriggerQueueProvider.taskStatusMap[run.status] || "failed",
            result: validResult,
            error: run.error?.message,
            errorCode
        };
    }



    async enqueueAndWait<T>(taskId: string, payload: any): Promise<QueueJobResult<T>> {
        const runId = await this.enqueue(taskId, payload);

        const maxAttempts = 600; // 20 minutes
        let attempts = 0;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;

            const status = await this.getStatus<T>(runId);

            if (status.status === "success" || status.status === "failed" || status.status === "cancelled") {
                return status;
            }
        }

        return {
            status: "failed",
            error: "Timeout waiting for task completion"
        };
    }
}