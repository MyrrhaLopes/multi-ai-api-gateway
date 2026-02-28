import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import QueueService from "../../../core/services/QueueService.ts";
import { GenerateContentRequestSchema, GenerateContentResponseSchema202 } from "./schemas.ts";
import z from "zod";
import { ClientError } from "../../globals/errors/client-error.ts";

//QUESTION: What is the purpouse of this type? I understand that plugins are a way of compositing and isolating routes and hooks,
// but I don't understand the purpouse of this type.
export const createGenerationTestRoute: FastifyPluginAsyncZod = async app => {
    app.post('/create-generation-task', {
        schema: {
            body: GenerateContentRequestSchema,
            response: {
                202: GenerateContentResponseSchema202,
            }
        }
    }, async (request, reply) => {

        const body = request.body;
        const queueService = new QueueService();
        const taskId = await queueService.enqueue("generate-ai-content", body);
        if (!taskId) {
            throw new ClientError("Failed to enqueue task", {})
        }
        type ResponseType = z.infer<typeof GenerateContentResponseSchema202>;
        const response: ResponseType = {
            taskId: taskId,
            modelName: body.modelName,
            status: "pending"
        }
        return reply.code(202).send(response)
    })
}