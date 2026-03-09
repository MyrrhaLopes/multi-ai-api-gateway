import { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { AuthService } from "../../../core/services/auth-service.ts";
import { ClientError } from "../../globals/errors/client-error.ts";

declare module "fastify" {
  interface FastifyRequest {
    auth?: {
      permitedModels: string[];
      permitedRoutes: string[];
    };
  }
}

const authHeaderSchema = z.object({
  "api-key": z
    .string({ error: "API Key is required" })
    .min(32, { error: "Invalid API KEY" }),
});

import fp from "fastify-plugin";

export const authPreHandler = fp(async (app: FastifyInstance) => {
  app.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const result = authHeaderSchema.safeParse(request.headers);
      if (!result.success) {
        //that is to say: if the header doesnt match the zod schema:
        return reply
          .code(401)
          .send({ error: "Unauthenticated", details: result.error });
      }
      const apiKey = result.data["api-key"];

      //autentica se o usuário está presente no sistema
      const { permitedModels, permitedRoutes } =
        await AuthService.authenticate(apiKey);

      // Verify route access
      // `request.routeOptions.url` gives the defined route path (e.g., "/create-generation-task")
      const currentRoute = request.routeOptions.url;

      // Allow access if the route is explicitly listed or if there is a wildcard "*"
      if (
        currentRoute &&
        !permitedRoutes.includes(currentRoute) &&
        !permitedRoutes.includes("*")
      ) {
        return reply.code(403).send({
          error: "Forbidden",
          details: `API Key does not have access to the route: ${currentRoute}`,
        });
      }

      // Attach the permissions to the request so downstream routes can use them
      request.auth = {
        permitedModels,
        permitedRoutes,
      };
    },
  );
});
