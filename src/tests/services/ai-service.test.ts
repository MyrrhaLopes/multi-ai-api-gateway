import { expect, it, vi, afterEach } from "vitest";
import { AiService } from "../../core/services/ai-service.ts";

/**
 * In AiService, it acts as a Coordinator that directly uses the global `fetch` API.
 * Because `fetch` is not passed into the service via the constructor (tight coupling),
 * we cannot use Dependency Injection to pass a mock.
 * 
 * Instead, we use Vitest's `vi.spyOn` on the `global` object to intercept 
 * the network request BEFORE it leaves your Node environment.
 */

afterEach(() => {
    vi.restoreAllMocks();
});

it('should receive string[] content and return an AIResponse (Mocked)', async () => {
    const content = [
        "Hello, how are you?",
        "https://example.com/image.png"
    ];

    // 1. MOCKING (The Hook)
    const fakeKieResponse = {
        code: 200,
        msg: "Success",
        data: { taskId: "fake-task-uuid-123" }
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(fakeKieResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    );

    // 2. ACTING
    const aiService = new AiService('sora2-image-to-video@kie');
    const response = await aiService.generate(content);

    // 3. ASSERTING INTERACTIONS
    expect(fetchSpy).toHaveBeenCalledOnce();

    // 4. ASSERTING VALUES 
    expect(response).toEqual({
        code: 200,
        msg: "Success",
        data: { taskId: "fake-task-uuid-123" }
    });
});