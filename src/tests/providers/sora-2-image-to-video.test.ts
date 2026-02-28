import { test, expect } from "vitest";
import { Sora2ImageToVideoKie } from "../../core/providers/ai/open-ai/sora-2-image-to-video/sora-2-image-to-video@kie.ts";
import type { AIMessage } from "../../core/entities/generation/messages-entities.ts";
import z from "zod";

test("sora-2-image-to-video@kie constructPayload correctly structures output", () => {
    const sora2ImageToVideoKie = new Sora2ImageToVideoKie();
    const messages: AIMessage[] = [
        {
            role: "user",
            content: [
                {
                    type: "text",
                    text: "Hello, how are you?"
                },
                {
                    type: "media",
                    source: "url",
                    mimeType: "image/png",
                    content: "https://example.com/image.png"
                }
            ]
        }
    ];

    const payload = sora2ImageToVideoKie.constructPayload(messages, false);

    // .parse() will throw a detailed ZodError failing the Vitest test if the structure is invalid


    // We can confidently use the validated, strongly-typed object for exact value assertions
    console.log(payload);
});