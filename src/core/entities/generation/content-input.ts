import z from "zod";

/** The types of content a model can accept */
export const ContentTypeSchema = z.enum(["text", "image_url", "video_url", "audio_url", "pdf_url"]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

/** A single piece of content: just a string (prompt text or a URL) */
export const ContentInputItemSchema = z.string().min(1);

/** The full content array that constructPayload receives */
export const ContentInputSchema = z.array(ContentInputItemSchema).min(1);
export type ContentInput = z.infer<typeof ContentInputSchema>;
