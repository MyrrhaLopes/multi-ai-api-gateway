import { z } from "zod";
import type { availableModels } from "./ai-models-registry.ts";
import type { AIMessage, AIResponse } from "./messages-entities.ts";
import type { availableProvider } from "../enqueueing/registry.ts";
import type { Costs } from "./costs-entity.ts";
import type { MediaCapability } from "./media-entities.ts";
import type { AiWrapper, availableWrappers } from "./wrappers/ai-wrappers.ts";
import type { availableModelProviders } from "./model-providers/model-providers.ts";

/**
 * Unified client abstraction supporting both HTTP-based and SDK-based providers.
 * Replaces the narrow `string | GoogleGenAI` type.
 */
export type AiClient =
    | { type: "http"; baseUrl: string; authHeader?: string }
    // | { type: "google"; instance: GoogleGenAI }
    // Add more SDK types as needed:
    // | { type: "openai"; instance: OpenAI }
    // | { type: "anthropic"; instance: Anthropic }
    ;

/**
 * Interface for defining the input and output capabilities of an AI model.
 */
export interface ModelIOCapabilities {
    supportsText: boolean;
    supportsMedia: boolean;
    media?: MediaCapability;
    supportsFunctionCalling?: boolean;
}


export interface AiModelConfig {
    name: availableModels;
    aiProvider: availableModelProviders;
    costs: Costs;
    client: AiClient;
    capabilities: {
        contextWindow: number;
        maxOutputTokens: number;
        inputCapability: ModelIOCapabilities;
        outputCapability: ModelIOCapabilities;
    };
    supportedWrappers?: availableWrappers[];
}


export abstract class AiModel {

    constructor(
        public config: AiModelConfig,
    ) {
    }

    /**
     * Indicates whether this model supports callback-based async execution.
     * If true, the task runner should use wait.forToken() pattern.
     */
    abstract supportsCallbacks(): boolean;

    /**
     * Builds the API payload for the model.
     * @param messages - The conversation history or prompts
     * @param stream - Whether to request streaming response
     * @param callbackConfig - Optional callback URLs for async execution
     */
    abstract getPayload(
        messages: AIMessage[],
        stream: boolean,
        callbackConfig?: CallbackConfig
    ): Record<string, unknown>;

    /**
     * Returns the API endpoint for this model/wrapper combination.
     */
    abstract getEndpoint(): string;

    /**
     * Resolves the correct AiClient to use, preferring wrapper client if selected.
     */
    private getActiveClient(): AiClient {
        return this.selectedWrapper?.client ?? this.config.client;
    }

    /**
     * Maps AiClient types to their corresponding env variable names for API keys.
     */
    private static readonly ENV_KEY_MAP: Record<string, string> = {
        "kie": "KIE_API_KEY",
        "google": "GOOGLE_AI_API_KEY",
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
    };

    /**
     * Resolves the authorization header for an HTTP client.
     * Priority: 1) client.authHeader from config, 2) env var based on wrapper/provider name
     */
    private getAuthHeader(client: AiClient): string {
        if (client.type !== "http") {
            return "";
        }

        // Use explicit authHeader if provided in config
        if (client.authHeader) {
            return client.authHeader;
        }

        // Determine which service we're calling to pick the right env var
        const serviceName = this.selectedWrapper?.name.toLowerCase()
            ?? this.config.aiProvider.provider.toLowerCase();

        const envVarName = AiModel.ENV_KEY_MAP[serviceName];
        const apiKey = envVarName ? process.env[envVarName] : undefined;

        return apiKey ? `Bearer ${apiKey}` : "";
    }

    /**
     * Calls the AI model and returns the response.
     * For async models with callbacks, this initiates the task and returns the task ID.
     * @param messages - The conversation history or prompts
     * @param callbackConfig - Optional callback configuration for async models
     */
    async call(messages: AIMessage[], callbackConfig?: CallbackConfig): Promise<AIResponse | KieCreateTaskResponse | undefined> {
        const client = this.getActiveClient();

        try {
            // Handle HTTP-based clients (wrappers or direct HTTP APIs)
            if (client.type === "http") {
                const payload = this.getPayload(messages, false, callbackConfig);
                const authHeader = this.getAuthHeader(client);

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
     * Parses the provider-specific response into a unified format.
     * For async models, this may return task creation info instead of final content.
     */
    abstract parseResponse(response: unknown): AIResponse | KieCreateTaskResponse;

    /**
     * Parses the final result from an async callback or polling response.
     * Only applicable for models that support callbacks.
     */
    parseAsyncResult?(resultJson: string): AIResponse;
}

