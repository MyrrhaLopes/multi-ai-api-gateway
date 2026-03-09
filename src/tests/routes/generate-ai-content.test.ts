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

describe("POST /create-generation-task", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup a clean Fastify instance for testing
    app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    app.setErrorHandler(errorHandler);

    // Register our auth hook and the route
    await app.register(authPreHandler);
    await app.register(AiContentGenerationRoute);
  });

  it("should return 401 if API Key is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/create-generation-task",
      payload: {
        modelName: "sora2-image-to-video@kie",
        messages: [{ role: "user", content: "test" }],
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("should return 403 if API Key does not have access to the route", async () => {
    // Mock the DB returning a user that only has access to a DIFFERENT route
    vi.mocked(AuthService.authenticate).mockResolvedValue({
      permitedModels: ["*"],
      permitedRoutes: ["/some-other-route"],
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/create-generation-task",
      headers: { "API Key": "valid_key_that_is_32_chars_long_1234" },
      payload: {
        modelName: "sora2-image-to-video@kie",
        messages: [{ role: "user", content: "test" }],
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe("Forbidden");
  });

  it("should return 400 ClientError if the API Key is not permitted to use the requested model", async () => {
    // Mock the DB returning a user that only has access to a specific model
    vi.mocked(AuthService.authenticate).mockResolvedValue({
      permitedModels: ["gpt-4o"], // Does not have access to sora2!
      permitedRoutes: ["/create-generation-task"],
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/create-generation-task",
      headers: { "API Key": "valid_key_that_is_32_chars_long_1234" },
      payload: {
        modelName: "sora2-image-to-video@kie",
        messages: [{ role: "user", content: "test" }],
      },
    });

    expect(response.statusCode).toBe(400); // Because we throw a ClientError
    expect(response.json().message).toContain("not permitted for this API Key");
  });

  it("should return 202 and enqueue the task if all permissions are valid", async () => {
    // Mock successful auth with full wildcard access
    vi.mocked(AuthService.authenticate).mockResolvedValue({
      permitedModels: ["*"],
      permitedRoutes: ["*"],
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/create-generation-task",
      headers: { "API Key": "valid_key_that_is_32_chars_long_1234" },
      payload: {
        modelName: "sora2-image-to-video@kie",
        messages: [{ role: "user", content: "test prompt" }],
      },
    });

    console.log(response);
    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({
      taskId: "fake_task_123", // Assert our mocked queue service was called
      modelName: "sora2-image-to-video@kie",
      status: "pending",
    });
  });
});
