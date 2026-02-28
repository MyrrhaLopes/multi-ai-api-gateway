import { z } from "zod";
import type { availableModels } from "./ai-models-registry.ts";
import type { AIMessage, AIResponse } from "./messages-entities.ts";
import type { availableProvider } from "../enqueueing/registry.ts";
import type { Costs } from "./costs-entity.ts";
import type { MediaCapability } from "./media-entities.ts";
import type { AiWrapper, availableWrappers, CallbackConfig, KieCreateTaskResponse } from "./model-providers-and-wrappers/kie-dtos.ts";
import type { availableModelProviders } from "./model-providers/model-providers.ts";

/**
 * Unified client abstraction supporting both HTTP-based and SDK-based providers.
 * Replaces the narrow `string | GoogleGenAI` type.
 */
export type AiClient =
    | { type: "http"; endpoint: string; authHeader?: string, apiKey?: string }
    // | { type: "client"; instance: GoogleGenAI }
    // Add more SDK types as needed:
    // | { type: "client"; instance: OpenAI }
    // | { type: "client"; instance: Anthropic }
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
    modelProvider: availableModelProviders;
    apiProvider: availableModelProviders | availableWrappers;
    costs: Costs;
    client: AiClient;
    capabilities: {
        contextWindow: number;
        maxOutputTokens: number;
        inputCapability: ModelIOCapabilities;
        outputCapability: ModelIOCapabilities;
    };
}


export interface AiModelClient {
    generate(messages: AIMessage[]): Promise<AIResponse>;
}

export abstract class AiModel {

    constructor(
        public config: AiModelConfig,
    ) {
    }
    /**
     * Builds the API payload for the model.
     * @param messages - The conversation history or prompts
     * @param stream - Whether to request streaming response
     * @param callbackConfig - Optional callback URLs for async execution
     */
    abstract constructPayload(
        messages: AIMessage[],
        stream: boolean,
        callbackConfig?: CallbackConfig
    ): Record<string, unknown>;

    /**
     * Parses the provider-specific response into the unified AIResponse format.
     * For async models, this may return task creation info instead of final content.
     */
    abstract parseResponse(response: unknown): AIResponse | KieCreateTaskResponse;

    /**
     * Parses the final result from an async callback or polling response.
     * Only applicable for models that support callbacks.
     */
    parseAsyncResult?(resultJson: string): AIResponse;
}

