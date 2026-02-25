import type { MediaSource } from "./messages-entities.ts";
import z from "zod";

export const SupportedMimeTypeSchema = z.enum(["image/png", "audio/wav", "video/mp4", "application/", "image/jpeg", "text/plain"]);
export type SupportedMimeType = z.infer<typeof SupportedMimeTypeSchema>;

export interface MediaCapability {
    supportedMimeTypes: SupportedMimeType[];
    maxSizeInMb?: number;
    source: MediaSource;
}