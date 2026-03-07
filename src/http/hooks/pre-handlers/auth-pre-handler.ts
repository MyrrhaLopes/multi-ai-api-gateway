import { FastifyReply, FastifyRequest } from "fastify"
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { AuthService } from "../../../core/services/auth-service.ts"
import { ClientError } from "../../globals/errors/client-error.ts"

const authHeaderSchema = z.object({
  'API Key': z.string({error: "API Key is required"}).min(32,{error:"Invalid API KEY"})
    })
})

export const authPreHandler : FastifyPluginAsyncZod = async (app){

  async (request:FastifyRequest, reply:FastifyReply) => {
    const result = authHeaderSchema.safeParse(reply.headers)
    if (!result.success) { //that is to say: if the header doesnt match the zod schema:
      return reply.code(401).send({"error":"Unauthenticated", "details":result.error})
    }
    const apiKey = result.data["API Key"]

    //TODO: adicionar isso a entity de Auth
    class AuthError extends ClientError{}
    //autentica se o usuário está presente no sistema
    const authService = new AuthService();
    const { user, error } = authService.authenticate(apiKey);
    if (!user) {
      throw new AuthError("API key not present");
    }
  }
}
