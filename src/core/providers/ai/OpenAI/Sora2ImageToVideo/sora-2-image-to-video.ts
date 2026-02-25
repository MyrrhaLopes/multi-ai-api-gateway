import type { AiWrapperNames } from "../../../../entities/generation/ai-models-registry.ts";
import { AiModel, KieCreateTaskResponseSchema, KieErrorResponseSchema, KieResultJsonSchema, type CallbackConfig, type KieCreateTaskResponse } from "../../../../entities/generation/general-entities.ts";
import type { AIMessage, AIResponse } from "../../../../entities/generation/messages-entities.ts";

/**
 * Sora2 Image to Video model implementation.
 * Uses KIE wrapper for async video generation from images.
 */
export class Sora2ImageToVideo extends AiModel {
    constructor(availableWrapper?: AiWrapperNames) {
        super(
            {
                name: "sora2-image-to-video",
                aiProvider: "open-ai",
                costs: {
                    coPer1MInputTokens: 0,
                    coPer1MOutputTokens: 0,
                    creditCostPerGeneration: 0
                },
                client: { type: "http", baseUrl: "https://api.kie.ai/api/v1" },
                capabilities: {
                    contextWindow: 0,
                    maxOutputTokens: 0,
                    inputCapability: {
                        supportsText: true,
                        supportsMedia: true,
                        media: {
                            supportedMimeTypes: ["image/png", "image/jpeg"], //TODO: add text to supported mime types
                            maxSizeInMb: 10,
                            source: "url"
                        }
                    },
                    outputCapability: {
                        supportsText: false,
                        supportsMedia: true,
                        media: {
                            supportedMimeTypes: ["video/mp4"],
                            maxSizeInMb: 100,
                            source: "url"
                        }
                    }
                },
                supportedWrappers: ["Kie"]
            },
        );
    }

    //TODO: move function to AiModel parent class
    /**
     * KIE wrapper supports callbacks for async task completion.
     */
    supportsCallbacks(): boolean {
        return this.availableWrapper === "Kie";
    }

    getEndpoint(): string {
        if (this.selectedWrapper && this.selectedWrapper.name === "Kie") {
            return "https://api.kie.ai/api/v1/jobs/createTask";
        }
        throw new Error(
            `No endpoint configured for ${this.config.name}. ` +
            `Default Sora-2 API implementation not available.`
        );
    }

