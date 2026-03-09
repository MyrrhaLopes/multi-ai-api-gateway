import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import QueueService from "../../../core/services/queue-service.ts";
import {
  GenerateContentRequestSchema,
  GenerateContentResponseSchema202,
  GetGenerationResponseSchema,
  isAIResponse,
} from "./schemas.ts";
import { union, object, z } from "zod";
import { ClientError } from "../../globals/errors/client-error.ts";
import { AuthService } from "../../../core/services/auth-service.ts";
import { authPreHandler } from "../../hooks/pre-handlers/auth-pre-handler.ts";

export const AiContentGenerationRoute: FastifyPluginAsyncZod = async (app) => {
  app.register(authPreHandler);
  app.get(
    "/generate-ai-content",
    {
      schema: {
        querystring: z.object({ q: z.string().min(1) }, "Expected taskId"),
        response: {
          200: GetGenerationResponseSchema,
          400: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const permitedModels = request.auth?.permitedModels || [];

      const { q } = request.query;

      console.log("aa");
      if (!q) {
        console.error("must have query!");
        return reply.code(400).send({ error: "must have query!" });
      }
      const queueService = new QueueService();

      const jobResult = await queueService.getStatus(q, isAIResponse);
      return reply.code(200).send(jobResult);
    },
  );
  app.post(
    "/generate-ai-content",
    {
      schema: {
        body: GenerateContentRequestSchema,
        response: {
          202: GenerateContentResponseSchema202,
        },
      },
    },

    async (request, reply) => {
      const body = request.body;

      // 1. Verify if the API key has permission for this specific model
      const permitedModels = request.auth?.permitedModels || [];
      if (
        !permitedModels.includes(body.modelName) &&
        !permitedModels.includes("*")
      ) {
        throw new ClientError(
          `Model '${body.modelName}' is not permitted for this API Key.`,
        );
      }

      // 2. Proceed with business logic
      const queueService = new QueueService();
      const taskId = await queueService.enqueue("generate-ai-content", body);
      if (!taskId) {
        throw new ClientError("Failed to enqueue task", {});
      }
      type ResponseType = z.infer<typeof GenerateContentResponseSchema202>;
      const response: ResponseType = {
        taskId: taskId,
        modelName: body.modelName,
        status: "pending",
      };
      return reply.code(202).send(response);
    },
  );
};
