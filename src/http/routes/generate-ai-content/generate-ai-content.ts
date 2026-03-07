import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import QueueService from "../../../core/services/queue-service.ts";
import {
  GenerateContentRequestSchema,
  GenerateContentResponseSchema202,
} from "./schemas.ts";
import { union, object, z } from "zod";
import { ClientError } from "../../globals/errors/client-error.ts";
import { AuthService } from "../../../core/services/auth-service.ts";

//QUESTION: What is the purpouse of this type? I understand that plugins are a way of compositing and isolating routes and hooks,
// but I don't understand the purpouse of this type.
//
// ANSWER: FastifyPluginAsyncZod ensures that the `app` instance passed into this function
// is correctly typed with Zod schema validation capabilities. It tells TypeScript that this
// plugin will accept Zod schemas for validation and type inference (like inferring `request.body`
// from your `GenerateContentRequestSchema`) without you needing to cast it manually.
export const createGenerationTestRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/create-generation-task",
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
