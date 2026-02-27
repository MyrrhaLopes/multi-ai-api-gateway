import type { AiTaskLiveData } from "../entities/enqueueing/ai-tasks-entities.ts";
import type { TaskQueueProvider } from "../entities/enqueueing/general-queue-entity.ts";
import { ModelRegistry, type availableModels } from "../entities/generation/ai-models-registry.ts";
import type { AiModel } from "../entities/generation/general-entities.ts";
import { AIResponseSchema, type AIMessage, type AIResponse } from "../entities/generation/messages-entities.ts";
import { AiWrapper, AiWrappersRegistry, availableWrappers } from "../entities/generation/model-providers-and-wrappers/kie-dtos.ts";

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
    public readonly wrapper?: AiWrapper;
    /**
     * Creates an AiService instance for the specified model.
     * @param modelName - The name of the AI model to use
     */
    constructor(
        public readonly modelName: availableModels,
        public readonly wrapperName?: availableWrappers,
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
        if (wrapperName && this.model.config.supportedWrappers?.includes(wrapperName)) {
            const wrapper = AiWrappersRegistry[wrapperName];
            if (!wrapper) {
                const available = Object.keys(AiWrappersRegistry).join(", ");
                throw new Error(
                    `Unknown AI wrapper: "${wrapperName}". ` +
                    `Available wrappers: [${available}]`
                );
            }
            this.wrapper = wrapper;
        }
    }
    /**
 * Calls the AI model and returns the response.
 * For async models with callbacks, this initiates the task and returns the task ID.
 * @param messages - The conversation history or prompts
 * @param callbackConfig - Optional callback configuration for async models
 */
    async call(messages: AIMessage[],): Promise<AIResponse | undefined> {
        try {
            // Handle HTTP-based clients (wrappers or direct HTTP APIs)
            if (this.model.config.client.type === "http") {
                const payload = this.model.constructPayload(messages, false);

                const response = await fetch(this.getEndpoint(), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(authHeader && { "Authorization": authHeader })
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    const via = this.selectedWrapper ? ` via ${this.selectedWrapper.name}` : "";
                    throw new Error(
                        `${this.config.name}${via} failed: ` +
                        `${response.status} ${response.statusText} - ${errorBody}`
                    );
                }

                const data = await response.json();
                return this.parseResponse(data);
            }

            // Handle SDK-based clients
            if (client.type === "google") {
                // TODO: Implement Google GenAI client execution
                throw new Error("Google GenAI client execution not yet implemented");
            }

            throw new Error(`No execution path for client type: ${(client as AiClient).type}`);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            throw new Error(`Failed to call ${this.config.name}: ${message}`);
        }
    }

    /**
     * Generates content using the AI model.
     * @param messages - The conversation history or prompts
     * @returns The AI response
     */
    async generate(messages: AIMessage[]): Promise<AIResponse> {
        return this.model.generate(messages);
    }
}
