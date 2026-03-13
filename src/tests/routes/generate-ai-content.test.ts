import { describe, it, expect, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { AiContentGenerationRoute } from "../../http/routes/generate-ai-content/generate-ai-content.ts";
import { authPreHandler } from "../../http/hooks/pre-handlers/auth-pre-handler.ts";
import { errorHandler } from "../../http/globals/errors/error-handler.ts";

// 1. Mock the AuthService so we don't hit the real Database
vi.mock("../../core/services/auth-service.ts", () => ({
  AuthService: {
    authenticate: vi.fn(),
  },
}));

// 2. Mock the QueueService so we NEVER send tasks to Trigger.dev / AI Providers
vi.mock("../../core/services/queue-service.ts", () => {
  return {
    default: class {
      enqueue = vi.fn().mockResolvedValue("fake_task_123");
    },
  };
});

// Import the mocked service so we can change its behavior per-test
import { AuthService } from "../../core/services/auth-service.ts";

describe("POST /generate-ai-content", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();

    app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    app.setErrorHandler(errorHandler);

    await app.register(authPreHandler);
    await app.register(AiContentGenerationRoute);
  });

  it("should return 401 if API Key is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/generate-ai-content",
      payload: {
        modelName: "sora2-image-to-video@kie",
        content: ["test prompt"],
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("should return 403 if API Key does not have access to the route", async () => {
    vi.mocked(AuthService.authenticate).mockResolvedValue({
      permitedModels: ["*"],
      permitedRoutes: ["/some-other-route"],
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/generate-ai-content",
      headers: { "api-key": "valid_key_that_is_32_chars_long_1234" },
      payload: {
        modelName: "sora2-image-to-video@kie",
        content: ["test prompt"],
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe("Forbidden");
  });

  it("should return 400 ClientError if the API Key is not permitted to use the requested model", async () => {
    vi.mocked(AuthService.authenticate).mockResolvedValue({
      permitedModels: ["gpt-4o"],
      permitedRoutes: ["/generate-ai-content"],
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/generate-ai-content",
      headers: { "api-key": "valid_key_that_is_32_chars_long_1234" },
      payload: {
        modelName: "sora2-image-to-video@kie",
        content: ["test prompt"],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toContain("not permitted for this API Key");
  });

  it("should return 202 and enqueue the task if all permissions are valid", async () => {
    vi.mocked(AuthService.authenticate).mockResolvedValue({
      permitedModels: ["*"],
      permitedRoutes: ["*"],
    } as any);

    const payload = {
      modelName: "sora2-image-to-video@kie",
      content: ["test prompt", "https://example.com/image.png"],
    };

    const response = await app.inject({
      method: "POST",
      url: "/generate-ai-content",
      headers: { "api-key": "valid_key_that_is_32_chars_long_1234" },
      payload,
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({
      taskId: "fake_task_123",
      modelName: "sora2-image-to-video@kie",
      status: "pending",
    });
  });

  it("should return 400 if content type is not supported by the model", async () => {
    vi.mocked(AuthService.authenticate).mockResolvedValue({
      permitedModels: ["*"],
      permitedRoutes: ["*"],
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/generate-ai-content",
      headers: { "api-key": "valid_key_that_is_32_chars_long_1234" },
      payload: {
        modelName: "sora2-image-to-video@kie",
        content: ["a prompt", "https://example.com/video.mp4"],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toContain("Content not supported");
  });
});
