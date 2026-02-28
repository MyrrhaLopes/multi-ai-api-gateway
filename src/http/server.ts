import fastify from "fastify";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { errorHandler } from "./globals/errors/error-handler.ts";
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { env } from "../core/env.ts";
import { createGenerationTestRoute } from "./routes/generate-ai-content/generate-ai-content.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler(errorHandler)

app.register(fastifyCors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
})

app.register(fastifySwagger, {
    openapi: {
        info: {
            title: "Multi AI Gateway API",
            description: "Multi AI Gateway API",
            version: "1.0.0"
        }
    },
    transform: jsonSchemaTransform
})

app.register(fastifySwaggerUi, {
    routePrefix: "/docs"
})

app.register(createGenerationTestRoute)

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(
    () => {
        console.log(`Server is running on port ${env.PORT}`)
        console.log(`Swagger UI is available at http://localhost:${env.PORT}/docs`)
    }
)