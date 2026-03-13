import { test, expect } from "vitest";
import { Sora2ImageToVideoKie } from "../../core/providers/ai/open-ai/sora-2-image-to-video/sora-2-image-to-video@kie.ts";

test("sora-2-image-to-video@kie constructPayload correctly structures output", () => {
    const sora2ImageToVideoKie = new Sora2ImageToVideoKie();
    const content = [
        "Hello, how are you?",
        "https://example.com/image.png",
    ];

    const payload = sora2ImageToVideoKie.constructPayload(content, false);

    expect(payload.model).toBe("sora-2-image-to-video");
    expect(payload.input.prompt).toBe("Hello, how are you?");
    expect(payload.input.image_urls).toEqual(["https://example.com/image.png"]);
    expect(payload.input.remove_watermark).toBe(true);
});

test("sora-2-image-to-video@kie declares correct supportedInputTypes", () => {
    const sora2ImageToVideoKie = new Sora2ImageToVideoKie();
    expect(sora2ImageToVideoKie.supportedInputTypes).toEqual(["text", "image_url"]);
});