    /**
     * Builds the KIE-compatible payload for Sora2 image-to-video.
     * 
     * **Requirements:**
     * - At least one image URL is required
     * - Maximum 1 image supported by KIE Sora2
     * - Images must be URL-based (no base64)
     * - Supported formats: PNG, JPG, JPEG, WEBP
     * - Max file size: 10MB per image
     * 
     * @throws Error if no images provided or validation fails
     */
    getPayload(
        messages: AIMessage[],
        _stream: boolean,
        callbackConfig?: CallbackConfig
    ): Record<string, unknown> {
        if (this.selectedWrapper && this.selectedWrapper.name !== "Kie") {
            throw new Error(
                `Unsupported wrapper configuration for ${this.config.name}. ` +
                `Expected 'Kie' wrapper, got: ${this.selectedWrapper?.name ?? "none"}`
            );
        }

        // Use let for variables that will be mutated, const for everything else
        let prompt = ""; // Concatenated in loop, so must be let
        const imageUrls: string[] = [];
        const aspectRatio: "portrait" | "landscape" = "portrait"; // Never reassigned, so const
        const nFrames: "5" | "10" = "10"; // Never reassigned, so const

        // Extract prompt and images from messages
        for (const message of messages) {
            if (message.role !== "user") continue;

            if (typeof message.content === "string") {
                // Sora2 requires an image - text-only content is not supported
                throw new Error(
                    `${this.config.name} requires at least one image. ` +
                    `Received text-only content: "${message.content.slice(0, 50)}...". ` +
                    `Please provide message.content as an array with both text and media parts.`
                );
            } else if (Array.isArray(message.content)) {
                for (const part of message.content) {
                    if (part.type === "text") {
                        prompt += part.text;
                    } else if (part.type === "media") {
                        // Validate media type
                        if (part.source !== "url") {
                            throw new Error(
                                `${this.config.name} only supports URL-based images. ` +
                                `Received source: "${part.source}". ` +
                                `Please upload images to a public URL first.`
                            );
                        }

                        // Validate MIME type (KIE docs show support for common image formats)
                        const supportedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
                        if (!supportedTypes.includes(part.mimeType)) {
                            throw new Error(
                                `${this.config.name} does not support MIME type "${part.mimeType}". ` +
                                `Supported types: ${supportedTypes.join(", ")}`
                            );
                        }

                        // Validate file size if provided in metadata
                        if (part.meta?.sizeInBytes) {
                            const maxSizeBytes = 10 * 1024 * 1024; // 10MB
                            if (part.meta.sizeInBytes > maxSizeBytes) {
                                throw new Error(
                                    `Image "${part.meta.fileName ?? "unnamed"}" exceeds ` +
                                    `${this.config.name} size limit of 10MB. ` +
                                    `Received: ${(part.meta.sizeInBytes / 1024 / 1024).toFixed(2)}MB`
                                );
                            }
                        }

                        if (typeof part.content === "string") {
                            imageUrls.push(part.content);
                        }
                    }
                }
            }
        }

        // Validate image requirements
        if (imageUrls.length === 0) {
            throw new Error(
                `${this.config.name} requires at least one image URL. ` +
                `No images were found in the provided messages. ` +
                `Please include at least one media content part with type="media" and source="url".`
            );
        }

        if (imageUrls.length > 1) {
            throw new Error(
                `${this.config.name} supports only 1 image, but received ${imageUrls.length} images. ` +
                `Please provide exactly one image URL.`
            );
        }

        // Build payload with required KIE fields
        const payload: Record<string, unknown> = {
            model: "sora-2-image-to-video",
            input: {
                prompt,
                image_urls: imageUrls,
                aspect_ratio: aspectRatio,
                n_frames: nFrames,
                remove_watermark: true
            }
        };

        // Add callback URLs for async execution
        if (callbackConfig) {
            payload.callBackUrl = callbackConfig.callbackUrl;
            if (callbackConfig.progressCallbackUrl) {
                payload.progressCallBackUrl = callbackConfig.progressCallbackUrl;
            }
        }

        return payload;
    }

    /**
     * Parses KIE's task creation response.
     * Returns task info for async tracking, not final content.
     * 
     * KIE error responses (4xx/5xx) only have `code` and `msg`, no `data` field.
     * We check for these first using KieErrorResponseSchema.
     */
    parseResponse(response: unknown): KieCreateTaskResponse {
        // Try to parse as success response first (code: 200 with data)
        const successParsed = KieCreateTaskResponseSchema.safeParse(response);
        if (successParsed.success) {
            return successParsed.data;
        }

        // If not a success response, check if it's a KIE error response
        const errorParsed = KieErrorResponseSchema.safeParse(response);
        if (errorParsed.success) {
            throw new Error(
                `KIE API error for ${this.config.name}: ` +
                `Code ${errorParsed.data.code} - ${errorParsed.data.msg}`
            );
        }

        // Neither success nor error schema matched - unknown response format
        throw new Error(
            `Invalid KIE response for ${this.config.name}: ` +
            `${successParsed.error.message}. Raw response: ${JSON.stringify(response)}`
        );
    }

    /**
     * Parses the final result from KIE callback payload.
     * Converts resultUrls to AIResponse format.
     */
    parseAsyncResult(resultJson: string): AIResponse {
        let parsed;
        try {
            parsed = KieResultJsonSchema.parse(JSON.parse(resultJson));
        } catch (e) {
            throw new Error(
                `Failed to parse KIE result JSON for ${this.config.name}: ` +
                `${e instanceof Error ? e.message : String(e)}`
            );
        }

        // Convert result URLs to content parts
        const content = parsed.resultUrls.map((url) => ({
            type: "media" as const,
            mimeType: "video/mp4" as const,
            source: "url" as const,
            content: url
        }));

        return {
            content,
            modelUsed: this.config.name,
            usage: {
                inputTokens: 0,
                outputTokens: 0
            }
        };
    }
}