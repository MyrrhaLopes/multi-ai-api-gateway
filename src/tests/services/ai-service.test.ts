import { expect, it, vi, afterEach } from "vitest";
import { type AIMessage } from "../../core/entities/generation/messages-entities.ts";
import { AiService } from "../../core/services/ai-service.ts";

/**
 * CONSULTANT EXPLANATION:
 * 
 * In AiService, it acts as a Coordinator that directly uses the global `fetch` API.
 * Because `fetch` is not passed into the service via the constructor (tight coupling),
 * we cannot use Dependency Injection to pass a mock.
 * 
 * Instead, we use Vitest's `vi.spyOn` on the `global` object to intercept 
 * the network request BEFORE it leaves your Node environment.
 */

afterEach(() => {
    // Always clean up your global spies after each test!
    // Otherwise, this fake fetch will break other tests that might need the real fetch.
    vi.restoreAllMocks();
});

it('should receive an AIMessage and return an AIResponse (Mocked)', async () => {
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

    // 1. MOCKING (The Hook)
    // We define what the fake API should return.
    const fakeKieResponse = {
        code: 200,
        msg: "Success",
        data: { taskId: "fake-task-uuid-123" }
    };

    // We intercept global.fetch and force it to return an HTTP 200 Response 
    // containing our fake JSON.
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(fakeKieResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    );

    // 2. ACTING
    // Instantiate the service and call generate.
    // NOTE: generate() is async, so we MUST use 'await' here.
    const aiService = new AiService('sora2-image-to-video@kie');
    const response = await aiService.generate(messages);

    // 3. ASSERTING INTERACTIONS (The real value of testing a Coordinator)
    // We verify that the AiService successfully attempted to make the network request.
    expect(fetchSpy).toHaveBeenCalledOnce();

    // You can even verify exactly what it sent to the network:
    // expect(fetchSpy).toHaveBeenCalledWith(
    //     expect.stringContaining('http'), 
    //     expect.objectContaining({ method: 'POST' })
    // );

    // 4. ASSERTING VALUES 
    // We verify the AiService correctly passed the API response through the model's parseResponse.
    expect(response).toEqual({
        code: 200,
        msg: "Success",
        data: { taskId: "fake-task-uuid-123" }
    });
});