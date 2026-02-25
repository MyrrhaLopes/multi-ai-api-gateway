import { schemaTask } from "@trigger.dev/sdk";
import { GenerateContentRequestSchema } from "../../../../../http/routes/create-generation-task/schemas.ts";
import { AiService } from "../../../../services/AiService.ts";

const myTask = schemaTask({
    id: "my-task",
    schema: GenerateContentRequestSchema,
    run: async (payload) => {
        console.log(payload.modelName, payload.wrapperName);
        const aiService = new AiService();
    },
});