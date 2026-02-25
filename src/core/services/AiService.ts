import type { AiTaskLiveData } from "../entities/enqueueing/ai-tasks-entities.ts";
import type { TaskQueueProvider } from "../entities/enqueueing/general-queue-entity.ts";
import { ModelRegistry, type availableModels } from "../entities/generation/ai-models-registry.ts";
import type { AiModel } from "../entities/generation/general-entities.ts";
import { AIResponseSchema, type AIMessage, type AIResponse } from "../entities/generation/messages-entities.ts";

/**
 * Service to interact with AI models.
 * Operates as a Context/Factory that abstracts the specific model implementation.
 * 
 * @example
 * ```ts
 * const ai = new AiService("sora2-image-to-video", "Kie", queueProvider);
 * const taskId = await ai.createTask(messages);
 * const status = await AiService.getTaskStatus(queueProvider, taskId);
 * ```
 */
export class AiService {
    public readonly model: AiModel;

    /**
     * Creates an AiService instance for the specified model.
     * @param modelName - The name of the AI model to use
     * 
    * @param queueProvider - Optional queue provider for background task creation
     * @throws Error if model not found in registry
     */
    constructor(
        public readonly modelName: availableModels,
        private readonly queueProvider?: TaskQueueProvider
    ) {
        const ModelClass = ModelRegistry[modelName];
        if (!ModelClass) {
            const available = Object.keys(ModelRegistry).join(", ");
            throw new Error(
                `Unknown AI model: "${modelName}". ` +
                `Available models: [${available}]`
            );
        }
        this.model = new ModelClass();
    }

    /**
     * Creates a background task for AI generation.
     * The task will be processed asynchronously by Trigger.dev.
     * 
     * @param messages - The conversation history or prompts
     * @returns The task/run ID for status tracking
     * @throws Error if queue provider not configured
     */
    async createTask(messages: AIMessage[]): Promise<string> {
        if (!this.queueProvider) {
            throw new Error(
                "Queue provider not configured. " +
                "Pass a TaskQueueProvider to the constructor to enable background tasks."
            );
        }

        return this.queueProvider.enqueue("generate-ai-content", {
            modelName: this.modelName,
            wrapperName: this.wrapperName,
            messages
        });
    }

    /**
     * Gets the status of a background AI task.
     * 
     * @param queueProvider - The queue provider instance
     * @param taskId - The task ID returned from createTask
     * @returns Current task status, result if completed, and error/errorCode if failed
     */
    static async getTaskStatus(
        queueProvider: TaskQueueProvider,
        taskId: string
    ): Promise<AiTaskLiveData> {
        if (!queueProvider) {
            throw new Error(
                "Queue provider required to get task status."
            );
        }

        const validator = (data: unknown): data is AIResponse => {
            return AIResponseSchema.safeParse(data).success;
        };

        // Get generic result from queue provider
        const result = await queueProvider.getStatus<AIResponse>(taskId, validator);

        // Convert generic QueueJobResult to AI-specific AiTaskLiveData
        return {
            status: result.status,
            result: result.result,
            error: result.error,
            errorCode: result.errorCode
        };
    }
}
