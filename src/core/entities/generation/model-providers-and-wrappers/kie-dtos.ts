import z from "zod";
import type { Costs } from "../costs-entity.ts";
import type { AiClient } from "../general-entities.ts";

export type AiWrapper = {
    name: string;
    costs: Costs;
    client: AiClient;
}

export const AiWrappersRegistry = {
    "Kie": {
        name: "Kie",
        costs: {
            coPer1MInputTokens: 0,
            coPer1MOutputTokens: 0,
            creditCostPerGeneration: 0
        },
        client: {
            type: "http",
            endpoint: "https://api.kie.com",
            authHeader: "Bearer " + process.env.KIE_API_KEY
        }
    }
} satisfies Record<string, AiWrapper>;
export type availableWrappers = keyof typeof AiWrappersRegistry;

// =============================================================================
// KIE Wrapper Specific Schemas
// =============================================================================

/**
 * KIE error response schema (4xx/5xx responses).
 * Error responses only have `code` and `msg`, no `data` field.
 */
export const KieErrorResponseSchema = z.object({
    code: z.number(),
    msg: z.string()
});
export type KieErrorResponse = z.infer<typeof KieErrorResponseSchema>;

export const KieCreateTaskResponseSchema = z.object({
    code: z.literal(200),
    msg: z.string(),
    data: z.object({
        taskId: z.string()
    })
});

export type KieCreateTaskResponse = z.infer<typeof KieCreateTaskResponseSchema>;

export const KieTaskStateSchema = z.enum(["waiting", "queuing", "generating", "success", "fail"]);
export type KieTaskState = z.infer<typeof KieTaskStateSchema>;

export const KieGetTaskResponseSchema = z.object({
    code: z.number(),
    message: z.string(),
    data: z.object({
        taskId: z.string(),
        model: z.string(),
        state: KieTaskStateSchema,
        param: z.string(),
        resultJson: z.string(),
        failCode: z.string(),
        failMsg: z.string(),
        completeTime: z.number().optional(),
        createTime: z.number(),
        updateTime: z.number(),
        progress: z.number().optional()
    })
});
export type KieGetTaskResponse = z.infer<typeof KieGetTaskResponseSchema>;

/**
 * Schema for KIE callback payload sent to callBackUrl
 * Contains the final result when task completes
 */
export const KieCallbackPayloadSchema = z.object({
    taskId: z.string(),
    state: KieTaskStateSchema,
    resultJson: z.string().optional(),
    failCode: z.string().optional(),
    failMsg: z.string().optional()
});
export type KieCallbackPayload = z.infer<typeof KieCallbackPayloadSchema>;

export const KieResultJsonSchema = z.object({
    resultUrls: z.array(z.string())
});
export type KieResultJson = z.infer<typeof KieResultJsonSchema>;

// =============================================================================
// Callback Configuration
// =============================================================================

export const CallbackConfigSchema = z.object({
    callbackUrl: z.string(),
    progressCallbackUrl: z.string().optional()
});
export type CallbackConfig = z.infer<typeof CallbackConfigSchema>;

// =============================================================================
// API Request/Response Schemas
// =============================================================================

