// =============================================================================
// Core Enums & Primitives
// =============================================================================

import z from "zod";
import { UsageSchema } from "./usage-entities.ts";
import { SupportedMimeTypeSchema } from "./media-entities.ts";

export const MediaSourceSchema = z.enum(["base64", "url"]);
export type MediaSource = z.infer<typeof MediaSourceSchema>;

export const MessageRoleSchema = z.enum(["user", "assistant", "system"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

// =============================================================================
// Content Parts
// =============================================================================

export const TextContentPartSchema = z.object({
    type: z.literal("text"),
    text: z.string()
});

export const MediaContentPartSchema = z.object({
    type: z.literal("media"),
    mimeType: SupportedMimeTypeSchema,
    source: MediaSourceSchema,
    content: z.string(), // URL or base64 string (File objects not serializable over wire)
    meta: z.object({
        fileName: z.string().optional(),
        sizeInBytes: z.number().optional()
    }).optional()
});

export const ContentPartSchema = z.union([TextContentPartSchema, MediaContentPartSchema]);
export type ContentPart = z.infer<typeof ContentPartSchema>;

// =============================================================================
// AI Messages
// =============================================================================

export const AIMessageSchema = z.object({
    role: MessageRoleSchema,
    content: z.union([z.string(), z.array(ContentPartSchema)])
});
export type AIMessage = z.infer<typeof AIMessageSchema>;
export const AIResponseSchema = z.object({
    content: z.array(ContentPartSchema),
    usage: UsageSchema.optional(),
    modelUsed: z.string()
});
export type AIResponse = z.infer<typeof AIResponseSchema>;