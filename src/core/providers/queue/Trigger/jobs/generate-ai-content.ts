import { schemaTask, wait } from "@trigger.dev/sdk";
import { GenerateContentRequestSchema } from "../../../../../http/routes/generate-ai-content/schemas.ts";
import { AiService } from "../../../../services/AiService.ts";

export const generateAiContentJob = schemaTask({
    id: "generate-ai-content",
    schema: GenerateContentRequestSchema,
    run: async (payload) => {
        const aiService = new AiService(payload.modelName);

        // TODO: implement better logic for handling KIE and other wrappers. 
        // TODO: make sure it can handle kie wrapper models not on marketplace (like veo3).
        // Maybe add a method to the aimodel contract for handling this?
        if (payload.modelName === "sora2-image-to-video@kie") {

            const token = await wait.createToken({
                timeout: "10m",
            });
            const result = await aiService.generate(payload.messages, { callbackUrl: token.url });
            return result;
        }

        const result = await aiService.generate(payload.messages);
        return result;
    },
});