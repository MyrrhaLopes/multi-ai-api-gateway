import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import QueueService from "../../../core/services/QueueService.ts";
import { GenerateContentRequestSchema, GenerateContentResponseSchema } from "./schemas.ts";
import { AiService } from "../../../core/services/AiService.ts";

//QUESTION: What is the purpouse of this type? I understand that plugins are a way of compositing and isolating routes and hooks,
// but I don't understand the purpouse of this type.
export const createGenerationTestRoute: FastifyPluginAsyncZod = async app => {
    app.post('/create-generation-task', {
        schema: {
            body: GenerateContentRequestSchema,
            response: GenerateContentResponseSchema
        }
    }, async (request, reply) => {

        const body = request.body;
        const aiService = new AiService(body.modelName, new QueueService());
        const taskId = await aiService.createTask(body.messages);

        return reply.code(200).send({})
    })
}