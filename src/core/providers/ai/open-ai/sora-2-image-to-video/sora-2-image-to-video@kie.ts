import z from "zod";
import { AiModel } from "../../../../entities/generation/general-entities.ts";
import type { ContentType } from "../../../../entities/generation/content-input.ts";
import { inferContentType } from "../../../../entities/generation/content-validation.ts";
import type { AIResponse } from "../../../../entities/generation/messages-entities.ts";
import { CallbackConfig, KieCreateTaskResponse, KieCreateTaskResponseSchema, KieErrorResponseSchema, KieResultJsonSchema } from "../../../../entities/generation/model-providers-and-wrappers/kie-dtos.ts";

export const ExpectedSora2PayloadSchema = z.object({
    model: z.literal("sora-2-image-to-video"),
    callbackUrl: z.string().optional(),
    progressCallbackUrl: z.string().optional(),
    input: z.object({
        prompt: z.string().max(10000, { message: "Prompt must be less than 10000 characters" }),
        image_urls: z.array(z.url()).length(1, { message: "Exactly one image must be provided", }),
        aspect_ratio: z.enum(["portrait", "landscape"]),
        n_frames: z.enum(["5", "10"]),
        remove_watermark: z.boolean()
    })
});

export type ExpectedSora2Payload = z.infer<typeof ExpectedSora2PayloadSchema>;

/**
 * Sora2 Image to Video model implementation.
 * Uses KIE wrapper for async video generation from images.
 */
export class Sora2ImageToVideoKie extends AiModel<ExpectedSora2Payload> {

    readonly supportedInputTypes: ContentType[] = ["text", "image_url"];

    constructor() {
        super(
            {
                name: "sora2-image-to-video@kie",
                modelProvider: "open-ai",
                apiProvider: "open-ai",
                costs: {
                    coPer1MInputTokens: 0,
                    coPer1MOutputTokens: 0,
                    creditCostPerGeneration: 0
                },
                client: { type: "http", endpoint: "https://api.kie.ai/api/v1/jobs/createTask", authHeader: `Bearer ${process.env.KIE_API_KEY}` },
                capabilities: {
                    contextWindow: 0,
                    maxOutputTokens: 0,
                    inputCapability: {
                        supportsText: true,
                        supportsMedia: true,
                        media: {
                            supportedMimeTypes: ["image/png", "image/jpeg"],
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
            },
        );
    }
    /**
     * Builds the KIE-compatible payload for Sora2 image-to-video.
     * 
     * Receives a flat array of content strings (text prompts and image URLs).
     * Content types have already been validated at the route handler level.
     */
    constructPayload(
        content: string[],
        _stream: boolean,
        callbackConfig?: CallbackConfig
    ) {
        const prompt = content.filter(c => inferContentType(c) === "text").join(" ");
        const imageUrls = content.filter(c => inferContentType(c) === "image_url");

        const payload: ExpectedSora2Payload = {
            model: "sora-2-image-to-video",
            callbackUrl: callbackConfig?.callbackUrl,
            progressCallbackUrl: callbackConfig?.progressCallbackUrl,
            input: {
                prompt,
                image_urls: imageUrls,
                aspect_ratio: "portrait",
                n_frames: "10",
                remove_watermark: true
            }
        };

        ExpectedSora2PayloadSchema.parse(payload);

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
        //TODO: entender a diferença entre parse e safeParse
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