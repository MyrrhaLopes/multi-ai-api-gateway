import type { ContentType } from "./content-input.ts";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"];
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".flac"];
const PDF_EXTENSIONS = [".pdf"];

/**
 * Infers the ContentType of a raw string.
 * - URLs are classified by file extension in the pathname (query params ignored).
 * - Non-URL strings are classified as "text".
 */
export function inferContentType(value: string): ContentType {
    try {
        const url = new URL(value);
        const pathname = url.pathname.toLowerCase();

        if (IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext))) return "image_url";
        if (VIDEO_EXTENSIONS.some(ext => pathname.endsWith(ext))) return "video_url";
        if (AUDIO_EXTENSIONS.some(ext => pathname.endsWith(ext))) return "audio_url";
        if (PDF_EXTENSIONS.some(ext => pathname.endsWith(ext))) return "pdf_url";

        // Valid URL but unknown extension — treat as text
        return "text";
    } catch {
        // Not a valid URL — it's a text prompt
        return "text";
    }
}

/**
 * Validates an array of content strings against a model's supported input types.
 * Returns `{ valid: true }` if all content is supported, or `{ valid: false, errors }` 
 * with a human-readable error per unsupported item.
 */
export function validateContentAgainstModel(
    content: string[],
    supportedInputTypes: ContentType[]
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const item of content) {
        const inferred = inferContentType(item);
        if (!supportedInputTypes.includes(inferred)) {
            const preview = item.length > 80 ? item.slice(0, 80) + "…" : item;
            errors.push(
                `Content "${preview}" was inferred as "${inferred}", ` +
                `but this model only supports: [${supportedInputTypes.join(", ")}]`
            );
        }
    }

    return { valid: errors.length === 0, errors };
}
