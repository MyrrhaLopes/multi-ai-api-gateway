import type { AiTaskLiveData } from "../entities/enqueueing/ai-tasks-entities.ts";
import { ModelRegistry, type availableModels } from "../entities/generation/ai-models-registry.ts";
import type { AiClient, AiModel } from "../entities/generation/general-entities.ts";
import { AIResponseSchema, type AIMessage, type AIResponse } from "../entities/generation/messages-entities.ts";
import { AiWrapper, AiWrappersRegistry, availableWrappers, CallbackConfig, type KieCreateTaskResponse } from "../entities/generation/model-providers-and-wrappers/kie-dtos.ts";

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
 */
    constructor(
        public readonly modelName: availableModels,
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
 * Calls the AI model and returns the response.
 * For async models with callbacks, this initiates the task and returns the task ID.
 * @param messages - The conversation history or prompts
 * @param callbackConfig - Optional callback configuration for async models
 */
    async generate(messages: AIMessage[], callbackConfig?: CallbackConfig): Promise<AIResponse | KieCreateTaskResponse | undefined> {
        try {
            // Handle HTTP-based clients (wrappers or direct HTTP APIs)
            if (this.model.config.client.type === "http") {
                const payload = this.model.constructPayload(messages, false, callbackConfig);

                const response = await fetch(this.model.config.client.endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...({ "Authorization": this.model.config.client.authHeader })
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(
                        `${this.model.config.name} generation failed: ` +
                        `${response.status} ${response.statusText} - ${errorBody}`
                    );
                }

                const data = await response.json();
                return this.model.parseResponse(data);
            }
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            throw new Error(`Failed to call ${this.model.config.name}: ${message}`);
        }
    }
}
